// src/cockpit/components/CockpitSidebar.jsx (VERSÃO FINAL - KPIS COLORIDOS)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CockpitSidebar.css';

// --- 1. Função Auxiliar de Cores para KPIs ---
const getKpiColor = (value, type) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'var(--texto-principal)';

  // Para Notas de Risco (0 a 10)
  if (type === 'score') {
    if (val >= 8) return 'var(--cor-critica)'; // Vermelho
    if (val >= 6) return 'var(--cor-alerta)';  // Laranja
    if (val >= 4) return 'var(--cor-cuidado)'; // Amarelo
    return 'var(--cor-sucesso)';               // Verde
  }

  // Para Contagens (Alertas)
  if (type === 'count') {
    if (val > 0) return 'var(--cor-critica)'; // Tem alerta! (Vermelho)
    return 'var(--cor-sucesso)';              // Zero alertas (Verde)
  }
  
  // Para Totais (Neutro)
  return 'var(--acento-primario)';
};


// --- 2. Componente KPI Card Atualizado (Recebe cor) ---
const KpiCard = ({ title, value, unit = "", type = "neutral" }) => {
  // Calcula a cor baseado no valor e no tipo
  const color = getKpiColor(value, type);

  return (
    <div className="cockpit-kpi-card">
      <span className="kpi-title">{title}</span>
      <span className="kpi-value" style={{ color: color }}>
        {value}
        {unit && <span style={{fontSize: '1rem', marginLeft: '4px', color: '#888'}}>{unit}</span>}
      </span>
    </div>
  );
};

const CockpitSidebar = ({ kpis, isLoading, activeFocus, setActiveFocus, activeIntel, setActiveIntel }) => {
  
  const isGrcExplorerActive = activeFocus === 'nacional' && activeIntel === 'rios'; 

  const renderKpis = () => {
    if (isLoading) return <div className="loading-text">Carregando Inteligência...</div>;
    if (!kpis) return <div className="error-text">Aguardando Dados...</div>;
    
    // --- CENÁRIO 1: RIOS ---
    if (activeIntel === 'rios') {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title">Visão GRC (Rios)</h3>
          
          <KpiCard 
            title="Risco Nacional Médio" 
            value={kpis.riscoNacionalMedio ? kpis.riscoNacionalMedio.toFixed(2) : '--'} 
            type="score" // Vai colorir de acordo com a nota
          />
          <KpiCard 
            title="Rios em Risco Crítico" 
            value={kpis.riosEmRiscoCritico || 0} 
            type="count" // Se tiver > 0, fica vermelho
          />
          <KpiCard 
            title="Municípios Mapeados" 
            value={kpis.municipiosMapeadosGRC || 0} 
            type="neutral" // Sempre azul/padrão
          />
          <KpiCard 
            title="Total de Registros" 
            value={kpis.totalDeRios || 0} 
            type="neutral"
          />
        </div>
      );
    }

    // --- CENÁRIO 2: CLIMA (AGORA COLORIDO) ---
    if (activeIntel === 'clima') {
      return (
        <div className="kpi-section">
          <h3 className="kpi-section-title" style={{ color: '#3b82f6' }}>Visão Climática (Hoje)</h3>
          
          <KpiCard 
            title="Risco Climático Médio" 
            value={kpis.riscoClimaNacionalMedio ? kpis.riscoClimaNacionalMedio.toFixed(2) : '--'} 
            type="score" // Fica Verde/Amarelo/Vermelho dependendo da média
          />
          <KpiCard 
            title="Alertas Críticos (Tempestade)" 
            value={kpis.municipiosAlertaCritico || 0} 
            type="count" // Vermelho se tiver alertas
          />
          <KpiCard 
            title="Zonas em Atenção" 
            value={kpis.municipiosEmAtencao || 0} 
            type="count" // Vermelho se tiver atenção
          />
          <KpiCard 
            title="Municípios Monitorados" 
            value="5570" 
            type="neutral"
          />
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

      {/* Botão Explorador GRC */}
      {isGrcExplorerActive && (
        <div className="toggle-section nav-explorer-section">
          <h4 className="toggle-title">Ferramentas de Auditoria</h4>
          <Link to="/grc-explorer" className="link-button active">Explorador GRC (Auditoria)</Link>
        </div>
      )}

      {/* Foco de Análise */}
      <div className="toggle-section">
        <h4 className="toggle-title">Foco de Análise</h4>
        <div className="toggle-group">
          <button className={`toggle-button ${activeFocus === 'nacional' ? 'active' : ''}`} onClick={() => setActiveFocus('nacional')}>Visão Nacional</button>
          <button className={`toggle-button ${activeFocus === 'ativos' ? 'active' : ''}`} onClick={() => setActiveFocus('ativos')}>Meus Ativos</button>
        </div>
        {activeFocus === 'ativos' && (
            <button className="create-asset-button" onClick={() => alert("Em breve: Criação de Ativo")}>+ Criar Novo Ativo</button>
        )}
      </div>
      
      {/* Camada de Inteligência */}
      <div className="toggle-section">
        <h4 className="toggle-title">Camada de Inteligência</h4>
        <div className="toggle-group-vertical">
          <button className={`toggle-button-large ${activeIntel === 'mestre' ? 'active' : ''}`} onClick={() => setActiveIntel('mestre')}>Risco Mestre (Fundido)</button>
          <button className={`toggle-button-large ${activeIntel === 'clima' ? 'active' : ''}`} onClick={() => setActiveIntel('clima')}>Isolar Risco de Clima</button>
          <button className={`toggle-button-large ${activeIntel === 'rios' ? 'active' : ''}`} onClick={() => setActiveIntel('rios')}>Isolar Risco de Rio (GRC)</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="cockpit-sidebar-content">
        {renderKpis()}
      </div>
    </aside>
  );
};

export default CockpitSidebar;