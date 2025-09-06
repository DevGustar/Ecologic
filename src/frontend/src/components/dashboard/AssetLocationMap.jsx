// src/components/dashboard/AssetLocationMap.jsx

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Adicione Popup aqui
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configuração do ícone
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// O componente agora recebe também o nome do ativo para o popup
function AssetLocationMap({ latitude, longitude, assetName }) {
  const position = [latitude, longitude];

  return (
    <MapContainer 
      key={position.toString()} 
      center={position} 
      zoom={11} // Damos um pouco mais de zoom para ver os detalhes do local
      scrollWheelZoom={false} 
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        // *** A MUDANÇA PRINCIPAL ESTÁ AQUI ***
        // Usamos 'dark_all' que inclui os rótulos (nomes de locais)
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={position}>
        {/* Adicionamos um Popup para mostrar os dados ao clicar */}
        <Popup>
          <strong>{assetName}</strong><br/>
          Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default AssetLocationMap;