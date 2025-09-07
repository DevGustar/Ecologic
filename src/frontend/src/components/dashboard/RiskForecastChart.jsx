// src/components/dashboard/RiskForecastChart.jsx (V.2.0)

import React from 'react';

// Nova função para obter cores de risco mais fortes
const getRiskColor = (risk) => {
  if (risk >= 8) return 'var(--cor-critica)';     // Vermelho escuro/marrom para risco muito alto
  if (risk >= 6) return 'var(--cor-alerta)';      // Laranja para risco alto
  if (risk >= 4) return 'var(--cor-cuidado)';     // Amarelo para risco moderado (como o 5.0)
  if (risk >= 2) return 'var(--cor-sucesso)';     // Verde claro para risco baixo
  return 'var(--cor-neutra)';                    // Azul claro para risco muito baixo
};

function RiskForecastChart({ dailyForecastWithRisk }) {
  // Mostramos a partir do segundo dia (o primeiro já está no KPI principal)
  // E agora mostramos TODOS os dias restantes que o backend envia (geralmente 6)
  const futureForecasts = dailyForecastWithRisk.slice(1); 

  if (!futureForecasts || futureForecasts.length === 0) {
    return null; // Ou uma mensagem tipo "Nenhuma previsão futura disponível"
  }

  return (
    <div className="risk-forecast-chart-panel">
      <h4>Previsão de Risco Futura</h4>
      <div className="forecast-items-container">
        {futureForecasts.map((day, index) => (
          <div key={index} className="forecast-item-card">
            <span className="forecast-date">
              {new Date(day.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}
            </span>
            <div className="risk-bar-wrapper"> {/* Novo wrapper para a barra */}
              <div 
                className="risk-bar" 
                style={{ 
                  width: `${(day.nota_de_risco / 10) * 100}%`,
                  backgroundColor: getRiskColor(day.nota_de_risco) 
                }}
              ></div>
            </div>
            <span className="forecast-risk-value" style={{ color: getRiskColor(day.nota_de_risco) }}>
              {day.nota_de_risco.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskForecastChart;