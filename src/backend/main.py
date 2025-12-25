# Ecologic/src/backend/main.py (VERSÃO MESTRA INTEGRADA)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
from . import models, database, schemas
import uuid
from typing import List, Optional
import json
import pandas as pd
import geopandas as gpd
import os
import unicodedata # <--- IMPORTANTE: Adicione no topo do arquivo

from .api_connectors import buscar_clima_openweather, fetch_elevation_data, get_municipality_from_coords
from .risk_calculator import calculate_daily_risk, calculate_hourly_risk
from . import map_data_loader

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializa Banco de Dados
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="EcoLogic 2.0 API")

# Configuração CORS
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- VARIÁVEIS GLOBAIS (MEMÓRIA RAM) ---
map_rivers_data: Optional[pd.DataFrame] = None
map_climate_data: Optional[pd.DataFrame] = None
gdf_rivers_painted: Optional[gpd.GeoDataFrame] = None
gdf_climate_painted: Optional[gpd.GeoDataFrame] = None
municipal_river_risk_map: dict = {}
map_states_geojson_data: Optional[gpd.GeoDataFrame] = None

# --- AUXILIARES ---
def get_risk_classification_from_note(risk_note: float) -> str:
    if risk_note >= 8: return "Crítico"
    if risk_note >= 6: return "Alto"
    if risk_note >= 4: return "Moderado"
    if risk_note >= 2: return "Baixo"
    if risk_note > 0: return "Mínimo"
    return "Sem Dados"

def get_db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()

# --- STARTUP (CARREGAMENTO DE DADOS) ---
@app.on_event("startup")
async def startup_event():
    global map_rivers_data, map_climate_data, gdf_rivers_painted, gdf_climate_painted, municipal_river_risk_map, map_states_geojson_data
    logger.info("🚀 Iniciando Ecologic 2.0 API...")
    
    # Carrega tudo de uma vez no map_data_loader (espera 6 retornos)
    (rivers, climate, gdf_rios, gdf_clima, risk_map, states) = map_data_loader.load_all_map_data()
    
    map_rivers_data = rivers
    map_climate_data = climate
    gdf_rivers_painted = gdf_rios
    gdf_climate_painted = gdf_clima
    municipal_river_risk_map = risk_map
    map_states_geojson_data = states
    
    logger.info("✅ Carga de dados concluída. API pronta.")

@app.get("/")
async def read_root(): return {"message": "API EcoLogic 2.0 Operacional"}

# ==========================================
# 1. CENÁRIO 1: RISCO DE RIOS (GRC)
# ==========================================

@app.get("/macro/grc/kpis")
def get_grc_kpi_data():
    if map_rivers_data is None: raise HTTPException(status_code=503, detail="Dados indisponíveis.")
    df = map_rivers_data.copy()
    
    # Garante numérico
    if 'Nota_de_Risco' in df.columns:
         df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce').fillna(0)

    # KPIs
    kpi_medio = df['Nota_de_Risco'].mean()
    kpi_criticos = df[df['Classificacao_Risco'] == 'Crítico'].shape[0]
    kpi_mapeados = len(municipal_river_risk_map)
    kpi_total = len(df)

    # Donut (5 Níveis)
    df['Class_Nova'] = df['Nota_de_Risco'].apply(get_risk_classification_from_note)
    df_dados = df[df['Class_Nova'] != 'Sem Dados']
    donut_pct = df_dados['Class_Nova'].value_counts(normalize=True).mul(100)
    donut_cnt = df_dados['Class_Nova'].value_counts()
    donut_final = [{"name": k, "value": float(v), "count": int(donut_cnt.get(k, 0))} for k, v in donut_pct.items()]

    # Top 10 Rios (CORRIGIDO: SEM DUPLICATAS)
    col_nome = 'NORIOCOMP' if 'NORIOCOMP' in df.columns else 'Nome do Rio'
    
    if col_nome in df.columns:
        # Filtra inválidos
        df_clean = df[
            (df[col_nome].notna()) & 
            (df[col_nome] != '') & 
            (~df[col_nome].astype(str).str.lower().isin(['sem nome', 'rio desconhecido', 'nan']))
        ].copy()
        
        # Ordena por Risco (maior primeiro)
        df_clean = df_clean.sort_values('Nota_de_Risco', ascending=False)
        
        # Remove duplicatas mantendo o primeiro (maior risco)
        df_unique = df_clean.drop_duplicates(subset=[col_nome], keep='first')
        
        top_10 = df_unique.head(10).apply(lambda r: {
            "nome": f"{r[col_nome]} ({r.get('NM_MUN_PADRONIZADO', 'N/A')})",
            "nota": float(r['Nota_de_Risco']),
            "frequencia": str(r.get('Frequencia', 'N/A')),
            "vulnerabilidade": str(r.get('Vulnerabilidade', 'N/A')),
            "impacto": str(r.get('Impacto', 'N/A'))
        }, axis=1).tolist()
    else:
        top_10 = []

    return {
        "kpis": {"riscoNacionalMedio": kpi_medio, "riosEmRiscoCritico": kpi_criticos, "municipiosMapeadosGRC": kpi_mapeados, "totalDeRios": kpi_total},
        "graficos": {"riscoPorNivel": donut_final, "topRiosPorRisco": top_10}
    }

