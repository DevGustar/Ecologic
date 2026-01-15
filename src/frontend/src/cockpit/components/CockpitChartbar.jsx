// src/cockpit/components/CockpitChartbar.jsx

import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import './CockpitChartbar.css';

// --- CORES SINCRONIZADAS COM O MAPA ---
const COLORS = {
  'Crítico': '#e74c3c',  
  'Alto': '#e67e22',     
  'Moderado': '#f1c40f', 
  'Baixo': '#2ecc71',    
  'Mínimo': '#3498db',   
  'Sem Dados': '#555'
};

// --- TOOLTIPS PERSONALIZADOS ---
const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip-donut">
        <span className="tooltip-label-donut">{data.name}</span>
        <span className="tooltip-value-donut">{data.value.toFixed(1)}%</span>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, activeIntel }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Define cor do tooltip
    let color = '#2ecc71';
    if (data.nota >= 8) color = '#e74c3c';
    else if (data.nota >= 6) color = '#e67e22';
    else if (data.nota >= 4) color = '#f1c40f';
    else if (data.nota > 0) color = '#3498db';

    return (
      <div className="custom-tooltip-bar tooltip-shift-left">
        <p className="tooltip-label-bar">{data.nome}</p>
        
        {/* Detalhe extra (ex: Rio) se houver */}
        {activeIntel === 'mestre' && data.detalhe && (
            <div style={{fontSize:'0.8rem', color:'#ccc', marginBottom:'5px'}}>
                {data.detalhe}
            </div>
        )}

        <div className="tooltip-score-row">
            <span>Nota:</span>
            <span className="score-value" style={{ color: color }}>
                {data.nota ? data.nota.toFixed(2) : '0.00'}
            </span>
        </div>
      </div>
    );
  }
  return null;
};

// --- COMPONENTE PRINCIPAL ---
const CockpitChartbar = ({ graficos, isLoading, onFilterChange, activeFilter, activeIntel }) => {

  // 1. DADOS PIZZA
  const donutData = graficos?.riscoPorNivel ? 
    [...graficos.riscoPorNivel].sort((a, b) => b.value - a.value) : [];

  // 2. DADOS RANKING
  const rawTopData = graficos?.topRanking || graficos?.topRiosPorRisco || [];
  
  // Tratamento de nomes longos para exibição
  const topData = rawTopData.map(item => {
      let displayName = item.nome;
      if (displayName.length > 18) displayName = displayName.substring(0, 16) + '...';
      return { ...item, displayName: displayName };
  });

  // Títulos
  let titleDonut = 'Distribuição de Risco';
  let titleBar = 'Ranking de Risco';

  if (activeIntel === 'mestre') {
      titleDonut = 'Risco Mestre (Fundido)';
      titleBar = 'Top Municípios em Risco';
  } else if (activeIntel === 'rios') {
      titleDonut = 'Risco por Nível (Rios)';
      titleBar = 'Top Rios por Risco';
  }

  // --- AÇÃO DE CLIQUE (INTERATIVIDADE) ---
  const handleBarClick = (data) => {
      // Garante que envia o NOME REAL para o filtro
      if (data && data.nome) {
          onFilterChange(data.nome);
      }
  };

  const renderCharts = () => {
    if (isLoading) return <div className="loading-text">Carregando...</div>;
    if (!graficos || (donutData.length === 0 && topData.length === 0)) { 
        return <div className="error-text">Aguardando dados...</div>; 
    }

    return (
      <>
        {/* GRÁFICO 1: PIZZA */}
        <div className="grafico-section">
          <h4>{titleDonut}</h4>
          <ResponsiveContainer width="100%" height={310}> 
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
                cursor="pointer"
                onClick={(data) => onFilterChange(data.name)} // Clique na fatia
              >
                {donutData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name] || '#555'} 
                    // Se houver filtro ativo, apaga as outras fatias
                    opacity={!activeFilter || activeFilter === entry.name ? 1 : 0.2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span style={{color: '#ccc', fontSize: '0.8rem'}}>{value}</span>}
                onClick={(e) => onFilterChange(e.value)} // Clique na legenda
                wrapperStyle={{ cursor: 'pointer' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* GRÁFICO 2: BARRAS (RANKING) */}
        <div className="grafico-section">
          <h4>{titleBar}</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
                data={topData} 
                layout="vertical" 
                margin={{ left: 0, right: 30, top: 10, bottom: 0 }} 
                barCategoryGap="20%" 
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis type="number" hide domain={[0, 10]} />
              <YAxis 
                type="category" 
                dataKey="displayName" 
                width={110} 
                stroke="#aaa" 
                fontSize="0.75rem" 
                tickLine={false} 
                axisLine={false} 
                interval={0} 
              />
              
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                content={<CustomBarTooltip activeIntel={activeIntel} />}
              />
              
              <Bar 
                dataKey="nota" 
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={handleBarClick} // <--- AQUI ESTÁ A INTERAÇÃO
              >
                {topData.map((entry, index) => {
                    // Cores baseadas na nota
                    let color = '#2ecc71';
                    if (entry.nota >= 8) color = '#e74c3c';
                    else if (entry.nota >= 6) color = '#e67e22';
                    else if (entry.nota >= 4) color = '#f1c40f';
                    else if (entry.nota > 0) color = '#3498db';

                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={color} 
                        // Destaque visual: apaga os outros se um estiver selecionado
                        opacity={!activeFilter || activeFilter === entry.nome ? 1 : 0.3}
                      />
                    );
                })}
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