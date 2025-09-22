// src/frontend/src/pages/NationalRiskPage.jsx (VERSÃO ATUALIZADA FINAL - PARA ESTABILIDADE)

import React, { useState, useCallback } from 'react'; // NOVO: Importa useCallback
import NationalRiskMap from '../components/dashboard/NationalRiskMap';
import './NationalRiskPage.css';

const NationalRiskPage = () => {
    const [kpis, setKpis] = useState({
        nationalAverageRisk: null,
        totalRivers: null,
        statesWithData: null,
    });

    // Usa useCallback para garantir que handleDataLoaded é estável e não causa re-render infinito
    // O array de dependências vazio significa que a função é criada APENAS uma vez
    const handleDataLoaded = useCallback((data) => {
        setKpis(data);
    }, []); 

    return (
        <div className="national-risk-page-container">
            {/* Sidebar de KPIs */}
            <div className="national-risk-sidebar">
                <h2>Visão Nacional de Risco</h2>

                <div className="kpi-card">
                    <h3>Risco Nacional Médio</h3>
                    <p className="kpi-value">
                        {kpis.nationalAverageRisk !== null ? kpis.nationalAverageRisk.toFixed(2) : 'Carregando...'}
                    </p>
                </div>

                <div className="kpi-card">
                    <h3>Total de Registros de Rios</h3> {/* Atualizado o texto */}
                    <p className="kpi-value">
                        {kpis.totalRivers !== null ? kpis.totalRivers.toLocaleString('pt-BR') : 'Carregando...'}
                    </p>
                </div>

                <div className="kpi-card">
                    <h3>Estados com Dados</h3>
                    <p className="kpi-value">
                        {kpis.statesWithData !== null ? kpis.statesWithData : 'Carregando...'}
                    </p>
                </div>
                
                <div className="kpi-card risk-legend">
                    <h3>Legenda de Risco</h3>
                    <div className="legend-item"><span style={{ backgroundColor: '#4CAF50' }}></span> Mínimo (0-2)</div>
                    <div className="legend-item"><span style={{ backgroundColor: '#8BC34A' }}></span> Baixo (2-4)</div>
                    <div className="legend-item"><span style={{ backgroundColor: '#FFEB3B' }}></span> Moderado (4-6)</div>
                    <div className="legend-item"><span style={{ backgroundColor: '#FF9800' }}></span> Alto (6-8)</div>
                    <div className="legend-item"><span style={{ backgroundColor: '#F44336' }}></span> Crítico (8+)</div>
                    <div className="legend-item"><span style={{ backgroundColor: '#808080' }}></span> Sem Dados</div>
                </div>

            </div>

            {/* Área do Mapa */}
            <div className="national-risk-map-area">
                <NationalRiskMap onDataLoaded={handleDataLoaded} />
            </div>
        </div>
    );
};

export default NationalRiskPage;