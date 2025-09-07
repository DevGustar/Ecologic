// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
import CreateAssetModal from '../components/modals/CreateAssetModal';
import Papa from 'papaparse';
import inside from 'point-in-polygon';

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [viewMode, setViewMode] = useState('national'); 
  const [riskData, setRiskData] = useState(null); // Contém {ibgeCode: riskScore}
  const [geoJsonData, setGeoJsonData] = useState(null); // Contém os dados GeoJSON dos municípios
  
  const [nationalKpis, setNationalKpis] = useState({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });
  const [assetKpis, setAssetKpis] = useState({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });

  // Função para buscar ativos da API
  const fetchAssets = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) { 
      console.error("Erro ao buscar ativos:", error); 
    }
  };

  // useEffect principal para carregar dados iniciais (CSV, GeoJSON, Ativos)
  useEffect(() => {
    // Carregar CSV de risco
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

        // Calcular KPIs NACIONAIS IMEDIATAMENTE após carregar o riskData
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

    // Carregar GeoJSON
    fetch('/geojson/municipios_brasil.json')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(error => console.error("Erro ao carregar GeoJSON:", error));

    // Carregar Ativos
    fetchAssets();
  }, []); // Executa apenas uma vez no carregamento inicial

  // useMemo para calcular assetsWithRisk (filtra para garantir que todos os dados estão carregados)
  const assetsWithRisk = useMemo(() => {
    if (!assets || !riskData || !geoJsonData) {
      return []; // Retorna vazio se algum dado estiver faltando
    }

    return assets.map(asset => {
      const assetPoint = [asset.longitude, asset.latitude];
      let containingMunicipality = null;

      // Percorre as features do GeoJSON para encontrar o município do ativo
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
        // Garante que o ibgeCode existe em riskData
        riskScore = riskData[ibgeCode] !== undefined ? riskData[ibgeCode] : null;
      }
      return { ...asset, riskScore };
    });
  }, [assets, riskData, geoJsonData]); // Recalcula quando assets, riskData ou geoJsonData mudam

  // useEffect para CALCULAR os KPIs DOS ATIVOS
  useEffect(() => {
    // Só calcula se assetsWithRisk não estiver vazio
    if (assetsWithRisk.length > 0) {
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
        // Se houver ativos, mas nenhum com risco válido
        setAssetKpis({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });
      }
    } else {
      // Se não houver ativos nenhuns
      setAssetKpis({ riskScore: '0.00', criticalAlerts: 0, attentionZones: 0 });
    }
  }, [assetsWithRisk]); // Recalcula sempre que a lista de ativos enriquecida for atualizada

  const handleAssetCreated = () => {
    setIsModalOpen(false);
    fetchAssets(); // Rebusca os ativos para atualizar a lista
  };

  // Escolhe qual conjunto de KPIs mostrar com base no viewMode
  const currentKpis = viewMode === 'national' ? nationalKpis : assetKpis;

  // Renderiza a UI
  return (
    <div className="dashboard-layout">
      <Sidebar 
        onOpenCreateAssetModal={() => setIsModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        kpis={currentKpis} 
      />
      
      <main className="main-content">
        {/* Renderiza o mapa apenas quando todos os dados estiverem carregados */}
        {(riskData && geoJsonData) ? (
          <InteractiveMap 
            assets={assetsWithRisk}
            riskData={riskData} // Continua a passar o riskData bruto para o mapa
            viewMode={viewMode} 
            geoJsonData={geoJsonData} // Passe o geoJsonData também, o mapa vai precisar
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