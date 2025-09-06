// src/pages/AssetDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AssetLocationMap from '../components/dashboard/AssetLocationMap'; // Importa o novo mapa focado

function AssetDetailPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [allAssets, setAllAssets] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Busca a lista de todos os ativos para a barra lateral
  useEffect(() => {
    const fetchAllAssets = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/assets');
        if (!response.ok) throw new Error('Falha ao buscar a lista de ativos');
        const data = await response.json();
        setAllAssets(data);
      } catch (error) {
        console.error("Erro ao buscar a lista de ativos:", error);
      }
    };
    fetchAllAssets();
  }, []);

  // Busca a ANÁLISE DE RISCO do ativo SELECIONADO
  useEffect(() => {
    // Só executa se tivermos um assetId
    if (assetId) {
      const fetchRiskAnalysis = async () => {
        setIsLoading(true);
        setRiskAnalysis(null);
        try {
          const apiUrl = `http://127.0.0.1:8000/assets/${assetId}/risk_analysis`;
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error('Falha ao buscar a análise de risco');
          const data = await response.json();
          setRiskAnalysis(data);
        } catch (error) {
          console.error("Erro ao buscar análise de risco:", error);
          setRiskAnalysis({ error: error.message });
        } finally {
          setIsLoading(false);
        }
      };
      fetchRiskAnalysis();
    }
  }, [assetId]); // Roda sempre que o assetId (da URL) mudar

  const handleAssetSelect = (newAssetId) => {
    navigate(`/asset/${newAssetId}`);
  };

  // Encontra o ativo selecionado completo para usar no título e no mapa
  const currentAsset = allAssets.find(asset => asset.asset_uuid === assetId);
  // Extrai a previsão do primeiro dia para fácil acesso
  const todayForecast = riskAnalysis?.daily_forecast_with_risk?.[0];

  return (
    <div className="asset-detail-layout">
      {/* Coluna da Esquerda: Lista de ativos */}
      <aside className="asset-list-sidebar">
        <div className="asset-list-header">
          <Link to="/" className="back-link">&larr; Voltar ao Dashboard</Link>
          <h2>Meus Ativos</h2>
        </div>
        <ul className="asset-list">
          {allAssets.map(asset => (
            <li 
              key={asset.asset_uuid} 
              className={asset.asset_uuid === assetId ? 'asset-list-item active' : 'asset-list-item'}
              onClick={() => handleAssetSelect(asset.asset_uuid)}
            >
              {asset.name}
            </li>
          ))}
        </ul>
      </aside>

      {/* Coluna da Direita: Conteúdo principal com a grelha de análise */}
      <main className="asset-detail-content">
        <h1>Análise: <span style={{ color: 'var(--acento-primario)' }}>{currentAsset?.name || 'Carregando...'}</span></h1>
        
        {isLoading ? (
          <p>A calcular risco em tempo real...</p>
        ) : riskAnalysis?.error ? (
          <div className="error-message">{riskAnalysis.error}</div>
        ) : currentAsset && todayForecast ? (
          <div className="analysis-grid">
            {/* Painel do Mapa Focado */}
            <div className="map-panel">
              <AssetLocationMap 
                latitude={currentAsset.latitude} 
                longitude={currentAsset.longitude} 
                assetName={currentAsset.name}               />
            </div>

            {/* Painel do KPI Principal */}
            <div className="kpi-panel">
              <div className="kpi-card">
                <span className="kpi-title">Nota de Risco (Hoje)</span>
                <span className="kpi-value">{todayForecast.nota_de_risco.toFixed(2)}</span>
              </div>
            </div>

            {/* Painel dos Detalhes da Previsão */}
            <div className="details-panel">
              <div className="details-card">
                <h4>Previsão para {new Date(todayForecast.dt * 1000).toLocaleDateString('pt-BR')}</h4>
                <p className="forecast-summary">{todayForecast.summary}</p>
                <div className="weather-details">
                  <span>Temp. Máxima: <strong>{todayForecast.temp.max.toFixed(1)}°C</strong></span>
                  <span>Chuva: <strong>{todayForecast.rain || 0} mm</strong></span>
                  <span>Clima: <strong>{todayForecast.weather[0].description}</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Não foi possível carregar os dados da análise. Verifique o backend e a seleção de ativo.</p>
        )}
      </main>
    </div>
  );
}

export default AssetDetailPage;