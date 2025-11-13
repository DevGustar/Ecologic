// src/pages/AssetDetailPage.jsx (VERSÃO FINAL COM ORDEM DA ABA HORÁRIA CORRIGIDA)

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AssetLocationMap from '../components/dashboard/AssetLocationMap';
import AssetListModal from '../components/modals/AssetListModal';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import RiskForecastChart from '../components/dashboard/RiskForecastChart';
import RiskBreakdown from '../components/dashboard/RiskBreakdown'; 
import HourlyRiskChart from '../components/charts/HourlyRiskChart';
import HourlyForecastList from '../components/dashboard/HourlyForecastList';

import './AssetDetailPage.css';

const getRiskColor = (risk) => {
  if (risk >= 8) return 'var(--cor-critica)';
  if (risk >= 6) return 'var(--cor-alerta)';
  if (risk >= 4) return 'var(--cor-cuidado)';
  if (risk >= 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)';
};

// Função para gerar o resumo DIÁRIO
const generateWeatherSummaryPT = (forecast) => {
  if (!forecast || !forecast.weather || !forecast.temp) return 'Dados de previsão indisponíveis.';
  const clima = forecast.weather[0].description;
  const tempMax = forecast.temp.max.toFixed(1);
  const chuva = forecast.rain || 0;
  let summary = `Previsão de ${clima}, com máxima de ${tempMax}°C.`;
  if (chuva > 10) {
    summary += ` Atenção ao volume de chuva esperado de ${chuva.toFixed(2)} mm.`;
  } else if (chuva > 0) {
    summary += ` Volume de chuva esperado de ${chuva.toFixed(2)} mm.`;
  } else {
    summary += " Sem previsão de chuva significativa.";
  }
  return summary;
};

