// src/components/layout/Sidebar.jsx

import React from 'react';
import KpiCard from '../dashboard/KpiCard';
import ToggleSwitch from './ToggleSwitch'; // 1. Importe o NOSSO ToggleSwitch

function Sidebar({ onOpenCreateAssetModal, viewMode, onViewModeChange }) {
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
          {/* 1. Mude esta linha: */}
          {/* <span>Visão Nacional</span> */}
          {/* Para esta: */}
          <span className="toggle-label-text">Visão Nacional</span>
          
          {/* 2. Mude esta linha: */}
          {/* <ToggleSwitch ... /> */}
          {/* Para esta, envolvendo-o numa div: */}
          <div className="toggle-switch-container">
            <ToggleSwitch
              checked={viewMode === 'assets'}
              onChange={(e) => onViewModeChange(e.target.checked ? 'assets' : 'national')}
            />
          </div>

          {/* 3. Mude esta linha: */}
          {/* <span>Meus Ativos</span> */}
          {/* Para esta: */}
          <span className="toggle-label-text">Meus Ativos</span>
        </label>
      </div>

      <div className="sidebar-kpis">
        <KpiCard title="Risk Score" value="85.2" />
        <KpiCard title="Alertas Críticos" value="12" />
        <KpiCard title="Zonas em Atenção" value="3" />
      </div>
    </aside>
  );
}

export default Sidebar;