// src/frontend/src/components/dashboard/RiskLevelsDonut.jsx (Com Gráfico Recharts)

import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// --- DEFINIÇÃO DA LEGENDA DE RISCO ---
// As chaves devem corresponder EXATAMENTE às strings na coluna 'Classificacao_Risco' do seu CSV.
const RISK_LEGEND_MAP = {
    'Baixo': '#8BC34A',
    'Moderado': '#FFEB3B',
    'Alto': '#FF9800',
    'Crítico': '#F44336'
};

const RiskLevelsDonut = ({ riversData }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Só processa se houver dados de rios
        if (riversData && riversData.length > 0) {
            setLoading(true);
            const categoryCounts = {
                'Baixo': 0,
                'Moderado': 0,
                'Alto': 0,
                'Crítico': 0
            };

            // Conta a ocorrência de cada classificação de risco
            riversData.forEach(item => {
                const classification = item['Classificacao_Risco'];
                if (classification && categoryCounts.hasOwnProperty(classification)) {
                    categoryCounts[classification]++;
                }
            });

            // Transforma as contagens em um formato que o Recharts entende
            const formattedData = Object.keys(categoryCounts)
                .filter(category => categoryCounts[category] > 0) // Mostra apenas categorias com dados
                .map(category => ({
                    name: category,
                    value: categoryCounts[category],
                    color: RISK_LEGEND_MAP[category]
                }));
            
            setChartData(formattedData);
            setLoading(false);
        } else {
            setChartData([]);
            setLoading(false);
        }
    }, [riversData]); // Re-calcula os dados do gráfico sempre que riversData muda

    if (loading) {
        return <div className="chart-loading-message">Carregando dados...</div>;
    }

    if (chartData.length === 0) {
        return <div className="chart-loading-message">Nenhum dado de risco disponível.</div>;
    }

    // Função para renderizar um rótulo personalizado no gráfico
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="black" textAnchor="middle" dominantBaseline="central" fontSize="0.9em" fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="40%" // Um pouco mais para cima para dar espaço para a legenda
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => `${value.toLocaleString('pt-BR')} registros`}
                    contentStyle={{ backgroundColor: 'var(--fundo-principal)', border: '1px solid var(--borda)' }}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ color: 'var(--texto-secundario)', fontSize: '0.8rem' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default RiskLevelsDonut;