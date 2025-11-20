// src/cockpit/components/CockpitMap.jsx (VERSÃO FINAL: CORES DE VOLTA + ZOOM + FILTRO)

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import CockpitMapLegend from './CockpitMapLegend';
import 'leaflet/dist/leaflet.css';
import './CockpitMap.css';

// --- Funções Auxiliares ---

const getRiskColor = (risk) => {
  const r = Number(risk);
  if (r >= 8) return 'var(--cor-critica)';
  if (r >= 6) return 'var(--cor-alerta)';
  if (r >= 4) return 'var(--cor-cuidado)';
  if (r >= 2) return 'var(--cor-sucesso)';
  if (r > 0) return 'var(--cor-neutra)'; // Azul (Mínimo)
  return 'transparent'; 
};

const getRiskLevel = (risk) => {
  const r = Number(risk);
  if (r >= 8) return "Crítico";
  if (r >= 6) return "Alto";
  if (r >= 4) return "Moderado";
  if (r >= 2) return "Baixo";
  if (r > 0) return "Mínimo";
  return "Sem Dados";
};

// Normaliza texto para comparação (remove acentos, tudo maiúsculo)
const normalizeName = (name) => {
    if (!name) return '';
    return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

// --- Componente de Zoom (Mantido) ---
const MapZoomHandler = ({ mapFilter, geoJsonData }) => {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) return;

    // Sem filtro? Volta para o Brasil
    if (!mapFilter) {
      map.flyTo([-14.235, -51.925], 4, { duration: 1.5 });
      return;
    }

    // Com filtro? Tenta achar o município
    const targetName = normalizeName(mapFilter);
    const feature = geoJsonData.features.find(f => {
        const fName = normalizeName(f.properties.NM_MUN_PADRONIZADO || f.properties.name);
        return fName === targetName;
    });

    // Se achou (clique na Barra), dá zoom nele
    if (feature) {
      const layer = L.geoJSON(feature);
      map.flyToBounds(layer.getBounds(), {
        padding: [100, 100],
        maxZoom: 9,
        duration: 1.5
      });
    } 
    // Se não achou (clique no Donut/Categoria), não faz nada (mantém a visão)

  }, [mapFilter, geoJsonData, map]);

  return null;
};

// --- COMPONENTE PRINCIPAL ---
const CockpitMap = ({ mapFilter, activeIntel }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true);
      setGeoJsonData(null); 
      setErrorMsg(null);

      try {
        let url = '';
        if (activeIntel === 'rios') url = 'http://127.0.0.1:8000/macro/grc/map';
        else if (activeIntel === 'clima') url = 'http://127.0.0.1:8000/macro/clima/map';
        else return; 

        const response = await fetch(url);
        if (response.status === 503) throw new Error("Dados indisponíveis (503). Verifique o Backend.");
        if (!response.ok) throw new Error('Falha ao buscar dados do mapa');
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error("Erro ao buscar mapa:", error);
        setErrorMsg("Mapa Indisponível");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMapData();
  }, [activeIntel]);

  // Lógica de Estilo (AQUI ESTÁ O SEGREDO DAS CORES)
  const geoJsonStyle = (feature) => {
    // Tenta pegar qualquer uma das propriedades de risco
    const risk = feature.properties.risco_rio_nota || feature.properties.risco_clima_nota || 0;
    
    const riskLevel = getRiskLevel(risk);
    const municipioName = normalizeName(feature.properties.NM_MUN_PADRONIZADO || feature.properties.name);
    const filterName = normalizeName(mapFilter);
    
    const baseColor = getRiskColor(risk);
    
    // --- MODO FILTRO ATIVO ---
    if (mapFilter) {
       // Verifica se bate com o filtro (por Categoria OU por Nome do Município)
       const isMatch = (String(riskLevel).toUpperCase() === String(mapFilter).toUpperCase()) || 
                       (municipioName === filterName);

       if (isMatch) {
          // DESTAQUE: Mantém a cor original, mas deixa mais forte
          return {
             fillColor: baseColor,
             fillOpacity: 0.9,
             weight: .3, // Borda branca
             color: '#FFFFFF',
             opacity: .8
          };
       } else {
          // APAGADO: Deixa escuro/transparente
          return {
             fillColor: '#222',
             fillOpacity: 0.1,
             weight: 0,
             opacity: 0
          };
       }
    }

    // --- MODO SEM FILTRO (NORMAL) ---
    if (risk > 0) {
      return {
        fillColor: baseColor,
        fillOpacity: 0.7, // Opacidade padrão
        weight: .3,       // Sem borda no descanso
        color: '#FFFFFF',
        opacity: .6
      };
    }
    
    // Sem dados (Risco 0)
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 0.2,
      color: '#444',
      opacity: 0.5
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const municipioName = props.NM_MUN_PADRONIZADO || props.name || 'Desconhecido';
    const risk = props.risco_rio_nota || props.risco_clima_nota || 0;
    
    const labelRisco = activeIntel === 'clima' ? 'Risco Climático' : 'Nota de Risco (Rios)';

    // Popup sempre disponível se tiver dados
    if (risk > 0) {
      layer.bindPopup(`<strong>${municipioName}</strong><br/>${labelRisco}: ${risk.toFixed(2)}`);
    } else {
      layer.bindPopup(`<strong>${municipioName}</strong><br/>Sem Dados`);
    }

    // Hover (só funciona visualmente se não tiver filtro ativo para não confundir)
    layer.on({
      mouseover: (e) => { 
        if (!mapFilter) {
            e.target.setStyle({ weight: 2, color: '#FFFFFF', opacity: 1 });
            e.target.bringToFront();
        }
      },
      mouseout: (e) => { 
        if (!mapFilter) {
            e.target.setStyle(geoJsonStyle(feature)); 
        }
      }
    });
  };

  return (
    <div className="cockpit-map-container">
      {!isLoading && geoJsonData ? (
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
          
          <GeoJSON 
            key={`${activeIntel}-${mapFilter || 'all'}`} 
            data={geoJsonData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature}
          />
          
          <CockpitMapLegend getRiskColor={getRiskColor} />
          <MapZoomHandler mapFilter={mapFilter} geoJsonData={geoJsonData} />
          
        </MapContainer>
      ) : (
        <div className="map-loading">
            {errorMsg ? errorMsg : (isLoading ? "Carregando Mapa..." : "Mapa Indisponível")}
        </div>
      )}
    </div>
  );
};

export default CockpitMap;