# ferramentas nencessárias
from fastapi import FastAPI, HTTPException
import uuid
from api_connectors import buscar_clima_openweather # importa nosso buscador
from api_connectors import fetch_elevation_data # importa nosso buscador de elevação

app = FastAPI(title="EcoLogic 2.0 API")

# banco de dados simplificado em memória
db_assets = {}

@app.post("/assets/") # endpoint para criação de ativos
def create_asset(name: str, lat: float, lon: float): #* para poder criar um ativo é preciso de nome, latitude e longitude
    asset_id = str(uuid.uuid4()) #gera um novo ID único de ativo - uuid4 (método especifico)

    #? ADICIONANDO ELEVAÇÃO NA CRIAÇÃO DO ATIVO
    print(f"Buscando dados de elevação para o novo ativo {name}...")
    elevation = fetch_elevation_data(lat=lat, lon=lon)
    print(f"Elevação encontrada: {elevation} metros")

    new_asset = { # dados do novo ativo organizados
        "id": asset_id,
        "name": name,
        "lat": lat,
        "lon": lon,
        "elevation_m": elevation # novo dados de elevação em metros
    }
    db_assets[asset_id] = new_asset # adiciona o novo ativo ao banco de dados no espaço ID que foi criado
    print(f"Banco de dados atualizado: {db_assets}")
    return new_asset # retorna dados do novo ativo criado

@app.get("/assets/{asset_id}/climate/") # endpoint para buscar o clima de um ativo usando o ID do ativo
def get_asset_clima(asset_id: str):
    #* 1. procura o ID no banco de dados
    if asset_id not in db_assets:
        # se não for encontrado o ID no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado.")
    
    #* 2. se achou o ID ele puxa as informações
    asset = db_assets[asset_id]
    
    #* 3. cria var e armazena as informações que vai precisar do ativo
    asset_lat = asset["lat"]
    asset_lon = asset["lon"]

    #* 4. busca o clima usando a função buscar_clima passando as coordenadas do ativo
    dados_climaticos = buscar_clima_openweather(lat=asset_lat, lon=asset_lon)

    #* 5. retorna os dados climáticos
    return dados_climaticos