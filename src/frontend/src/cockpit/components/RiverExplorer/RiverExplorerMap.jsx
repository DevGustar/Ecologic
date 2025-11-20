// src/cockpit/components/RiverExplorer/RiverExplorerMap.jsx (COM ZOOM AUTOMÁTICO)

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'; // Importa useMap
import 'leaflet/dist/leaflet.css';
import './RiverExplorerMap.css';
import L from 'leaflet'; // Importa Leaflet para cálculos

// Função de cor
const getRiskColor = (risk) => {
  if (risk >= 8) return 'var(--cor-critica)';
  if (risk >= 6) return 'var(--cor-alerta)';
  if (risk >= 4) return 'var(--cor-cuidado)';
  if (risk >= 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)'; 
};

// --- NOVO COMPONENTE: Responsável por dar o Zoom ---
const MapUpdater = ({ geoJsonData, selectedMunicipality }) => {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData || !selectedMunicipality) return;

    // Encontra a feature do município selecionado
    const feature = geoJsonData.features.find(
      f => f.properties.NM_MUN_PADRONIZADO === selectedMunicipality
    );

    if (feature) {
      // Cria um layer temporário para calcular os limites (bounds)
      const layer = L.geoJSON(feature);
      const bounds = layer.getBounds();
      
      // Faz o mapa "voar" para o município com uma animação suave
      map.flyToBounds(bounds, {
        padding: [50, 50], // Um pouco de respiro nas bordas
        maxZoom: 10,       // Não dá zoom demais
        duration: 1.5      // Duração da animação em segundos
      });
    }
  }, [geoJsonData, selectedMunicipality, map]);

  return null;
};

const RiverExplorerMap = ({ rivers, isLoading, selectedMunicipality }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/macro/grc/map');
        if (response.ok) {
          const data = await response.json();
          setGeoJsonData(data);
        }
      } catch (error) {
        console.error("Erro ao carregar mapa base:", error);
      }
    };
    fetchMapData();
  }, []);

  const activeMunicipalities = useMemo(() => {
    const map = {};
    rivers.forEach(river => {
      const munName = river.NM_MUN_PADRONIZADO;
      const risk = river.Nota_de_Risco;
      const uf = river['Sigla do Estado'];
      
      if (!map[munName] || risk > map[munName].risk) {
        map[munName] = { risk, uf };
      }
    });
    return map;
  }, [rivers]);

  const geoJsonStyle = (feature) => {
    const munName = feature.properties.NM_MUN_PADRONIZADO;
    const activeData = activeMunicipalities[munName];
    
    const isSelected = munName === selectedMunicipality;

    // ESTILO DE DESTAQUE (AMARELO OURO)
    if (isSelected) {
        return {
            fillColor: '#FFD700', 
            fillOpacity: 0.9,
            weight: 3,         
            color: '#FFFFFF',  
            opacity: 1
        };
    }

    if (activeData) {
      return {
        fillColor: getRiskColor(activeData.risk),
        fillOpacity: 0.8, 
        weight: 0.5,
        color: '#FFF',
        opacity: 1
      };
    } 
    
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 0.2,
      color: 'var(--borda-sutil, #444)',
      opacity: 0.3
    };
  };

  const onEachFeature = (feature, layer) => {
    const munName = feature.properties.NM_MUN_PADRONIZADO;
    const activeData = activeMunicipalities[munName];

    if (activeData) {
      layer.bindPopup(`
        <strong>${munName} - ${activeData.uf}</strong>
        <br/>Nota de Risco: ${activeData.risk.toFixed(2)}
      `);

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          if (munName !== selectedMunicipality) {
              l.setStyle({ weight: 3, color: '#FFFFFF', opacity: 1 });
              l.bringToFront();
          }
        },
        mouseout: (e) => {
          e.target.setStyle(geoJsonStyle(feature));
        }
      });
    }
  };

  return (
    <div className="explorer-map-wrapper">
      {geoJsonData ? (
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          
          {/* O componente GeoJSON */}
          <GeoJSON 
            key={`${rivers.length}-${selectedMunicipality}`} 
            data={geoJsonData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature}
          />
          
          {/* NOVO: O componente que faz o zoom automático */}
          <MapUpdater 
            geoJsonData={geoJsonData} 
            selectedMunicipality={selectedMunicipality} 
          />
          
        </MapContainer>
      ) : (
        <div className="map-loading">Carregando Mapa...</div>
      )}
    </div>
  );
};

export default RiverExplorerMap;