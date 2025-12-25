// src/cockpit/components/CockpitChartbar.jsx (VERSÃO ATUALIZADA - SUPORTE A MESTRE)

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

// --- Tooltip Donut (Pizza) ---
const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip-donut">
        <span className="tooltip-label-donut">{data.name}</span>
        <span className="tooltip-value-donut">{data.value.toFixed(1)}%</span>
        {/* Se o backend mandar contagem, mostramos. Se não, oculta */}
        {data.count !== undefined && (
            <span className="tooltip-count-donut">({data.count} regs)</span>
        )}
      </div>
    );
  }
  return null;
};

// --- Legenda Donut ---
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

// --- Tooltip Barra (Ranking) ---
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Verifica se temos detalhes extras (GRC ou Mestre)
    const isRio = data.frequencia && data.frequencia !== 'N/A';
    const hasDetalhe = data.detalhe; // Campo novo do Mestre (Nome do Rio)

    return (
      <div className="custom-tooltip-bar tooltip-shift-left">
        <p className="tooltip-label-bar">{data.nome}</p>
        
        {/* Se for Mestre, mostra o Rio como detalhe */}
        {hasDetalhe && (
            <div style={{fontSize:'0.85rem', color:'#ccc', marginBottom:'5px'}}>
                Rio: {data.detalhe}
            </div>
        )}

        <div className="tooltip-score-row">
            <span>Nota:</span>
            <span className="score-value" style={{
                color: data.nota >= 8 ? 'var(--cor-critica)' : 
                       data.nota >= 6 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)'
            }}>
                {data.nota ? data.nota.toFixed(2) : '0.00'}
            </span>
        </div>
        
        {/* Detalhes específicos da visão GRC/Rios */}
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

// --- COMPONENTE PRINCIPAL ---
const CockpitChartbar = ({ graficos, isLoading, onFilterChange, activeFilter, activeIntel }) => {

  // Dados do Donut
  const donutData = graficos?.riscoPorNivel ? 
    [...graficos.riscoPorNivel].sort((a, b) => b.value - a.value) : [];

  // Dados do Ranking (Top 10/20)
  const rawTopData = graficos?.topRanking || graficos?.topRiosPorRisco || [];
  
  // Processamento dos nomes para exibição (nomeCurto)
  const topData = rawTopData.map(item => ({
      ...item,
      nomeCurto: (activeIntel === 'rios')
        ? item.nome.split(' (')[0].replace('Rio ', '').replace('Arroio ', '') // Limpa p/ caber na barra
        : item.nome // Para Clima e Mestre, o nome já vem certo (Município)
    }));

  // Definição dinâmica dos Títulos
  let titleDonut = 'Risco por Nível';
  let titleBar = 'Top Ranking';

  if (activeIntel === 'mestre') {
      titleDonut = 'Risco Mestre (Fundido)';
      titleBar = 'Top Municípios em Risco';
  } else if (activeIntel === 'clima') {
      titleDonut = 'Risco Climático (Hoje)';
      titleBar = 'Alertas Climáticos';
  } else {
      titleDonut = 'Risco por Nível (Rios)';
      titleBar = 'Top 10 Rios por Risco';
  }

  // Função de clique na barra para filtrar o mapa
  const handleBarClick = (data) => {
      if (activeIntel === 'rios') {
          // Lógica GRC: Tenta pegar municipio explícito ou extrair de "Rio (MUNICIPIO)"
          if (data.municipio) {
              onFilterChange(data.municipio);
          } else {
              const match = data.nome.match(/\(([^)]+)\)/);
              if (match) onFilterChange(match[1]);
          }
      } else {
          // Lógica Clima e Mestre: O nome principal JÁ É o município
          // Se tiver activeIntel='mestre', data.nome é "Joinville", data.detalhe é "Rio Cachoeira"
          onFilterChange(data.nome); 
      }
  };

  const renderCharts = () => {
    if (isLoading) { return <div className="loading-text">Carregando Gráficos...</div>; }
    
    // Se não tiver dados ou listas vazias
    if (!graficos || (donutData.length === 0 && topData.length === 0)) { 
        return <div className="error-text">Sem dados para exibir.</div>; 
    }

    return (
      <>
        {/* --- GRÁFICO 1: DONUT --- */}
        <div className="grafico-section">
          <h4>{titleDonut}</h4>
          <ResponsiveContainer width="100%" height={310}> 
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                labelLine={false}
                onClick={(data) => onFilterChange(data.name)}
                cursor="pointer"
              >
                {donutData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name] || '#8884d8'} 
                    opacity={!activeFilter || activeFilter === entry.name ? 1 : 0.3}
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

        {/* --- GRÁFICO 2: BARRAS (RANKING) --- */}
        <div className="grafico-section">
          <h4>{titleBar}</h4>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart 
                data={topData} 
                layout="vertical" 
                margin={{ left: 10, right: 30 }} 
                barCategoryGap="20%" // Barras um pouco mais gordinhas
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borda-sutil)" horizontal={false} />
              <XAxis type="number" stroke="var(--texto-secundario)" domain={[0, 10]} ticks={[0, 5, 10]} hide />
              <YAxis 
                type="category" 
                dataKey="nomeCurto" 
                width={130} 
                stroke="var(--texto-secundario)" 
                fontSize="0.75rem" 
                tickLine={false} 
                axisLine={false} 
                interval={0} 
              />
              
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                content={<CustomBarTooltip />}
              />
              
              <Bar 
                dataKey="nota" 
                radius={[0, 4, 4, 0]}
                onClick={handleBarClick}
                cursor="pointer"
              >
                {topData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                        entry.nota >= 8 ? 'var(--cor-critica)' : 
                        (entry.nota >= 6 ? 'var(--cor-alerta)' : 
                        (entry.nota >= 4 ? 'var(--cor-cuidado)' : 'var(--cor-sucesso)'))
                    } 
                    opacity={!activeFilter || activeFilter === (activeIntel === 'rios' ? entry.municipio : entry.nome) ? 1 : 0.3}
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