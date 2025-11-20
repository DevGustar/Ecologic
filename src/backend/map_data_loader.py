# Ecologic/src/backend/map_data_loader.py (VERSÃO ROBUSTA E COMPLETA)

import os
import pandas as pd
import geopandas as gpd
import logging

logger = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', '..', 'data') 

# --- FUNÇÕES AUXILIARES ---

def preprocess_rivers_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Limpa e padroniza o DataFrame de rios."""
    if df.empty: return df
    
    if 'Classificacao_Risco' in df.columns:
        df['Classificacao_Risco'] = df['Classificacao_Risco'].astype(str).str.strip().str.capitalize()
        df['Classificacao_Risco'] = df['Classificacao_Risco'].replace({
            'Critico': 'Crítico', 'Cr\x92tico': 'Crítico', 'Nan': 'Sem Dados', 'None': 'Sem Dados', '': 'Sem Dados'
        }, regex=False)
        df['Classificacao_Risco'] = df['Classificacao_Risco'].fillna('Sem Dados')
    
    if 'Nota_de_Risco' in df.columns:
        df['Nota_de_Risco'] = df['Nota_de_Risco'].astype(str).str.replace(',', '.', regex=False)
        df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce').fillna(0)
    else:
        df['Nota_de_Risco'] = 0 
    
    coluna_municipio = 'NM_MUN' if 'NM_MUN' in df.columns else 'Nome do Municipio'
    if coluna_municipio in df.columns:
        df['NM_MUN_PADRONIZADO'] = df[coluna_municipio].astype(str).str.strip().str.upper()
    else:
        df['NM_MUN_PADRONIZADO'] = 'SEM MUNICÍPIO'
    return df

def _calculate_vulnerability_factor(risk_score: float) -> float:
    if risk_score >= 8: return 1.5
    if risk_score >= 6: return 1.3
    if risk_score >= 4: return 1.15
    return 1.0

def generate_municipal_risk_data(rivers_df: pd.DataFrame, gdf_municipios: gpd.GeoDataFrame):
    """Gera o mapa pintado para RIOS (Cenário 1)."""
    if 'NM_MUN_PADRONIZADO' not in rivers_df.columns: return {}, gdf_municipios

    municipal_risk = rivers_df.groupby('NM_MUN_PADRONIZADO')['Nota_de_Risco'].max()
    municipal_vulnerability_map = municipal_risk.apply(_calculate_vulnerability_factor).to_dict()
    municipal_note_map = municipal_risk.to_dict()

    gdf_painted = gdf_municipios.copy()
    gdf_painted['risco_rio_nota'] = gdf_painted['NM_MUN_PADRONIZADO'].map(municipal_note_map).fillna(0)
    
    return municipal_vulnerability_map, gdf_painted

def generate_climate_map_data(climate_df: pd.DataFrame, gdf_municipios: gpd.GeoDataFrame):
    """Gera o mapa pintado para CLIMA (Cenário 2)."""
    if climate_df is None or 'NM_MUN_PADRONIZADO' not in climate_df.columns:
        return None

    # Tenta identificar a coluna de nota de risco
    col_nota = 'nota_de_risco' 
    if col_nota not in climate_df.columns:
        if 'risk_score' in climate_df.columns: col_nota = 'risk_score'
        else: return None

    climate_note_map = climate_df.set_index('NM_MUN_PADRONIZADO')[col_nota].to_dict()

    gdf_painted = gdf_municipios.copy()
    gdf_painted['risco_clima_nota'] = gdf_painted['NM_MUN_PADRONIZADO'].map(climate_note_map).fillna(0)
    
    return gdf_painted

# --- FUNÇÃO PRINCIPAL ---
def load_all_map_data():
    logger.info(f"Buscando arquivos na pasta: {DATA_DIR}")

    rivers_df = None
    climate_df = None
    gdf_municipios = None
    states_gdf = None
    
    municipal_risk_map = {}
    gdf_rivers_painted = None
    gdf_climate_painted = None

    # 1. Carregar RIOS
    try:
        rivers_df = pd.read_csv(os.path.join(DATA_DIR, 'dados_risco_rios.csv'), sep=';', encoding='latin1')
        rivers_df = preprocess_rivers_dataframe(rivers_df)
        logger.info(f"✅ RIOS carregados: {len(rivers_df)} registros.")
    except Exception: logger.error("❌ Falha ao carregar dados_risco_rios.csv")

    # 2. Carregar CLIMA (Cenário 2)
    climate_path = os.path.join(DATA_DIR, 'risk_report_municipios.csv')
    try:
        # Tenta ler com vírgula
        climate_df = pd.read_csv(climate_path, sep=',', encoding='utf-8')
        # Se falhar ou tiver 1 coluna, tenta ponto e vírgula
        if len(climate_df.columns) <= 1:
             climate_df = pd.read_csv(climate_path, sep=';', encoding='utf-8')
        
        # Padroniza coluna de município
        col_mun = 'municipio' if 'municipio' in climate_df.columns else 'city'
        if col_mun in climate_df.columns:
            climate_df['NM_MUN_PADRONIZADO'] = climate_df[col_mun].astype(str).str.strip().str.upper()
            logger.info(f"✅ CLIMA carregado: {len(climate_df)} registros.")
        else:
            logger.error("❌ CSV de clima sem coluna 'municipio'.")
            climate_df = None
    except Exception as e: 
        logger.warning(f"⚠️ CSV de Clima não carregado (Erro 503 esperado se faltar): {e}")

    # 3. Carregar MAPA
    try:
        gdf_municipios = gpd.read_file(os.path.join(DATA_DIR, 'municipios_brasil.json'), encoding='utf-8')
        col_geo = 'name' if 'name' in gdf_municipios.columns else 'NM_MUN'
        if col_geo in gdf_municipios.columns:
            gdf_municipios['NM_MUN_PADRONIZADO'] = gdf_municipios[col_geo].str.upper()
            logger.info("✅ GeoJSON Municípios carregado.")
        else: gdf_municipios = None
    except Exception: logger.error("❌ Falha ao carregar municipios_brasil.json")

    # 4. Carregar ESTADOS
    try:
        states_gdf = gpd.read_file(os.path.join(DATA_DIR, 'estados_brasil.json'), encoding='utf-8')
    except Exception: pass

    # FUSÕES
    if gdf_municipios is not None:
        if rivers_df is not None:
            _, gdf_rivers_painted = generate_municipal_risk_data(rivers_df, gdf_municipios)
            # Recria o dicionário de risco de rio aqui para garantir consistência
            municipal_risk_map = _ 
        
        if climate_df is not None:
            gdf_climate_painted = generate_climate_map_data(climate_df, gdf_municipios)

    return rivers_df, climate_df, gdf_rivers_painted, gdf_climate_painted, municipal_risk_map, states_gdf