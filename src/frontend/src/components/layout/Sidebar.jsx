// src/components/layout/Sidebar.jsx

import React from 'react';
import KpiCard from '../dashboard/KpiCard';
import ToggleSwitch from './ToggleSwitch';

function Sidebar({ onOpenCreateAssetModal, viewMode, onViewModeChange, kpis }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Ecologic</h2>
      </div>
      
      <button onClick={onOpenCreateAssetModal} className="create-asset-button">
        + Criar Novo Ativo
      </button>

      {/* <nav className="sidebar-nav">
        <a href="#" className="nav-item active">Dashboard</a>
      </nav> */}

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
        <KpiCard 
          title={viewMode === 'national' ? 'Risk Score (Nacional)' : 'Risk Score (Ativos)'} 
          value={kpis.riskScore}
          color={kpis.riskScoreColor} // Passa a cor do Risk Score
        />
        <KpiCard 
          title="Alertas Críticos" 
          value={kpis.criticalAlerts}
          color={kpis.criticalAlertsColor} // Passa a cor dos Alertas
        />
        <KpiCard 
          title="Zonas em Atenção" 
          value={kpis.attentionZones}
          color={kpis.attentionZonesColor} // Passa a cor das Zonas
        />
      </div>
    </aside>
  );
}

export default Sidebar;