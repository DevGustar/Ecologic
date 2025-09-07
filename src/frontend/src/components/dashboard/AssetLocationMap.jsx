// src/components/dashboard/AssetLocationMap.jsx

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function AssetLocationMap({ latitude, longitude, assetName, riskColor }) {
  const position = [latitude, longitude];

  // Cria um ícone HTML personalizado com a cor de risco e o furo
  const customMarkerIcon = L.divIcon({
    html: `
      <div class="custom-marker-outer" style="background-color: ${riskColor};">
        <div class="custom-marker-inner"></div>
      </div>
    `,
    className: 'custom-marker-container', // Este container é apenas para o Leaflet posicionar
    iconSize: [36, 48], // Aumentar ligeiramente o tamanho para o novo design
    iconAnchor: [18, 48], // Metade da largura e altura total
    popupAnchor: [0, -40] // Ajustar a posição do popup
  });

  return (
    <MapContainer 
      key={position.toString()} 
      center={position} 
      zoom={11}
      scrollWheelZoom={false} 
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={position} icon={customMarkerIcon}>
        <Popup>
          <strong>{assetName}</strong><br/>
          Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default AssetLocationMap;