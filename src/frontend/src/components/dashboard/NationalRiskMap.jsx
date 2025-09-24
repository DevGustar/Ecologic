// src/frontend/src/components/dashboard/NationalRiskMap.jsx (VERSÃO ATUALIZADA - FUNCIONAL)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Importa os ícones padrão do Leaflet, corrigindo problemas com o Webpack/Vite
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// URL base da sua API FastAPI
const API_BASE_URL = "http://127.00.0.1:8000";

// --- Definição da Legenda de Risco (Cores e Intervalos baseados nas imagens do Power BI) ---
// Ajuste os valores min/max e cores aqui para corresponder EXATAMENTE ao seu Power BI, se necessário.
const RISK_LEGEND = {
    MuitoBaixo: { min: 0, max: 2, color: '#4CAF50', text: 'Muito Baixo (0-2)' }, // Verde escuro
    Baixo: { min: 2.1, max: 4, color: '#8BC34A', text: 'Baixo (2-4)' },      // Verde claro
    Moderado: { min: 4.1, max: 6, color: '#FFEB3B', text: 'Moderado (4-6)' }, // Amarelo
    Alto: { min: 6.1, max: 8, color: '#FF9800', text: 'Alto (6-8)' },        // Laranja
    Critico: { min: 8.1, max: 10, color: '#F44336', text: 'Crítico (8+)' },    // Vermelho
    Extremo: { min: 10.1, max: 12, color: '#D32F2F', text: 'Extremo (10+)' } // Vermelho mais forte (se existirem notas acima de 10)
};

// Função auxiliar para obter a cor com base na nota de risco
const getColorForRisk = (riskScore) => {
    if (riskScore === null || isNaN(riskScore)) return '#808080'; // Cinza para dados inválidos (sem dados)

    // Percorre a legenda na ordem das categorias
    // É importante que os intervalos não se sobreponham e cubram a gama esperada de scores
    for (const categoryKey in RISK_LEGEND) {
        const { min, max, color } = RISK_LEGEND[categoryKey];
        if (riskScore >= min && riskScore <= max) {
            return color;
        }
    }
    // Caso o score esteja fora dos limites definidos na legenda
    return '#B0BEC5'; // Cor padrão (cinza claro)
};

