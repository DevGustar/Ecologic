// src/cockpit/components/CockpitSidebar.jsx (VERSÃO FINAL COM LÓGICA CONDICIONAL DE SUMIR)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  
  // NOVO: Adiciona controle de estado para os toggles
  const [activeFocus, setActiveFocus] = useState('nacional'); // 'nacional' ou 'ativos'
  const [activeIntel, setActiveIntel] = useState('rios');     // 'mestre', 'clima' ou 'rios'
  
  // MUDANÇA CRÍTICA: A condição de renderização para o Explorador GRC
  const isGrcExplorerActive = activeFocus === 'nacional' && activeIntel === 'rios'; 

  const renderKpis = () => {
    // ... (Mantendo a lógica de renderização dos KPIs)
    if (isLoading) {
      return <div className="loading-text">Carregando KPIs...</div>;
    }
    if (!kpis) {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title">Aguardando Conexão...</h3>
          <KpiCard title="Risco Nacional Médio" value="--" />
        </div>
      );
    }
    
    if (activeIntel === 'rios') {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title">Visão GRC (Rios)</h3>
          
          <KpiCard title="Risco Nacional Médio (Rios)" value={kpis.riscoNacionalMedio ? kpis.riscoNacionalMedio.toFixed(2) : '--'} />
          <KpiCard title="Rios em Risco Crítico" value={kpis.riosEmRiscoCritico || '--'} />
          <KpiCard title="Municípios Mapeados (GRC)" value={kpis.municipiosMapeadosGRC || '--'} />
          <KpiCard title="Total de Registros de Rios" value={kpis.totalDeRios || '--'} />
        </div>
      );
    }
    
    // Placeholder para os outros cenários
    return (
        <div className="kpi-section">
          <h3 className="kpi-section-title">Visão Geral</h3>
          <KpiCard title="Risco Mestre (Fundido)" value="N/A" />
        </div>
    ); 
  };

  return (
    <aside className="cockpit-sidebar">
      <div className="cockpit-sidebar-header">
        <h2 className="cockpit-title">Ecologic 2.0</h2>
      </div>

      {/* 1. Ferramentas de Auditoria */}
      {/* O container só aparece se a ferramenta estiver ativa */}
      {isGrcExplorerActive && (
        <div className="toggle-section nav-explorer-section">
          <h4 className="toggle-title">Ferramentas de Auditoria</h4>
          
          {/* Explorador GRC - SÓ RENDERIZA SE FOR NACIONAL E RIOS */}
          <Link 
              to="/grc-explorer" 
              className="link-button active"
          >
              Explorador GRC (Auditoria)
          </Link>
        </div>
      )}

      {/* 2. Foco de Análise */}
      <div className="toggle-section">
        <h4 className="toggle-title">Foco de Análise</h4>
        <div className="toggle-group">
          {/* Botão Visão Nacional */}
          <button 
            className={`toggle-button ${activeFocus === 'nacional' ? 'active' : ''}`}
            onClick={() => setActiveFocus('nacional')}
          >
            Visão Nacional
          </button>
          
          {/* Botão Meus Ativos */}
          <button 
            className={`toggle-button ${activeFocus === 'ativos' ? 'active' : ''}`}
            onClick={() => setActiveFocus('ativos')}
          >
            Meus Ativos
          </button>
        </div>
        
        {/* Botão Criar Ativo (Aparece apenas se 'Meus Ativos' estiver ativo) */}
        {activeFocus === 'ativos' && (
            <button className="create-asset-button" onClick={() => alert("Simulando: Tela de Criação de Ativo")}>
                + Criar Novo Ativo
            </button>
        )}
      </div>
      
      {/* 3. Camada de Inteligência */}
      <div className="toggle-section">
        <h4 className="toggle-title">Camada de Inteligência</h4>
        <div className="toggle-group-vertical">
          <button 
            className={`toggle-button-large ${activeIntel === 'mestre' ? 'active' : ''}`}
            onClick={() => setActiveIntel('mestre')}
          >
            Risco Mestre (Fundido)
          </button>
          <button 
            className={`toggle-button-large ${activeIntel === 'clima' ? 'active' : ''}`}
            onClick={() => setActiveIntel('clima')}
          >
            Isolar Risco de Clima
          </button>
          <button 
            className={`toggle-button-large ${activeIntel === 'rios' ? 'active' : ''}`}
            onClick={() => setActiveIntel('rios')}
          >
            Isolar Risco de Rio (GRC)
          </button>
        </div>
      </div>

      {/* 4. KPIs */}
      <div className="cockpit-sidebar-content">
        {renderKpis()}
      </div>
    </aside>
  );
};

export default CockpitSidebar;