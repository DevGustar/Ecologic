# Ecologic/src/backend/main.py (VERSÃO FINAL COMPLETA E CORRIGIDA)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
from . import models, database, schemas
import uuid
from typing import List, Optional
import json

# Importamos as duas funções de cálculo do risk_calculator
from .api_connectors import buscar_clima_openweather, fetch_elevation_data
from .risk_calculator import calculate_daily_risk, calculate_hourly_risk

from . import map_data_loader
import pandas as pd
import geopandas as gpd

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="EcoLogic 2.0 API")

origins = [
    "http://localhost:5173",
    "http://172.16.0.1:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

map_rivers_data: Optional[pd.DataFrame] = None
map_states_geojson_data: Optional[gpd.GeoDataFrame] = None

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    global map_rivers_data, map_states_geojson_data
    logger.info("Iniciando API e carregando dados de mapa...")
    loaded_map_rivers, loaded_map_states_geojson = map_data_loader.load_all_map_data()
    if loaded_map_rivers is not None:
        map_rivers_data = loaded_map_rivers
        logger.info(f"Dados de rios para mapa carregados. {len(map_rivers_data)} registros.")
    if loaded_map_states_geojson is not None:
        map_states_geojson_data = loaded_map_states_geojson
        logger.info(f"GeoJSON de estados para mapa carregado. {len(map_states_geojson_data)} estados.")
    logger.info("Carregamento de dados de mapa concluído.")

# --- Endpoints da API ---

@app.get("/")
async def read_root():
    return {"message": "API EcoLogic 2.0 está a funcionar! Acesse /docs para a documentação."}

@app.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)): 
    asset_id = str(uuid.uuid4())
    elevation = fetch_elevation_data(asset.latitude, asset.longitude)
    new_asset_model = models.Asset(asset_uuid=asset_id, name=asset.name, latitude=asset.latitude, longitude=asset.longitude, elevation_m=elevation)
    db.add(new_asset_model)
    db.commit()
    db.refresh(new_asset_model)
    logger.info(f"Ativo criado: {new_asset_model.name}")
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
    dados_estruturais_ativo = {"elevation_m": asset.elevation_m}
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
    dados_estruturais_ativo = {"elevation_m": asset.elevation_m}
    analise_detalhada = calculate_daily_risk(climate_data=dados_climaticos_hoje, structural_data=dados_estruturais_ativo)
    return analise_detalhada

# --- ENDPOINT DE RISCO EM TEMPO REAL (CORRIGIDO) ---
@app.get("/assets/{asset_id}/current_risk")
def get_asset_current_risk(asset_id: str, db: Session = Depends(get_db)):
    """
    (VERSÃO CORRIGIDA) Busca o clima atual, TRADUZ os dados para o formato
    esperado e calcula o risco para o momento.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "current" not in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Dados de clima atual não disponíveis.")

    clima_atual = dados_brutos_clima.get('current', {})
    dados_estruturais_ativo = {"elevation_m": asset.elevation_m}

    if 'rain' in clima_atual and isinstance(clima_atual['rain'], (int, float)):
        clima_atual['rain'] = {'1h': clima_atual['rain']}
        
    analise_detalhada_atual = calculate_hourly_risk(
        hourly_climate_data=clima_atual,
        structural_data=dados_estruturais_ativo
    )
    
    return {"current_risk_score": analise_detalhada_atual['score_final']}


# --- ENDPOINT HORÁRIO (CORRIGIDO PARA TER CONSISTÊNCIA) ---
@app.get("/assets/{asset_id}/hourly_risk_analysis")
def get_asset_hourly_risk(asset_id: str, db: Session = Depends(get_db)):
    """
    (VERSÃO CORRIGIDA) Garante que o primeiro ponto da previsão horária
    seja o dado em tempo real, para consistência com o KPI.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None: raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "hourly" not in dados_brutos_clima or "current" not in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Dados de previsão incompletos.")

    dados_estruturais_ativo = {"elevation_m": asset.elevation_m}
    
    clima_atual = dados_brutos_clima.get('current', {})
    if 'rain' in clima_atual and isinstance(clima_atual['rain'], (int, float)):
        clima_atual['rain'] = {'1h': clima_atual['rain']}
    
    analise_atual = calculate_hourly_risk(
        hourly_climate_data=clima_atual,
        structural_data=dados_estruturais_ativo
    )
    clima_atual['nota_de_risco'] = analise_atual['score_final']
    clima_atual['explicacao_risco'] = analise_atual['fatores_contribuintes']

    previsao_horaria_enriquecida = []
    lista_previsao_horaria = dados_brutos_clima.get('hourly', [])[1:24]

    for previsao_uma_hora in lista_previsao_horaria:
        analise_detalhada_hora = calculate_hourly_risk(
            hourly_climate_data=previsao_uma_hora,
            structural_data=dados_estruturais_ativo
        )
        previsao_uma_hora['nota_de_risco'] = analise_detalhada_hora['score_final']
        previsao_uma_hora['explicacao_risco'] = analise_detalhada_hora['fatores_contribuintes']
        previsao_horaria_enriquecida.append(previsao_uma_hora)

    dados_finais = [clima_atual] + previsao_horaria_enriquecida

    return {
        "asset_info": asset,
        "hourly_forecast_with_risk": dados_finais
    }

# --- Endpoints de Mapa (Inalterados) ---
@app.get("/map_data/rivers")
async def get_map_rivers_data():
    if map_rivers_data is None: raise HTTPException(status_code=503, detail="Dados de rios não carregados.")
    return map_rivers_data.to_dict(orient='records')

@app.get("/map_data/states_geojson")
async def get_map_states_geojson():
    if map_states_geojson_data is None: raise HTTPException(status_code=503, detail="GeoJSON de estados não carregado.")
    return json.loads(map_states_geojson_data.to_json())

# --- Bloco para rodar a aplicação ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)