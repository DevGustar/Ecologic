// src/cockpit/pages/CockpitPage.jsx (VERSÃO FINAL COM FILTRO CRUZADO)

import React, { useState, useEffect } from 'react';
import CockpitSidebar from '../components/CockpitSidebar';
import CockpitChartbar from '../components/CockpitChartbar';
import CockpitMap from '../components/CockpitMap';
import './CockpitPage.css';

function CockpitPage() {
  const [activeFocus, setActiveFocus] = useState('nacional');
  const [activeIntel, setActiveIntel] = useState('rios');
  
  const [grcKpis, setGrcKpis] = useState(null);
  const [grcGraficos, setGrcGraficos] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // NOVO: O "ESTADO MESTRE" QUE CONTROLA O FILTRO
  const [mapFilter, setMapFilter] = useState(null); // ex: 'Crítico' ou 'MONTENEGRO'

  useEffect(() => {
    // (A sua lógica de 'fetchGrcData' continua a mesma)
    const fetchGrcData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/macro/grc/kpis'); 
        if (!response.ok) throw new Error('Falha ao buscar dados do dashboard GRC');
        const data = await response.json();
        setGrcKpis(data.kpis);
        setGrcGraficos(data.graficos);
      } catch (error) {
        console.error("Erro ao buscar dados do Cenário 1 (Rios):", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrcData();
  }, [activeIntel]);

  // NOVO: A função que os gráficos vão chamar para "avisar" a mãe
  const handleFilterChange = (filter) => {
    // Se o usuário clicar no mesmo filtro de novo, ele desliga o filtro
    if (mapFilter === filter) {
      setMapFilter(null);
    } else {
      setMapFilter(filter);
    }
  };

  return (
    <div className="cockpit-page-container">
      <CockpitSidebar
        kpis={grcKpis}
        isLoading={isLoading}
        // (A gente vai passar os toggles aqui depois)
      />
      
      <main className="cockpit-map-area">
        {/* O mapa agora "ouve" o filtro */}
        <CockpitMap mapFilter={mapFilter} />
      </main>

      <CockpitChartbar
        graficos={grcGraficos}
        isLoading={isLoading}
        onFilterChange={handleFilterChange} // Passa a função de "aviso" para os gráficos
        activeFilter={mapFilter} // Passa o filtro ativo para o gráfico saber se está selecionado
      />
    </div>
  );
}

export default CockpitPage;