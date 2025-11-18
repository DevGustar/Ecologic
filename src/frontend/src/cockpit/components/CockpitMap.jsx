// src/cockpit/components/CockpitMap.jsx (VERSÃO FINAL COM TUDO JUNTO)

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
  if (risk > 0) return 'var(--cor-neutra)'; // Mínimo (azul)
  return 'transparent'; // Sem Dados (nota 0)
};

// Função para classificar a nota em texto
const getRiskLevel = (risk) => {
  if (risk >= 8) return "Crítico";
  if (risk >= 6) return "Alto";
  if (risk >= 4) return "Moderado";
  if (risk >= 2) return "Baixo";
  if (risk > 0) return "Mínimo";
  return null;
};

// O Mapa agora recebe o "mapFilter" como prop
const CockpitMap = ({ mapFilter }) => {
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

  // MUDANÇA: O ESTILO AGORA DEPENDE DO FILTRO
  const geoJsonStyle = (feature) => {
    const risk = feature.properties.risco_rio_nota;
    const riskLevel = getRiskLevel(risk);
    const municipioName = feature.properties.NM_MUN_PADRONIZADO;
    
    // Se não houver filtro, mostra o mapa padrão
    if (!mapFilter) {
      if (risk > 0) {
        return { // Estilo "Com Risco"
          fillColor: getRiskColor(risk),
          fillOpacity: 0.6,
          weight: 0,
          opacity: 1,
        };
      } else {
        return { // Estilo "Sem Risco" (borda sutil)
          fillColor: 'transparent', 
          fillOpacity: 0,
          weight: 0.2, 
          color: 'var(--borda-sutil, #444)', 
          opacity: 0.5, 
        };
      }
    }
    
    // Se houver filtro...
    
    // Filtro 1: Clicou no Donut (ex: mapFilter === "Crítico")
    if (riskLevel === mapFilter) {
      return {
        fillColor: getRiskColor(risk),
        fillOpacity: 0.7,
        weight: 0.5, // Borda sutil para o grupo
        color: '#FFF',
        opacity: 0.5,
      };
    }
    
    // Filtro 2: Clicou na Barra (ex: mapFilter === "MONTENEGRO")
    if (municipioName === mapFilter) {
      return {
        fillColor: getRiskColor(risk),
        fillOpacity: 0.8,
        weight: 2, // Destaca a borda do município selecionado
        color: '#FFFFFF', // Borda branca
        opacity: 1,
      };
    }
    
    // Se não for nenhum dos filtros, "apaga" o município
    return { fillColor: 'transparent', fillOpacity: 0, weight: 0, opacity: 0 };
  };

  // MUDANÇA: A gente traz o onEachFeature DE VOLTA!
  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    
    const municipioName = props.name || props.NM_MUN || 'Município Desconhecido';
    const estadoUF = props.uf || props.sigla || 'N/A'; // Ajuste o 'uf' para o nome correto
    const risk = props.risco_rio_nota;

    // 1. Efeito Hover (funciona para todos)
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#FFFFFF',
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
      },
      mouseout: (e) => {
        // Usa 'resetStyle' para voltar ao estilo do GeoJSON (que agora é dinâmico)
        e.target.setStyle(geoJsonStyle(feature));
      }
    });

    // 2. Lógica do Popup (agora inteligente)
    if (risk > 0) {
      layer.bindPopup(`
        <strong>${municipioName}</strong>
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
            key={mapFilter || 'no-filter'} // O 'key' força o mapa a redesenhar quando o filtro mudar
            data={geoJsonData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature} // <-- ELE VOLTOU!
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