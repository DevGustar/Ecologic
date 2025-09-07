// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
import CreateAssetModal from '../components/modals/CreateAssetModal';
import Papa from 'papaparse';
import inside from 'point-in-polygon';

// Função para definir a cor do KPI de Risk Score
const getRiskScoreColor = (score) => {
  if (score > 8) return 'var(--cor-critica)';
  if (score > 6) return 'var(--cor-alerta)';
  if (score > 4) return 'var(--cor-cuidado)';
  if (score > 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)';
};

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [viewMode, setViewMode] = useState('national');
  const [riskData, setRiskData] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  
  const [nationalKpis, setNationalKpis] = useState({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });
  const [assetKpis, setAssetKpis] = useState({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });

  const fetchAssets = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) { 
      console.error("Erro ao buscar ativos:", error); 
    }
  };

  useEffect(() => {
    Papa.parse('/risk_report_final.csv', {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const riskLookup = results.data.reduce((acc, row) => {
          if (row.codigo_ibge && row.nota_de_risco) {
            acc[String(row.codigo_ibge).trim()] = parseFloat(row.nota_de_risco);
          }
          return acc;
        }, {});
        setRiskData(riskLookup);

        const allRisks = Object.values(riskLookup);
        if (allRisks.length > 0) {
          const totalRisk = allRisks.reduce((sum, risk) => sum + risk, 0);
          const avgRisk = (totalRisk / allRisks.length);
          const critical = allRisks.filter(risk => risk > 8).length;
          const attention = allRisks.filter(risk => risk >= 6 && risk <= 8).length;
          setNationalKpis({
            riskScore: avgRisk.toFixed(2),
            criticalAlerts: critical,
            attentionZones: attention
          });
        }
      },
    });
    fetch('/geojson/municipios_brasil.json').then(res => res.json()).then(data => setGeoJsonData(data));
    fetchAssets();
  }, []);

  const assetsWithRisk = useMemo(() => {
    if (!assets || !riskData || !geoJsonData) return [];
    return assets.map(asset => {
      const assetPoint = [asset.longitude, asset.latitude];
      let containingMunicipality = null;
      for (const feature of geoJsonData.features) {
        if (feature.geometry && feature.geometry.coordinates) {
          const geometryType = feature.geometry.type;
          let polygonsToCheck = [];
          if (geometryType === 'Polygon') {
            polygonsToCheck.push(feature.geometry.coordinates[0]);
          } else if (geometryType === 'MultiPolygon') {
            for (const polygon of feature.geometry.coordinates) {
              polygonsToCheck.push(polygon[0]);
            }
          }
          for (const polygonCoords of polygonsToCheck) {
            if (inside(assetPoint, polygonCoords)) {
              containingMunicipality = feature;
              break;
            }
          }
        }
        if (containingMunicipality) break;
      }
      let riskScore = null;
      if (containingMunicipality) {
        const ibgeCode = containingMunicipality.properties.id;
        riskScore = riskData[ibgeCode] || null;
      }
      return { ...asset, riskScore };
    });
  }, [assets, riskData, geoJsonData]);

  useEffect(() => {
    const assetsWithValidRisk = assetsWithRisk.filter(asset => asset.riskScore !== null);
    if (assetsWithValidRisk.length > 0) {
      const totalRisk = assetsWithValidRisk.reduce((sum, asset) => sum + asset.riskScore, 0);
      const avgRisk = (totalRisk / assetsWithValidRisk.length);
      const critical = assetsWithValidRisk.filter(asset => asset.riskScore > 8).length;
      const attention = assetsWithValidRisk.filter(asset => asset.riskScore >= 6 && asset.riskScore <= 8).length;
      setAssetKpis({
        riskScore: avgRisk.toFixed(2),
        criticalAlerts: critical,
        attentionZones: attention
      });
    } else {
      setAssetKpis({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });
    }
  }, [assetsWithRisk]);

  const handleAssetCreated = () => {
    setIsModalOpen(false);
    fetchAssets();
  };

  const kpisToShow = viewMode === 'national' ? nationalKpis : assetKpis;

  const kpisWithColors = {
    ...kpisToShow,
    riskScoreColor: getRiskScoreColor(parseFloat(kpisToShow.riskScore)),
    criticalAlertsColor: kpisToShow.criticalAlerts > 0 ? 'var(--cor-critica)' : 'var(--texto-principal)',
    attentionZonesColor: kpisToShow.attentionZones > 0 ? 'var(--cor-alerta)' : 'var(--texto-principal)',
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onOpenCreateAssetModal={() => setIsModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        kpis={kpisWithColors} 
      />
      
      <main className="main-content">
        {(riskData && geoJsonData) ? (
          <InteractiveMap 
            assets={assetsWithRisk}
            riskData={riskData}
            viewMode={viewMode} 
            geoJsonData={geoJsonData}
          />
        ) : (
          <div className="loading-map-message">
            A carregar dados do mapa e de risco...
          </div>
        )}
      </main>

      <CreateAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAssetCreated}
      />
    </div>
  );
}

export default DashboardPage;