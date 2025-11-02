// src/components/charts/RiskTrendChart.jsx (VERSÃO FINAL COM DIAS DA SEMANA NO EIXO X)

import React, { useState } from 'react';

const RiskTrendChart = ({ forecastData, getRiskColor }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!forecastData || forecastData.length === 0) {
    return <p>Não há dados de previsão para exibir o gráfico.</p>;
  }

  // --- LÓGICA DO GRÁFICO ---

  const points = forecastData.map(day => day.nota_de_risco);
  const maxValue = 10;
  // MUDANÇA: Aumenta a altura total do SVG para dar espaço aos novos rótulos
  const chartHeight = 220; 
  const chartWidth = 500;
  const paddingX = 30;
  const paddingY = 20;

  // MUDANÇA: Reserva mais espaço na parte de baixo (30px) para os rótulos dos dias
  const availableHeight = chartHeight - paddingY - 30;
  const availableWidth = chartWidth - (2 * paddingX);

  // A sua lógica de Zonas de Risco (mantida exatamente como estava)
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

  // --- RENDERIZAÇÃO ---

  return (
    <div className="risk-trend-chart-content">
      <h4>Tendência de Risco (Próximos Dias)</h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        
        {/* 1. Zonas de Risco (Fundo) - Inalterado */}
        {riskZones.map(zone => {
          const y = getY(zone.max);
          const height = (zone.max - zone.min) / maxValue * availableHeight;
          return (
            <rect
              key={zone.name} x={paddingX} y={y}
              width={availableWidth} height={height}
              fill={zone.color} opacity="0.15"
            />
          );
        })}

        {/* 2. Grid e Eixo Y - Inalterado */}
        {yAxisLabels.map((label, index) => {
          const y = getY(label);
          return (
            <g key={`y-axis-${index}`}>
              <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="var(--borda-clara)" strokeWidth="0.5" strokeDasharray={label === 0 || label === 10 ? "" : "4,4"} />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="0.7rem" fill="var(--texto-secundario)">{label}</text>
            </g>
          );
        })}

        {/* 3. Linha Principal - Inalterado */}
        <polyline fill="none" stroke="var(--acento-primario)" strokeWidth="3" points={pointsString} strokeLinejoin="round" strokeLinecap="round" />

        {/* NOVO: Rótulos dos Dias da Semana (Eixo X) */}
        {forecastData.map((day, index) => {
            const x = paddingX + (index / (points.length - 1)) * availableWidth;
            const date = new Date(day.dt * 1000);
            // Pega só o dia da semana (ex: "Dom", "Seg")
            const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });

            return (
                <text
                    key={`x-label-${index}`}
                    x={x}
                    y={chartHeight - 10} // Posiciona na margem inferior que criamos
                    textAnchor="middle"
                    fontSize="0.7rem"
                    fill="var(--texto-secundario)"
                    textTransform="capitalize"
                >
                    {weekday}
                </text>
            );
        })}

        {/* 4. Pontos Interativos - Inalterado */}
        {points.map((point, index) => {
          const x = paddingX + (index / (points.length - 1)) * availableWidth;
          const y = getY(point);
          const date = new Date(forecastData[index].dt * 1000);
          const labelText = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

          return (
            <g 
              key={index}
              onMouseEnter={() => setHoveredPoint({ point, x, y, labelText })}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle cx={x} cy={y} r="12" fill="transparent" /> 
              <circle cx={x} cy={y} r="5" fill={getRiskColor(point)} stroke="var(--fundo-secundario)" strokeWidth="2" />
            </g>
          );
        })}

        {/* 5. Tooltip Interativo - Inalterado */}
        {hoveredPoint && (
          <g className="chart-tooltip">
            <rect x={hoveredPoint.x - 40} y={hoveredPoint.y - 35} width="80" height="32" rx="5" fill="var(--fundo-primario)" stroke="var(--borda)" />
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

export default RiskTrendChart;