@app.get("/macro/grc/map")
def get_grc_map_data():
    if gdf_rivers_painted is None: raise HTTPException(status_code=503, detail="Mapa GRC indisponível.")
    return json.loads(gdf_rivers_painted.to_json())

# ==========================================
# 2. CENÁRIO 2: RISCO DE CLIMA
# ==========================================

@app.get("/macro/clima/kpis")
def get_clima_kpi_data():
    if map_climate_data is None: return {} 
    df = map_climate_data.copy()
    
    col_nota = 'nota_de_risco' if 'nota_de_risco' in df.columns else 'risk_score'
    if col_nota not in df.columns: return {}
    
    df[col_nota] = pd.to_numeric(df[col_nota], errors='coerce').fillna(0)

    kpi_medio = df[col_nota].mean()
    kpi_criticos = df[df[col_nota] >= 8].shape[0]
    kpi_atencao = df[df[col_nota] >= 6].shape[0]
    
    # Donut Clima
    df['Class_Clima'] = df[col_nota].apply(get_risk_classification_from_note)
    donut_pct = df['Class_Clima'].value_counts(normalize=True).mul(100)
    donut_cnt = df['Class_Clima'].value_counts()
    donut_final = [{"name": k, "value": float(v), "count": int(donut_cnt.get(k, 0))} for k, v in donut_pct.items()]

    # Top 10 Municípios (Clima)
    top_10 = df.sort_values(col_nota, ascending=False).head(10).apply(lambda r: {
        "nome": f"{r.get('municipio', 'N/A')} ({r.get('uf', 'N/A')})",
        "nota": float(r[col_nota]),
        "frequencia": "N/A", "vulnerabilidade": "N/A", "impacto": "N/A"
    }, axis=1).tolist()

    return {
        "kpis": {"riscoClimaNacionalMedio": kpi_medio, "municipiosAlertaCritico": kpi_criticos, "municipiosEmAtencao": kpi_atencao},
        "graficos": {"riscoPorNivel": donut_final, "topRiosPorRisco": top_10}
    }

@app.get("/macro/clima/map")
def get_clima_map_data():
    if gdf_climate_painted is None: raise HTTPException(status_code=503, detail="Mapa Clima indisponível.")
    return json.loads(gdf_climate_painted.to_json())

# ==========================================
# 3. CENÁRIO 4: MEUS ATIVOS (CLIENTE)
# ==========================================

