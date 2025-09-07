import React from 'react';

// O componente agora recebe a prop 'color'
function KpiCard({ title, value, color }) {
  return (
    <div className="kpi-card">
      <span className="kpi-title">{title}</span>
      {/* O estilo da cor é aplicado diretamente aqui */}
      <span className="kpi-value" style={{ color: color }}>
        {value}
      </span>
    </div>
  );
}

export default KpiCard;