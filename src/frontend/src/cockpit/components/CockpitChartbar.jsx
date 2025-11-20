// src/cockpit/components/CockpitChartbar.jsx (VERSÃO FINAL - INTERAÇÃO CLIMA ATIVADA)

import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import './CockpitChartbar.css';

const COLORS = {
  'Crítico': 'var(--cor-critica)',
  'Alto': 'var(--cor-alerta)',
  'Moderado': 'var(--cor-cuidado)',
  'Baixo': 'var(--cor-sucesso)',
  'Mínimo': 'var(--cor-neutra)',
  'Sem Dados': 'var(--borda-sutil)'
};

// Tooltip Donut
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

// Legenda Donut
const CustomDonutLegend = ({ payload, onFilterChange, activeFilter }) => (
  <div className="grafico-donut-legenda">
    {payload.map((entry, index) => (
      <div 
        key={`legend-${index}`} 
        className={`legenda-item ${activeFilter && activeFilter !== entry.payload.name ? 'inactive' : ''}`}
        onClick={() => onFilterChange(entry.payload.name)} 
        style={{ cursor: 'pointer' }}
      >
        <span className="legenda-cor" style={{ backgroundColor: entry.color }}></span>
        <span className="legenda-nome">{entry.payload.name}</span>
        <span className="legenda-valor">{entry.payload.value.toFixed(1)}%</span>
      </div>
    ))}
  </div>
);

// --- Tooltip Inteligente (Se adapta para Rios ou Clima) ---
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Verifica se é um dado de Rio (tem frequencia) ou Clima
    const isRio = data.frequencia && data.frequencia !== 'N/A';

    return (
      <div className="custom-tooltip-bar tooltip-shift-left">
        <p className="tooltip-label-bar">{data.nome}</p>
        <div className="tooltip-score-row">
            <span>Nota:</span>
            <span className="score-value">{data.nota ? data.nota.toFixed(2) : '0.00'}</span>
        </div>
        
        {/* Se for Rio, mostra os detalhes GRC. Se for Clima, não mostra nada extra (por enquanto) */}
        {isRio && (
           <div className="tooltip-grc-breakdown">
             <span>Freq: <strong>{data.frequencia}</strong></span>
             <span>Vuln: <strong>{data.vulnerabilidade}</strong></span>
             <span>Imp: <strong>{data.impacto}</strong></span>
           </div>
        )}
      </div>
    );
  }
  return null;
};

const CockpitChartbar = ({ graficos, isLoading, onFilterChange, activeFilter, activeIntel }) => {

  const donutData = graficos?.riscoPorNivel ? 
    [...graficos.riscoPorNivel].sort((a, b) => b.value - a.value) : [];

  // Preparação dos dados do Top 10
  const rawTopData = graficos?.topRanking || graficos?.topRiosPorRisco || [];
  
  const topData = rawTopData.map(item => ({
      ...item,
      // Se for Rio, limpa "Rio ...". Se for Clima, pega o nome da cidade.
      nomeCurto: activeIntel === 'rios'
        ? item.nome.split(' (')[0].replace('Rio ', '').replace('Arroio ', '')
        : item.nome.split(' (')[0]
    }));

  const titleDonut = activeIntel === 'clima' ? 'Risco Climático (Nível)' : 'Risco por Nível (Rios)';
  const titleBar = activeIntel === 'clima' ? 'Top Municípios Críticos' : 'Top 10 Rios por Risco';

  // Função inteligente de clique
  const handleBarClick = (data) => {
      if (activeIntel === 'rios') {
          // Para Rios, o município está dentro dos parênteses: "Rio X (MUNICIPIO)"
          // Usamos a propriedade que criamos no backend ou extraímos aqui
          if (data.municipio) {
              onFilterChange(data.municipio);
          } else {
              // Fallback: tenta extrair do nome completo
              const match = data.nome.match(/\(([^)]+)\)/);
              if (match) onFilterChange(match[1]);
          }
      } else {
          // Para Clima, o 'nomeCurto' JÁ É o nome do município (ex: "Jaguaruna")
          onFilterChange(data.nomeCurto);
      }
  };

  const renderCharts = () => {
    if (isLoading) { return <div className="loading-text">Carregando Gráficos...</div>; }
    if (!graficos) { return <div className="error-text">Aguardando dados...</div>; }

    return (
      <>
        {/* Donut */}
        <div className="grafico-section">
          <h4>{titleDonut}</h4>
          <ResponsiveContainer width="100%" height={300}> 
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
                onClick={(data) => onFilterChange(data.name)}
              >
                {donutData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name] || '#8884d8'} 
                    opacity={!activeFilter || activeFilter === entry.name ? 1 : 0.3}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
              <Legend 
                content={<CustomDonutLegend 
                  payload={donutData.map(entry => ({...entry, color: COLORS[entry.name]}))}
                  onFilterChange={onFilterChange}
                  activeFilter={activeFilter}
                />} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Barra */}
        <div className="grafico-section">
          <h4>{titleBar}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topData} layout="vertical" margin={{ left: 10, right: 30 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borda-sutil)" />
              <XAxis type="number" stroke="var(--texto-secundario)" domain={[0, 10]} ticks={[0, 2.5, 5, 7.5, 10]} />
              <YAxis type="category" dataKey="nomeCurto" width={100} stroke="var(--texto-secundario)" fontSize="0.8rem" tickLine={false} axisLine={false} interval={0} />
              
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                content={<CustomBarTooltip />}
              />
              
              <Bar 
                dataKey="nota" 
                fill="var(--cor-alerta)" 
                onClick={handleBarClick} // <--- AQUI ESTÁ A NOVA LÓGICA
              >
                {topData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.nota >= 8 ? 'var(--cor-critica)' : (entry.nota >= 6 ? 'var(--cor-alerta)' : 'var(--cor-cuidado)')} 
                    opacity={!activeFilter || activeFilter === (activeIntel === 'rios' ? entry.municipio : entry.nomeCurto) ? 1 : 0.3}
                    style={{ cursor: 'pointer' }}
                  />
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