@app.get("/macro/assets/map")
def get_assets_map_points(
    intel: str = "mestre", # Recebe o filtro do frontend
    db: Session = Depends(get_db)
):
    """
    Retorna os pontos dos ativos com RISCO REAL CALCULADO NA HORA.
    - Rios: Baseado no cadastro (banco de dados).
    - Clima: Chama OpenWeather API em tempo real.
    - Mestre: Fusão dos dois.
    """
    assets = db.query(models.Asset).all()
    features = []
    
    for asset in assets:
        risk_final = 0.0
        
        # 1. CÁLCULO ESTRUTURAL (RIOS)
        # Normalizamos o fator (que geralmente é 1.0 a 1.5) para uma nota 0-10
        # Ex: Fator 1.5 (Crítico) -> Nota 9.0 | Fator 1.0 (Baixo) -> Nota 2.0
        risk_rio = (asset.river_risk_factor - 0.9) * 15 
        if risk_rio > 10: risk_rio = 10
        if risk_rio < 0: risk_rio = 1.0

        # 2. CÁLCULO CLIMÁTICO (TEMPO REAL)
        risk_clima = 0.0
        if intel in ['clima', 'mestre']:
            try:
                # Chama a API externa (Pode levar alguns ms)
                clima_data = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
                
                if clima_data and 'daily' in clima_data:
                    hoje = clima_data['daily'][0]
                    
                    dados_climaticos = {
                        "volume_chuva_mm": hoje.get('rain', 0) or 0,
                        "prob_chuva_%": (hoje.get('pop', 0) or 0) * 100,
                        "rajadas_kmh": (hoje.get('wind_gust', 0) or 0) * 3.6,
                        "pressao_hpa": hoje.get('pressure', 1013),
                        "umidade_%": hoje.get('humidity', 50)
                    }
                    
                    # Dados estruturais para a calculadora
                    dados_estruturais = {
                        "elevation_m": asset.elevation_m,
                        "river_risk_factor": asset.river_risk_factor
                    }
                    
                    # Usa a calculadora oficial
                    analise = calculate_daily_risk(dados_climaticos, dados_estruturais)
                    risk_clima = analise['score_final']
                else:
                    # Se falhar a API, assume risco baixo ou mantém o anterior
                    risk_clima = 1.0
            except Exception as e:
                logger.error(f"Erro ao calcular clima para ativo {asset.name}: {e}")
                risk_clima = 0.0

        # 3. DECISÃO DO VALOR FINAL
        if intel == 'rios':
            risk_final = risk_rio
        elif intel == 'clima':
            risk_final = risk_clima
        else: # Mestre
            # Lógica de Fusão: O maior risco prevalece
            risk_final = max(risk_rio, risk_clima)

        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [asset.longitude, asset.latitude]},
            "properties": {
                "name": asset.name,
                "risk": risk_final,
                "id": asset.asset_uuid,
                # Adiciona detalhes para debug ou tooltip avançado se quiser
                "risk_rio": risk_rio,
                "risk_clima": risk_clima
            }
        })
        
    return {"type": "FeatureCollection", "features": features}

# ==========================================
# 4. EXPLORADOR GRC (AUDITORIA)
# ==========================================

@app.get("/macro/rivers/search")
def search_rivers(estado: Optional[str] = None, municipio: Optional[str] = None, classificacao: Optional[str] = None):
    if map_rivers_data is None: raise HTTPException(status_code=503, detail="Dados indisponíveis.")
    df = map_rivers_data.copy()
    if 'Nota_de_Risco' in df.columns: df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce').fillna(0)
    
    if estado: df = df[df['Sigla do Estado'].str.upper() == estado.upper()]
    if municipio: df = df[df['NM_MUN_PADRONIZADO'].str.upper() == municipio.upper()]
    
    df['Classificacao_Calculada'] = df['Nota_de_Risco'].apply(get_risk_classification_from_note)
    if classificacao: df = df[df['Classificacao_Calculada'].str.upper() == classificacao.upper()]

    df_result = df.sort_values('Nota_de_Risco', ascending=False).head(2000)
    for col in ['Impacto', 'Frequencia', 'Vulnerabilidade']:
        if col in df_result.columns: df_result[col] = df_result[col].fillna('N/A')
        
    return json.loads(df_result.to_json(orient='records'))

@app.get("/macro/options/municipalities")
def get_unique_municipalities(estado: Optional[str] = None):
    if map_rivers_data is None: return {"municipalities": []}
    try:
        df = map_rivers_data
        if estado: df = df[df['Sigla do Estado'].str.upper() == estado.upper()]
        municipios = df['NM_MUN_PADRONIZADO'].dropna().unique().tolist()
        municipios.sort()
        return {"municipalities": municipios}
    except Exception: return {"municipalities": []}

# ==========================================
# 5. MICRO ANÁLISE (PÁGINA DE DETALHE DO ATIVO)
# ==========================================

@app.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)): 
    asset_id = str(uuid.uuid4())
    elevation = fetch_elevation_data(asset.latitude, asset.longitude)
    municipality_name = get_municipality_from_coords(asset.latitude, asset.longitude)
    fator_risco_rio = 1.0 
    if municipality_name:
        fator_risco_rio = municipal_river_risk_map.get(municipality_name, 1.0)
        logger.info(f"Ativo em '{municipality_name}'. Fator de Risco de Rio aplicado: {fator_risco_rio}")
    new_asset_model = models.Asset( asset_uuid=asset_id, name=asset.name, latitude=asset.latitude, longitude=asset.longitude, elevation_m=elevation, river_risk_factor=fator_risco_rio )
    db.add(new_asset_model)
    db.commit()
    db.refresh(new_asset_model)
    return new_asset_model

