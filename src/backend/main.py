from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from datetime import datetime

# Importando funções para buscar clima, elevação e calcular risco
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

# CRIAÇÃO DE ATIVOS

@app.post("/assets")
def create_asset(name: str, lat: float, lon: float): 
    """
    Endpoint para criar um ativo, recebe nome, latitude e longitude 
    """
    asset_id = str(uuid.uuid4()) # Gera um ID único para o ativo
    elevation = fetch_elevation_data(lat, lon) # Busca a elevação usando a função importada

    new_asset = { # Cria o dicionário do ativo
        "id": asset_id, 
        "name": name, 
        "latitude": lat, 
        "longitude": lon, 
        "elevation_m": elevation
    }

    db_assets[asset_id] = new_asset # Armazena o ativo no "banco de dados"
    print(f"Ativo criado: {new_asset}")
    return new_asset


# ------------------------------------------------------
# DADOS ESTRUTURAIS DO ATIVO

@app.get("/assets/{asset_id}")
def get_asset_info(asset_id: str):
    """
    Retorna os dados estruturais de um único ativo que já foi criado.
    """
    if asset_id not in db_assets: # se o id existe no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return db_assets[asset_id] # retorna os dados do ativo


# ------------------------------------------------------
# DADOS CLIMATICOS BRUTOS

@app.get("/assets/{asset_id}/climate")
def get_asset_climate(asset_id: str):
    """
    Retorna os dados climáticos brutos (sem processamento) para um ativo específico.
    Usa a função importada buscar_clima_openweather para obter os dados.
    """
    if asset_id not in db_assets: # se o id existe no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    asset = db_assets[asset_id] # pega os dados do ativo e guarda na variável asset
    dados_climáticos = buscar_clima_openweather(lat=asset['latitude'], lon=asset['longitude'])
    # Chama a função de buscar clima, passando latitude e longitude do ativo como parâmetros
    return dados_climáticos

# ------------------------------------------------------
# DADOS CLIMATICOS PROCESSADOS (RISCO DIÁRIO)

@app.get("/assets/{asset_id}/processed_data")
def get_processed_data(asset_id: str):
    """
    Este endpoint busca os dados brutos do clima, processa-os para extrair
    as informações essenciais, e devolve um "pacote" de dados limpo e pronto
    para ser usado pelo risk_calculator ou pelo frontend.
    """
    # 1. Validação do Ativo e busca dos dados estruturais
    if asset_id not in db_assets: # se o id não existe no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    asset = db_assets[asset_id] # guarda as informações do ativo numa variável

    # 2. Busca dos dados brutos do clima
    dados_brutos_clima = buscar_clima_openweather(lat=asset['latitude'], lon=asset['longitude'])
    if not dados_brutos_clima or "error" in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Falha ao contatar a API de clima.")

    # 3. Processamento e Limpeza dos Dados (A Sua Ideia)
    
    # Prepara a secção de dados do ativo (que inclui a elevação)
    dados_do_ativo_processados = {
        "id": asset.get("id"),
        "name": asset.get("name"),
        "latitude": asset.get("latitude"),
        "longitude": asset.get("longitude"),
        "elevation_m": asset.get("elevation_m", 500) # Usamos .get() por segurança
    }

    # Prepara a secção com a lista de previsões diárias
    previsao_diaria_processada = []
    lista_previsao_bruta = dados_brutos_clima.get('daily', [])

    # "Caminhamos" pela lista de previsões brutas
    for previsao_um_dia in lista_previsao_bruta:
        # Extraímos apenas os "dados essenciais" que você mencionou
        volume_chuva_bruto = previsao_um_dia.get('rain')
        volume_chuva_final = volume_chuva_bruto if volume_chuva_bruto is not None else 0

        previsao_diaria_processada.append({
            "dia": datetime.fromtimestamp(previsao_um_dia['dt']).strftime('%d/%m (%a)'),
            "condicao": previsao_um_dia['weather'][0]['description'],
            "temperatura_max_c": previsao_um_dia['temp']['max'],
            "sensacao_termica_dia_c": previsao_um_dia['feels_like']['day'],
            "prob_chuva_%": previsao_um_dia.get('pop', 0) * 100,
            "volume_chuva_mm": volume_chuva_final,
            "umidade_%": previsao_um_dia.get('humidity', 0),
            "vento_kmh": previsao_um_dia.get('wind_speed', 0) * 3.6,
            "rajadas_kmh": previsao_um_dia.get('wind_gust', 0) * 3.6,
            "cobertura_nuvens_%": previsao_um_dia.get('clouds', 0),
            "pressao_hpa": previsao_um_dia.get('pressure', 0)
        })

    # 4. Monta e Retorna o "Pacote Completo"
    # Este é o "dossiê" final que o nosso risk_calculator ou o frontend irá usar
    return {
        "asset_info": dados_do_ativo_processados,
        "daily_forecast": previsao_diaria_processada
    }