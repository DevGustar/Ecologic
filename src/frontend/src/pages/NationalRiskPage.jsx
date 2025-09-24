// src/frontend/src/pages/NationalRiskPage.jsx (LAYOUT DE 3 COLUNAS - Com placeholders para gráficos)

import React, { useState, useCallback } from 'react';
import NationalRiskMap from '../components/dashboard/NationalRiskMap';
import KpiCard from '../components/dashboard/KpiCard'; 
// Importar os componentes dos gráficos (eles serão criados ou atualizados em breve)
import RiskLevelsDonut from '../components/dashboard/RiskLevelsDonut'; 
import TopRiversChart from '../components/dashboard/TopRiversChart'; 

import './NationalRiskPage.css';

// --- Definição da Legenda de Risco (Duplicada para renderização na sidebar) ---
const RISK_LEGEND = {
    MuitoBaixo: { min: 0, max: 2, color: '#4CAF50', text: 'Muito Baixo (0-2)' },
    Baixo: { min: 2.1, max: 4, color: '#8BC34A', text: 'Baixo (2-4)' },
    Moderado: { min: 4.1, max: 6, color: '#FFEB3B', text: 'Moderado (4-6)' },
    Alto: { min: 6.1, max: 8, color: '#FF9800', text: 'Alto (6-8)' },
    Critico: { min: 8.1, max: 10, color: '#F44336', text: 'Crítico (8+)' },
    Extremo: { min: 10.1, max: 12, color: '#D32F2F', text: 'Extremo (10+)' }
};

const NationalRiskPage = () => {
    const [kpis, setKpis] = useState({
        nationalAverageRisk: null,
        totalRivers: null,
        statesWithData: null,
        criticalRivers: null,
        riversData: [], // IMPORTANTE: Vai passar os dados brutos para os gráficos
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
                        <span className="legend-text">Sem Dados</span>
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
                    {/* Placeholder para o gráfico de Donut */}
                    <RiskLevelsDonut riversData={kpis.riversData} /> 
                </div>
                <div className="chart-panel">
                    <h3>Top Rios por Risco</h3>
                    {/* Placeholder para o gráfico de Barras */}
                    <TopRiversChart riversData={kpis.riversData} /> 
                </div>
            </div>
        </div>
    );
};

export default NationalRiskPage;