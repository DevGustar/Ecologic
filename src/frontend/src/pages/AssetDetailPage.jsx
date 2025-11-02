// src/pages/AssetDetailPage.jsx (VERSÃO FINAL COM LISTA DE PREVISÃO HORÁRIA)

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AssetLocationMap from '../components/dashboard/AssetLocationMap';
import AssetListModal from '../components/modals/AssetListModal';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import RiskForecastChart from '../components/dashboard/RiskForecastChart';
import RiskBreakdown from '../components/dashboard/RiskBreakdown'; 
import HourlyRiskChart from '../components/charts/HourlyRiskChart';
// NOVO: Importamos nosso novo componente de lista horária
import HourlyForecastList from '../components/dashboard/HourlyForecastList';

import './AssetDetailPage.css';

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
  const [riskExplanation, setRiskExplanation] = useState(null);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const [isFetchingExplanation, setIsFetchingExplanation] = useState(false);
  const [activeTab, setActiveTab] = useState('diaria');
  const [hourlyRiskAnalysis, setHourlyRiskAnalysis] = useState(null);
  const [isFetchingHourly, setIsFetchingHourly] = useState(false);

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

  useEffect(() => {
    if (assetId) {
      const fetchRiskAnalysis = async () => {
        setIsLoading(true);
        setRiskAnalysis(null);
        setRiskExplanation(null);
        setIsExplanationVisible(false);
        // Reseta os dados horários ao mudar de ativo
        setHourlyRiskAnalysis(null); 
        setActiveTab('diaria'); // Sempre volta para a aba diária
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

  useEffect(() => {
    if (activeTab === 'horaria' && !hourlyRiskAnalysis && assetId) {
      const fetchHourlyRisk = async () => {
        setIsFetchingHourly(true);
        try {
          const apiUrl = `http://127.0.0.1:8000/assets/${assetId}/hourly_risk_analysis`;
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error('Falha ao buscar a análise horária');
          const data = await response.json();
          setHourlyRiskAnalysis(data.hourly_forecast_with_risk);
        } catch (error) {
          console.error("Erro ao buscar análise horária:", error);
        } finally {
          setIsFetchingHourly(false);
        }
      };
      fetchHourlyRisk();
    }
  }, [activeTab, assetId, hourlyRiskAnalysis]);

  const handleAssetSelect = (newAssetId) => {
    navigate(`/asset/${newAssetId}`);
    setIsAssetListModalOpen(false);
  };

  const handleKpiInteraction = async () => {
    if (isFetchingExplanation) return;
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
            <div className="kpi-panel"><span className="kpi-title">Carregando...</span></div>
          ) : todayForecast ? (
            <>
              <div className="kpi-panel kpi-panel-interactive" onClick={handleKpiInteraction}>
                <span className="kpi-title">Nota de Risco (Hoje)</span>
                <span className="kpi-value" style={{ color: getRiskColor(todayForecast.nota_de_risco) }}>
                  {todayForecast.nota_de_risco.toFixed(2)}
                </span>
                {isExplanationVisible && riskExplanation && ( <RiskBreakdown factors={riskExplanation} /> )}
              </div>
              
              <nav className="analysis-tabs">
                <button className={`tab-button ${activeTab === 'diaria' ? 'active' : ''}`} onClick={() => setActiveTab('diaria')}>
                  Análise Diária
                </button>
                <button className={`tab-button ${activeTab === 'horaria' ? 'active' : ''}`} onClick={() => setActiveTab('horaria')}>
                  Análise por Hora
                </button>
              </nav>

              <div className="sidebar-tab-content">
                {activeTab === 'diaria' && (
                  <>
                    <div className="analysis-grid-content">
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
                    </div>
                    <div className="tendencia-analysis-panel">
                      <RiskTrendChart 
                        forecastData={riskAnalysis.daily_forecast_with_risk}
                        getRiskColor={getRiskColor}
                      />
                    </div>
                  </>
                )}
                
                {activeTab === 'horaria' && (
                  <div className="hourly-analysis-panel">
                    {isFetchingHourly ? ( <p>Carregando análise horária...</p> ) 
                    : hourlyRiskAnalysis ? ( 
                      <>
                        <HourlyRiskChart 
                          forecastData={hourlyRiskAnalysis} 
                          getRiskColor={getRiskColor}
                        />
                        {/* NOVO: Renderiza a lista de previsão horária abaixo do gráfico */}
                        <HourlyForecastList 
                          hourlyData={hourlyRiskAnalysis} 
                          getRiskColor={getRiskColor}
                        />
                      </>
                    ) 
                    : ( <p>Não foi possível carregar os dados horários.</p> )}
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