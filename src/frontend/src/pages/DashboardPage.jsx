// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
import CreateAssetModal from '../components/modals/CreateAssetModal';
import Papa from 'papaparse';
import inside from 'point-in-polygon'; // Importa a biblioteca para verificação de ponto em polígono

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [viewMode, setViewMode] = useState('national');
  const [riskData, setRiskData] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null); // Estado para guardar o mapa GeoJSON

  // Função para buscar os ativos do backend
  const fetchAssets = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/assets');
      if (!response.ok) {
        throw new Error('Falha ao buscar os ativos');
      }
      const data = await response.json();
      setAssets(data);
    } catch (error) { 
      console.error("Erro ao buscar ativos:", error); 
    }
  };

  // Carrega todos os dados necessários (CSV, GeoJSON, Ativos) quando a página monta
  useEffect(() => {
    // Carrega os dados de risco do CSV
    Papa.parse('/risk_report_final.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const riskLookup = results.data.reduce((acc, row) => {
          if (row.codigo_ibge && row.nota_de_risco) {
            acc[String(row.codigo_ibge).trim()] = parseFloat(row.nota_de_risco);
          }
          return acc;
        }, {});
        setRiskData(riskLookup);
      },
    });

    // Carrega o mapa dos municípios
    fetch('/geojson/municipios_brasil.json')
      .then(res => res.json())
      .then(data => setGeoJsonData(data));
      
    // Busca os ativos da nossa API
    fetchAssets();
  }, []); // O array vazio [] garante que isto execute apenas uma vez

  // "Enriquece" os ativos com a nota de risco, usando geocodificação inversa
  const assetsWithRisk = useMemo(() => {
    // Só executa se tivermos todas as três fontes de dados prontas
    if (!assets || !riskData || !geoJsonData) {
      return [];
    }

    return assets.map(asset => {
      const assetPoint = [asset.longitude, asset.latitude]; // Formato [lon, lat] para a biblioteca
      
      let containingMunicipality = null;

      // Iteramos sobre cada feature (município) no GeoJSON
      for (const feature of geoJsonData.features) {
        if (feature.geometry && feature.geometry.coordinates) {
          const geometryType = feature.geometry.type;
          let polygonsToCheck = [];

          if (geometryType === 'Polygon') {
            // Para um Polygon, as coordenadas são [anel_exterior, anel_interior1, ...]
            polygonsToCheck.push(feature.geometry.coordinates[0]); // Pegamos apenas o anel exterior
          } else if (geometryType === 'MultiPolygon') {
            // Para um MultiPolygon, as coordenadas são [[anel1], [anel2], ...]
            // Precisamos de iterar sobre cada polígono dentro do MultiPolygon
            for (const polygon of feature.geometry.coordinates) {
              polygonsToCheck.push(polygon[0]); // Pegamos o anel exterior de cada sub-polígono
            }
          }

          // Verificamos o ponto em cada polígono que extraímos
          for (const polygonCoords of polygonsToCheck) {
            if (inside(assetPoint, polygonCoords)) {
              containingMunicipality = feature;
              break; // Encontrou o município, pode parar de verificar os polígonos desta feature
            }
          }
        }
        if (containingMunicipality) {
          break; // Se já encontramos o município, paramos de procurar nas features restantes
        }
      }

      let riskScore = null;
      if (containingMunicipality) {
        const ibgeCode = containingMunicipality.properties.id;
        riskScore = riskData[ibgeCode] || null;
      }

      return {
        ...asset,
        riskScore: riskScore // Adiciona a nota de risco encontrada ao objeto do ativo
      };
    });
  }, [assets, riskData, geoJsonData]); // Recalcula sempre que os ativos ou os dados de suporte mudarem

  // Função chamada pelo modal após um ativo ser criado com sucesso
  const handleAssetCreated = () => {
    setIsModalOpen(false);
    fetchAssets(); // Re-busca a lista de ativos para atualizar o dashboard
  };

  // Por enquanto, os KPIs são estáticos. O próximo passo será torná-los dinâmicos.
  const kpis = { riskScore: '85.2', criticalAlerts: '12', attentionZones: '3' };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onOpenCreateAssetModal={() => setIsModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        kpis={kpis}
      />
      
      <main className="main-content">
        <InteractiveMap 
          assets={assetsWithRisk} // Passa a nova lista "enriquecida" para o mapa
          riskData={riskData}
          viewMode={viewMode} 
        />
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