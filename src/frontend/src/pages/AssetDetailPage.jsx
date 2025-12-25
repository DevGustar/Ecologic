import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AssetDetailPage.css';

// --- CONFIGURAÇÃO DE ÍCONES ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- FUNÇÕES DE CORES ---
const getRiskColor = (risk) => {
  const r = parseFloat(risk);
  if (r >= 8) return 'var(--cor-critica)'; 
  if (r >= 6) return 'var(--cor-alerta)';  
  if (r >= 4) return 'var(--cor-cuidado)'; 
  if (r >= 2) return 'var(--cor-sucesso)'; 
  if (r > 0) return 'var(--cor-neutra)';   
  return '#444';                           
};

const getSeverityColor = (text) => {
    if (!text) return '#ccc';
    const t = text.toLowerCase();
    if (t.includes('crítico')) return 'var(--cor-critica)'; 
    if (t.includes('alto')) return 'var(--cor-alerta)';     
    if (t.includes('moderado')) return 'var(--cor-cuidado)';
    if (t.includes('baixo')) return 'var(--cor-sucesso)';   
    return '#ccc'; 
};

const formatLabel = (timestamp, mode) => {
    const date = new Date(timestamp * 1000);
    if (mode === 'hourly') return date.getHours() + 'h';
    return `${date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)} ${date.getDate()}`;
};

// --- COMPONENTE VISUAL DO TOOLTIP ---
const RiskTooltipContent = ({ data }) => {
    if (!data) return null;

    return (
        <div style={{
            backgroundColor: 'rgba(26, 26, 26, 0.98)', 
            border: '1px solid #444',
            padding: '12px',
            borderRadius: '8px',
            minWidth: '230px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            textAlign: 'left'
        }}>
            <div style={{ 
                color: 'var(--acento-primario)', 
                fontWeight: 'bold', 
                marginBottom: '8px', 
                borderBottom: '1px solid #444', 
                paddingBottom: '4px',
                fontSize: '0.9rem'
            }}>
                Matriz de Risco ({data.label})
            </div>
            
            {data.factors && data.factors.length > 0 ? (
                data.factors.map((fator, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#ccc' }}>{fator.nome}:</span>
                        <span style={{ color: getSeverityColor(fator.severidade), fontWeight: 'bold' }}>
                            {fator.valor_raw}
                        </span>
                    </div>
                ))
            ) : (
                <div style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8rem' }}>Sem riscos críticos.</div>
            )}

            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333', textAlign: 'center' }}>
                Nota Final: <strong style={{ color: getRiskColor(data.risk), fontSize: '1.1rem' }}>{data.risk.toFixed(2)}</strong>
            </div>
        </div>
    );
};

