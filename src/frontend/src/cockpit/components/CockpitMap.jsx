import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import CockpitMapLegend from "./CockpitMapLegend";
import "leaflet/dist/leaflet.css";
import "./CockpitMap.css";

// --- ÍCONES ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- UTILITÁRIOS ---
const norm = (v) => {
  if (!v) return "";
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
};

const getRiskColor = (risk) => {
  const r = Number(risk) || 0;
  if (r >= 8) return "#e74c3c"; 
  if (r >= 6) return "#e67e22"; 
  if (r >= 4) return "#f1c40f"; 
  if (r >= 2) return "#2ecc71"; 
  if (r > 0) return "#3498db";  
  return "transparent";
};

const getRiskLevel = (risk) => {
  const r = Number(risk);
  if (isNaN(r) || r === 0) return "Sem Dados";
  if (r >= 8) return "Crítico";
  if (r >= 6) return "Alto";
  if (r >= 4) return "Moderado";
  if (r >= 2) return "Baixo";
  return "Mínimo";
};

// --- ZOOM HANDLER ---
const MapZoomHandler = ({ mapFilter, geoJsonData, activeFocus, assetData }) => {
  const map = useMap();

  useEffect(() => {
    // 1. ZOOM EM MEUS ATIVOS
    const hasAssets = Array.isArray(assetData) && assetData.length > 0;
    if (activeFocus === "ativos" && hasAssets) {
      const markers = assetData.map((a) => {
          const c = a?.geometry?.coordinates;
          if (!c || c.length < 2) return null;
          return L.marker([c[1], c[0]]);
      }).filter(Boolean);

      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        try { map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 }); } catch (e) {}
        return;
      }
    }

    // 2. ZOOM VISÃO MACRO
    if (!geoJsonData) {
        if (!hasAssets && !mapFilter) map.flyTo([-14.235, -51.925], 4);
        return;
    }

    if (!mapFilter) {
      map.flyTo([-14.235, -51.925], 4);
      return;
    }

    const targetName = norm(mapFilter);
    const feature = geoJsonData.features.find((f) => {
      const fName = norm(f?.properties?.NM_MUN_PADRONIZADO || f?.properties?.name);
      return fName === targetName;
    });

    if (feature) {
      const layer = L.geoJSON(feature);
      try { map.flyToBounds(layer.getBounds(), { padding: [100, 100], maxZoom: 9 }); } catch (e) {}
    }
  }, [mapFilter, geoJsonData, map, activeFocus, assetData]);

  return null;
};

