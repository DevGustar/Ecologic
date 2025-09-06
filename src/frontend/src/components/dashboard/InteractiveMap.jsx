// src/components/dashboard/InteractiveMap.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import Papa from 'papaparse';
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

function InteractiveMap({ assets }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const mapCenter = [-14.235, -51.925];

  const getRiskColor = (risk) => {
    if (risk > 8) return '#1C3A5E';
    if (risk > 6) return '#2A528A';
    if (risk > 4) return '#3A7CA5';
    if (risk > 2) return '#5F98C4';
    return '#A2C4DF';
  };

  useEffect(() => {
    Papa.parse('/risk_report_final.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const riskLookup = results.data.reduce((acc, row) => {
          const id = row.codigo_ibge;
          const risk = parseFloat(row.nota_de_risco);
          if (id && !isNaN(risk)) {
            acc[id.trim()] = risk;
          }
          return acc;
        }, {});
        setRiskData(riskLookup);
      },
    });
    fetch('/geojson/municipios_brasil.json')
      .then((response) => response.json())
      .then((data) => {
        setGeoJsonData(data);
      });
  }, []);

  const geoJsonStyle = (feature) => {
    const municipalityId = feature.properties.id;
    const risk = riskData && riskData[municipalityId] !== undefined ? riskData[municipalityId] : 0;
    return {
      fillColor: getRiskColor(risk),
      weight: 0.2,
      opacity: 1,
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
        <MapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            // A URL para o CartoDB Voyager Dark
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
            >
              <Popup>
                <strong>Ativo:</strong> {asset.name}<br/>
                <strong>Elevação:</strong> {asset.elevation_m.toFixed(2)}m
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