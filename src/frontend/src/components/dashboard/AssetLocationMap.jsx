// src/components/dashboard/AssetLocationMap.jsx

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configuração do ícone padrão do Leaflet para que o marcador apareça corretamente
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// O componente recebe as coordenadas e o nome do ativo para exibir
function AssetLocationMap({ latitude, longitude, assetName }) {
  const position = [latitude, longitude];

  return (
    <MapContainer 
      // A 'key' é um truque para forçar o mapa a recentralizar quando as coordenadas mudam
      key={position.toString()} 
      center={position} 
      zoom={11} // Um zoom mais próximo para focar no local do ativo
      scrollWheelZoom={false} // Desativa o zoom com o scroll do mouse para não atrapalhar a rolagem da página
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        // Usamos o tema escuro com nomes de locais para dar contexto
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={position}>
        <Popup>
          <strong>{assetName}</strong><br/>
          Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default AssetLocationMap;