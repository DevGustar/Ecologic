// src/components/dashboard/MapLegend.jsx

import React from 'react';

// A PALETA MONOCROMÁTICA CORRETA e os limites de risco que definimos
const grades = [0, 2, 4, 6, 8];
const colors = [
  '#A2C4DF', // Risco Mínimo (0-2)
  '#5F98C4', // Risco Baixo (2-4)
  '#3A7CA5', // Risco Médio (4-6)
  '#2A528A', // Risco Alto (6-8)
  '#1C3A5E'  // Risco Crítico (8+)
];
const labels = [
  'Mínimo (0-2)',
  'Baixo (2-4)',
  'Médio (4-6)',
  'Alto (6-8)',
  'Crítico (8+)'
];

function MapLegend() {
  return (
    <div className="map-legend">
      <h4>Nota de Risco</h4>
      {grades.map((grade, index) => (
        <div key={grade} className="legend-item">
          <i style={{ backgroundColor: colors[index] }}></i>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

export default MapLegend;