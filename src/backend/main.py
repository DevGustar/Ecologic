# Ecologic/src/backend/main.py (VERSÃO FINAL COM ENDPOINTS ANTIGOS E NOVOS)

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

from .api_connectors import buscar_clima_openweather, fetch_elevation_data, get_municipality_from_coords
from .risk_calculator import calculate_daily_risk, calculate_hourly_risk
from . import map_data_loader

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="EcoLogic 2.0 API")
origins = [ "http://localhost:5173", "http://172.16.0.1:5173", "http://127.0.0.1:5173" ]
app.add_middleware( CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"] )

# --- Nossas variáveis globais para guardar TODOS os dados na memória ---
map_rivers_data: Optional[pd.DataFrame] = None
gdf_municipios_pintado: Optional[gpd.GeoDataFrame] = None
municipal_river_risk_map: dict = {}
map_states_geojson_data: Optional[gpd.GeoDataFrame] = None # Para o endpoint antigo

def get_risk_classification_from_note(risk_note: float) -> str:
    if risk_note >= 8: return "Crítico"
    if risk_note >= 6: return "Alto"
    if risk_note >= 4: return "Moderado"
    if risk_note >= 2: return "Baixo"
    if risk_note > 0: return "Mínimo" # <-- O azul para notas baixas
    return "Sem Dados" # Nota 0

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    global map_rivers_data, gdf_municipios_pintado, municipal_river_risk_map, map_states_geojson_data
    logger.info("Iniciando API e carregando todos os dados da 'Visão Mestra'...")
    
    # A função de loader agora retorna as 4 peças
    loaded_rivers, loaded_gdf_painted, loaded_risk_map, loaded_states_gdf = map_data_loader.load_all_map_data()
    
    if loaded_rivers is not None:
        map_rivers_data = loaded_rivers
        logger.info(f"✅ Dados brutos de RIOS carregados. {len(map_rivers_data)} registros.")
    if loaded_gdf_painted is not None:
        gdf_municipios_pintado = loaded_gdf_painted
        logger.info(f"✅ GeoJSON de MUNICÍPIOS (pintado) carregado.")
    if loaded_risk_map:
        municipal_river_risk_map = loaded_risk_map
        logger.info(f"✅ DICIONÁRIO DE RISCO (Fusão Mestra) CARREGADO. {len(municipal_river_risk_map)} municípios.")
    if loaded_states_gdf is not None:
        map_states_geojson_data = loaded_states_gdf
        logger.info(f"✅ GeoJSON de ESTADOS (antigo) carregado.")
        
    logger.info("Carregamento de dados de mapa concluído.")

# --- Endpoints da API ---
@app.get("/")
async def read_root(): return {"message": "API EcoLogic 2.0 está a funcionar!"}


# --- NOVOS ENDPOINTS MESTRES (MACRO ANÁLISE PARA O "COCKPIT") ---

@app.get("/macro/grc/kpis")
def get_grc_kpi_data():
    """
    (VERSÃO REFINADA) Endpoint mestre para os KPIs do Cenário 1.
    O Donut usa a lógica correta (5 níveis) e o Top 10 filtra rios duplicados.
    """
    logger.info("Calculando KPIs e Gráficos para o Dashboard GRC (Rios)...")
    
    if map_rivers_data is None:
        raise HTTPException(status_code=500, detail="Dados GRC (rios) não inicializados no servidor.")

    df_rios = map_rivers_data
    
    # --- 1. Calcular KPIs ---
    kpi_risco_medio = df_rios['Nota_de_Risco'].mean()
    kpi_rios_criticos_count = df_rios[df_rios['Classificacao_Risco'] == 'Crítico'].shape[0]
    kpi_municipios_mapeados = len(municipal_river_risk_map)
    kpi_total_rios = len(df_rios)

    # --- 2. Calcular Gráfico Donut (pela Nota Numérica) ---
    df_rios['Classificacao_Risco_Nova'] = df_rios['Nota_de_Risco'].apply(get_risk_classification_from_note)
    df_rios_com_dados = df_rios[df_rios['Classificacao_Risco_Nova'] != 'Sem Dados']
    
    donut_pct = df_rios_com_dados['Classificacao_Risco_Nova'].value_counts(normalize=True).mul(100)
    donut_count = df_rios_com_dados['Classificacao_Risco_Nova'].value_counts()
    
    donut_data_final = []
    for nivel, pct in donut_pct.items():
        count = donut_count.get(nivel, 0)
        donut_data_final.append({ "name": nivel, "value": float(pct), "count": int(count) })

    # --- 3. Calcular Gráfico Top 10 Rios (LIMPO E SEM REPETIÇÃO) ---
    coluna_nome_rio = 'NORIOCOMP' if 'NORIOCOMP' in df_rios.columns else 'Nome do Rio'
    coluna_municipio = 'NM_MUN_PADRONIZADO'

    if coluna_nome_rio not in df_rios.columns or coluna_municipio not in df_rios.columns:
        top_rios_data = []
    else:
        # Filtra rios "sem nome"
        df_rios_com_nome = df_rios[
            (df_rios[coluna_nome_rio].notna()) & 
            (df_rios[coluna_nome_rio].str.lower() != 'sem nome') &
            (df_rios[coluna_nome_rio].str.lower() != 'rio desconhecido')
        ]
        
        # MUDANÇA: Ordena por Risco, remove os nomes duplicados (mantendo só o de maior risco)
        df_rios_unicos = df_rios_com_nome.sort_values(by='Nota_de_Risco', ascending=False)
        df_rios_unicos = df_rios_unicos.drop_duplicates(subset=[coluna_nome_rio], keep='first')
        
        # Pega os 10 maiores
        top_rios_df = df_rios_unicos.head(10)
        
        top_rios_data = top_rios_df.apply(
            lambda row: {
                "nome": f"{row.get(coluna_nome_rio)} ({row.get(coluna_municipio, 'N/A')})",
                "nota": row.get('Nota_de_Risco', 0)
            },
            axis=1
        ).tolist()

    return {
        "kpis": {
            "riscoNacionalMedio": kpi_risco_medio,
            "riosEmRiscoCritico": kpi_rios_criticos_count,
            "municipiosMapeadosGRC": kpi_municipios_mapeados,
            "totalDeRios": kpi_total_rios
        },
        "graficos": {
            "riscoPorNivel": donut_data_final,
            "topRiosPorRisco": top_rios_data
        }
    }

@app.get("/macro/grc/map")
def get_grc_map_data():
  
    if gdf_municipios_pintado is None:
        raise HTTPException(status_code=500, detail="Mapa GRC (municípios) não inicializado no servidor.")
    
    logger.info("Enviando GeoJSON de Risco de Rios (por Município) para o frontend.")
    return json.loads(gdf_municipios_pintado.to_json())


# --- Endpoints de Ativos (Micro Análise - 100% Inalterados e Funcionais) ---

@app.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)): 
    asset_id = str(uuid.uuid4())
    elevation = fetch_elevation_data(asset.latitude, asset.longitude)
    municipality_name = get_municipality_from_coords(asset.latitude, asset.longitude)
    fator_risco_rio = 1.0 
    if municipality_name:
        fator_risco_rio = municipal_river_risk_map.get(municipality_name, 1.0)
        logger.info(f"Ativo em '{municipality_name}'. Fator de Risco de Rio aplicado: {fator_risco_rio}")
    else:
        logger.warning(f"Não foi possível encontrar o município para o ativo '{asset.name}'. Fator de risco de rio usará o padrão 1.0.")
    new_asset_model = models.Asset( asset_uuid=asset_id, name=asset.name, latitude=asset.latitude, longitude=asset.longitude, elevation_m=elevation, river_risk_factor=fator_risco_rio )
    db.add(new_asset_model)
    db.commit()
    db.refresh(new_asset_model)
    logger.info(f"Ativo criado: {new_asset_model.name} com Fator de Rio: {fator_risco_rio}")
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
    dados_climaticos_hoje = {"volume_chuva_mm": previsao_hoje.get('rain', 0), "prob_chuva_%": previsao_um_dia.get('pop', 0) * 100, "rajadas_kmh": previsao_um_dia.get('wind_gust', 0) * 3.6, "pressao_hpa": previsao_um_dia.get('pressure', 1013), "umidade_%": previsao_um_dia.get('humidity', 50)}
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

