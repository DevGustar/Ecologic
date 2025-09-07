// src/components/charts/RiskTrendChart.jsx

import React from 'react';

const RiskTrendChart = ({ forecastData, getRiskColor }) => {
  if (!forecastData || forecastData.length === 0) {
    return <p>Não há dados de previsão para exibir o gráfico.</p>;
  }

  const points = forecastData.map(day => day.nota_de_risco);
  const maxValue = 10;
  const chartHeight = 200; // Aumentado para dar mais espaço vertical
  const chartWidth = 500; // Largura base para cálculo proporcional (vai preencher 100% do container)
  const paddingX = 30; // Espaçamento horizontal nas bordas do gráfico
  const paddingY = 20; // Espaçamento vertical nas bordas do gráfico

  // Ajusta a largura disponível para os pontos
  const availableWidth = chartWidth - (2 * paddingX);
  const availableHeight = chartHeight - (2 * paddingY);

  // Cria a string de pontos para a linha do gráfico
  const pointsString = points.map((point, index) => {
    const x = paddingX + (index / (points.length - 1)) * availableWidth;
    const y = paddingY + availableHeight - (point / maxValue) * availableHeight;
    return `${x},${y}`;
  }).join(' ');

  // Define os rótulos do eixo Y (risco)
  const yAxisLabels = [0, 2.5, 5, 7.5, 10]; // Exemplo de rótulos de risco

  return (
    <div className="risk-trend-chart-content">
      <h4>Tendência de Risco (Próximos Dias)</h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Linhas de fundo (grid) e rótulos do eixo Y */}
        {yAxisLabels.map((label, index) => {
          const y = paddingY + availableHeight - (label / maxValue) * availableHeight;
          return (
            <g key={`y-axis-${index}`}>
              <line 
                x1={paddingX} 
                y1={y} 
                x2={chartWidth - paddingX} 
                y2={y} 
                stroke="var(--borda-clara)" 
                strokeWidth="0.5" 
                strokeDasharray={label === 0 || label === 10 ? "" : "4,4"} // Linhas cheias para 0 e 10
              />
              <text 
                x={paddingX - 10} 
                y={y + 4} 
                textAnchor="end" 
                fontSize="0.7rem" 
                fill="var(--texto-secundario)"
              >
                {label}
              </text>
            </g>
          );
        })}
        
        {/* A linha principal do gráfico */}
        <polyline
          fill="none"
          stroke="var(--acento-primario)"
          strokeWidth="3"
          points={pointsString}
        />

        {/* Os pontos (círculos) em cima da linha */}
        {points.map((point, index) => {
          const x = paddingX + (index / (points.length - 1)) * availableWidth;
          const y = paddingY + availableHeight - (point / maxValue) * availableHeight;
          
          // Formata a data para a legenda (ex: DOM 07/09)
          const date = new Date(forecastData[index].dt * 1000);
          const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
          const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const labelText = `${weekday} ${dayMonth}`;

          return (
            <g key={index}>
              <circle 
                cx={x} 
                cy={y} 
                r="5" 
                fill={getRiskColor(point)} 
                stroke="var(--fundo-secundario)" 
                strokeWidth="2" 
              />
              {/* Rótulos da data abaixo dos pontos (exibidos apenas em alguns pontos ou com rotação para evitar sobreposição) */}
              {/* Para simplificar, vamos exibir apenas em intervalos ou rotacionar */}
              <text 
                x={x} 
                y={chartHeight - paddingY + 15} /* Ajusta a posição vertical */
                textAnchor="middle" 
                fontSize="0.75rem" 
                fill="var(--texto-secundario)"
                // Adiciona rotação para evitar sobreposição em muitos pontos
                transform={`rotate(45, ${x}, ${chartHeight - paddingY + 15})`} 
              >
                {labelText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RiskTrendChart;