const NationalRiskMap = ({ onDataLoaded }) => {
    const [statesGeoJson, setStatesGeoJson] = useState(null);
    const [riversData, setRiversData] = useState([]); // Agora estes são os dados dos rios/estados
    const [statesRiskMap, setStatesRiskMap] = useState({}); // Mapa {SIGLA: {averageRisk: nota, riverCount: count}}
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const geoJsonRef = useRef(); // Ref para o componente GeoJSON do Leaflet

    // Efeito para buscar os dados iniciais da API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const statesResponse = await axios.get(`${API_BASE_URL}/map_data/states_geojson`);
                setStatesGeoJson(statesResponse.data);

                const riversResponse = await axios.get(`${API_BASE_URL}/map_data/rivers`);
                setRiversData(riversResponse.data); // Assume que este endpoint já retorna os dados de rios/estados com Nota_de_Risco

                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar dados da API:", err);
                setError("Não foi possível carregar os dados do mapa.");
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Dependências vazias: só executa uma vez ao montar o componente

    // Efeito para processar os dados dos rios (que agora contêm o risco por estado)
    useEffect(() => {
        if (riversData.length > 0) {
            const processedStatesData = {};
            let totalRiskSum = 0;
            let countStatesForAvg = 0; // Contagem de estados com risco válido para a média nacional
            let totalRiverRecords = 0; // Total de registros de rios (linhas no CSV)

            riversData.forEach(item => {
                // VERIFIQUE ESTAS CHAVES: Devem corresponder EXATAMENTE ao que sua API retorna.
                const stateSigla = item['Sigla do Estado']; 
                const riskScore = parseFloat(item['Nota_de_Risco']); 

                if (stateSigla && !isNaN(riskScore)) {
                    // Armazenar a nota de risco e contar as ocorrências por estado
                    if (!processedStatesData[stateSigla]) {
                        processedStatesData[stateSigla] = { averageRisk: riskScore, riverCount: 0 };
                        // Se é a primeira vez que vemos este estado, contamos para a média nacional
                        totalRiskSum += riskScore;
                        countStatesForAvg += 1;
                    }
                    processedStatesData[stateSigla].riverCount += 1;
                    totalRiverRecords += 1; // Contabiliza todos os registros de rios
                }
            });
            setStatesRiskMap(processedStatesData);

            // CÁLCULO DO NOVO KPI: RIOS CRÍTICOS
            const criticalRiversCount = riversData.filter(item => {
                const riskScore = parseFloat(item['Nota_de_Risco']);
                // Consideramos "Crítico" se a nota for maior ou igual ao mínimo da categoria Crítico na nossa legenda
                return !isNaN(riskScore) && riskScore >= RISK_LEGEND.Critico.min;
            }).length;

            // Calcula os KPIs para a página pai
            if (onDataLoaded) {
                const nationalAverageRisk = countStatesForAvg > 0 ? (totalRiskSum / countStatesForAvg) : 0;
                const statesWithData = Object.keys(processedStatesData).length;

                onDataLoaded({
                    totalRivers: totalRiverRecords, 
                    nationalAverageRisk: nationalAverageRisk,
                    statesWithData: statesWithData,
                    criticalRivers: criticalRiversCount, // NOVO KPI
                    riversData: riversData // <--- IMPORTANTE: Passar os dados brutos dos rios para os gráficos
                });
            }
        }
    }, [riversData, onDataLoaded]); // Dependências: riversData (quando muda), onDataLoaded (garantir estabilidade)


    // Função para estilizar as features (estados) no mapa com base no risco
    // Usa useCallback para otimização e estabilidade
    const styleStates = useCallback((feature) => {
        // VERIFIQUE ESTA CHAVE: Deve corresponder EXATAMENTE à propriedade da sigla no seu GeoJSON.
        const stateSigla = feature.properties.SIGLA; 
        const risk = statesRiskMap[stateSigla] ? statesRiskMap[stateSigla].averageRisk : null;
        
        return {
            fillColor: getColorForRisk(risk),
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }, [statesRiskMap]); // Depende de statesRiskMap para atualizar quando os dados de risco mudam


    // Função que será chamada para cada feature (estado) no GeoJSON, configurando popups e interações
    // Usa useCallback para otimização e estabilidade
    const onEachFeature = useCallback((feature, layer) => {
        // VERIFIQUE ESTAS CHAVES: Devem corresponder às propriedades no seu GeoJSON.
        const stateSigla = feature.properties.SIGLA; 
        const stateName = feature.properties.nome_estado; // Exemplo: se o nome completo do estado estiver aqui

        const riskInfo = statesRiskMap[stateSigla];
        
        let popupContent = `<b>Estado: ${stateName || stateSigla} (${stateSigla})</b><br/>`;
        if (riskInfo && riskInfo.averageRisk !== null) {
            popupContent += `Risco: ${riskInfo.averageRisk.toFixed(2)}<br/>`;
            popupContent += `Registros: ${riskInfo.riverCount}`; // Total de registros para este estado
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
                // Ação: Ao sair o mouse, resetar o estilo da camada.
                // Verificação de segurança para garantir que a referência GeoJSON e o elemento Leaflet existem.
                if (geoJsonRef.current && geoJsonRef.current.leafletElement) {
                    geoJsonRef.current.leafletElement.resetStyle(e.target);
                } else {
                    // Se a referência não estiver disponível, aplique o estilo padrão diretamente.
                    e.target.setStyle(styleStates(e.target.feature));
                }
            },
            click: (e) => {
                const map = e.target._map;
                map.fitBounds(e.target.getBounds()); // Zoom no estado clicado
            }
        });
    }, [statesRiskMap, styleStates, geoJsonRef]); // Depende de statesRiskMap, styleStates e geoJsonRef


    if (loading) {
        return <div style={{ color: 'var(--text-light)', padding: '20px', textAlign: 'center' }}>Carregando dados do mapa...</div>;
    }

    if (error) {
        return <div style={{ color: 'var(--critical-color)', padding: '20px', textAlign: 'center' }}>Erro: {error}</div>;
    }

    return (
        <div style={{ flexGrow: 1, height: '100%', width: '100%' }}>
            <MapContainer
                center={[-15.7801, -47.9292]} // Centro do Brasil
                zoom={4}
                minZoom={3}
                maxZoom={10}
                scrollWheelZoom={true}
                zoomControl={false} // Desabilitado para ter controle manual via ZoomControl
                style={{ height: '100%', width: '100%', backgroundColor: 'var(--background-dark)' }} // Cor de fundo do mapa
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Tema escuro
                />
                
                <ZoomControl position="topleft" /> {/* Controle de zoom no canto superior esquerdo */}

                {statesGeoJson && (
                    <GeoJSON
                        data={statesGeoJson}
                        style={styleStates}
                        onEachFeature={onEachFeature}
                        ref={geoJsonRef} // Atribui a referência
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default NationalRiskMap;