// src/cockpit/components/CockpitChartbar.jsx (VERSÃO FINAL REFINADA)

import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import './CockpitChartbar.css'; // Importa o seu CSS

// MUDANÇA: Corrigi a paleta de cores para bater com a sua legenda
const COLORS = {
  'Crítico': 'var(--cor-critica)', // Vermelho
  'Alto': 'var(--cor-alerta)',      // Laranja/Amarelo (vamos ajustar)
  'Moderado': 'var(--cor-cuidado)', // Amarelo/Laranja (vamos ajustar)
  'Baixo': 'var(--cor-sucesso)',    // Verde
  'Mínimo': 'var(--cor-neutra)'     // Azul
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
// MUDANÇA: A legenda agora usa as cores certas
const CustomDonutLegend = ({ payload }) => (
  <div className="grafico-donut-legenda">
    {payload.map((entry, index) => (
      <div key={`legend-${index}`} className="legenda-item">
        <span className="legenda-cor" style={{ backgroundColor: COLORS[entry.payload.name] }}></span>
        <span className="legenda-nome">{entry.payload.name}</span>
        <span className="legenda-valor">{entry.payload.value.toFixed(1)}%</span>
      </div>
    ))}
  </div>
);

// --- Tooltip Customizado para o Gráfico de Barras ---
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip-bar">
        <p className="tooltip-label-bar">{data.nome}</p>
        <p className="tooltip-value-bar">Nota de Risco: {data.nota.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const CockpitChartbar = ({ graficos, isLoading }) => {

  const donutData = graficos?.riscoPorNivel.sort((a, b) => b.value - a.value) || [];
  const topRiosData = graficos?.topRiosPorRisco.map(rio => ({
      ...rio,
      nomeCurto: rio.nome.split(' (')[0].replace('Rio ', '') // Deixa o label mais curto
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
          <ResponsiveContainer width="100%" height={340}> 
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
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
          <ResponsiveContainer width="100%" height={300}>
            {/* MUDANÇA: Adiciona 'barCategoryGap' para espaçamento */}
            <BarChart data={topRiosData} layout="vertical" margin={{ left: 0, right: 20 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borda-sutil)" />
              <XAxis type="number" stroke="var(--texto-secundario)" domain={[0, 10]} ticks={[0, 5, 10]} 
 />
              <YAxis 
                type="category" 
                dataKey="nomeCurto" 
                width={120} // Aumenta o espaço para o nome
                stroke="var(--texto-secundario)" 
                fontSize="0.7.5rem"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                content={<CustomBarTooltip />}
              />
              <Bar dataKey="nota" fill="var(--cor-alerta)" fillOpacity={0.7}>
                {topRiosData.map((entry, index) => (
                  // Colore a barra de acordo com o risco
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