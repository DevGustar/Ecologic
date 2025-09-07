// src/components/dashboard/AssetLocationMap.jsx

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// O componente agora recebe também a cor de risco (riskColor)
function AssetLocationMap({ latitude, longitude, assetName, riskColor }) {
  const position = [latitude, longitude];

  // --- A MAGIA ACONTECE AQUI: Criamos um ícone SVG dinâmico ---
  // Este código SVG desenha o ícone de pingo padrão do Leaflet,
  // mas permite-nos injetar a nossa própria cor no 'fill'.
  const svgIconHtml = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5,0 C5.59,0 0,5.59 0,12.5 C0,19.41 12.5,41 12.5,41 C12.5,41 25,19.41 25,12.5 C25,5.59 19.41,0 12.5,0 Z" fill="${riskColor}" stroke="white" stroke-width="1.5"/>
      <circle cx="12.5" cy="12.5" r="4" fill="white"/>
    </svg>
  `;

  const customMarkerIcon = L.divIcon({
    html: svgIconHtml,
    className: 'custom-svg-marker', // Classe para o container, se precisarmos
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
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
      {/* O marcador agora usa o nosso ícone SVG dinâmico */}
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