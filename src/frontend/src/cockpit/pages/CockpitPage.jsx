// src/cockpit/pages/CockpitPage.jsx (VERSÃO FINAL COM 3 COLUNAS)

import React, { useState, useEffect } from 'react';
import CockpitSidebar from '../components/CockpitSidebar';
import CockpitChartbar from '../components/CockpitChartbar'; // NOVO: A sidebar da direita
import CockpitMap from '../components/CockpitMap';
import './CockpitPage.css';

function CockpitPage() {
  const [activeFocus, setActiveFocus] = useState('nacional');
  const [activeIntel, setActiveIntel] = useState('rios');
  const [grcKpis, setGrcKpis] = useState(null);
  const [grcGraficos, setGrcGraficos] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeIntel === 'rios') {
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
    }
  }, [activeIntel]);

  return (
    <div className="cockpit-page-container">
      {/* Coluna 1: A Sidebar de KPIs (Esquerda) */}
      <CockpitSidebar
        kpis={grcKpis}
        isLoading={isLoading}
      />
      
      {/* Coluna 2: O Mapa (Centro) */}
      <main className="cockpit-map-area">
        <CockpitMap />
      </main>

      {/* Coluna 3: A Nova Sidebar de Gráficos (Direita) */}
      <CockpitChartbar
        graficos={grcGraficos}
        isLoading={isLoading}
      />
    </div>
  );
}

export default CockpitPage;