function AssetDetailPage() {
  const { assetId } = useParams();
  
  const [assetData, setAssetData] = useState(null);
  const [riskData, setRiskData] = useState(null);   
  const [hourlyData, setHourlyData] = useState(null); 
  const [viewMode, setViewMode] = useState('hourly'); 
  const [isLoading, setIsLoading] = useState(true);

  // Tooltip State (Lista)
  const [listTooltip, setListTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resDaily = await fetch(`http://127.0.0.1:8000/assets/${assetId}/risk_analysis`);
        const dataDaily = await resDaily.json();
        setAssetData(dataDaily.asset_info);
        setRiskData(dataDaily.daily_forecast_with_risk);

        const resHourly = await fetch(`http://127.0.0.1:8000/assets/${assetId}/hourly_risk_analysis`);
        if (resHourly.ok) {
            const dataHourly = await resHourly.json();
            setHourlyData(dataHourly.hourly_forecast_with_risk);
        }
      } catch (error) {
        console.error("Erro API:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [assetId]);

  // Handlers Lista
  const handleListMouseMove = (e, item) => setListTooltip({ visible: true, x: e.clientX + 20, y: e.clientY + 10, data: item });
  const handleListMouseLeave = () => setListTooltip({ ...listTooltip, visible: false });

  if (isLoading) return <div className="loading-screen">Carregando...</div>;
  if (!assetData || !riskData) return <div className="error-screen">Erro.</div>;

  const activeDataset = viewMode === 'daily' ? riskData : (hourlyData || []);
  
  const visualizationData = activeDataset.map(item => ({
      label: formatLabel(item.dt, viewMode),
      risk: item.nota_de_risco || 0,
      factors: item.fatores_explicados || [], 
      rain: item.volume_chuva_mm || 0,
      wind: item.rajadas_kmh || 0,
      fullDate: new Date(item.dt * 1000).toLocaleString('pt-BR')
  }));

  const currentRiskObj = hourlyData ? hourlyData[0] : riskData[0];
  const currentRiskScore = (currentRiskObj?.nota_de_risco || 0).toFixed(2);
  const currentRiskColor = getRiskColor(currentRiskObj?.nota_de_risco || 0);

  // Adaptador Gráfico
  const CustomChartTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
          return <RiskTooltipContent data={payload[0].payload} />;
      }
      return null;
  };

  return (
    <div className="asset-page-container">
      
      <header className="asset-header">
        <Link to="/" className="back-link">← Voltar ao Mapa</Link>
        <h1>{assetData.name}</h1>
        <div className="asset-meta-tags">
           <span className="meta-tag">Lat: {assetData.latitude.toFixed(4)}</span>
           <span className="meta-tag">Lon: {assetData.longitude.toFixed(4)}</span>
           <span className="meta-tag">Alt: {assetData.elevation_m}m</span>
        </div>
      </header>

      <div className="asset-grid">
        <div className="asset-col-left">
            
            <div className="risk-card-main" style={{ borderColor: currentRiskColor }}>
                <h3>RISCO AGORA</h3>
                <div className="risk-score-big" style={{ color: currentRiskColor }}>{currentRiskScore}</div>
                <div className="weather-quick-view">
                    <span>☂️ {(currentRiskObj?.volume_chuva_mm || 0).toFixed(1)} mm</span>
                    <span>💨 {(currentRiskObj?.rajadas_kmh || 0).toFixed(0)} km/h</span>
                </div>
            </div>

            <div className="view-toggles">
                <button className={viewMode === 'hourly' ? 'active' : ''} onClick={() => setViewMode('hourly')}>Próximas 24 Horas</button>
                <button className={viewMode === 'daily' ? 'active' : ''} onClick={() => setViewMode('daily')}>Próximos 7 Dias</button>
            </div>

            {/* GRÁFICO (NATIVO) */}
            <div className="chart-section">
                <h4>Tendência de Risco</h4>
                <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                        <BarChart 
                            data={visualizationData} 
                            margin={{top: 10, right: 0, left: -20, bottom: 0}}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="label" stroke="#888" fontSize={11} tickLine={false} />
                            <YAxis domain={[0, 10]} stroke="#888" fontSize={11} tickLine={false} />
                            
                            <RechartsTooltip 
                                content={<CustomChartTooltip />} 
                                cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }} 
                                wrapperStyle={{ outline: 'none', zIndex: 1000 }}
                            />
                            
                            <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                                {visualizationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* LISTA INFERIOR */}
            <div className="forecast-list-container">
                <h4>Detalhamento Analítico ({viewMode === 'daily' ? 'Diário' : 'Horário'})</h4>
                <div className="forecast-list-scroll">
                    {visualizationData.map((item, index) => (
                        <div 
                            key={index} 
                            className="forecast-item"
                            onMouseMove={(e) => handleListMouseMove(e, item)}
                            onMouseLeave={handleListMouseLeave}
                            style={{ cursor: 'default' }} // <--- CORREÇÃO AQUI: Força o cursor normal
                        >
                            <div className="forecast-date">{item.label}</div>
                            <div className="forecast-bar-wrapper">
                                <div className="forecast-bar-fill" style={{ width: `${item.risk * 10}%`, backgroundColor: getRiskColor(item.risk) }}></div>
                            </div>
                            <div className="forecast-score" style={{ color: getRiskColor(item.risk) }}>
                                {item.risk.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="asset-col-right">
            <div className="asset-map-frame">
                <MapContainer center={[assetData.latitude, assetData.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[assetData.latitude, assetData.longitude]}>
                        <Popup>{assetData.name}</Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
      </div>

      {/* TOOLTIP FLUTUANTE (LISTA) */}
      {listTooltip.visible && listTooltip.data && (
          <div style={{
                position: 'fixed',
                top: listTooltip.y,
                left: listTooltip.x,
                zIndex: 9999,
                pointerEvents: 'none' 
          }}>
              <RiskTooltipContent data={listTooltip.data} />
          </div>
      )}

    </div>
  );
}

export default AssetDetailPage;