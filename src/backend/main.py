# Ecologic/src/backend/main.py (VERSÃO COMPLETA E CORRIGIDA)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
from . import models, database, schemas
import uuid
from datetime import datetime
from typing import List, Optional
import json

# Importando funções para buscar clima, elevação e calcular risco
from .api_connectors import buscar_clima_openweather, fetch_elevation_data
from .risk_calculator import calculate_daily_risk

# Importa o nosso módulo de carregamento de dados de mapa
from . import map_data_loader
import pandas as pd
import geopandas as gpd

# Configuração de logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Criação da Tabela no Banco de Dados (se não existir) ---
models.Base.metadata.create_all(bind=database.engine)


# --- Criação da Aplicação ---
app = FastAPI(title="EcoLogic 2.0 API")

# --- Configuração do CORS para o frontend ---
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

# --- Variáveis globais para armazenar os DADOS DO MAPA carregados ---
map_rivers_data: Optional[pd.DataFrame] = None
map_states_geojson_data: Optional[gpd.GeoDataFrame] = None


# --- Dependência para Sessão do Banco de Dados ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Evento de inicialização da API ---
@app.on_event("startup")
async def startup_event():
    """
    Carrega todos os dados necessários (mapa) quando a API é iniciada.
    """
    global map_rivers_data, map_states_geojson_data
    logger.info("Iniciando API e carregando dados de mapa...")
    
    loaded_map_rivers, loaded_map_states_geojson = map_data_loader.load_all_map_data()
    
    if loaded_map_rivers is not None:
        map_rivers_data = loaded_map_rivers
        logger.info(f"Dados de rios para mapa carregados e padronizados. {len(map_rivers_data)} registros.")
    else:
        logger.error("❌ Falha ao carregar dados de rios para mapa.")

    if loaded_map_states_geojson is not None:
        map_states_geojson_data = loaded_map_states_geojson
        logger.info(f"GeoJSON de estados para mapa carregado. {len(map_states_geojson_data)} estados.")
    else:
        logger.error("❌ Falha ao carregar GeoJSON de estados para mapa.")
    
    logger.info("Carregamento de dados de mapa concluído.")


# --- Endpoints da API ---

@app.get("/")
async def read_root():
    return {"message": "API EcoLogic 2.0 está a funcionar! Acesse /docs para a documentação."}


@app.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)): 
    """
    Endpoint para criar um ativo, recebe um objeto JSON com nome, latitude e longitude
    """
    asset_id = str(uuid.uuid4())
    elevation = fetch_elevation_data(asset.latitude, asset.longitude)

    new_asset_model = models.Asset(
        asset_uuid=asset_id,
        name=asset.name,
        latitude=asset.latitude,
        longitude=asset.longitude,
        elevation_m=elevation
    )

    db.add(new_asset_model)
    db.commit()
    db.refresh(new_asset_model)
    
    logger.info(f"Ativo criado e salvo no banco de dados: {new_asset_model.name}")
    return new_asset_model


@app.get("/assets", response_model=List[schemas.Asset])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Endpoint para ler uma lista de todos os ativos da base de dados.
    """
    assets = db.query(models.Asset).offset(skip).limit(limit).all()
    logger.info(f"Encontrados {len(assets)} ativos na base de dados.")
    return assets


@app.get("/assets/{asset_uuid}", response_model=schemas.Asset)
def get_asset_info(asset_uuid: str, db: Session = Depends(get_db)):
    """
    Retorna os dados estruturais de um único ativo que já foi criado.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_uuid).first()

    if asset is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return asset


@app.get("/assets/{asset_id}/risk_analysis")
def get_asset_risk_analysis(asset_id: str, db: Session = Depends(get_db)):
    """
    (VERSÃO FINAL) Busca os dados do clima e anexa tanto a nota de risco
    quanto a EXPLICAÇÃO DETALHADA para cada dia da previsão.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "error" in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Falha ao contatar a API de clima.")

    dados_estruturais_ativo = {"elevation_m": asset.elevation_m}
    previsao_enriquecida = []
    lista_previsao_bruta = dados_brutos_clima.get('daily', [])

    for previsao_um_dia in lista_previsao_bruta:
        dados_climaticos_dia = {
            "volume_chuva_mm": previsao_um_dia.get('rain', 0),
            "prob_chuva_%": previsao_um_dia.get('pop', 0) * 100,
            "rajadas_kmh": previsao_um_dia.get('wind_gust', 0) * 3.6,
            "pressao_hpa": previsao_um_dia.get('pressure', 1013),
            "umidade_%": previsao_um_dia.get('humidity', 50)
        }
        if dados_climaticos_dia["volume_chuva_mm"] is None:
            dados_climaticos_dia["volume_chuva_mm"] = 0

        # MUDANÇA PRINCIPAL: Agora guardamos a análise completa
        analise_detalhada_dia = calculate_daily_risk(
            climate_data=dados_climaticos_dia,
            structural_data=dados_estruturais_ativo
        )

        # Anexamos AMBOS os dados que o frontend precisa
        previsao_um_dia['nota_de_risco'] = analise_detalhada_dia['score_final']
        previsao_um_dia['explicacao_risco'] = analise_detalhada_dia['fatores_contribuintes']
        
        previsao_enriquecida.append(previsao_um_dia)

    return {
        "asset_info": asset,
        "daily_forecast_with_risk": previsao_enriquecida
    }


@app.get("/assets/{asset_id}/risk_explanation")
def get_asset_risk_explanation(asset_id: str, db: Session = Depends(get_db)):
    """
    NOVO ENDPOINT: Retorna a explicação detalhada de como a nota de risco
    do dia atual (hoje) foi calculada.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "daily" not in dados_brutos_clima or not dados_brutos_clima["daily"]:
        raise HTTPException(status_code=503, detail="Não foi possível obter a previsão de hoje da API de clima.")
    
    previsao_hoje = dados_brutos_clima['daily'][0]

    dados_climaticos_hoje = {
        "volume_chuva_mm": previsao_hoje.get('rain', 0),
        "prob_chuva_%": previsao_hoje.get('pop', 0) * 100,
        "rajadas_kmh": previsao_hoje.get('wind_gust', 0) * 3.6,
        "pressao_hpa": previsao_hoje.get('pressure', 1013),
        "umidade_%": previsao_hoje.get('humidity', 50)
    }
    if dados_climaticos_hoje["volume_chuva_mm"] is None:
        dados_climaticos_hoje["volume_chuva_mm"] = 0

    dados_estruturais_ativo = {"elevation_m": asset.elevation_m}

    analise_detalhada = calculate_daily_risk(
        climate_data=dados_climaticos_hoje,
        structural_data=dados_estruturais_ativo
    )

    return analise_detalhada


# --- Endpoints para Dados do Mapa ---

@app.get("/map_data/rivers")
async def get_map_rivers_data():
    if map_rivers_data is None:
        raise HTTPException(status_code=503, detail="Dados de rios para mapa ainda não foram carregados.")
    return map_rivers_data.to_dict(orient='records')


@app.get("/map_data/states_geojson")
async def get_map_states_geojson():
    if map_states_geojson_data is None:
        raise HTTPException(status_code=503, detail="GeoJSON de estados para mapa ainda não foi carregado.")
    geojson_dict = json.loads(map_states_geojson_data.to_json())
    return geojson_dict


# --- Bloco para rodar a aplicação com Uvicorn ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)