// src/components/dashboard/RiskBreakdown.jsx (VERSÃO POPOVER ATUALIZADA)

import React from 'react';
import './RiskBreakdown.css'; // Vamos precisar criar/ajustar este ficheiro CSS

/**
 * Componente para exibir a composição detalhada de uma nota de risco.
 * Recebe uma lista de 'fatores' pré-calculados do backend.
 * @param {Array} factors - A lista de objetos de fatores contribuintes.
 */
function RiskBreakdown({ factors }) {
  // Se não houver fatores ou a lista estiver vazia, não renderiza nada.
  if (!factors || factors.length === 0) {
    return null;
  }

  return (
    // Este container será posicionado de forma absoluta pelo CSS
    <div className="risk-breakdown-container">
      <h5 className="risk-breakdown-title">Composição da Nota de Risco</h5>
      <ul className="risk-breakdown-list">
        {factors.map((factor, index) => (
          <li key={index} className="risk-factor-item">
            {/* Exibe o nome do fator e o seu valor bruto (ex: "Impacto da Chuva (25.4 mm)") */}
            <span className="factor-name">{factor.nome} ({factor.valor_raw})</span>
            
            {/* Exibe os detalhes calculados pelo backend */}
            <div className="factor-details">
              <span>Score: <strong>{factor.score_atribuido.toFixed(2)}</strong></span>
              <span>Peso: <strong>{(factor.peso_no_calculo * 100).toFixed(0)}%</strong></span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RiskBreakdown;