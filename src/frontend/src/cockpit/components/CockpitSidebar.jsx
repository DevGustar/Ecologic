// src/cockpit/components/CockpitSidebar.jsx (VERSÃO ATUALIZADA)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateAssetModal from './CreateAssetModal';
import './CockpitSidebar.css';

// --- Funções Auxiliares ---
const getKpiColor = (value, type) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'var(--texto-principal)';
  if (type === 'score') {
    if (val >= 8) return 'var(--cor-critica)'; // Vermelho
    if (val >= 6) return 'var(--cor-alerta)';  // Laranja
    if (val >= 4) return 'var(--cor-cuidado)'; // Amarelo
    return 'var(--cor-sucesso)';               // Verde
  }
  if (type === 'count') {
    if (val > 0) return 'var(--cor-critica)'; 
    return 'var(--cor-sucesso)';              
  }
  return 'var(--acento-primario)';
};

const formatNumber = (num) => {
    if (!num && num !== 0) return '-';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num;
};

const KpiCard = ({ title, value, unit = "", type = "neutral" }) => {
  const color = getKpiColor(value, type);
  return (
    <div className="cockpit-kpi-card">
      <span className="kpi-title">{title}</span>
      <span className="kpi-value" style={{ color: color }}>
        {value}
        {unit && <span style={{fontSize: '0.8rem', marginLeft: '4px', color: '#888'}}>{unit}</span>}
      </span>
    </div>
  );
};

// --- Componente Principal ---
const CockpitSidebar = ({ kpis, isLoading, activeFocus, setActiveFocus, activeIntel, setActiveIntel }) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isGrcExplorerActive = activeFocus === 'nacional' && activeIntel === 'rios'; 

  const renderKpis = () => {
    if (isLoading) return <div className="loading-text">Carregando Inteligência...</div>;
    if (!kpis) return <div className="error-text">Aguardando Dados...</div>;
    
    // --- 1. VISÃO MESTRA (NOVA) ---
    if (activeIntel === 'mestre') {
        return (
            <div className="kpi-section">
                <h3 className="kpi-section-title" style={{ color: '#e74c3c' }}>⚡ Risco Mestre (Fundido)</h3>
                
                {/* KPI Principal */}
                <KpiCard 
                    title="Risco Nacional Médio" 
                    value={kpis.riscoNacionalMedio ? kpis.riscoNacionalMedio.toFixed(2) : '--'} 
                    type="score" 
                />
                
                {/* KPI de Impacto Social */}
                <div className="cockpit-kpi-card">
                    <span className="kpi-title">População em Risco</span>
                    <span className="kpi-value" style={{ color: '#f39c12' }}>
                        {formatNumber(kpis.populacaoEmRisco)}
                    </span>
                </div>

                <KpiCard title="Municípios Críticos" value={kpis.municipiosAlertaCritico || 0} type="count" />
                <KpiCard title="Total Monitorado" value={formatNumber(kpis.totalMonitorado)} type="neutral" />
            </div>
        );
    }

    // --- 2. VISÃO RIOS (GRC) ---
    if (activeIntel === 'rios') {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title">Visão GRC (Rios)</h3>
          <KpiCard title="Risco Nacional Médio" value={kpis.riscoNacionalMedio ? kpis.riscoNacionalMedio.toFixed(2) : '--'} type="score" />
          <KpiCard title="Rios em Risco Crítico" value={kpis.riosEmRiscoCritico || 0} type="count" />
          <KpiCard title="Municípios Mapeados" value={kpis.municipiosMapeadosGRC || 0} type="neutral" />
          <KpiCard title="Total de Registros" value={kpis.totalDeRios || 0} type="neutral" />
        </div>
      );
    }

    // --- 3. VISÃO CLIMA ---
    if (activeIntel === 'clima') {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title" style={{ color: '#3b82f6' }}>Visão Climática (Hoje)</h3>
          <KpiCard title="Risco Climático Médio" value={kpis.riscoClimaNacionalMedio ? kpis.riscoClimaNacionalMedio.toFixed(2) : '--'} type="score" />
          <KpiCard title="Alertas Críticos (Tempestade)" value={kpis.municipiosAlertaCritico || 0} type="count" />
          <KpiCard title="Zonas em Atenção" value={kpis.municipiosEmAtencao || 0} type="count" />
          <KpiCard title="Municípios Monitorados" value="5570" type="neutral" />
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

      {isGrcExplorerActive && (
        <div className="toggle-section nav-explorer-section">
          <h4 className="toggle-title">Ferramentas de Auditoria</h4>
          <Link to="/grc-explorer" className="link-button active">Explorador GRC (Auditoria)</Link>
        </div>
      )}

      <div className="toggle-section">
        <h4 className="toggle-title">Foco de Análise</h4>
        <div className="toggle-group">
          <button className={`toggle-button ${activeFocus === 'nacional' ? 'active' : ''}`} onClick={() => setActiveFocus('nacional')}>Visão Nacional</button>
          <button className={`toggle-button ${activeFocus === 'ativos' ? 'active' : ''}`} onClick={() => setActiveFocus('ativos')}>Meus Ativos</button>
        </div>
        
        {activeFocus === 'ativos' && (
            <button 
                className="create-asset-button" 
                onClick={() => setIsModalOpen(true)}
            >
                + Criar Novo Ativo
            </button>
        )}
      </div>
      
      <div className="toggle-section">
        <h4 className="toggle-title">Camada de Inteligência</h4>
        <div className="toggle-group-vertical">
          <button className={`toggle-button-large ${activeIntel === 'mestre' ? 'active' : ''}`} onClick={() => setActiveIntel('mestre')}>Risco Mestre (Fundido)</button>
          <button className={`toggle-button-large ${activeIntel === 'clima' ? 'active' : ''}`} onClick={() => setActiveIntel('clima')}>Isolar Risco de Clima</button>
          <button className={`toggle-button-large ${activeIntel === 'rios' ? 'active' : ''}`} onClick={() => setActiveIntel('rios')}>Isolar Risco de Rio (GRC)</button>
        </div>
      </div>

      <div className="cockpit-sidebar-content">
        {renderKpis()}
      </div>

      <CreateAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </aside>
  );
};

export default CockpitSidebar;