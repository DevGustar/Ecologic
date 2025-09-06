// src/components/layout/Sidebar.jsx

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

// O componente agora recebe a prop 'onOpenCreateAssetModal'
function Sidebar({ onOpenCreateAssetModal }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Ecologic</h2>
      </div>
      
      {/* O botão agora é um <button> que chama a função recebida via prop */}
      <button onClick={onOpenCreateAssetModal} className="create-asset-button">
        + Criar Novo Ativo
      </button>

      <nav className="sidebar-nav">
        {/* Usamos 'a' simples por enquanto, já que não temos rotas */}
        <a href="#" className="nav-item active">Dashboard</a>
      </nav>

      <div className="sidebar-kpis">
        <KpiCard title="Risk Score" value="85.2" />
        <KpiCard title="Alertas Críticos" value="12" />
        <KpiCard title="Zonas em Atenção" value="3" />
      </div>
    </aside>
  );
}

export default Sidebar;