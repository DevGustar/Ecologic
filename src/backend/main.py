# --- main.py ---
# O Gerente da Aplicação (v2.1 - agora com um endpoint para dados do ativo)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from datetime import datetime

# Importamos NOSSAS DUAS ferramentas especialistas
from api_connectors import buscar_clima_openweather, fetch_elevation_data
from risk_calculator import calculate_daily_risk

# --- Criação da Aplicação ---
app = FastAPI(title="EcoLogic 2.0 API")

# --- Configuração do CORS para o futuro frontend
# garantindo que quando o React for chamar a API, não haja problemas de CORS
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Nosso "Banco de Dados em Memória" ---
db_assets = {}

# --- Endpoints da API ---

@app.post("/assets")
def create_asset(name: str, lat: float, lon: float):
    # (Esta função permanece a mesma)
    asset_id = str(uuid.uuid4())
    elevation = fetch_elevation_data(lat, lon)
    new_asset = {
        "id": asset_id, "name": name, "latitude": lat, 
        "longitude": lon, "elevation_m": elevation
    }
    db_assets[asset_id] = new_asset
    print(f"Ativo criado: {new_asset}")
    return new_asset

@app.get("/assets/{asset_id}")
def get_asset_info(asset_id: str):
    """
    Retorna os dados estruturais de um único ativo que já foi criado.
    """
    if asset_id not in db_assets: # se o id existe no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return db_assets[asset_id] # retorna os dados do ativo

@app.get("/assets/{asset_id}/climate")
def get_asset_climate(asset_id: str):
    # puxa dados brutos da API Climatica
    if asset_id not in db_assets:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    asset = db_assets[asset_id]
    dados_climáticos = buscar_clima_openweather(lat=asset['latitude'], lon=asset['longitude'])
    return dados_climáticos
