// src/cockpit/pages/CockpitPage.jsx (VERSÃO BLINDADA)

import React, { useState, useEffect } from 'react';
import CockpitSidebar from '../components/CockpitSidebar';
import CockpitChartbar from '../components/CockpitChartbar';
import CockpitMap from '../components/CockpitMap';
import './CockpitPage.css';

function CockpitPage() {
  const [activeFocus, setActiveFocus] = useState('nacional');
  const [activeIntel, setActiveIntel] = useState('rios'); 
  const [mapFilter, setMapFilter] = useState(null);

  const [kpis, setKpis] = useState(null);
  const [graficos, setGraficos] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setMapFilter(null); 
      setKpis(null);     
      setGraficos(null); 
      
      try {
        let urlKpi = '';
        if (activeIntel === 'rios') urlKpi = 'http://127.0.0.1:8000/macro/grc/kpis';
        else if (activeIntel === 'clima') urlKpi = 'http://127.0.0.1:8000/macro/clima/kpis';
        else { setIsLoading(false); return; }

        const response = await fetch(urlKpi);
        
        if (!response.ok) {
            console.warn(`Backend retornou erro ${response.status} para ${urlKpi}`);
            // Não lançamos erro fatal, apenas paramos o processamento
            return; 
        }
        
        const data = await response.json();
        
        // BLINDAGEM: Só define se os dados existirem
        if (data && data.kpis) {
            setKpis(data.kpis);
        }

        if (data && data.graficos) {
            setGraficos({
                riscoPorNivel: data.graficos.riscoPorNivel || [],
                topRiosPorRisco: data.graficos.topRiosPorRisco || data.graficos.topMunicipios || []
            });
        }
        
      } catch (error) {
        console.error("Erro ao buscar dados do Cockpit:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeIntel]); 

  const handleFilterChange = (filter) => {
    setMapFilter(prev => prev === filter ? null : filter);
  };

  return (
    <div className="cockpit-page-container">
      <CockpitSidebar
        activeFocus={activeFocus} setActiveFocus={setActiveFocus}
        activeIntel={activeIntel} setActiveIntel={setActiveIntel}
        kpis={kpis} isLoading={isLoading}
      />
      
      <main className="cockpit-map-area">
        <CockpitMap 
            mapFilter={mapFilter} 
            activeIntel={activeIntel} 
            activeFocus={activeFocus}
        />
      </main>

      <CockpitChartbar
        graficos={graficos}
        isLoading={isLoading}
        onFilterChange={handleFilterChange}
        activeFilter={mapFilter}
        activeIntel={activeIntel}
      />
    </div>
  );
}

export default CockpitPage;