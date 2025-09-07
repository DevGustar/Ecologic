// src/components/layout/Sidebar.jsx

import React from 'react';
import KpiCard from '../dashboard/KpiCard';
import ToggleSwitch from './ToggleSwitch';

// 1. A função agora recebe a prop 'kpis'
function Sidebar({ onOpenCreateAssetModal, viewMode, onViewModeChange, kpis }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Ecologic</h2>
      </div>
      
      <button onClick={onOpenCreateAssetModal} className="create-asset-button">
        + Criar Novo Ativo
      </button>

      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">Dashboard</a>
      </nav>

      <div className="view-mode-toggle">
        <label>
          <span className="toggle-label-text">Visão Nacional</span>
          <div className="toggle-switch-container">
            <ToggleSwitch
              checked={viewMode === 'assets'}
              onChange={(e) => onViewModeChange(e.target.checked ? 'assets' : 'national')}
            />
          </div>
          <span className="toggle-label-text">Meus Ativos</span>
        </label>
      </div>

      <div className="sidebar-kpis">
        {/* O título agora muda com base no viewMode */}
        <KpiCard 
          title={viewMode === 'national' ? 'Risk Score (Nacional)' : 'Risk Score (Ativos)'} 
          value={kpis.riskScore} 
        />
        <KpiCard title="Alertas Críticos" value={kpis.criticalAlerts} />
        <KpiCard title="Zonas em Atenção" value={kpis.attentionZones} />
      </div>
    </aside>
  );
}

export default Sidebar;