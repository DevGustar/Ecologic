// src/pages/AssetDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AssetLocationMap from '../components/dashboard/AssetLocationMap';
import AssetListModal from '../components/modals/AssetListModal';
import RiskForecastChart from '../components/dashboard/RiskForecastChart';

// A função de cores agora é definida aqui para ser partilhada
const getRiskColor = (risk) => {
  // Usamos as variáveis CSS que já definimos
  if (risk >= 8) return 'var(--cor-critica)';
  if (risk >= 6) return 'var(--cor-alerta)';
  if (risk >= 4) return 'var(--cor-cuidado)';
  if (risk >= 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)';
};

function AssetDetailPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [allAssets, setAllAssets] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssetListModalOpen, setIsAssetListModalOpen] = useState(false);

  // Busca a lista de todos os ativos para o modal
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

  // Busca a análise de risco do ativo selecionado
  useEffect(() => {
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
  }, [assetId]);

  // Função para ser chamada pelo modal para navegar para um novo ativo
  const handleAssetSelect = (newAssetId) => {
    navigate(`/asset/${newAssetId}`);
    setIsAssetListModalOpen(false);
  };

  const currentAsset = allAssets.find(asset => asset.asset_uuid === assetId);
  const todayForecast = riskAnalysis?.daily_forecast_with_risk?.[0];

  return (
    <div className="asset-detail-page-container">
      <header className="asset-detail-header">
        <Link to="/" className="back-link">&larr; Voltar ao Dashboard</Link>
        <h1>Análise: <span style={{ color: 'var(--acento-primario)' }}>{currentAsset?.name || 'Carregando...'}</span></h1>
        <button onClick={() => setIsAssetListModalOpen(true)} className="button-secondary">
          Mudar Ativo
        </button>
      </header>

      <main className="asset-detail-content-full">
        {isLoading ? (
          <p>A calcular risco em tempo real...</p>
        ) : riskAnalysis?.error ? (
          <div className="error-message">{riskAnalysis.error}</div>
        ) : currentAsset && todayForecast ? (
          <div className="analysis-grid">
            {/* Painel do KPI Principal */}
            <div className="kpi-panel">
                <span className="kpi-title">Nota de Risco (Hoje)</span>
                <span 
                  className="kpi-value" 
                  style={{ color: getRiskColor(todayForecast.nota_de_risco) }}
                >
                  {todayForecast.nota_de_risco.toFixed(2)}
                </span>
            </div>

            {/* Painel do Mapa Focado */}
            <div className="map-panel">
              <AssetLocationMap 
                latitude={currentAsset.latitude} 
                longitude={currentAsset.longitude} 
                assetName={currentAsset.name}
                riskColor={getRiskColor(todayForecast.nota_de_risco)}
              />
            </div>

            {/* Painel de Detalhes da Previsão do Dia */}
            <div className="details-panel">
                <h4>Previsão para {new Date(todayForecast.dt * 1000).toLocaleDateString('pt-BR')}</h4>
                <p className="forecast-summary">{todayForecast.summary}</p>
                <div className="weather-details">
                  <span>Temp. Máxima: <strong>{todayForecast.temp.max.toFixed(1)}°C</strong></span>
                  <span>Chuva: <strong>{todayForecast.rain || 0} mm</strong></span>
                  <span>Clima: <strong>{todayForecast.weather[0].description}</strong></span>
                </div>
            </div>

            {/* Painel do Gráfico de Previsão de Risco Futura */}
            <div className="risk-forecast-panel">
              <RiskForecastChart 
                dailyForecastWithRisk={riskAnalysis.daily_forecast_with_risk}
                getRiskColor={getRiskColor} // Passa a função de cores como prop
              />
            </div>
          </div>
        ) : (
          <p>Não foi possível carregar os dados da análise.</p>
        )}
      </main>

      <AssetListModal
        isOpen={isAssetListModalOpen}
        onClose={() => setIsAssetListModalOpen(false)}
        assets={allAssets}
        currentAssetId={assetId}
        onSelect={handleAssetSelect}
      />
    </div>
  );
}

export default AssetDetailPage;