// src/cockpit/components/CockpitMap.jsx (VERSÃO FINAL COM HOVER DE BORDA CONSISTENTE)

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import CockpitMapLegend from './CockpitMapLegend';
import 'leaflet/dist/leaflet.css';
import './CockpitMap.css';

// Função para definir a cor
const getRiskColor = (risk) => {
  if (risk >= 8) return 'var(--cor-critica)';
  if (risk >= 6) return 'var(--cor-alerta)';
  if (risk >= 4) return 'var(--cor-cuidado)';
  if (risk >= 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)'; 
};

// O estilo de "descanso"
const geoJsonStyle = (feature) => {
  const risk = feature.properties.risco_rio_nota;

  if (risk > 0) {
    // --- Município COM DADOS de Risco de Rio ---
    const color = getRiskColor(risk);
    return {
      fillColor: color,
      fillOpacity: 0.6,
      weight: 0, // Sem borda no descanso
      opacity: 1, 
    };
  } else {
    // --- Município "SEM DADOS" (Risco 0) ---
    return {
      fillColor: 'transparent', 
      fillOpacity: 0,
      weight: 0.2, // Borda sutil no descanso
      color: 'var(--borda-sutil, #444)', 
      opacity: 0.5, 
    };
  }
};

const CockpitMap = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);

  useEffect(() => {
    // Busca o nosso novo GeoJSON "pintado"
    const fetchMapData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/macro/grc/map');
        if (!response.ok) throw new Error('Falha ao buscar dados do mapa GRC');
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error("Erro ao buscar mapa GRC:", error);
      }
    };
    fetchMapData();
  }, []);

  // Lógica de interatividade (Hover + Click/Popup)
  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    
    const municipioName = props.name || props.NM_MUN || 'Município Desconhecido';
    const estadoUF = props.uf || props.sigla || 'N/A'; // Ajuste o 'uf' para o nome correto da sua coluna
    const risk = props.risco_rio_nota;

    // 1. Efeito Hover (funciona para todos)
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2, // Borda branca grossa
          color: '#FFFFFF',
          // MUDANÇA: A gente não mexe mais na opacidade do preenchimento!
          // fillOpacity: 0.8 
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        // Volta ao estilo original (seja colorido ou cinza sutil)
        e.target.setStyle(geoJsonStyle(feature));
      }
    });

    // 2. Lógica do Popup (agora inteligente)
    if (risk > 0) {
      layer.bindPopup(`
        <strong>${municipioName} - ${estadoUF}</strong>
        <br/>Nota de Risco (Rios): ${risk.toFixed(2)}
      `);
    } else {
      layer.bindPopup(`
        <strong>${municipioName} - ${estadoUF}</strong>
        <br/>Risco de Rio: Sem Dados
      `);
    }
  };

  return (
    <div className="cockpit-map-container">
      {geoJsonData ? (
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON 
            data={geoJsonData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature}
          />
          
          <CockpitMapLegend getRiskColor={getRiskColor} />
        </MapContainer>
      ) : (
        <div className="map-loading">Carregando Mapa de Risco GRC...</div>
      )}
    </div>
  );
};

export default CockpitMap;