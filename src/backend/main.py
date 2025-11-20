# Ecologic/src/backend/main.py (VERSÃO ESTÁVEL E CORRIGIDA)

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

from .api_connectors import buscar_clima_openweather, fetch_elevation_data, get_municipality_from_coords
from .risk_calculator import calculate_daily_risk, calculate_hourly_risk
from . import map_data_loader

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="EcoLogic 2.0 API")
origins = ["http://localhost:5173", "http://172.16.0.1:5173", "http://127.0.0.1:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- VARIÁVEIS GLOBAIS ---
map_rivers_data: Optional[pd.DataFrame] = None
map_climate_data: Optional[pd.DataFrame] = None
gdf_rivers_painted: Optional[gpd.GeoDataFrame] = None
gdf_climate_painted: Optional[gpd.GeoDataFrame] = None
municipal_river_risk_map: dict = {}
map_states_geojson_data: Optional[gpd.GeoDataFrame] = None

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

@app.on_event("startup")
async def startup_event():
    global map_rivers_data, map_climate_data, gdf_rivers_painted, gdf_climate_painted, municipal_river_risk_map, map_states_geojson_data
    logger.info("Iniciando API...")
    
    # TEM QUE SER 6 VARIÁVEIS AQUI
    (rivers, climate, gdf_rios, gdf_clima, risk_map, states) = map_data_loader.load_all_map_data()
    
    map_rivers_data = rivers
    map_climate_data = climate
    gdf_rivers_painted = gdf_rios
    gdf_climate_painted = gdf_clima
    municipal_river_risk_map = risk_map
    map_states_geojson_data = states
    
    logger.info("Carga concluída.")

@app.get("/")
async def read_root(): return {"message": "API EcoLogic 2.0 Operacional"}

# --- KPIS E GRÁFICOS (GRC) ---
@app.get("/macro/grc/kpis")
def get_grc_kpi_data():
    if map_rivers_data is None: raise HTTPException(status_code=503, detail="Dados indisponíveis.")
    df = map_rivers_data.copy()
    
    # Garante numérico
    if 'Nota_de_Risco' in df.columns:
         df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce').fillna(0)

    # 1. KPIs
    kpi_medio = df['Nota_de_Risco'].mean()
    kpi_criticos = df[df['Classificacao_Risco'] == 'Crítico'].shape[0]
    kpi_mapeados = len(municipal_river_risk_map)
    kpi_total = len(df)

    # 2. Donut (5 Níveis, Sem Dados Filtrado)
    df['Class_Nova'] = df['Nota_de_Risco'].apply(get_risk_classification_from_note)
    df_donut = df[df['Class_Nova'] != 'Sem Dados']
    donut_pct = df_donut['Class_Nova'].value_counts(normalize=True).mul(100)
    donut_cnt = df_donut['Class_Nova'].value_counts()
    donut_final = [{"name": k, "value": float(v), "count": int(donut_cnt.get(k, 0))} for k, v in donut_pct.items()]

    # 3. Top 10 Rios (Sem Duplicatas e Com Dados GRC)
    col_nome = 'NORIOCOMP' if 'NORIOCOMP' in df.columns else 'Nome do Rio'
    
    if col_nome in df.columns:
        # Filtra inválidos
        df_clean = df[
            (df[col_nome].notna()) & 
            (df[col_nome] != '') &
            (~df[col_nome].astype(str).str.lower().isin(['sem nome', 'rio desconhecido', 'nan']))
        ].copy()
        
        # Ordena e Remove Duplicatas
        df_clean = df_clean.sort_values('Nota_de_Risco', ascending=False)
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
    if gdf_rivers_painted is None: raise HTTPException(status_code=503, detail="Mapa indisponível.")
    return json.loads(gdf_rivers_painted.to_json())

# --- OUTROS ENDPOINTS (Clima, Explorador, Ativos...) MANTIDOS ---
# (Para economizar espaço, estou omitindo os outros endpoints que já estão certos e não mudaram.
# Mantenha o restante do seu arquivo igual.)

@app.get("/macro/clima/kpis")
def get_clima_kpi_data():
    if map_climate_data is None: return {} # Retorna vazio se não tiver clima
    df = map_climate_data.copy()
    col_nota = 'nota_de_risco' if 'nota_de_risco' in df.columns else 'risk_score'
    if col_nota not in df.columns: return {}
    df[col_nota] = pd.to_numeric(df[col_nota], errors='coerce').fillna(0)
    
    kpi_medio = df[col_nota].mean()
    kpi_criticos = df[df[col_nota] >= 8].shape[0]
    kpi_atencao = df[df[col_nota] >= 6].shape[0]
    
    df['Class_Clima'] = df[col_nota].apply(get_risk_classification_from_note)
    donut_pct = df['Class_Clima'].value_counts(normalize=True).mul(100)
    donut_cnt = df['Class_Clima'].value_counts()
    donut_final = [{"name": k, "value": float(v), "count": int(donut_cnt.get(k, 0))} for k, v in donut_pct.items()]

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
    if gdf_climate_painted is None: raise HTTPException(status_code=503, detail="Mapa indisponível.")
    return json.loads(gdf_climate_painted.to_json())

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

# --- Endpoints de Ativos ---
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
    assets = db.query(models.Asset).offset(skip).limit(limit).all()
    return assets

@app.get("/assets/{asset_uuid}", response_model=schemas.Asset)
def get_asset_info(asset_uuid: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_uuid).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return asset

@app.get("/assets/{asset_id}/risk_analysis")
def get_asset_risk_analysis(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "error" in dados_brutos_clima: raise HTTPException(status_code=503, detail="Falha na API de clima.")
    dados_estruturais_ativo = { "elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor }
    previsao_enriquecida = []
    lista_previsao_bruta = dados_brutos_clima.get('daily', [])
    for previsao_um_dia in lista_previsao_bruta:
        dados_climaticos_dia = {"volume_chuva_mm": previsao_um_dia.get('rain', 0), "prob_chuva_%": previsao_um_dia.get('pop', 0) * 100, "rajadas_kmh": previsao_um_dia.get('wind_gust', 0) * 3.6, "pressao_hpa": previsao_um_dia.get('pressure', 1013), "umidade_%": previsao_um_dia.get('humidity', 50)}
        if dados_climaticos_dia["volume_chuva_mm"] is None: dados_climaticos_dia["volume_chuva_mm"] = 0
        analise_detalhada_dia = calculate_daily_risk(climate_data=dados_climaticos_dia, structural_data=dados_estruturais_ativo)
        previsao_um_dia['nota_de_risco'] = analise_detalhada_dia['score_final']
        previsao_um_dia['explicacao_risco'] = analise_detalhada_dia['fatores_contribuintes']
        previsao_enriquecida.append(previsao_um_dia)
    return {"asset_info": asset, "daily_forecast_with_risk": previsao_enriquecida}

@app.get("/assets/{asset_id}/risk_explanation")
def get_asset_risk_explanation(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "daily" not in dados_brutos_clima or not dados_brutos_clima["daily"]: raise HTTPException(status_code=503, detail="Previsão de hoje indisponível.")
    previsao_hoje = dados_brutos_clima['daily'][0]
    dados_climaticos_hoje = {"volume_chuva_mm": previsao_hoje.get('rain', 0), "prob_chuva_%": previsao_hoje.get('pop', 0) * 100, "rajadas_kmh": previsao_hoje.get('wind_gust', 0) * 3.6, "pressao_hpa": previsao_hoje.get('pressure', 1013), "umidade_%": previsao_hoje.get('humidity', 50)}
    if dados_climaticos_hoje["volume_chuva_mm"] is None: dados_climaticos_hoje["volume_chuva_mm"] = 0
    dados_estruturais_ativo = {"elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor}
    analise_detalhada = calculate_daily_risk(climate_data=dados_climaticos_hoje, structural_data=dados_estruturais_ativo)
    return analise_detalhada

@app.get("/assets/{asset_id}/current_risk")
def get_asset_current_risk(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "current" not in dados_brutos_clima: raise HTTPException(status_code=503, detail="Dados de clima atual não disponíveis.")
    clima_atual = dados_brutos_clima.get('current', {})
    dados_estruturais_ativo = {"elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor}
    if 'rain' in clima_atual and isinstance(clima_atual['rain'], (int, float)):
        clima_atual['rain'] = {'1h': clima_atual['rain']}
    analise_detalhada_atual = calculate_hourly_risk(hourly_climate_data=clima_atual, structural_data=dados_estruturais_ativo)
    return {"current_risk_score": analise_detalhada_atual['score_final']}

@app.get("/assets/{asset_id}/hourly_risk_analysis")
def get_asset_hourly_risk(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "hourly" not in dados_brutos_clima or "current" not in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Dados de previsão incompletos.")
    dados_estruturais_ativo = {"elevation_m": asset.elevation_m, "river_risk_factor": asset.river_risk_factor}
    clima_atual = dados_brutos_clima.get('current', {})
    if 'rain' in clima_atual and isinstance(clima_atual['rain'], (int, float)):
        clima_atual['rain'] = {'1h': clima_atual['rain']}
    analise_atual = calculate_hourly_risk(hourly_climate_data=clima_atual, structural_data=dados_estruturais_ativo)
    clima_atual['nota_de_risco'] = analise_atual['score_final']
    clima_atual['explicacao_risco'] = analise_atual['fatores_contribuintes']
    previsao_horaria_enriquecida = []
    lista_previsao_horaria = dados_brutos_clima.get('hourly', [])[1:24]
    for previsao_uma_hora in lista_previsao_horaria:
        analise_detalhada_hora = calculate_hourly_risk(hourly_climate_data=previsao_uma_hora, structural_data=dados_estruturais_ativo)
        previsao_uma_hora['nota_de_risco'] = analise_detalhada_hora['score_final']
        previsao_uma_hora['explicacao_risco'] = analise_detalhada_hora['fatores_contribuintes']
        previsao_horaria_enriquecida.append(previsao_uma_hora)
    dados_finais = [clima_atual] + previsao_horaria_enriquecida
    return {"asset_info": asset, "hourly_forecast_with_risk": dados_finais}

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