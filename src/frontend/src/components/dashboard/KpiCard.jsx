import React from 'react';
// Não vamos importar './KpiCard.css' para não bagunçar, confiando no App.css

const KpiCard = ({ title, value, isCritical = false }) => {
    // A classe `kpi-card` e `isCritical` virá do App.css
    return (
        <div className={`kpi-card ${isCritical ? 'isCritical' : ''}`}>
            <h3>{title}</h3>
            <p className="kpi-value">{value}</p>
        </div>
    );
};

export default KpiCard;