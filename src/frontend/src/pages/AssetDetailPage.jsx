// src/pages/AssetDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AssetLocationMap from '../components/dashboard/AssetLocationMap';
import AssetListModal from '../components/modals/AssetListModal';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import RiskForecastChart from '../components/dashboard/RiskForecastChart';

// NOVO: Importa o componente que vai exibir a explicação
import RiskBreakdown from '../components/dashboard/RiskBreakdown'; 

// NOVO (BOA PRÁTICA): Assumindo que a função de cor foi movida para um utilitário
// Se ainda não o fez, recomendo criar o ficheiro 'src/utils/riskUtils.js'
// import { getRiskColor } from '../utils/riskUtils';

import './AssetDetailPage.css';

// MUDANÇA: Por agora, mantemos a função aqui como no seu original
const getRiskColor = (risk) => {
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
  const [activeTab, setActiveTab] = useState('principal');

  // NOVO: Estados para controlar a visibilidade e os dados da explicação do risco
  const [riskExplanation, setRiskExplanation] = useState(null);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);

  // ... (useEffect para fetchAllAssets permanece o mesmo) ...
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

  // ... (useEffect para fetchRiskAnalysis permanece o mesmo) ...
  useEffect(() => {
    if (assetId) {
      const fetchRiskAnalysis = async () => {
        setIsLoading(true);
        setRiskAnalysis(null);
        // NOVO: Reseta a explicação ao mudar de ativo
        setRiskExplanation(null);
        setIsExplanationVisible(false);
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

  const handleAssetSelect = (newAssetId) => {
    navigate(`/asset/${newAssetId}`);
    setIsAssetListModalOpen(false);
  };

  // NOVO: Função para buscar os dados da explicação do risco sob demanda
  const handleKpiInteraction = async () => {
    if (isFetchingExplanation) return; // Evita cliques duplos

    if (isExplanationVisible) {
      setIsExplanationVisible(false);
      return;
    }

    if (!riskExplanation) {
      setIsFetchingExplanation(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/assets/${assetId}/risk_explanation`);
        if (!response.ok) throw new Error('Falha ao buscar a explicação do risco');
        const data = await response.json();
        setRiskExplanation(data.fatores_contribuintes);
      } catch (error) {
        console.error("Erro ao buscar explicação do risco:", error);
        setRiskExplanation([{ nome: 'Erro ao carregar dados', score_atribuido: 0, peso_no_calculo: 0, valor_raw: '' }]);
      } finally {
        setIsFetchingExplanation(false);
      }
    }
    setIsExplanationVisible(true);
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

      <main className="analysis-layout-wrapper">
        <aside className="analysis-sidebar-main">
          {isLoading ? (
            <div className="kpi-panel"><span className="kpi-title">Carregando KPIs...</span></div>
          ) : todayForecast ? (
            <>
              {/* MUDANÇA: O painel do KPI agora é um container interativo */}
              <div className="kpi-panel kpi-panel-interactive" onClick={handleKpiInteraction}>
                <span className="kpi-title">Nota de Risco (Hoje)</span>
                <span className="kpi-value" style={{ color: getRiskColor(todayForecast.nota_de_risco) }}>
                  {todayForecast.nota_de_risco.toFixed(2)}
                </span>

                {/* NOVO: Renderização condicional do popover com a explicação do risco */}
                {isExplanationVisible && riskExplanation && (
                  <RiskBreakdown factors={riskExplanation} />
                )}
              </div>
              
              <nav className="analysis-tabs">
                <button 
                  className={activeTab === 'principal' ? 'tab-button active' : 'tab-button'}
                  onClick={() => setActiveTab('principal')}
                >
                  Análise Principal
                </button>
                <button 
                  className={activeTab === 'tendencia' ? 'tab-button active' : 'tab-button'}
                  onClick={() => setActiveTab('tendencia')}
                >
                  Tendência de Risco
                </button>
              </nav>

              <div className="sidebar-tab-content">
                {activeTab === 'principal' && (
                  <>
                    <div className="details-panel">
                      <h4>Previsão para {new Date(todayForecast.dt * 1000).toLocaleDateString('pt-BR')}</h4>
                      <p className="forecast-summary">{todayForecast.summary}</p>
                      <div className="weather-details">
                        <span>Temp. Máxima: <strong>{todayForecast.temp.max.toFixed(1)}°C</strong></span>
                        <span>Chuva: <strong>{todayForecast.rain || 0} mm</strong></span>
                        <span>Clima: <strong>{todayForecast.weather[0].description}</strong></span>
                      </div>
                    </div>
                    <div className="risk-forecast-panel">
                      <RiskForecastChart 
                        dailyForecastWithRisk={riskAnalysis.daily_forecast_with_risk}
                        getRiskColor={getRiskColor}
                      />
                    </div>
                  </>
                )}
                {activeTab === 'tendencia' && (
                  <div className="tendencia-analysis-panel">
                    <RiskTrendChart 
                      forecastData={riskAnalysis.daily_forecast_with_risk}
                      getRiskColor={getRiskColor}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="error-message">Não foi possível carregar a análise.</div>
          )}
        </aside>

        <div className="analysis-map-area">
          {currentAsset && (
            <AssetLocationMap 
              latitude={currentAsset.latitude} 
              longitude={currentAsset.longitude} 
              assetName={currentAsset.name} 
              riskColor={todayForecast ? getRiskColor(todayForecast.nota_de_risco) : 'var(--cor-neutra)'}
            />
          )}
        </div>
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