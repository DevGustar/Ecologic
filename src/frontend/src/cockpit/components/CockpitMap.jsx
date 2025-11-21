// src/cockpit/components/CockpitMap.jsx (SEU CÓDIGO + ZOOM + CORREÇÕES DE IMPORT)

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'; // Adicionado useMap
import L from 'leaflet'; // Adicionado L para o zoom funcionar
import CockpitMapLegend from './CockpitMapLegend';
import 'leaflet/dist/leaflet.css';
import './CockpitMap.css';

const getRiskColor = (risk) => {
  const r = Number(risk);
  if (r >= 8) return 'var(--cor-critica)';
  if (r >= 6) return 'var(--cor-alerta)';
  if (r >= 4) return 'var(--cor-cuidado)';
  if (r >= 2) return 'var(--cor-sucesso)';
  if (r > 0) return 'var(--cor-neutra)'; 
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

const normalizeName = (name) => {
    if (!name) return '';
    return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

// --- Componente de Zoom (INTEGRADO AO SEU CÓDIGO) ---
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
  }, [mapFilter, geoJsonData, map]);

  return null;
};

// Recebe activeIntel para saber qual endpoint chamar
const CockpitMap = ({ mapFilter, activeIntel }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Adicionado para tratar erro

  // REFETCH quando o cenário muda (Rios <-> Clima)
  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true);
      setGeoJsonData(null); // Limpa o mapa anterior enquanto carrega
      setErrorMsg(null);

      try {
        let url = '';
        if (activeIntel === 'rios') url = 'http://127.0.0.1:8000/macro/grc/map';
        else if (activeIntel === 'clima') url = 'http://127.0.0.1:8000/macro/clima/map';
        else return; // Placeholder para Mestre

        const response = await fetch(url);
        if (response.status === 503) throw new Error("Dados indisponíveis (503).");
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

  const geoJsonStyle = (feature) => {
    // O backend manda 'risco_rio_nota' OU 'risco_clima_nota'
    // Vamos tentar pegar qualquer um dos dois
    const risk = feature.properties.risco_rio_nota || feature.properties.risco_clima_nota || 0;
    const riskLevel = getRiskLevel(risk);
    const municipioName = normalizeName(feature.properties.NM_MUN_PADRONIZADO);
    const filterName = normalizeName(mapFilter);
    
    // Se não houver filtro (SEU ESTILO ORIGINAL)
    if (!mapFilter) {
      if (risk > 0) {
        return {
          fillColor: getRiskColor(risk),
          fillOpacity: 0.8,
          weight: .4,
          color: '#FFFFFF',
          opacity: .5,
          
        };
      } else {
        return {
          fillColor: 'transparent', 
          fillOpacity: 0,
          weight: 0.2, 
          color: 'var(--borda-sutil, #444)', 
          opacity: 0.5, 
        };
      }
    }
    
    // Se houver filtro (Cross-filtering)
    // (Usei a normalização aqui para garantir que o filtro funcione)
    const isMatch = (String(riskLevel).toUpperCase() === String(filterName).toUpperCase()) || 
                    (municipioName === filterName);

    if (isMatch) {
      return {
        fillColor: getRiskColor(risk),
        fillOpacity: 0.9,
        weight: .6,
        color: '#FFFFFF',
        opacity: .5,
      };
    } else {
        // Adicionei o estilo para "apagado" que faltava no seu snippet para o filtro funcionar visualmente
        return {
             fillColor: '#222',
             fillOpacity: 0.1,
             weight: 0,
             opacity: 0
        };
    }
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const municipioName = props.NM_MUN_PADRONIZADO || props.name || 'Desconhecido';
    const risk = props.risco_rio_nota || props.risco_clima_nota || 0;
    
    // Label do popup muda conforme o cenário
    const labelRisco = activeIntel === 'clima' ? 'Risco Climático' : 'Nota de Risco (Rios)';

    if (risk > 0) {
      layer.bindPopup(`
        <strong>${municipioName}</strong>
        <br/>${labelRisco}: ${risk.toFixed(2)}
      `);
    } else {
      layer.bindPopup(`<strong>${municipioName}</strong><br/>Sem Dados`);
    }

    layer.on({
      mouseover: (e) => {
        // Só destaca no hover se não tiver filtro ativo
        if (!mapFilter) {
            const layer = e.target;
            layer.setStyle({ weight: 2, color: '#FFFFFF' });
            layer.bringToFront();
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
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON 
            key={`${activeIntel}-${mapFilter || 'all'}`} // Força update ao trocar cenário ou filtro
            data={geoJsonData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature}
          />
          
          <CockpitMapLegend getRiskColor={getRiskColor} />
          
          {/* O Zoom Inteligente que você pediu */}
          <MapZoomHandler mapFilter={mapFilter} geoJsonData={geoJsonData} />
          
        </MapContainer>
      ) : (
        <div className="map-loading">
            {errorMsg ? errorMsg : (isLoading ? "Carregando Inteligência..." : "Selecione uma camada.")}
        </div>
      )}
    </div>
  );
};

export default CockpitMap;