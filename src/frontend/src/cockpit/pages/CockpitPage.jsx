// src/cockpit/pages/CockpitPage.jsx

import React, { useState, useEffect } from 'react';
import CockpitSidebar from '../components/CockpitSidebar';
import CockpitChartbar from '../components/CockpitChartbar';
import CockpitMap from '../components/CockpitMap';
import './CockpitPage.css';

function CockpitPage() {
  const [activeFocus, setActiveFocus] = useState('nacional');
  const [activeIntel, setActiveIntel] = useState('mestre'); // Já inicia na Fusão
  const [mapFilter, setMapFilter] = useState(null);

  // Estados de Dados
  const [kpis, setKpis] = useState(null);
  const [graficos, setGraficos] = useState(null);
  
  // NOVO: Estado para guardar o GeoJSON que vem do backend
  const [mapData, setMapData] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setMapFilter(null);
      setKpis(null);
      setGraficos(null);
      setMapData(null); // Reseta o mapa para não misturar dados antigos
      
      try {
        // --- CENÁRIO 1: FUSÃO MESTRA (Endpoint Único) ---
        if (activeIntel === 'mestre') {
            const response = await fetch('http://127.0.0.1:8000/macro/mestre/full_data');
            
            if (!response.ok) {
                console.warn(`Erro API Mestre: ${response.status}`);
                return;
            }
            
            const data = await response.json();
            
            if (data) {
                setKpis(data.kpis);
                setGraficos(data.graficos);
                setMapData(data.mapa); // Guarda o GeoJSON aqui!
            }
        } 
        
        // --- CENÁRIO 2: MODOS ANTIGOS (Rios ou Clima isolados) ---
        else {
            let urlKpi = '';
            if (activeIntel === 'rios') urlKpi = 'http://127.0.0.1:8000/macro/grc/kpis';
            else if (activeIntel === 'clima') urlKpi = 'http://127.0.0.1:8000/macro/clima/kpis';
            else { setIsLoading(false); return; }

            const response = await fetch(urlKpi);
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (data) {
                setKpis(data.kpis);
                setGraficos({
                    riscoPorNivel: data.graficos.riscoPorNivel || [],
                    // Garante compatibilidade de nomes
                    topRiosPorRisco: data.graficos.topRiosPorRisco || data.graficos.topMunicipios || []
                });
            }
            // Nota: Nos modos antigos, deixamos mapData como null, 
            // pois o CockpitMap saberá buscar os dados legados sozinho.
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
        {/* Passamos o mapData como 'externalData'. 
            O mapa vai usar isso se existir, ou buscar sozinho se for null. */}
        <CockpitMap 
            mapFilter={mapFilter} 
            activeIntel={activeIntel} 
            activeFocus={activeFocus}
            externalData={mapData} 
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