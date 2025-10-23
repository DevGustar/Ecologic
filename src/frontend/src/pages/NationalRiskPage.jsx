// src/frontend/src/pages/NationalRiskPage.jsx

import React, { useState, useCallback } from 'react';
import NationalRiskMap from '../components/dashboard/NationalRiskMap';
import KpiCard from '../components/dashboard/KpiCard'; 
import RiskLevelsDonut from '../components/dashboard/RiskLevelsDonut'; 
import TopRiversChart from '../components/dashboard/TopRiversChart'; 

import './NationalRiskPage.css';

const RISK_LEGEND = {
    'Baixo': { color: '#8BC34A', text: 'Baixo' },      
    'Moderado': { color: '#FFEB3B', text: 'Moderado' }, 
    'Alto': { color: '#FF9800', text: 'Alto' },        
    'Crítico': { color: '#F44336', text: 'Crítico' }    
};

const NationalRiskPage = () => {
    const [kpis, setKpis] = useState({
        nationalAverageRisk: null,
        totalRivers: null,
        statesWithData: null,
        criticalRivers: null,
        riversData: [], 
    });

    const handleDataLoaded = useCallback((data) => {
        setKpis(data);
    }, []);

    return (
        <div className="national-risk-page-container">
            {/* Sidebar da Esquerda: KPIs e Legenda */}
            <div className="sidebar sidebar-left">
                <div className="header-kpi">
                    <h2>Visão Nacional de Risco</h2>
                </div>
                <KpiCard
                    title="Risco Nacional Médio"
                    value={kpis.nationalAverageRisk !== null ? kpis.nationalAverageRisk.toFixed(2) : '...'}
                />
                <KpiCard
                    title="Total de Registros de Rios"
                    value={kpis.totalRivers !== null ? kpis.totalRivers.toLocaleString('pt-BR') : '...'}
                />
                <KpiCard
                    title="Estados com Dados"
                    value={kpis.statesWithData !== null ? kpis.statesWithData : '...'}
                />
                <KpiCard
                    title="Rios em Risco Crítico"
                    value={kpis.criticalRivers !== null ? kpis.criticalRivers.toLocaleString('pt-BR') : '...'}
                    isCritical={kpis.criticalRivers > 0} 
                />
                <div className="risk-legend-container">
                    <h3>Legenda de Risco</h3>
                    {Object.entries(RISK_LEGEND).map(([key, item]) => (
                        <div key={key} className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                            <span className="legend-text">{item.text}</span>
                        </div>
                    ))}
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#808080' }}></span>
                        <span className="legend-text">Sem Dados / Outros</span>
                    </div>
                </div>
            </div>

            {/* Área Central: Mapa */}
            <div className="main-content-area">
                <NationalRiskMap onDataLoaded={handleDataLoaded} />
            </div>

            {/* Sidebar da Direita: Gráficos */}
            <div className="sidebar sidebar-right">
                <div className="chart-panel">
                    <h3>Risco por Nível</h3>
                    <div className="chart-content-wrapper">
                        <RiskLevelsDonut riversData={kpis.riversData} /> 
                    </div>
                </div>
                <div className="chart-panel">
                    <h3>Top Rios por Risco</h3>
                    <div className="chart-content-wrapper">
                        <TopRiversChart riversData={kpis.riversData} /> 
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NationalRiskPage;