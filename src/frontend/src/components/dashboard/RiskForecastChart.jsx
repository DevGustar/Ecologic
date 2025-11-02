// src/components/dashboard/RiskForecastChart.jsx (VERSÃO FINAL COM CORES NO TOOLTIP)

import React, { useState } from 'react';
import './RiskForecastChart.css';

// NOVO: Função de utilitário para converter a severidade em uma classe CSS
const getSeverityClass = (severity) => {
  if (!severity) return '';
  return `severity-${severity.toLowerCase()}`;
};

function RiskForecastChart({ dailyForecastWithRisk, getRiskColor }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!dailyForecastWithRisk || dailyForecastWithRisk.length === 0) {
    return <p>Previsão indisponível.</p>;
  }

  return (
    <div className="risk-forecast-list">
      <h4>Previsão de Risco Futura</h4>
      <ul>
        {dailyForecastWithRisk.map((forecast, index) => {
          const riskScore = forecast.nota_de_risco;
          const riskColor = getRiskColor(riskScore);
          const date = new Date(forecast.dt * 1000);
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          const dayAndMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

          return (
            <li 
              key={index} 
              className="forecast-item"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="forecast-day">{dayName}, {dayAndMonth}</span>
              <div className="forecast-bar-container">
                <div 
                  className="forecast-bar" 
                  style={{ width: `${riskScore * 10}%`, backgroundColor: riskColor }}
                ></div>
              </div>
              <span className="forecast-score" style={{ color: riskColor }}>
                {riskScore.toFixed(2)}
              </span>

              {hoveredIndex === index && forecast.explicacao_risco && (
                <div className="risk-explanation-tooltip">
                  <h5>Composição do Risco</h5>
                  <ul className="tooltip-factor-list">
                    {forecast.explicacao_risco.map((factor, fIndex) => (
                      <li key={fIndex}>
                        <div className="factor-info">
                          <span className="factor-info-name">{factor.nome}</span>
                          {factor.peso_no_calculo > 0 && (
                            <span className="factor-info-weight">
                              Peso: {(factor.peso_no_calculo * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {/* MUDANÇA: O valor bruto agora tem uma classe CSS dinâmica para a cor */}
                        <strong className={getSeverityClass(factor.severidade)}>
                          {factor.valor_raw}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default RiskForecastChart;