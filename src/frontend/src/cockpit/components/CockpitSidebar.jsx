// src/cockpit/components/CockpitSidebar.jsx (VERSÃO FINAL REFINADA)

import React from 'react';
import './CockpitSidebar.css';

// Componente "burro" para os KPIs (Big Numbers)
const KpiCard = ({ title, value }) => (
  <div className="cockpit-kpi-card">
    <span className="kpi-title">{title}</span>
    <span className="kpi-value">{value}</span>
  </div>
);

// Componente principal da Sidebar
const CockpitSidebar = ({ kpis, isLoading }) => {
  
  const activeFocus = 'nacional';
  const activeIntel = 'rios';

  const renderKpis = () => {
    if (isLoading) {
      return <div className="loading-text">Carregando KPIs...</div>;
    }
    if (!kpis) {
      return <div className="error-text">Erro ao carregar KPIs.</div>;
    }
    
    if (activeIntel === 'rios') {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title">Visão GRC (Rios)</h3>
          {/* MUDANÇA: Os KPIs agora são empilhados em 1 coluna */}
          <KpiCard title="Risco Nacional Médio (Rios)" value={kpis.riscoNacionalMedio.toFixed(2)} />
          <KpiCard title="Rios em Risco Crítico" value={kpis.riosEmRiscoCritico} />
          <KpiCard title="Municípios Mapeados (GRC)" value={kpis.municipiosMapeadosGRC} />
          {/* NOVO KPI ADICIONADO */}
          <KpiCard title="Total de Registros de Rios" value={kpis.totalDeRios} />
        </div>
      );
    }
    return null;
  };

  return (
    <aside className="cockpit-sidebar">
      <div className="cockpit-sidebar-header">
        <h2 className="cockpit-title">Ecologic 2.0</h2>
      </div>

      <div className="toggle-section">
        <h4 className="toggle-title">Foco de Análise</h4>
        <div className="toggle-group">
          <button className={`toggle-button ${activeFocus === 'nacional' ? 'active' : ''}`}>
            Visão Nacional
          </button>
          <button className={`toggle-button ${activeFocus === 'ativos' ? 'active' : ''}`}>
            Meus Ativos
          </button>
        </div>
      </div>
      
      <div className="toggle-section">
        <h4 className="toggle-title">Camada de Inteligência</h4>
        <div className="toggle-group-vertical">
          <button className={`toggle-button-large ${activeIntel === 'mestre' ? 'active' : ''}`}>
            Risco Mestre (Fundido)
          </button>
          <button className={`toggle-button-large ${activeIntel === 'clima' ? 'active' : ''}`}>
            Isolar Risco de Clima
          </button>
          <button className={`toggle-button-large ${activeIntel === 'rios' ? 'active' : ''}`}>
            Isolar Risco de Rio (GRC)
          </button>
        </div>
      </div>

      <div className="cockpit-sidebar-content">
        {renderKpis()}
      </div>
    </aside>
  );
};

export default CockpitSidebar;