// --- COMPONENTE PRINCIPAL ---
const CockpitMap = ({ mapFilter, activeIntel = "rios", activeFocus = "nacional", externalData }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [assetData, setAssetData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Lookup Mestre
  const realScores = useMemo(() => {
     const map = {};
     if (externalData && Array.isArray(externalData.features)) {
         externalData.features.forEach(f => {
             if (f.properties && f.properties.name) {
                 const key = norm(f.properties.name);
                 map[key] = f.properties.risk;
             }
         });
     }
     return map;
  }, [externalData]);

  // --- CARREGAMENTO DE DADOS (SUA LÓGICA RESTAURADA) ---
  useEffect(() => {
    let canceled = false;
    
    // MODO MESTRE (Combinação)
    if (activeIntel === "mestre") {
        if (externalData) {
            setAssetData(externalData.features || []);
            // Sempre carrega o mapa base (Rios) para ter o desenho
            fetch("http://127.0.0.1:8000/macro/grc/map")
                .then(r => r.json())
                .then(data => { if(!canceled) setGeoJsonData(data); })
                .catch(e => console.warn("Erro ao carregar mapa base", e));
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }
        return;
    }

    // MODO LEGADO (Rios / Clima / Ativos)
    const runLegacy = async () => {
        setIsLoading(true);
        setGeoJsonData(null);
        setAssetData([]);
        
        try {
            const fetchGeo = async () => {
                // Seleciona URL correta (Conserta o Clima!)
                const url = activeIntel === "clima" ? "http://127.0.0.1:8000/macro/clima/map" : "http://127.0.0.1:8000/macro/grc/map";
                const res = await fetch(url);
                if (!res.ok) throw new Error("Erro de rede");
                const data = await res.json();
                if (!canceled) setGeoJsonData(data);
            };
            
            const fetchAssets = async () => {
                const res = await fetch("http://127.0.0.1:8000/macro/assets/map");
                if (!res.ok) throw new Error("Erro de rede");
                const data = await res.json();
                if (!canceled) setAssetData(data.features || []);
            };

            // Lógica original de Promise.all
            if (activeFocus === "ativos") await Promise.all([fetchAssets(), fetchGeo()]);
            else await fetchGeo();

        } catch (err) { 
            console.error(err); 
        } finally { 
            if (!canceled) setIsLoading(false); 
        }
    };
    runLegacy();
    return () => { canceled = true; };
  }, [activeIntel, activeFocus, externalData]);

  // --- EXTRAÇÃO DE DADOS ---
  const getFeatureData = (props) => {
      const name = norm(props.NM_MUN_PADRONIZADO || props.name);
      
      // Mestre
      if (activeIntel === 'mestre') {
          const calculatedScore = realScores[name];
          if (calculatedScore !== undefined && calculatedScore !== null) {
              return { risk: Number(calculatedScore), label: "Risco Mestre" };
          }
          const climaLocal = Number(props.risco_clima_nota || 0);
          if (climaLocal > 0) return { risk: climaLocal * 0.5, label: "Risco Mestre (Clima)" };
          return { risk: 0, label: "Sem Dados" };
      }
      
      // Clima
      if (activeIntel === 'clima') {
          return { risk: Number(props.risco_clima_nota || 0), label: "Risco Climático" };
      }
      
      // Rios
      return { risk: Number(props.risco_rio_nota || props.RISCO_RIO || props.nota || 0), label: "Risco Rio (GRC)" };
  };

  // --- ESTILIZAÇÃO ---
  const geoJsonStyle = (feature) => {
    // 1. MODO ATIVOS: Mapa limpo/transparente
    if (activeFocus === "ativos") {
        return { 
            fillColor: "transparent", 
            fillOpacity: 0, 
            weight: 0.5, 
            color: "#666", 
            opacity: 0.3 
        };
    }

    // 2. MODO MACRO: Cores Normais
    const { risk } = getFeatureData(feature.properties || {});
    const props = feature.properties || {};
    const municipioName = norm(props.NM_MUN_PADRONIZADO || props.name);
    const filterName = norm(mapFilter);

    if (mapFilter) {
        const riskLevel = norm(getRiskLevel(risk));
        if (riskLevel !== filterName && municipioName !== filterName) {
            return { fillColor: "#222", fillOpacity: 0.1, weight: 0.5, color: "#333" };
        }
    }

    if (risk > 0) {
        return { fillColor: getRiskColor(risk), fillOpacity: 0.75, weight: 0.5, color: "#666", opacity: 1 };
    }
    return { fillColor: "transparent", fillOpacity: 0, weight: 0.3, color: "#444", opacity: 0.3 };
  };

  // --- POPUP ---
  const onEachFeature = (feature, layer) => {
    // Se for "Ativos", não mostra popup no município para não atrapalhar
    if (activeFocus === "ativos") return; 

    const props = feature.properties || {};
    const municipioName = props.NM_MUN_PADRONIZADO || props.name || "Desconhecido";
    
    const { risk, label } = getFeatureData(props);
    const color = getRiskColor(risk);
    
    layer.bindPopup(`
        <div style="text-align:center; min-width: 140px;">
            <strong style="font-size:1rem; color:#fff; text-transform:uppercase;">${municipioName}</strong>
            <hr style="margin:6px 0; border-color:#444;"/>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; color:#ccc;">${label}:</span>
                <strong style="font-size:1.2rem; color:${color};">${risk.toFixed(2)}</strong>
            </div>
            <div style="font-size:0.75rem; color:#888; margin-top:4px;">
                Nível: <span style="color:${color}">${getRiskLevel(risk)}</span>
            </div>
        </div>
    `);

    layer.on({
      mouseover: (e) => {
        if (activeFocus === "ativos") return;
        const target = e.target;
        target.setStyle({ weight: 2, color: "#FFFFFF", fillOpacity: 0.9 });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) target.bringToFront();
      },
      mouseout: (e) => {
        if (!mapFilter) e.target.setStyle(geoJsonStyle(feature));
      },
      click: (e) => {
        map.fitBounds(e.target.getBounds(), { padding: [50, 50] });
      }
    });
  };

  const showMap = !isLoading && (!!geoJsonData || (assetData && assetData.length > 0) || activeIntel === 'mestre');

  return (
    <div className="cockpit-map-container" style={{ height: "100%", width: "100%", position: 'relative' }}>
      {isLoading && <div className="map-loading-overlay">Carregando Mapa...</div>}

      {showMap ? (
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: "100%", width: "100%" }} preferCanvas={true}>
          <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />

          {/* GEOJSON (Fundo) */}
          {geoJsonData && (
            <GeoJSON
              // Key: força atualização quando muda contexto
              key={`geo-${activeIntel}-${activeFocus}-${mapFilter || 'all'}`}
              data={geoJsonData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* MARCADORES (PONTOS) */}
          {Array.isArray(assetData) && assetData.map((asset, i) => {
            const coords = asset?.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;
            
            const lat = coords[1], lon = coords[0];
            const assetRisk = (asset?.properties?.risk ?? asset?.properties?.risco ?? 0);
            const assetName = asset?.properties?.name || "Ativo";
            const assetId = asset?.properties?.id;
            const assetMuni = asset?.properties?.municipio || "";
            
            // Filtro visual para pontos
            if (activeFocus === "nacional" && mapFilter) {
               const level = norm(getRiskLevel(assetRisk));
               if (norm(level) !== norm(mapFilter) && norm(assetName) !== norm(mapFilter)) return null;
            }

            const pinColor = getRiskColor(assetRisk);
            const size = activeFocus === "ativos" ? 16 : 12;
            const iconHtml = `<div style="background:${pinColor}; width:${size}px; height:${size}px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 8px ${pinColor};"></div>`;
            
            return (
              <Marker
                key={`pt-${i}`}
                position={[lat, lon]}
                icon={L.divIcon({ className: "custom-pin", html: iconHtml, iconSize: [size, size] })}
              >
                <Popup>
                    <div style={{textAlign:'center', color:'#333', minWidth:'150px'}}>
                        <strong style={{fontSize:'1.1rem'}}>{assetName}</strong>
                        {assetMuni && (
                            <div style={{fontSize:'0.85rem', color:'#666', marginBottom:'5px'}}>
                                {assetMuni}
                            </div>
                        )}
                        <hr style={{margin:'5px 0', border:0, borderTop:'1px solid #ddd'}}/>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                             <span>Risco Atual:</span>
                             <strong style={{color:pinColor, fontSize:'1.2rem'}}>{assetRisk.toFixed(2)}</strong>
                        </div>
                        
                        {/* LINK DO ATIVO RESTAURADO */}
                        {assetId && (
                            <a 
                                href={`/asset/${assetId}`}
                                style={{
                                    display: 'block',
                                    background: '#007bff',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    marginTop: '8px',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}
                            >
                                Ver Detalhes &rarr;
                            </a>
                        )}
                    </div>
                </Popup>
              </Marker>
            );
          })}

          {activeFocus !== "ativos" && <CockpitMapLegend getRiskColor={getRiskColor} />}
          <MapZoomHandler mapFilter={mapFilter} geoJsonData={geoJsonData} activeFocus={activeFocus} assetData={assetData} />
        </MapContainer>
      ) : (
        <div className="map-loading">Aguardando dados...</div>
      )}
    </div>
  );
};

export default CockpitMap;