# --- ENDPOINTS ANTIGOS (MANTIDOS PARA NÃO QUEBRAR NADA) ---
@app.get("/map_data/rivers")
async def get_map_rivers_data():
    if map_rivers_data is None: raise HTTPException(status_code=503, detail="Dados de rios não carregados.")
    return map_rivers_data.to_dict(orient='records')

@app.get("/map_data/states_geojson")
async def get_map_states_geojson():
    if map_states_geojson_data is None: raise HTTPException(status_code=503, detail="GeoJSON de estados não carregado.")
    return json.loads(map_states_geojson_data.to_json())

# Em src/backend/main.py

# --- NOVO ENDPOINT DE EXPLORAÇÃO GRC ---
@app.get("/macro/rivers/search")
def search_rivers(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    classificacao: Optional[str] = None
):
    """
    Endpoint de Análise Exploratória. Permite filtrar os rios por Estado,
    Município ou Classificação.
    """
    logger.info(f"Busca exploratória iniciada. Filtros: {estado}, {municipio}, {classificacao}")

    if map_rivers_data is None:
        raise HTTPException(status_code=500, detail="Dados de rios não carregados.")

    df_filtered = map_rivers_data.copy()
    
    # 1. Filtro por Estado
    if estado:
        # A coluna é 'Sigla do Estado' no seu CSV
        df_filtered = df_filtered[df_filtered['Sigla do Estado'].str.upper() == estado.upper()]
        
    # 2. Filtro por Município
    if municipio:
        # A coluna é 'NM_MUN_PADRONIZADO'
        df_filtered = df_filtered[df_filtered['NM_MUN_PADRONIZADO'].str.upper() == municipio.upper()]

    # 3. Filtro por Classificação
    if classificacao:
        # A coluna é 'Classificacao_Risco'
        df_filtered = df_filtered[df_filtered['Classificacao_Risco'].str.upper() == classificacao.upper()]

    # Colunas essenciais que o frontend espera (incluindo as GRC)
    colunas_essenciais = [
        'Sigla do Estado', 'Nome do Rio', 'NM_MUN_PADRONIZADO', 'Classificacao_Risco', 
        'Nota_de_Risco', 'Impacto', 'Frequencia', 'Vulnerabilidade'
    ]
    
    # Seleciona as colunas, ordenando pelo risco
    df_result = df_filtered.sort_values(by='Nota_de_Risco', ascending=False)
    
    # Limita o resultado (Máximo 100 resultados por busca)
    df_result = df_result.head(100) 
    
    # Preenche NaN com texto para evitar quebras no frontend
    for col in ['Impacto', 'Frequencia', 'Vulnerabilidade']:
        if col in df_result.columns:
            df_result[col] = df_result[col].fillna('N/A')

    # Retorna o resultado como JSON
    return json.loads(df_result[colunas_essenciais].to_json(orient='records'))

# --- Bloco para rodar a aplicação ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)