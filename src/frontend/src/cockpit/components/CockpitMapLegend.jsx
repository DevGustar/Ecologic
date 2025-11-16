// src/cockpit/components/CockpitMapLegend.jsx

import React from 'react';
import './CockpitMapLegend.css'; // O CSS da nossa legenda

const CockpitMapLegend = ({ getRiskColor }) => {
  // Define os níveis de risco que queremos mostrar na legenda
  const levels = [
    { label: 'Crítico', risk: 9 },
    { label: 'Alto', risk: 7 },
    { label: 'Médio', risk: 5 },
    { label: 'Baixo', risk: 3 },
    { label: 'Mínimo', risk: 1 }
  ];

  return (
    <div className="legend-container">
      <h4>Nota de Risco (Rios)</h4>
      <ul>
        {levels.map(level => (
          <li key={level.label} className="legend-item">
            <span 
              className="legend-color-box" 
              style={{ backgroundColor: getRiskColor(level.risk) }}
            ></span>
            <span className="legend-label">{level.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CockpitMapLegend;