// Função para gerar o resumo INTELIGENTE das próximas horas
const generateHourlySummaryPT = (forecastData) => {
  if (!forecastData || forecastData.length === 0) return '';
  const next6Hours = forecastData.slice(0, 6);
  const maxRiskInNext6Hours = Math.max(...next6Hours.map(h => h.nota_de_risco));
  const maxRiskHour = next6Hours.find(h => h.nota_de_risco === maxRiskInNext6Hours);
  const firstRainHour = next6Hours.find(h => h.rain && h.rain['1h'] > 0.5);
  if (maxRiskInNext6Hours > 7.5) {
    const time = new Date(maxRiskHour.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Atenção: pico de risco esperado nas próximas horas, atingindo ${maxRiskInNext6Hours.toFixed(2)} por volta das ${time}.`;
  }
  if (firstRainHour) {
    const time = new Date(firstRainHour.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const rainDesc = firstRainHour.weather[0].description;
    return `Previsão de tempo estável, com início de ${rainDesc} a partir das ${time}.`;
  }
  return 'O risco permanecerá baixo e estável nas próximas horas, sem previsão de chuva significativa.';
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
  const [currentRiskScore, setCurrentRiskScore] = useState(null);

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
      const fetchAllRiskData = async () => {
        setIsLoading(true);
        setRiskAnalysis(null);
        setRiskExplanation(null);
        setIsExplanationVisible(false);
        setHourlyRiskAnalysis(null);
        setCurrentRiskScore(null);
        setActiveTab('diaria');
        try {
          const dailyAnalysisPromise = fetch(`http://127.0.0.1:8000/assets/${assetId}/risk_analysis`);
          const currentRiskPromise = fetch(`http://127.0.0.1:8000/assets/${assetId}/current_risk`);
          const [dailyResponse, currentResponse] = await Promise.all([ dailyAnalysisPromise, currentRiskPromise ]);
          if (!dailyResponse.ok) throw new Error('Falha ao buscar a análise de risco diária');
          if (!currentResponse.ok) throw new Error('Falha ao buscar o risco atual');
          const dailyData = await dailyResponse.json();
          const currentData = await currentResponse.json();
          setRiskAnalysis(dailyData);
          setCurrentRiskScore(currentData.current_risk_score);
        } catch (error) {
          console.error("Erro ao buscar dados de risco:", error);
          setRiskAnalysis({ error: error.message });
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllRiskData();
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
  const currentWeather = hourlyRiskAnalysis?.[0];

  return (
    <div className="asset-detail-page-container">
      <header className="asset-detail-header">
        <Link to="/" className="back-link">&larr; Voltar ao Dashboard</Link>
        <h1>Análise: <span style={{ color: 'var(--acento-primario)' }}>{currentAsset?.name || 'Carregando...'}</span></h1>
        <button onClick={() => setIsAssetListModalOpen(true)} className="button-secondary"> Mudar Ativo </button>
      </header>

      <main className="analysis-layout-wrapper">
        <aside className="analysis-sidebar-main">
          {isLoading ? (
            <div className="kpi-panel"><span className="kpi-title">Carregando...</span></div>
          ) : todayForecast ? (
            <>
              <div className="kpi-panel kpi-panel-interactive" onClick={handleKpiInteraction}>
                <span className="kpi-title">Nota de Risco (Agora)</span>
                <span className="kpi-value" style={{ color: getRiskColor(currentRiskScore) }}>
                  {currentRiskScore !== null ? currentRiskScore.toFixed(2) : '...'}
                </span>
                {isExplanationVisible && riskExplanation && ( <RiskBreakdown factors={riskExplanation} /> )}
              </div>
              
              <nav className="analysis-tabs">
                <button className={`tab-button ${activeTab === 'diaria' ? 'active' : ''}`} onClick={() => setActiveTab('diaria')}> Análise Diária </button>
                <button className={`tab-button ${activeTab === 'horaria' ? 'active' : ''}`} onClick={() => setActiveTab('horaria')}> Análise por Hora </button>
              </nav>

              <div className="sidebar-tab-content">
                {activeTab === 'diaria' && (
                  <>
                    <div className="analysis-grid-content">
                      <div className="details-panel">
                        <h4>Previsão para Hoje</h4>
                        <p className="forecast-summary">{generateWeatherSummaryPT(todayForecast)}</p>
                      </div>
                      <div className="details-panel forecast-summary-panel">
                        <h4>Resumo Próximos Dias</h4>
                        <p className="forecast-summary">{generateDailySummaryPT(riskAnalysis.daily_forecast_with_risk)}</p>
                      </div>
                    </div>
                    
                    <div className="risk-forecast-panel">
                      <RiskForecastChart 
                        dailyForecastWithRisk={riskAnalysis.daily_forecast_with_risk}
                        getRiskColor={getRiskColor}
                      />
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
                        <div className="analysis-grid-content">
                            <div className="details-panel current-weather-panel">
                                <h4>Condições Atuais</h4>
                                <div className="weather-details">
                                    <span>Temperatura: <strong>{currentWeather?.temp.toFixed(1)}°C</strong></span>
                                    <span>Umidade: <strong>{currentWeather?.humidity}%</strong></span>
                                    <span>Clima: <strong>{currentWeather?.weather[0].description}</strong></span>
                                </div>
                            </div>
                            <div className="details-panel forecast-summary-panel">
                                <h4>Resumo Próximas Horas</h4>
                                <p className="forecast-summary">{generateHourlySummaryPT(hourlyRiskAnalysis)}</p>
                            </div>
                        </div>

                        {/* MUDANÇA CRÍTICA: A LISTA AGORA VEM ANTES DO GRÁFICO */}
                        <div className="risk-forecast-panel hourly-list-panel">
                            <HourlyForecastList 
                                hourlyData={hourlyRiskAnalysis} 
                                getRiskColor={getRiskColor}
                            />
                        </div>

                        <div className="tendencia-analysis-panel">
                            <HourlyRiskChart 
                                forecastData={hourlyRiskAnalysis} 
                                getRiskColor={getRiskColor}
                            />
                        </div>
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
              riskColor={currentRiskScore !== null ? getRiskColor(currentRiskScore) : 'var(--cor-neutra)'}
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