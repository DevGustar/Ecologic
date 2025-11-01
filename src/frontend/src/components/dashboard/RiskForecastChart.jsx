// src/components/dashboard/RiskForecastChart.jsx (VERSÃO COMPLETA E ATUALIZADA)

import React, { useState } from 'react';
import './RiskForecastChart.css'; // Vamos criar este ficheiro para o estilo

function RiskForecastChart({ dailyForecastWithRisk, getRiskColor }) {
  // NOVO: Estado para controlar qual item da lista está com o mouse em cima
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
              // NOVO: Eventos para ligar e desligar o tooltip
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

              {/* NOVO: Renderização condicional do Tooltip (a "caixa suspensa") */}
              {hoveredIndex === index && forecast.explicacao_risco && (
                <div className="risk-explanation-tooltip">
                  <h5>Composição do Risco</h5>
                  <ul className="tooltip-factor-list">
                    {forecast.explicacao_risco.map((factor, fIndex) => (
                      <li key={fIndex}>
                        <span>{factor.nome}:</span>
                        <strong>{factor.valor_raw}</strong>
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