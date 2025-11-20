// src/cockpit/components/RiverExplorerMap.jsx (REAÇÃO AO CLIQUE)

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './RiverExplorerMap.css';

const getRiskColor = (risk) => {
  if (risk >= 8) return 'var(--cor-critica)';
  if (risk >= 6) return 'var(--cor-alerta)';
  if (risk >= 4) return 'var(--cor-cuidado)';
  if (risk >= 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)'; 
};

// Recebe selectedMunicipality
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
    
    // VERIFICAÇÃO DE DESTAQUE
    const isSelected = munName === selectedMunicipality;

    // Se for o município CLICADO na tabela, destaca ele!
    if (isSelected) {
        return {
            fillColor: '#FFD700', // Ouro / Amarelo forte
            fillOpacity: 0.9,
            weight: 3,         // Borda grossa
            color: '#FFFFFF',  // Borda branca
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

  // (onEachFeature continua o mesmo para hover e popup)
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
          // Só muda estilo no hover se NÃO for o selecionado (para não perder o destaque amarelo)
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
          {/* O key agora inclui selectedMunicipality para forçar a repintura instantânea */}
          <GeoJSON 
            key={`${rivers.length}-${selectedMunicipality}`} 
            data={geoJsonData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      ) : (
        <div className="map-loading">Carregando Mapa...</div>
      )}
    </div>
  );
};

export default RiverExplorerMap;