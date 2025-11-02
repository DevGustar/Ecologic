// src/components/charts/HourlyRiskChart.jsx (VERSÃO FINAL E COMPLETA)

import React, { useState } from 'react';

const HourlyRiskChart = ({ forecastData, getRiskColor }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!forecastData || forecastData.length === 0 || !getRiskColor) {
    return <p>Não há dados horários para exibir o gráfico.</p>;
  }

  // --- LÓGICA DO GRÁFICO ---
  const points = forecastData.map(hour => hour.nota_de_risco);
  const maxValue = 10;
  const chartHeight = 220;
  const chartWidth = 500;
  const paddingX = 30;
  const paddingY = 20;

  const availableWidth = chartWidth - (2 * paddingX);
  const availableHeight = chartHeight - (paddingY * 2.5);

  // As zonas de risco usam a getRiskColor que vem de fora, garantindo consistência
  const riskZones = [
    { name: 'Baixo', min: 0, max: 4, color: getRiskColor(2) },
    { name: 'Médio', min: 4, max: 6, color: getRiskColor(5) },
    { name: 'Alto', min: 6, max: 8, color: getRiskColor(7) },
    { name: 'Crítico', min: 8, max: 10, color: getRiskColor(9) }
  ];

  const getY = (value) => paddingY + availableHeight - (value / maxValue) * availableHeight;

  const pointsString = points.map((point, index) => {
    const x = paddingX + (index / (points.length - 1)) * availableWidth;
    const y = getY(point);
    return `${x},${y}`;
  }).join(' ');

  const yAxisLabels = [0, 2.5, 5, 7.5, 10];
  
  const xAxisLabels = forecastData.map((hour, index) => {
    if (index % 3 === 0) {
      const x = paddingX + (index / (forecastData.length - 1)) * availableWidth;
      const date = new Date(hour.dt * 1000);
      const hourText = `${String(date.getHours()).padStart(2, '0')}h`;
      return { x, label: hourText };
    }
    return null;
  }).filter(Boolean);

  // --- RENDERIZAÇÃO DO GRÁFICO ---
  return (
    <div className="risk-trend-chart-content">
      <h4>Tendência de Risco (Próximas 24 Horas)</h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        
        {/* Zonas de Risco (Fundo) */}
        {riskZones.map(zone => {
          const y = getY(zone.max);
          const height = (zone.max - zone.min) / maxValue * availableHeight;
          return (
            <rect
              key={zone.name}
              x={paddingX} y={y}
              width={availableWidth} height={height}
              fill={zone.color} opacity="0.15"
            />
          );
        })}

        {/* Grid e Eixo Y */}
        {yAxisLabels.map((label) => {
          const y = getY(label);
          return (
            <g key={`y-axis-${label}`}>
              <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="var(--borda-clara)" strokeWidth="0.5" strokeDasharray={label === 0 || label === 10 ? "" : "4,4"} />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="0.7rem" fill="var(--texto-secundario)">{label}</text>
            </g>
          );
        })}
        
        {/* Linha Principal */}
        <polyline fill="none" stroke="var(--acento-primario)" strokeWidth="3" points={pointsString} strokeLinejoin="round" strokeLinecap="round" />

        {/* Rótulos das Horas (Eixo X) */}
        {xAxisLabels.map(({ x, label }, index) => (
          <text key={`x-label-${index}`} x={x} y={chartHeight - 10} textAnchor="middle" fontSize="0.7rem" fill="var(--texto-secundario)">
            {label}
          </text>
        ))}

        {/* Pontos Interativos */}
        {points.map((point, index) => {
          const x = paddingX + (index / (points.length - 1)) * availableWidth;
          const y = getY(point);
          const date = new Date(forecastData[index].dt * 1000);
          const labelText = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return (
            <g 
              key={index}
              onMouseEnter={() => setHoveredPoint({ point, x, y, labelText })}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle cx={x} cy={y} r="12" fill="transparent" /> 
              {/* Usa a getRiskColor que vem de fora para garantir consistência */}
              <circle cx={x} cy={y} r="5" fill={getRiskColor(point)} stroke="var(--fundo-secundario)" strokeWidth="2" />
            </g>
          );
        })}

        {/* Tooltip Interativo */}
        {hoveredPoint && (
          <g className="chart-tooltip">
            <rect x={hoveredPoint.x - 40} y={hoveredPoint.y - 35} width="80" height="25" rx="5" fill="var(--fundo-primario)" stroke="var(--borda)" />
            <text x={hoveredPoint.x} y={hoveredPoint.y - 20} textAnchor="middle" fontSize="0.8rem" fontWeight="bold" fill={getRiskColor(hoveredPoint.point)}>
              {hoveredPoint.point.toFixed(2)}
            </text>
            <text x={hoveredPoint.x} y={hoveredPoint.y - 21} dy="1.2em" textAnchor="middle" fontSize="0.65rem" fill="var(--texto-secundario)">
              {hoveredPoint.labelText}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default HourlyRiskChart;