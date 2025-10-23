// src/frontend/src/components/dashboard/TopRiversChart.jsx (SEU CÓDIGO ORIGINAL + FILTRO "sem nome")

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_COLORS = {
    'Baixo': '#8BC34A', 'Moderado': '#FFEB3B', 'Alto': '#FF9800', 'Crítico': '#F44336'
};

const getRiskColor = (riskScore) => {
    if (riskScore >= 8) return RISK_COLORS['Crítico'];
    if (riskScore >= 6) return RISK_COLORS['Alto'];
    if (riskScore >= 4) return RISK_COLORS['Moderado'];
    return RISK_COLORS['Baixo'];
};

const TopRiversChart = ({ riversData }) => {
    const topRivers = useMemo(() => {
        if (!riversData || riversData.length === 0) return [];
        const processedData = riversData
            .map(item => ({
                name: `${item['Nome do Rio']} (${item['Nome do Municipio']})`,
                risk: parseFloat(String(item['Nota_de_Risco'])?.replace(',', '.')) || 0,
                // Adicionamos o nome original do rio para facilitar o filtro
                originalRiverName: item['Nome do Rio']
            }))
            // >>>>> A ÚNICA MUDANÇA ESTÁ AQUI <<<<<
            .filter(item => String(item.originalRiverName || '').trim().toLowerCase() !== 'sem nome')
            .filter(item => item.risk > 0);
            
        processedData.sort((a, b) => b.risk - a.risk);
        return processedData.slice(0, 10).reverse();
    }, [riversData]);

    if (!topRivers || topRivers.length === 0) {
        return <div className="chart-loading-message">Sem dados para exibir.</div>;
    }

    const formatYAxisTick = (tick) => tick.length > 25 ? `${tick.substring(0, 22)}...` : tick;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRivers} layout="vertical" margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
                <XAxis type="number" domain={[0, 10]} stroke="var(--texto-secundario)" />
                <YAxis
                    type="category" dataKey="name" width={150}
                    stroke="var(--texto-secundario)" fontSize="0.7em"
                    tick={{ fill: 'var(--texto-secundario)' }}
                    interval={0} tickFormatter={formatYAxisTick}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    contentStyle={{ backgroundColor: 'var(--fundo-principal)', border: '1px solid var(--borda)' }}
                />
                <Bar dataKey="risk" name="Nota de Risco" barSize={15}>
                    {topRivers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default TopRiversChart;