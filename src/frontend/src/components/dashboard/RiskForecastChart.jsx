// src/components/dashboard/RiskForecastChart.jsx (VERSÃO FINAL COM TOOLTIP FLUTUANTE PARA CIMA)

import React, { useState, useRef } from 'react';
import './RiskForecastChart.css';

const RiskForecastChart = ({ dailyForecastWithRisk, getRiskColor }) => {
  const [hoveredItem, setHoveredItem] = useState(null); 
  const panelRef = useRef(null);
  const tooltipRef = useRef(null); // NOVO: Referência para o próprio tooltip

  if (!dailyForecastWithRisk || dailyForecastWithRisk.length === 0) {
    return <p>Previsão indisponível.</p>;
  }

  const getSeverityClass = (severity) => {
    if (!severity) return '';
    return `severity-${severity.toLowerCase()}`;
  };

  const handleMouseEnter = (e, day) => {
    const itemRect = e.currentTarget.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    
    // Altura estimada do tooltip para o cálculo (podemos refinar)
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 250; 

    // MUDANÇA CRÍTICA: Lógica de posicionamento
    let topPosition = itemRect.top - panelRect.top - tooltipHeight - 8; // Tenta posicionar ACIMA

    // Se for "estourar" para fora do topo do painel, posiciona ABAIXO
    if (topPosition < 0) {
      topPosition = itemRect.top - panelRect.top + itemRect.height + 8;
    }

    setHoveredItem({
      data: day,
      top: topPosition,
    });
  };

  return (
    <div className="risk-forecast-panel" ref={panelRef}>
      <h4>Previsão de Risco Futura</h4>
      <ul className="risk-forecast-list-container">
        {dailyForecastWithRisk.map((day, index) => {
          const riskScore = day.nota_de_risco;
          const riskColor = getRiskColor(riskScore);
          const date = new Date(day.dt * 1000);
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          const dayAndMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

          return (
            <li 
              key={index} 
              className="forecast-item"
              onMouseEnter={(e) => handleMouseEnter(e, day)}
              onMouseLeave={() => setHoveredItem(null)}
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
            </li>
          );
        })}
      </ul>

      {/* O Tooltip flutuante agora tem a 'ref' */}
      {hoveredItem && (
        <div 
          ref={tooltipRef}
          className="risk-explanation-tooltip" 
          style={{ top: `${hoveredItem.top}px` }}
        >
          <h5>Composição do Risco ({new Date(hoveredItem.data.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })})</h5>
          <ul className="tooltip-factor-list">
            {hoveredItem.data.explicacao_risco.map((factor, fIndex) => (
              <li key={fIndex}>
                  <div className="factor-info">
                  <span className="factor-info-name">{factor.nome}</span>
                  {factor.peso_no_calculo > 0 && (
                      <span className="factor-info-weight">
                      Peso: {(factor.peso_no_calculo * 100).toFixed(0)}%
                      </span>
                  )}
                  </div>
                  <strong className={getSeverityClass(factor.severidade)}>
                  {factor.valor_raw}
                  </strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskForecastChart;