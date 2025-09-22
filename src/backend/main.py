# Ecologic/src/backend/main.py (VERSÃO FINAL COM ENDPOINTS DE MAPA E DB)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn # Adicionado para poder rodar o servidor via main.py
from sqlalchemy.orm import Session
from . import models, database, schemas # schemas já estava, adicionei de novo para clareza
import uuid
from datetime import datetime
from typing import List, Optional # Adicionado Optional para os dados carregados

# Importando funções para buscar clima, elevação e calcular risco (já existentes)
from .api_connectors import buscar_clima_openweather, fetch_elevation_data
from .risk_calculator import calculate_daily_risk

# NOVO: Importa o nosso módulo de carregamento de dados de mapa
from .map_data_loader import load_all_map_data
import pandas as pd
import geopandas as gpd
import json # Para serializar o GeoJSON corretamente


### Esta linha diz ao SQLAlchemy para criar a nossa tabela "assets"
### no ficheiro ecologic.db se ela ainda não existir.
models.Base.metadata.create_all(bind=database.engine)


# --- Criação da Aplicação ---
app = FastAPI(title="EcoLogic 2.0 API")

# --- Configuração do CORS para o futuro frontend
# (Esta parte permanece igual)
origins = [
    "http://localhost:5173",  # A URL do seu frontend
    "http://127.0.0.1:5173",  # Caso o navegador use 127.0.0.1
    # Adicione outros domínios do frontend aqui
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Variáveis globais para armazenar os DADOS DO MAPA carregados ---
# Serão carregados uma vez na inicialização da aplicação.
map_rivers_data: Optional[pd.DataFrame] = None
map_states_geojson_data: Optional[gpd.GeoDataFrame] = None


### Esta função é o nosso "entregador" de ligações à base de dados.
### O FastAPI irá chamá-la para nós.
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- NOVO: Evento de inicialização da API ---
@app.on_event("startup")
async def startup_event():
    """
    Carrega todos os dados necessários (mapa) quando a API é iniciada.
    """
    global map_rivers_data, map_states_geojson_data
    print("Iniciando API e carregando dados de mapa...")
    
    # Chama a função do nosso módulo para carregar os dados do mapa
    loaded_map_rivers, loaded_map_states_geojson = load_all_map_data()
    
    if loaded_map_rivers is not None:
        map_rivers_data = loaded_map_rivers
        print(f"Dados de rios para mapa carregados. {len(map_rivers_data)} registros.")
    else:
        print("❌ Falha ao carregar dados de rios para mapa.")

    if loaded_map_states_geojson is not None:
        map_states_geojson_data = loaded_map_states_geojson
        print(f"GeoJSON de estados para mapa carregado. {len(map_states_geojson_data)} estados.")
    else:
        print("❌ Falha ao carregar GeoJSON de estados para mapa.")
    
    print("Carregamento de dados de mapa concluído.")


# --- Endpoints da API ---

# Endpoint de Teste (Raiz) - Mantido
@app.get("/")
async def read_root():
    return {"message": "API EcoLogic 2.0 está a funcionar\! Acesse /docs para a documentação."}


# CRIAÇÃO DE ATIVOS - Mantido (com pequenas melhorias na resposta e type hints)
@app.post("/assets", response_model=schemas.Asset) # Adicionado response_model para melhor documentação
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
    
    print(f"Ativo criado e salvo no banco de dados: {new_asset_model.name}")
    return new_asset_model

# --------------------- ROTA PARA PUXAR TODOS OS ATIVOS --------------------- - Mantido
@app.get("/assets", response_model=List[schemas.Asset])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Endpoint para ler uma lista de todos os ativos da base de dados.
    """
    assets = db.query(models.Asset).offset(skip).limit(limit).all()
    print(f"Encontrados {len(assets)} ativos na base de dados.")
    return assets

# DADOS ESTRUTURAIS DO ATIVO - Mantido
@app.get("/assets/{asset_uuid}", response_model=schemas.Asset) # Adicionado response_model
def get_asset_info(asset_uuid: str, db: Session = Depends(get_db)):
    """
    Retorna os dados estruturais de um único ativo que já foi criado.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_uuid).first()

    if asset is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return asset

# ------------------------------------------------------
# DADOS CLIMATICOS PROCESSADOS (ANÁLISE DE RISCO) - Mantido
@app.get("/assets/{asset_id}/risk_analysis")
def get_asset_risk_analysis(asset_id: str, db: Session = Depends(get_db)):
    """
    Este endpoint busca os dados brutos do clima, processa-os e
    usa o risk_calculator para devolver a análise completa com a nota de risco.
    """
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "error" in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Falha ao contatar a API de clima.")

    dados_estruturais_ativo = {
        "elevation_m": asset.elevation_m
    }

    previsao_enriquecida = []
    lista_previsao_bruta = dados_brutos_clima.get('daily', [])

    for previsao_um_dia in lista_previsao_bruta:
        dados_climaticos_dia = {
            "volume_chuva_mm": previsao_um_dia.get('rain', 0),
            "prob_chuva_%": previsao_um_dia.get('pop', 0) * 100,
            "rajadas_kmh": previsao_um_dia.get('wind_gust', 0) * 3.6
        }
        if dados_climaticos_dia["volume_chuva_mm"] is None:
            dados_climaticos_dia["volume_chuva_mm"] = 0

        nota_de_risco = calculate_daily_risk(
            climate_data=dados_climaticos_dia,
            structural_data=dados_estruturais_ativo
        )

        previsao_um_dia['nota_de_risco'] = nota_de_risco
        previsao_enriquecida.append(previsao_um_dia)

    return {
        "asset_info": asset,
        "daily_forecast_with_risk": previsao_enriquecida
    }

# --- NOVOS ENDPOINTS PARA DADOS DO MAPA ---

@app.get("/map_data/rivers")
async def get_map_rivers_data():
    """
    Retorna os dados brutos dos rios (do arquivo CSV) para uso no mapa do frontend.
    """
    if map_rivers_data is None:
        raise HTTPException(status_code=503, detail="Dados de rios para mapa ainda não foram carregados.")
    
    # Converte o DataFrame para uma lista de dicionários, fácil de consumir em JS.
    return map_rivers_data.to_dict(orient='records')

@app.get("/map_data/states_geojson")
async def get_map_states_geojson():
    """
    Retorna o GeoJSON bruto dos estados do Brasil para uso no mapa do frontend.
    """
    if map_states_geojson_data is None:
        raise HTTPException(status_code=503, detail="GeoJSON de estados para mapa ainda não foi carregado.")
    
    # geopandas.to_json() retorna uma string JSON. Para FastAPI retornar como um objeto JSON,
    # precisamos parsear essa string de volta para um objeto Python (dict).
    # O "name" na raiz do GeoJSON é um detalhe, o importante é o "features"
    geojson_dict = json.loads(map_states_geojson_data.to_json())
    return geojson_dict

# --- Bloco para rodar a aplicação com Uvicorn ---
# Isso permite que você execute 'python main.py' diretamente.
# Em produção, você usaria 'uvicorn main:app --host 0.0.0.0 --port 8000'
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)