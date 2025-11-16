# Ecologic/src/backend/map_data_loader.py (VERSÃO FINAL QUE CARREGA TUDO)

import os
import pandas as pd
import geopandas as gpd
import logging

logger = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', '..', 'data') 

def preprocess_rivers_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Limpa e padroniza o DataFrame de rios.
    """
    if df.empty:
        return df
    if 'Classificacao_Risco' in df.columns:
        df['Classificacao_Risco'] = df['Classificacao_Risco'].astype(str).str.strip().str.capitalize()
        df['Classificacao_Risco'] = df['Classificacao_Risco'].replace({
            'Critico': 'Crítico', 'Cr\x92tico': 'Crítico', 'Nan': 'Sem Dados',
            'None': 'Sem Dados', '': 'Sem Dados'
        }, regex=False)
        df['Classificacao_Risco'] = df['Classificacao_Risco'].fillna('Sem Dados')
    else:
        logger.warning("Coluna 'Classificacao_Risco' não encontrada.")
    if 'Nota_de_Risco' in df.columns:
        df['Nota_de_Risco'] = df['Nota_de_Risco'].astype(str).str.replace(',', '.', regex=False)
        df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce').fillna(0)
    else:
        logger.warning("Coluna 'Nota_de_Risco' não encontrada.")
        df['Nota_de_Risco'] = 0 
    
    coluna_municipio = None
    if 'NM_MUN' in df.columns:
        coluna_municipio = 'NM_MUN'
    elif 'Nome do Municipio' in df.columns:
        coluna_municipio = 'Nome do Municipio'
        
    if coluna_municipio:
        # Padroniza a coluna do CSV de rios para a fusão
        df['NM_MUN_PADRONIZADO'] = df[coluna_municipio].astype(str).str.strip().str.upper()
    else:
        logger.error("ERRO CRÍTICO DE FUSÃO: Nenhuma coluna de nome de município (ex: 'NM_MUN' ou 'Nome do Municipio') foi encontrada no CSV de rios.")
        df['NM_MUN_PADRONIZADO'] = 'Sem Município'
    return df

def _calculate_vulnerability_factor(risk_score: float) -> float:
    """
    Converte uma Nota de Risco (0-10) em um multiplicador de vulnerabilidade.
    """
    if risk_score >= 8: return 1.5
    if risk_score >= 6: return 1.3
    if risk_score >= 4: return 1.15
    return 1.0

def generate_municipal_risk_data(rivers_df: pd.DataFrame, gdf_municipios: gpd.GeoDataFrame) -> (dict, gpd.GeoDataFrame):
    """
    Cria o "dicionário de risco" E o "mapa pintado".
    """
    logger.info("Iniciando a geração do mapa de risco de rios por município...")
    
    # Garante que as colunas necessárias existam
    if 'NM_MUN_PADRONIZADO' not in rivers_df.columns or 'Nota_de_Risco' not in rivers_df.columns:
        logger.error("Não foi possível gerar o mapa de risco municipal. Colunas essenciais estão faltando no rivers_df.")
        return {}, gdf_municipios

    municipal_risk = rivers_df.groupby('NM_MUN_PADRONIZADO')['Nota_de_Risco'].max()
    
    # 1. Dicionário de FATOR (para o batismo do ativo)
    municipal_vulnerability_map = municipal_risk.apply(_calculate_vulnerability_factor).to_dict()
    
    # 2. Dicionário de NOTA (para pintar o mapa)
    municipal_note_map = municipal_risk.to_dict()

    # 3. "Pinta" o GeoJSON
    # Garante que a coluna exista no GeoJSON
    if 'NM_MUN_PADRONIZADO' in gdf_municipios.columns:
        gdf_municipios['risco_rio_nota'] = gdf_municipios['NM_MUN_PADRONIZADO'].map(municipal_note_map).fillna(0)
    else:
        logger.error("ERRO: Coluna 'NM_MUN_PADRONIZADO' não encontrada no GeoJSON de municípios. Mapa não será pintado.")
        gdf_municipios['risco_rio_nota'] = 0 # Cria a coluna com valor padrão
    
    logger.info(f"✅ Mapa de risco de rios por município gerado. {len(municipal_vulnerability_map)} municípios mapeados.")
    return municipal_vulnerability_map, gdf_municipios

def load_all_map_data():
    """
    Carrega TODOS os dados para a "Visão Mestra":
    1. dados_risco_rios.csv (para KPIs)
    2. municipios_brasil.json (o mapa base novo)
    3. estados_brasil.json (o mapa base antigo)
    
    Retorna as 4 peças que o main.py espera:
    (map_rivers_data, gdf_municipios_pintado, municipal_risk_map, states_gdf)
    """
    logger.info(f"Buscando arquivos na pasta: {DATA_DIR}")

    # Define as variáveis no início para evitar UnboundLocalError
    rivers_df = None
    gdf_municipios = None
    states_gdf = None
    municipal_vulnerability_map = {} # Garante que seja um dicionário vazio
    gdf_municipios_pintado = None

    # --- 1. Carregar dados de rios (CSV) ---
    rivers_csv_path = os.path.join(DATA_DIR, 'dados_risco_rios.csv')
    try:
        rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='latin1')
        logger.info(f"✅ CSV de rios carregado (latin1): {rivers_csv_path}")
        rivers_df = preprocess_rivers_dataframe(rivers_df) # Limpa e padroniza
    except Exception as e:
        logger.error(f"❌ ERRO CRÍTICO ao carregar CSV de rios em {rivers_csv_path}: {e}")
            
    # --- 2. Carregar GeoJSON de MUNICÍPIOS (O Novo Mapa) ---
    municipios_geojson_path = os.path.join(DATA_DIR, 'municipios_brasil.json')
    try:
        gdf_municipios = gpd.read_file(municipios_geojson_path, encoding='utf-8')
        coluna_geo_mun = 'name' if 'name' in gdf_municipios.columns else 'NM_MUN'
        
        if coluna_geo_mun in gdf_municipios.columns:
            gdf_municipios['NM_MUN_PADRONIZADO'] = gdf_municipios[coluna_geo_mun].str.upper()
            logger.info(f"✅ GeoJSON de municípios carregado: {municipios_geojson_path}")
        else:
            logger.error(f"❌ ERRO: Coluna 'name' ou 'NM_MUN' não encontrada no GeoJSON de municípios.")
            gdf_municipios = None
            
    except Exception as e:
        logger.error(f"❌ ERRO CRÍTICO ao carregar GeoJSON de municípios em {municipios_geojson_path}: {e}")
        logger.error("!!! VERIFIQUE SE O ARQUIVO 'municipios_brasil.json' ESTÁ NA SUA PASTA 'data/' !!!")
        gdf_municipios = None # Garante que está Nulo se falhar

    # --- 3. Carregar GeoJSON de ESTADOS (O Mapa Antigo, para não quebrar o endpoint antigo) ---
    states_geojson_path = os.path.join(DATA_DIR, 'estados_brasil.json')
    try:
        states_gdf = gpd.read_file(states_geojson_path, encoding='utf-8')
        logger.info(f"✅ GeoJSON de estados (antigo) carregado: {states_geojson_path}")
    except Exception as e:
        logger.error(f"❌ ERRO ao carregar GeoJSON de estados em {states_geojson_path}: {e}")
        states_gdf = None # Garante que está Nulo se falhar

    # --- 4. A Fusão (só tenta se os arquivos principais carregaram) ---
    if rivers_df is not None and gdf_municipios is not None:
        municipal_vulnerability_map, gdf_municipios_pintado = generate_municipal_risk_data(rivers_df, gdf_municipios)
    else:
        logger.error("Impossível gerar dados da fusão. Arquivos de rios ou municípios falharam ao carregar.")
        gdf_municipios_pintado = gdf_municipios 

    # Retorna as 4 peças que o main.py espera
    return rivers_df, gdf_municipios_pintado, municipal_vulnerability_map, states_gdf