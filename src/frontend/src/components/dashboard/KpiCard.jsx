// src/components/dashboard/KpiCard.jsx

import React from 'react';

// Adicionamos a prop 'isHero'
function KpiCard({ title, value, isHero = false }) {
  // A classe 'hero' será adicionada condicionalmente
  const cardClass = isHero ? "kpi-card hero" : "kpi-card";

  return (
    <div className={cardClass}>
      <span className="kpi-title">{title}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}

export default KpiCard;