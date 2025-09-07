// src/components/dashboard/InteractiveMap.jsx

import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import MapLegend from './MapLegend';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function InteractiveMap({ assets, riskData, viewMode }) {
  const [popupContent, setPopupContent] = useState({ isLoading: false, data: null, error: null });

  const handleMarkerClick = async (asset) => {
    setPopupContent({ isLoading: true, data: null, error: null });
    try {
      const apiUrl = `http://127.0.0.1:8000/assets/${asset.asset_uuid}/risk_analysis`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Falha ao buscar análise de risco');
      }
      const analysisData = await response.json();
      setPopupContent({ isLoading: false, data: analysisData, error: null });
    } catch (err) {
      console.error("Erro ao buscar análise para o pop-up:", err);
      setPopupContent({ isLoading: false, data: null, error: err.message });
    }
  };

  const [geoJsonData, setGeoJsonData] = React.useState(null);
  React.useEffect(() => {
    fetch('/geojson/municipios_brasil.json')
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data));
  }, []);

 const getRiskColor = (risk) => {
  // Usamos as variáveis CSS que já definimos
  if (risk >= 8) return 'var(--cor-critica)';
  if (risk >= 6) return 'var(--cor-alerta)';
  if (risk >= 4) return 'var(--cor-cuidado)';
  if (risk >= 2) return 'var(--cor-sucesso)';
  return 'var(--cor-neutra)';
};

  const geoJsonStyle = (feature) => {
    const municipalityId = feature.properties.id;
    const risk = riskData && riskData[municipalityId] !== undefined ? riskData[municipalityId] : 0;
    return {
      fillColor: getRiskColor(risk),
      weight: 0.3,
      opacity: .8,
      color: '#A2C4DF',
      fillOpacity: 0.9,
    };
  };

  const onEachFeature = (feature, layer) => {
    const municipalityId = feature.properties.id;
    const municipalityName = feature.properties.name;
    if (municipalityName && riskData) {
      const risk = riskData[municipalityId] !== undefined ? riskData[municipalityId].toFixed(2) : 'Não calculado';
      layer.bindPopup(`<strong>${municipalityName}</strong><br/>Nota de Risco: ${risk}`);
      layer.on({
        mouseover: (e) => e.target.setStyle({ weight: 2, color: '#FFFFFF', fillOpacity: 1 }),
        mouseout: (e) => e.target.setStyle(geoJsonStyle(feature)),
      });
    }
  };
  
  return (
    <div className="map-container-wrapper">
      {geoJsonData && riskData ? (
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
          <MapLegend />
          
          {assets && assets.map(asset => (
            <Marker 
              key={asset.asset_uuid} 
              position={[asset.latitude, asset.longitude]}
              eventHandlers={{
                click: () => handleMarkerClick(asset),
              }}
            >
              <Popup>
                <div className="map-popup-content">
                  <strong>{asset.name}</strong>
                  {popupContent.isLoading ? (
                    <p className="popup-loading">A calcular risco...</p>
                  ) : popupContent.error ? (
                    <p className="popup-error">Erro: {popupContent.error}</p>
                  ) : popupContent.data ? (
                    <>
                      <p>
                        Nota de Risco: <strong>{popupContent.data.daily_forecast_with_risk[0].nota_de_risco.toFixed(2)}</strong>
                      </p>
                      <p>Elevação: {popupContent.data.asset_info.elevation_m.toFixed(2)}m</p>
                      <Link to={`/asset/${asset.asset_uuid}`} className="popup-details-link">
                        Ver mais detalhes &rarr;
                      </Link>
                    </>
                  ) : (
                    <p>Clique novamente para carregar os dados.</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <p>Carregando dados do mapa e de risco...</p>
      )}
    </div>
  );
}

export default InteractiveMap;