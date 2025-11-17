// src/cockpit/components/CockpitChartbar.jsx (VERSÃO FINAL COM TOOLTIP CORRIGIDO)

import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import './CockpitChartbar.css';

// Cores para o gráfico de Donut
const COLORS = {
  'Crítico': 'var(--cor-critica)',
  'Alto': 'var(--cor-alerta)',
  'Moderado': 'var(--cor-cuidado)',
  'Baixo': 'var(--cor-sucesso)',
  'Mínimo': 'var(--cor-neutra)'
};

// --- Tooltip Customizado para o Donut ---
const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip-donut">
        <span className="tooltip-label-donut">{data.name}</span>
        <span className="tooltip-value-donut">{data.value.toFixed(1)}%</span>
        <span className="tooltip-count-donut">({data.count} registros)</span>
      </div>
    );
  }
  return null;
};

// --- Legenda Customizada para o Donut ---
const CustomDonutLegend = ({ payload }) => (
  <div className="grafico-donut-legenda">
    {payload.map((entry, index) => (
      <div key={`legend-${index}`} className="legenda-item">
        <span className="legenda-cor" style={{ backgroundColor: entry.color }}></span>
        <span className="legenda-nome">{entry.payload.name}</span>
        <span className="legenda-valor">{entry.payload.value.toFixed(1)}%</span>
      </div>
    ))}
  </div>
);

// --- Tooltip Customizado para o Gráfico de Barras (COM DADOS GRC) ---
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // MUDANÇA CRÍTICA: Corrigido de payload[0].payload.payload
    const data = payload[0].payload; 
    return (
      <div className="custom-tooltip-bar">
        <p className="tooltip-label-bar">{data.nome}</p>
        <p className="tooltip-value-bar">Nota de Risco: {data.nota.toFixed(2)}</p>
        
        {/* A NOVA INTELIGÊNCIA GRC */}
        <div className="tooltip-grc-breakdown">
          <span>Frequência: <strong>{data.frequencia}</strong></span>
          <span>Vulnerabilidade: <strong>{data.vulnerabilidade}</strong></span>
          <span>Impacto: <strong>{data.impacto}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

const CockpitChartbar = ({ graficos, isLoading }) => {

  const donutData = graficos?.riscoPorNivel.sort((a, b) => b.value - a.value) || [];
  const topRiosData = graficos?.topRiosPorRisco.map(rio => ({
      ...rio,
      nomeCurto: rio.nome.split(' (')[0].replace('Rio ', '').replace('Arroio ', '')
    })) || [];

  const renderCharts = () => {
    if (isLoading) {
      return <div className="loading-text">Carregando Gráficos...</div>;
    }
    if (!graficos) {
      return <div className="error-text">Erro ao carregar gráficos.</div>;
    }

    return (
      <>
        <div className="grafico-section">
          <h4>Risco por Nível (Rios)</h4>
          <ResponsiveContainer width="100%" height={290}> 
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={82}
                fill="#8884d8"
                dataKey="value"
                labelLine={false}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
              <Legend 
                content={<CustomDonutLegend payload={donutData.map(entry => ({...entry, color: COLORS[entry.name]}))} />} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grafico-section">
          <h4>Top 10 Rios por Risco</h4>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={topRiosData} layout="vertical" margin={{ left: 10, right: 30 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borda-sutil)" />
              <XAxis type="number" stroke="var(--texto-secundario)" domain={[0, 10]} ticks={[0, 5, 10]} />
              <YAxis type="category" dataKey="nomeCurto" width={140} stroke="var(--texto-secundario)" fontSize="0.75rem" tickLine={false} axisLine={false} interval={0} />
              
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                content={<CustomBarTooltip />}
                wrapperStyle={{ zIndex: 1000 }}
              />
              
              <Bar dataKey="nota" fill="var(--cor-alerta)" fillOpacity={0.7}>
                {topRiosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.nota >= 8 ? 'var(--cor-critica)' : (entry.nota >= 6 ? 'var(--cor-alerta)' : 'var(--cor-cuidado)')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  };

  return (
    <aside className="cockpit-chartbar">
      <div className="cockpit-sidebar-content">
        {renderCharts()}
      </div>
    </aside>
  );
};

export default CockpitChartbar;