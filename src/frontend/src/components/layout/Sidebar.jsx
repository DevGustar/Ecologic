// src/components/layout/Sidebar.jsx

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Ecologic</h2>
      </div>
      
      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">Dashboard</a>
        <a href="#" className="nav-item">Relatórios</a>
        <a href="#" className="nav-item">Alertas</a>
      </nav>

      <div className="sidebar-kpis">
        {/* 1. O KPI "Herói" continua sendo um KpiCard para ter destaque */}
        <KpiCard title="Risk Score" value="85.2" isHero={true} />

        {/* 2. As métricas secundárias agora são uma lista */}
        <div className="kpi-list">
          <div className="kpi-list-item">
            <span className="kpi-list-title">Alertas Críticos</span>
            <span className="kpi-list-value">12</span>
          </div>
          <div className="kpi-list-item">
            <span className="kpi-list-title">Zonas em Atenção</span>
            <span className="kpi-list-value">3</span>
          </div>
          {/* Podemos facilmente adicionar mais itens aqui no futuro */}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;