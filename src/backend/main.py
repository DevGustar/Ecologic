from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session ### Adicionamos a 'Session'
from . import models, database ### Importamos os nossos novos módulos de base de dados
import uuid
from datetime import datetime

# Importando funções para buscar clima, elevação e calcular risco
from .api_connectors import buscar_clima_openweather, fetch_elevation_data
from .risk_calculator import calculate_daily_risk

### Esta linha diz ao SQLAlchemy para criar a nossa tabela "assets"
### no ficheiro ecologic.db se ela ainda não existir.
models.Base.metadata.create_all(bind=database.engine)


# --- Criação da Aplicação ---
app = FastAPI(title="EcoLogic 2.0 API")

# --- Configuração do CORS para o futuro frontend
# (Esta parte permanece igual)
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### A nossa "memória" antiga agora é gerida pela base de dados,
### por isso podemos apagar a linha 'db_assets = {}'.

### Esta função é o nosso "entregador" de ligações à base de dados.
### O FastAPI irá chamá-la para nós.
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Endpoints da API ---

# CRIAÇÃO DE ATIVOS

@app.post("/assets")
### A nossa função agora "pede" uma ligação à base de dados (db)
def create_asset(name: str, lat: float, lon: float, db: Session = Depends(get_db)): 
    """
    Endpoint para criar um ativo, recebe nome, latitude e longitude 
    """
    asset_id = str(uuid.uuid4()) # Gera um ID único para o ativo
    elevation = fetch_elevation_data(lat, lon) # Busca a elevação usando a função importada

    ### Em vez de um dicionário, criamos um "molde" do nosso modelo Asset
    new_asset_model = models.Asset(
        asset_uuid=asset_id,
        name=name,
        latitude=lat,
        longitude=lon,
        elevation_m=elevation
    )

    ### Agora, usamos a base de dados para guardar o ativo permanentemente
    db.add(new_asset_model) # Adiciona o novo ativo à "conversa" com a base de dados
    db.commit()             # Confirma e salva as alterações
    db.refresh(new_asset_model) # Atualiza o objeto com os dados finais do banco
    
    print(f"Ativo criado e salvo no banco de dados: {new_asset_model.name}")
    return new_asset_model


# ------------------------------------------------------
# DADOS ESTRUTURAIS DO ATIVO

@app.get("/assets/{asset_uuid}")
### Esta função também pede uma ligação à base de dados
def get_asset_info(asset_uuid: str, db: Session = Depends(get_db)):
    """
    Retorna os dados estruturais de um único ativo que já foi criado.
    """
    ### Em vez de procurar num dicionário, fazemos uma consulta (query) na base de dados
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_uuid).first()

    if asset is None: # se o id não existe no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return asset # retorna os dados do ativo


# ------------------------------------------------------
# DADOS CLIMATICOS PROCESSADOS (ANÁLISE DE RISCO)

@app.get("/assets/{asset_id}/risk_analysis")
### E esta também pede a ligação para poder buscar os dados do ativo
def get_asset_risk_analysis(asset_id: str, db: Session = Depends(get_db)):
    """
    Este endpoint busca os dados brutos do clima, processa-os e
    usa o risk_calculator para devolver a análise completa com a nota de risco.
    """
    # 1. Busca os dados do ativo na base de dados
    asset = db.query(models.Asset).filter(models.Asset.asset_uuid == asset_id).first()
    if asset is None: # se o id não existe no banco de dados
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    
    # 2. Busca dos dados brutos do clima (como antes)
    dados_brutos_clima = buscar_clima_openweather(lat=asset.latitude, lon=asset.longitude)
    if not dados_brutos_clima or "error" in dados_brutos_clima:
        raise HTTPException(status_code=503, detail="Falha ao contatar a API de clima.")

    # 3. Processamento e Limpeza dos Dados
    
    # Prepara a secção de dados estruturais do ativo
    dados_estruturais_ativo = {
        "elevation_m": asset.elevation_m
    }

    # Prepara a secção com a lista de previsões diárias
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

        # Chama o "cérebro" para calcular o risco
        nota_de_risco = calculate_daily_risk(
            climate_data=dados_climaticos_dia,
            structural_data=dados_estruturais_ativo
        )

        # Adiciona a nota de risco à previsão daquele dia
        previsao_um_dia['nota_de_risco'] = nota_de_risco
        previsao_enriquecida.append(previsao_um_dia)

    # 4. Monta e Retorna o "Pacote Completo"
    return {
        "asset_info": asset,
        "daily_forecast_with_risk": previsao_enriquecida
    }