// src/cockpit/components/CockpitMap.jsx
import React, { useState, useEffect } from "react";
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

// Ajuste de ícone padrão do Leaflet (para evitar problema do pino padrão não aparecer)
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

// ---------------- Utilitários ----------------
const norm = (v) => {
  if (v === null || v === undefined) return "";
  return String(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const getRiskColor = (risk) => {
  const r = Number(risk);
  if (r >= 8) return "var(--cor-critica)";
  if (r >= 6) return "var(--cor-alerta)";
  if (r >= 4) return "var(--cor-cuidado)";
  if (r >= 2) return "var(--cor-sucesso)";
  if (r > 0) return "var(--cor-neutra)";
  return "transparent";
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

// ---------------- Zoom Inteligente ----------------
const MapZoomHandler = ({ mapFilter, geoJsonData, activeFocus, assetData }) => {
  const map = useMap();

  useEffect(() => {
    // Visão ativos → foco nos marcadores
    if (activeFocus === "ativos" && Array.isArray(assetData) && assetData.length > 0) {
      const markers = assetData
        .map((a) => {
          const coords = a?.geometry?.coordinates;
          if (!coords || coords.length < 2) return null;
          return L.marker([coords[1], coords[0]]);
        })
        .filter(Boolean);

      if (markers.length === 0) return;

      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
      return;
    }

    // Visão nacional (com ou sem filtro)
    if (!geoJsonData) return;

    if (!mapFilter) {
      map.flyTo([-14.235, -51.925], 4, { duration: 1.5 });
      return;
    }

    const targetName = norm(mapFilter);
    const feature = geoJsonData.features.find((f) => {
      const fName = norm(f?.properties?.NM_MUN_PADRONIZADO || f?.properties?.name);
      return fName === targetName;
    });

    if (feature) {
      const layer = L.geoJSON(feature);
      map.flyToBounds(layer.getBounds(), { padding: [100, 100], maxZoom: 9, duration: 1.5 });
    }
  }, [mapFilter, geoJsonData, map, activeFocus, assetData]);

  return null;
};

// ---------------- Componente Principal ----------------
const CockpitMap = ({ mapFilter, activeIntel = "rios", activeFocus = "nacional" }) => {
  // props:
  // - mapFilter (string) - filtro por nome do município ou nível (ex: "Crítico")
  // - activeIntel ("rios" | "clima")
  // - activeFocus ("nacional" | "ativos")
  const [geoJsonData, setGeoJsonData] = useState(null); // shapes
  const [assetData, setAssetData] = useState([]); // assets (markers)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch dos dados (geojson e assets quando necessário)
  useEffect(() => {
    let canceled = false;

    const fetchGeo = async () => {
      try {
        const url = activeIntel === "clima"
          ? "http://127.0.0.1:8000/macro/clima/map"
          : "http://127.0.0.1:8000/macro/grc/map";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Falha ao buscar geojson (${res.status})`);
        const data = await res.json();
        if (!canceled) setGeoJsonData(data);
      } catch (err) {
        console.error("Erro fetch geojson:", err);
        if (!canceled) setErrorMsg("Mapa Indisponível");
      }
    };

    const fetchAssets = async () => {
      try {
        const url = "http://127.0.0.1:8000/macro/assets/map";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Falha ao buscar assets (${res.status})`);
        const data = await res.json();
        if (!canceled) setAssetData(data.features || []);
      } catch (err) {
        console.error("Erro fetch assets:", err);
        if (!canceled) setErrorMsg("Ativos indisponíveis");
      }
    };

    const run = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setGeoJsonData(null);
      setAssetData([]);

      try {
        if (activeFocus === "ativos") {
          // quando em ativos, buscamos ambos: assets + shapes (para colorir apenas municípios que têm ativos)
          await Promise.all([fetchAssets(), fetchGeo()]);
        } else {
          // visão nacional: só shapes
          await fetchGeo();
        }
      } finally {
        if (!canceled) setIsLoading(false);
      }
    };

    run();

    return () => { canceled = true; };
  }, [activeIntel, activeFocus]);

  // ---------------- Estilo do GeoJSON ----------------
  const geoJsonStyle = (feature) => {
    const props = feature.properties || {};
    // risco do município vindo do backend
    const risk = activeIntel === "clima"
      ? (props.risco_clima_nota ?? 0)
      : (props.risco_rio_nota ?? 0);

    const municipioName = norm(props.NM_MUN_PADRONIZADO || props.name);
    const filterName = norm(mapFilter);

    // VISÃO ATIVOS: esconder tudo que não possui asset; destacar municípios onde há asset
    if (activeFocus === "ativos") {
      const hasAsset = Array.isArray(assetData) && assetData.some((a) => {
        const assetMunicipio = norm(a?.properties?.municipio ?? a?.properties?.name ?? "");
        return assetMunicipio === municipioName;
      });

      if (!hasAsset) {
        return {
          fillColor: "transparent",
          fillOpacity: 0,
          weight: 0,
        };
      }

      // município com ativo → cor segundo risco do município (coerente com visão nacional)
      return {
        fillColor: getRiskColor(risk),
        fillOpacity: 0.85,
        weight: 0.6,
        color: "#FFFFFF",
        opacity: 0.85,
      };
    }

    // VISÃO NACIONAL (preservando comportamento do código base)
    if (!mapFilter) {
      if (risk > 0) {
        return {
          fillColor: getRiskColor(risk),
          fillOpacity: 0.8,
          weight: 0.4,
          color: "#FFFFFF",
          opacity: 0.5,
        };
      }
      return {
        fillColor: "transparent",
        fillOpacity: 0,
        weight: 0.2,
        color: "var(--borda-sutil, #444)",
        opacity: 0.5,
      };
    }

    // cross-filter ativo: comparar níveis e nomes normalizados (remove acentos)
    const riskLevel = norm(getRiskLevel(risk));
    const isMatch = riskLevel === filterName || municipioName === filterName;

    if (isMatch) {
      return {
        fillColor: getRiskColor(risk),
        fillOpacity: 0.9,
        weight: 0.6,
        color: "#FFFFFF",
        opacity: 0.5,
      };
    }

    // estilo "apagado" quando houver filtro mas não houver match
    return {
      fillColor: "#222",
      fillOpacity: 0.1,
      weight: 0,
      opacity: 0,
    };
  };

  // ---------------- onEachFeature ----------------
  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const municipioName = props.NM_MUN_PADRONIZADO || props.name || "Desconhecido";
    const risk = activeIntel === "clima"
      ? (props.risco_clima_nota ?? 0)
      : (props.risco_rio_nota ?? 0);

    const label = activeIntel === "clima" ? "Risco Climático" : "Nota de Risco (Rios)";

    if (risk > 0) {
      layer.bindPopup(`<strong>${municipioName}</strong><br/>${label}: ${Number(risk).toFixed(2)}`);
    } else {
      layer.bindPopup(`<strong>${municipioName}</strong><br/>Sem Dados`);
    }

    layer.on({
      mouseover: (e) => {
        // apenas destaca no hover quando NÂO há filtro ativo (comportamento original)
        if (!mapFilter) {
          const target = e.target;
          target.setStyle({ weight: 2, color: "#FFFFFF", opacity: 1 });
          if (target.bringToFront) target.bringToFront();
        }
      },
      mouseout: (e) => {
        if (!mapFilter) {
          e.target.setStyle(geoJsonStyle(feature));
        }
      }
    });
  };

  // Decide se mostramos o mapa
  const showMap = !isLoading && !!geoJsonData;

  return (
    <div className="cockpit-map-container" style={{ height: "100%", width: "100%" }}>
      {showMap ? (
        <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ height: "100%", width: "100%" }} preferCanvas={true}>
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />

          {/* GeoJSON: desenha sempre (mas o style decide se aparece completamente ou apenas municípios com assets) */}
          <GeoJSON
            key={`${activeIntel}-${activeFocus}-${mapFilter || "all"}`}
            data={geoJsonData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />

          {/* Marcadores de ativos (apenas se assetData existir) */}
          {Array.isArray(assetData) && assetData.map((asset, i) => {
            const coords = asset?.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;
            const lat = coords[1], lon = coords[0];

            // risco do ativo (pode vir em different.casing)
            const assetRisk = (asset?.properties?.risk ?? asset?.properties?.RISK ?? asset?.properties?.risco ?? 0);
            const pinColor = getRiskColor(assetRisk);

            // ícone div colorido para distinguir riscos
            const iconHtml = `
              <div style="
                background: ${pinColor};
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 3px rgba(0,0,0,0.45);
              "></div>
            `;
            const coloredIcon = L.divIcon({
              className: "custom-pin-icon",
              html: iconHtml,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
              popupAnchor: [0, -9],
            });

            return (
              <Marker
                key={`asset-${asset?.properties?.id ?? i}-${lat}-${lon}`}
                position={[lat, lon]}
                icon={coloredIcon}
              >
                <Popup>
                  <div style={{ textAlign: "center", color: "#333" }}>
                    <strong>{asset?.properties?.name ?? asset?.properties?.nome ?? "Ativo"}</strong>
                    <div style={{ marginTop: 6, fontWeight: "bold", color: pinColor }}>
                      Risco Estimado: {typeof assetRisk === "number" ? assetRisk.toFixed(2) : assetRisk}
                    </div>
                    {asset?.properties?.id && (
                      <a href={`/asset/${asset.properties.id}`} style={{ display: "block", marginTop: 8, color: "#007bff" }}>
                        Ver Detalhes
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Legenda só aparece na visão nacional */}
          {activeFocus !== "ativos" && <CockpitMapLegend getRiskColor={getRiskColor} />}

          <MapZoomHandler
            mapFilter={mapFilter}
            geoJsonData={geoJsonData}
            activeFocus={activeFocus}
            assetData={assetData}
          />
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
