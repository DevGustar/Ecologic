// src/components/layout/Sidebar.jsx (VERSÃO COM ADIÇÃO DO BOTÃO 'VISÃO NACIONAL')

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // NOVO: Importa para navegação
import KpiCard from '../dashboard/KpiCard';
import ToggleSwitch from './ToggleSwitch';

function Sidebar({ onOpenCreateAssetModal, viewMode, onViewModeChange, kpis }) {
    const navigate = useNavigate(); // NOVO: Hook para navegação
    const location = useLocation(); // NOVO: Hook para saber a rota atual

    // Função para navegar para a Visão Nacional
    const handleNavigateToNationalRisk = () => {
        navigate('/national-risk');
        // Opcional: Se você quiser que o toggle mude para 'national' quando este botão for clicado
        // onViewModeChange('national'); 
    };

    // Função para navegar para Meus Ativos (Dashboard)
    const handleNavigateToMyAssets = () => {
        navigate('/');
        // Opcional: Se você quiser que o toggle mude para 'assets' quando este botão for clicado
        // onViewModeChange('assets');
    };


    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Ecologic</h2>
            </div>
            
            <button onClick={onOpenCreateAssetModal} className="create-asset-button">
                + Criar Novo Ativo
            </button>

            {/* Botão para a Visão Nacional (novo elemento) */}
            <button 
                className={`nav-item-button ${location.pathname === '/national-risk' ? 'active' : ''}`}
                onClick={handleNavigateToNationalRisk}
                style={{ marginBottom: '10px', padding: '10px 15px', backgroundColor: '#3a4a5a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em' }}
            >
                Visão Nacional de Risco
            </button>

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
                    color={kpis.riskScoreColor}
                />
                <KpiCard 
                    title="Alertas Críticos" 
                    value={kpis.criticalAlerts}
                    color={kpis.criticalAlertsColor}
                />
                <KpiCard 
                    title="Zonas em Atenção" 
                    value={kpis.attentionZones}
                    color={kpis.attentionZonesColor}
                />
            </div>
        </aside>
    );
}

export default Sidebar;