@app.get("/assets", response_model=List[schemas.Asset])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Asset).offset(skip).limit(limit).all()

@app.get("/assets/{asset_uuid}", response_model=schemas.Asset)
def get_asset_info(asset_uuid: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_uuid).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return asset

@app.get("/assets/{asset_id}/risk_analysis")
def get_asset_risk_analysis(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos: return {"asset_info": asset, "daily_forecast_with_risk": []}

    structural_data = {"elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor}
    previsao_enriquecida = []
    
    # Processa Daily (Próximos 7 dias)
    for dia in dados_brutos.get('daily', []):
        # 1. Extração Inteligente (Para não dar erro de chave)
        rain_obj = dia.get('rain', 0)
        # Tenta pegar float direto ou objeto {'1h': ...}
        rain_val = float(rain_obj if isinstance(rain_obj, (int, float)) else rain_obj.get('1h', 0))
        
        wind_speed = float(dia.get('wind_speed', 0))
        wind_gust = float(dia.get('wind_gust', 0))
        # Pega o pior vento e converte m/s -> km/h
        wind_val_kmh = max(wind_speed, wind_gust) * 3.6
        
        pop_val = float(dia.get('pop', 0)) * 100
        
        # 2. Prepara input para a Calculadora
        climate_input = {
            "volume_chuva_mm": rain_val,
            "prob_chuva_%": pop_val,
            "rajadas_kmh": wind_val_kmh,
            "pressao_hpa": dia.get('pressure', 1013),
            "umidade_%": dia.get('humidity', 50),
            # Adiciona temp se tiver
            "temp": dia.get('temp', {}).get('day', 25) if isinstance(dia.get('temp'), dict) else 25
        }
        
        # 3. Calcula (Usando a mesma lógica mestra)
        analise = calculate_daily_risk(climate_input, structural_data)
        
        # 4. Injeta os resultados DETALHADOS
        dia['nota_de_risco'] = analise['score_final']
        dia['fatores_explicados'] = analise['fatores_contribuintes'] # <--- AQUI ESTÁ O QUE FALTAVA
        
        # 5. Sobrescreve campos para o Frontend ler fácil
        dia['volume_chuva_mm'] = rain_val
        dia['rajadas_kmh'] = wind_val_kmh
        dia['pop'] = pop_val
        
        previsao_enriquecida.append(dia)
        
    return {"asset_info": asset, "daily_forecast_with_risk": previsao_enriquecida}

@app.get("/assets/{asset_id}/hourly_risk_analysis")
# src/backend/main.py

@app.get("/assets/{asset_id}/hourly_risk_analysis")
def get_asset_hourly_risk(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if not asset: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos: return {"asset_info": asset, "hourly_forecast_with_risk": []}

    structural_data = {"elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor}
    previsao_enriquecida = []
    
    # Processa Hourly (Próximas 24h)
    for hora in dados_brutos.get('hourly', [])[:24]:
        
        # 1. Extração para EXIBIÇÃO no Frontend (Valores já convertidos)
        # Chuva
        rain_obj = hora.get('rain', 0)
        rain_val = float(rain_obj.get('1h', 0) if isinstance(rain_obj, dict) else rain_obj)
        
        # Vento (km/h) para exibir no gráfico
        speed_ms = float(hora.get('wind_speed', 0))
        gust_ms = float(hora.get('wind_gust', 0))
        wind_kmh_exibicao = max(speed_ms, gust_ms) * 3.6
        
        pop_val = float(hora.get('pop', 0))
        
        # 2. PREPARAÇÃO PARA A CALCULADORA (O PULO DO GATO)
        # Passamos os dados EXATAMENTE como a calculadora espera ler
        climate_input = {
            "rain": {"1h": rain_val},    # Calculadora busca ['rain']['1h']
            "wind_speed": speed_ms,      # Calculadora busca ['wind_speed'] (em m/s)
            "pop": pop_val,              # Calculadora busca ['pop'] (0 a 1)
            "pressure": hora.get('pressure', 1013),
            "humidity": hora.get('humidity', 50)
        }
        
        # 3. Calcula
        analise = calculate_hourly_risk(climate_input, structural_data)
        
        # 4. Injeta os resultados
        hora['nota_de_risco'] = analise['score_final']
        hora['fatores_explicados'] = analise['fatores_contribuintes']
        
        # 5. Sobrescreve campos para o Frontend ler fácil
        hora['volume_chuva_mm'] = rain_val
        hora['rajadas_kmh'] = wind_kmh_exibicao
        hora['pop'] = pop_val
        hora['temp'] = hora.get('temp', 0)
        
        previsao_enriquecida.append(hora)

    return {"asset_info": asset, "hourly_forecast_with_risk": previsao_enriquecida}


@app.get("/macro/assets/map")
def get_assets_map_points(
    intel: str = "mestre", # O Frontend manda: 'rios', 'clima' ou 'mestre'
    db: Session = Depends(get_db)
):
    assets = db.query(models.Asset).all()
    features = []
    
    for asset in assets:
        # Lógica simplificada aqui para performance no mapa
        # (Em produção real, usaríamos os valores cacheados do cálculo de KPI acima)
        
        # 1. Busca Clima
        climate_raw = buscar_clima_openweather(asset.latitude, asset.longitude)
        rain_mm = 0; wind_kmh = 0; pop = 0; temp = 25
        
        if climate_raw and 'daily' in climate_raw:
            d = climate_raw['daily'][0]
            rain_mm = float(d.get('rain', 0) if isinstance(d.get('rain'), (int,float)) else d.get('rain',{}).get('1h',0))
            pop = float(d.get('pop', 0)) * 100
            wind_kmh = float(d.get('wind_speed', 0)) * 3.6
        
        # 2. Calcula as 3 notas possíveis
        # A) Rio
        score_rio = min((asset.river_risk_factor * 3.3), 10.0)
        
        # B) Clima (Simplificado)
        score_clima = min((rain_mm * 0.5) + (wind_kmh * 0.1), 10.0)
        
        # C) Mestre (Calculadora Oficial)
        analise = calculate_daily_risk(
            {"volume_chuva_mm": rain_mm, "prob_chuva_%": pop, "rajadas_kmh": wind_kmh},
            {"elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor}
        )
        score_mestre = analise['score_final']
        
        # 3. Decide qual nota devolver pro mapa
        final_score = score_mestre # Default
        if intel == 'rios': final_score = score_rio
        if intel == 'clima': final_score = score_clima
        
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [asset.longitude, asset.latitude]},
            "properties": {
                "id": asset.asset_uuid,
                "name": asset.name,
                "risk": round(final_score, 2) # O Mapa só precisa saber a "Nota Final"
            }
        })

    return {"type": "FeatureCollection", "features": features}
    
# src/backend/main.py

# ... (Mantenha seus imports e variáveis globais lá em cima)

# --- HELPER FUNCTIONS (Auxiliares da Regra de Negócio) ---
def converter_vuln_para_fator(texto):
    """Transforma texto (ex: 'Muito Alto') em multiplicador matemático."""
    if not isinstance(texto, str): return 1.0
    t = texto.lower().strip()
    if 'muito alto' in t or 'crítico' in t: return 1.25 # Aumenta risco em 25%
    if 'alto' in t: return 1.15
    return 1.0

def estimar_populacao_impactada(impacto_texto):
    """Estimativa de pessoas afetadas baseada no grau de impacto da ANA."""
    if not isinstance(impacto_texto, str): return 0
    t = impacto_texto.lower()
    if 'muito alto' in t: return 50000
    if 'alto' in t: return 10000
    if 'médio' in t: return 1000
    return 100

# ==========================================
# 7. FUSÃO MESTRA: DADOS COMPLETOS (ÚNICO ENDPOINT)
# ==========================================
# Função para limpar texto (Remove acentos: Corumbá -> CORUMBA)
def normalizar_chave(texto):
    if not isinstance(texto, str): return ""
    return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII').upper().strip()

@app.get("/macro/mestre/full_data")
def get_mestre_full_data():
    """
    ENDPOINT MESTRE (SEM FILTROS):
    - Manda 100% dos municípios, mesmo com nota 0.
    - Garante que o mapa pinte tudo.
    """
    if map_rivers_data is None:
        return {"kpis": {}, "graficos": {}, "mapa": {"type": "FeatureCollection", "features": []}}

    # 1. Indexação Clima
    df_clima = map_climate_data if map_climate_data is not None else pd.DataFrame()
    climate_map = {}
    try:
        if not df_clima.empty:
            col_city = next((c for c in df_clima.columns if c.lower() in ['municipio', 'city', 'nome']), None)
            col_risk = next((c for c in df_clima.columns if c.lower() in ['risk_score', 'nota', 'risk']), None)
            if col_city and col_risk:
                climate_map = {
                    normalizar_chave(str(k)): float(v) 
                    for k, v in zip(df_clima[col_city], pd.to_numeric(df_clima[col_risk], errors='coerce').fillna(0))
                }
    except: pass

    # 2. Inicialização
    stats = {'Crítico': 0, 'Alto': 0, 'Moderado': 0, 'Baixo': 0, 'Mínimo': 0}
    top_list = []
    map_features = []
    
    total_score_sum = 0
    total_pop_risco = 0
    count = 0

    records = map_rivers_data.to_dict('records')

    for row in records:
        # A) Inputs
        r_rio = float(row.get('Nota_de_Risco', 0))
        mun_nome = str(row.get('NM_MUN_PADRONIZADO', ''))
        mun_chave = normalizar_chave(mun_nome)
        
        r_clima = climate_map.get(mun_chave, 0.0)
        
        vuln_txt = str(row.get('Vulnerabilidade', 'Baixo'))
        impacto_txt = str(row.get('Impacto', 'Baixo'))
        fator_vuln = converter_vuln_para_fator(vuln_txt)

        # B) FÓRMULA (50/50 Pura)
        base_score = (r_rio * 0.5) + (r_clima * 0.5)
        final_score = base_score * fator_vuln
        if final_score > 10.0: final_score = 10.0

        # C) Consolidação
        count += 1
        total_score_sum += final_score
        
        if final_score >= 4.0:
            total_pop_risco += estimar_populacao_impactada(impacto_txt)

        cat = get_risk_classification_from_note(final_score)
        if cat in stats: stats[cat] += 1

        # D) Output (SEM FILTRO DE NOTA MÍNIMA)
        nome_rio = str(row.get('NORIOCOMP', 'Rio'))
        label_principal = mun_nome if len(mun_nome) > 2 else nome_rio
        
        # Só filtra da LISTA lateral se for muito irrelevante, pra não poluir
        if final_score > 0.1:
            top_list.append({
                "nome": label_principal,
                "nota": round(final_score, 2),
                "detalhe": nome_rio
            })

        # NO MAPA: MANDA TUDO, SEMPRE.
        # Precisamos lat/lon. Se não tiver, infelizmente não dá pra plotar ponto.
        lat = row.get('Latitude') or row.get('LATITUDE')
        lon = row.get('Longitude') or row.get('LONGITUDE')
        
        if lat and lon:
            map_features.append({
                "type": "Feature",
                "geometry": { "type": "Point", "coordinates": [float(lon), float(lat)] },
                "properties": {
                    "id": str(uuid.uuid4()),
                    "name": mun_nome, # Nome oficial para bater com GeoJSON
                    "risk": round(final_score, 2),
                    "municipio": nome_rio
                }
            })

    # 3. Retorno
    top_list.sort(key=lambda x: x['nota'], reverse=True)
    avg_risk = total_score_sum / count if count > 0 else 0

    grafico_pizza = []
    if count > 0:
        for k, v in stats.items():
            if v > 0:
                pct = (v / count) * 100
                grafico_pizza.append({"name": k, "value": round(pct, 1)})

    return {
        "kpis": {
            "riscoNacionalMedio": round(avg_risk, 2),
            "municipiosAlertaCritico": stats['Crítico'] + stats['Alto'],
            "totalMonitorado": count,
            "populacaoEmRisco": total_pop_risco
        },
        "graficos": {
            "riscoPorNivel": grafico_pizza,
            "topRiosPorRisco": top_list[:20]
        },
        "mapa": {
            "type": "FeatureCollection",
            "features": map_features
        }
    }

# --- ENDPOINTS LEGADOS (MANTIDOS) ---
@app.get("/map_data/rivers")
async def get_map_rivers_data():
    if map_rivers_data is None: raise HTTPException(status_code=503, detail="Dados de rios não carregados.")
    return map_rivers_data.to_dict(orient='records')

@app.get("/map_data/states_geojson")
async def get_map_states_geojson():
    if map_states_geojson_data is None: raise HTTPException(status_code=503, detail="GeoJSON de estados não carregado.")
    return json.loads(map_states_geojson_data.to_json())

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)