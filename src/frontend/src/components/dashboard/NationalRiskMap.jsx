// src/frontend/src/components/dashboard/NationalRiskMap.jsx (CÓDIGO COMPLETO FINAL - REVERSÃO E NOVA APLICAÇÃO)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Importa os ícones padrão do Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// URL base da sua API FastAPI
const API_BASE_URL = "http://127.0.0.1:8000";

// --- DEFINIÇÃO DA LEGENDA DE RISCO PARA O MAPA ---
const RISK_LEGEND_MAP = {
    'Baixo': '#8BC34A',         
    'Moderado': '#FFEB3B',      
    'Alto': '#FF9800',          
    'Crítico': '#F44336'        
};

const getColorForClassification = (classification) => {
    return RISK_LEGEND_MAP[classification] || '#808080'; 
};

const NationalRiskMap = ({ onDataLoaded }) => {
    const [statesGeoJson, setStatesGeoJson] = useState(null);
    const [riversData, setRiversData] = useState([]); 
    const [statesMapData, setStatesMapData] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const geoJsonRef = useRef(); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statesResponse = await axios.get(`${API_BASE_URL}/map_data/states_geojson`);
                setStatesGeoJson(statesResponse.data);

                const riversResponse = await axios.get(`${API_BASE_URL}/map_data/rivers`);
                // >>>>> ESTA É A LINHA CRÍTICA QUE DEVE ESTAR AQUI <<<<<
                setRiversData((Array.isArray(riversResponse.data) ? riversResponse.data : []).flat()); 
                // >>>>> FIM DA LINHA CRÍTICA <<<<<

                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar dados da API:", err);
                setError("Não foi possível carregar os dados do mapa.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (riversData.length > 0) {
            console.log("DEBUG: Dados de rios para processamento (dentro do useEffect):", riversData.slice(0, 5));

            const tempStatesMapData = {}; 
            let totalRiskSum = 0; 
            let totalValidRiskScoresCount = 0; 
            let criticalRiversCount = 0; 
            let statesWithAnyData = new Set(); 

            riversData.forEach(item => {
                const stateSigla = item['Sigla do Estado']; 
                const riskScore = parseFloat(String(item['Nota_de_Risco'])?.replace(',', '.')) || null; 
                const classification = item['Classificacao_Risco']; 
                
                if (stateSigla) {
                    statesWithAnyData.add(stateSigla); 
                    if (!tempStatesMapData[stateSigla]) {
                        tempStatesMapData[stateSigla] = { totalRisk: 0, count: 0, classificationCounts: {} };
                    }

                    if (riskScore !== null) { 
                        tempStatesMapData[stateSigla].totalRisk += riskScore;
                        tempStatesMapData[stateSigla].count += 1;
                    }

                    if (classification) {
                        tempStatesMapData[stateSigla].classificationCounts[classification] = 
                            (tempStatesMapData[stateSigla].classificationCounts[classification] || 0) + 1;
                    }
                }
                
                if (riskScore !== null) { 
                    totalRiskSum += riskScore;
                    totalValidRiskScoresCount += 1;
                }

                // >>>>> DEBUG FOCADO PARA 'RIOS EM RISCO CRÍTICO' AQUI <<<<<
                const classificationValue = String(classification || '').trim(); // O valor da string da coluna, com trim
                const normalizedForComparison = classificationValue
                                                    .normalize('NFD')
                                                    .replace(/[\u0300-\u036f]/g, "")
                                                    .toUpperCase(); // Adicionado toUpperCase para ignorar caixa

                // Loga SOMENTE se a string se assemelha a "CRITICO" (ignora acento e caixa)
                if (normalizedForComparison.includes('CRITICO')) {
                    console.log(`DEBUG_CRITICO_FOCADO: 
                        Rio: "${item['Nome do Rio'] || 'N/A'}" | 
                        Classificação Original Lida: "${classificationValue}" |
                        Classificação Normalizada para Comparação: "${normalizedForComparison}" |
                        É 'Crítico' (com acento)? ${classificationValue === 'Crítico'} | 
                        É 'Critico' (sem acento)? ${classificationValue.normalize('NFD').replace(/[\u0300-\u036f]/g, "") === 'Critico'}`);
                }
                
                // Lógica de contagem final: compara com 'Crítico' (com acento), 'Critico' (sem acento) e 'CRÍTICO'/'CRITICO' (tudo maiúsculo)
                if (classificationValue === 'Crítico' || 
                    classificationValue.normalize('NFD').replace(/[\u0300-\u036f]/g, "") === 'Critico' ||
                    classificationValue.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") === 'CRITICO') { 
                    criticalRiversCount++;
                    console.log(`CRÍTICO_CONTADO_SUCESSO: Rio "${item['Nome do Rio'] || 'N/A'}" | Classificação: "${classificationValue}"`);
                }
                // >>>>> FIM DO DEBUG FOCADO <<<<<
            });

            const finalStatesMapData = {};
            statesWithAnyData.forEach(stateSigla => {
                const data = tempStatesMapData[stateSigla];
                let averageRisk = null;
                if (data.count > 0) {
                    averageRisk = data.totalRisk / data.count;
                }

                let predominantClassification = 'Sem Dados / Outros'; 
                let maxCount = 0;
                for (const classifKey in RISK_LEGEND_MAP) { 
                    if (data.classificationCounts[classifKey] && data.classificationCounts[classifKey] > maxCount) {
                        maxCount = data.classificationCounts[classifKey];
                        predominantClassification = classifKey;
                    }
                }
                if (maxCount === 0) { 
                    let anyMaxCount = 0;
                    for (const classif in data.classificationCounts) {
                        if (data.classificationCounts[classif] > anyMaxCount) {
                            anyMaxCount = data.classificationCounts[classif];
                            predominantClassification = classif; 
                        }
                    }
                }


                finalStatesMapData[stateSigla] = { 
                    averageRisk: averageRisk,
                    predominantClassification: predominantClassification,
                    riverCount: data.count 
                };
            });
            setStatesMapData(finalStatesMapData);

            if (onDataLoaded) {
                onDataLoaded({
                    totalRivers: riversData.length, 
                    nationalAverageRisk: totalValidRiskScoresCount > 0 ? (totalRiskSum / totalValidRiskScoresCount) : 0,
                    statesWithData: statesWithAnyData.size, 
                    criticalRivers: criticalRiversCount, 
                    riversData: riversData 
                });
            }
        }
    }, [riversData, onDataLoaded]);

    const styleStates = useCallback((feature) => {
        const stateSigla = feature.properties.SIGLA; 
        const mapData = statesMapData[stateSigla];
        
        const fillColor = mapData ? getColorForClassification(mapData.predominantClassification) : '#808080'; 
        
        return {
            fillColor: fillColor,
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }, [statesMapData]);

    const onEachFeature = useCallback((feature, layer) => {
        const stateSigla = feature.properties.SIGLA; 
        const stateName = feature.properties.nome_estado || stateSigla; 

        const mapData = statesMapData[stateSigla];
        
        let popupContent = `<b>Estado: ${stateName} (${stateSigla})</b><br/>`;
        if (mapData && mapData.averageRisk !== null) {
            popupContent += `Risco Médio: ${mapData.averageRisk.toFixed(2)}<br/>`;
            popupContent += `Classificação Predominante: ${mapData.predominantClassification || 'N/A'}<br/>`;
            popupContent += `Registros: ${mapData.riverCount.toLocaleString('pt-BR')}`;
        } else {
            popupContent += `Nenhum dado de risco disponível.`;
        }
        layer.bindPopup(popupContent);

        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 3,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.9
                });
                layer.bringToFront();
            },
            mouseout: (e) => {
                if (geoJsonRef.current && geoJsonRef.current.leafletElement) {
                    geoJsonRef.current.leafletElement.resetStyle(e.target);
                } else {
                    e.target.setStyle(styleStates(e.target.feature));
                }
            },
            click: (e) => {
                const map = e.target._map;
                map.fitBounds(e.target.getBounds()); 
            }
        });
    }, [statesMapData, styleStates, geoJsonRef]);

    if (loading) {
        return <div style={{ color: 'var(--text-light)', padding: '20px', textAlign: 'center' }}>Carregando dados do mapa...</div>;
    }

    if (error) {
        return <div style={{ color: 'var(--critical-color)', padding: '20px', textAlign: 'center' }}>Erro: {error}</div>;
    }

    return (
        <div style={{ flexGrow: 1, height: '100%', width: '100%' }}>
            <MapContainer
                center={[-15.7801, -47.9292]} 
                zoom={4}
                minZoom={3}
                maxZoom={10}
                scrollWheelZoom={true}
                zoomControl={false} 
                style={{ height: '100%', width: '100%', backgroundColor: 'var(--background-dark)' }}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                />
                
                <ZoomControl position="topleft" />
                {statesGeoJson && (
                    <GeoJSON
                        data={statesGeoJson}
                        style={styleStates}
                        onEachFeature={onEachFeature}
                        ref={geoJsonRef}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default NationalRiskMap;