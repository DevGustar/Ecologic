// src/components/dashboard/HourlyForecastList.jsx (VERSÃO FINAL COM TOOLTIP FLUTUANTE)

import React, { useState, useRef } from 'react';
import './HourlyForecastList.css';

const HourlyForecastList = ({ hourlyData, getRiskColor }) => {
  // O estado agora guarda o item E sua posição na tela
  const [hoveredItem, setHoveredItem] = useState(null); 
  const panelRef = useRef(null); // Referência para o painel inteiro

  if (!hourlyData || hourlyData.length === 0) {
    return null;
  }

  const getSeverityClass = (severity) => {
    if (!severity) return '';
    return `severity-${severity.toLowerCase()}`;
  };

  const handleMouseEnter = (e, hour) => {
    const itemRect = e.currentTarget.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();

    // Calcula a posição do tooltip relativa ao painel
    setHoveredItem({
      data: hour,
      top: itemRect.top - panelRect.top + itemRect.height + 8, // Posiciona abaixo do item
    });
  };

  return (
    // O painel principal agora é a nossa referência de posicionamento
    <div className="hourly-forecast-panel" ref={panelRef}>
      <h4>Próximas Horas</h4>
      <ul className="hourly-list-container">
        {hourlyData.map((hour, index) => {
          const riskScore = hour.nota_de_risco;
          const riskColor = getRiskColor(riskScore);
          const date = new Date(hour.dt * 1000);
          const hourText = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const weatherDesc = hour.weather[0].description;

          return (
            <li 
              key={index} 
              className="hourly-item"
              onMouseEnter={(e) => handleMouseEnter(e, hour)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span className="hourly-time">{hourText}</span>
              <span className="hourly-desc">{weatherDesc}</span>
              <strong className="hourly-score" style={{ color: riskColor }}>
                {riskScore.toFixed(2)}
              </strong>
              {/* O tooltip não é mais renderizado aqui dentro */}
            </li>
          );
        })}
      </ul>

      {/* O Tooltip único e flutuante é renderizado aqui, como filho do painel principal */}
      {hoveredItem && (
        <div 
          className="risk-explanation-tooltip" 
          // A posição agora é controlada dinamicamente pelo 'style'
          style={{ top: `${hoveredItem.top}px` }}
        >
          <h5>Composição do Risco ({new Date(hoveredItem.data.dt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</h5>
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

export default HourlyForecastList;