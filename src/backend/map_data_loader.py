# Ecologic/src/backend/map_data_loader.py (ATUALIZADO PARA A FUSÃO MESTRA)

import os
import pandas as pd
import geopandas as gpd
import logging

# Configuração de logging
logger = logging.getLogger(__name__)

# Define o caminho base do projeto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Assume que a pasta 'data' está na raiz do projeto 'Ecologic/'
DATA_DIR = os.path.join(BASE_DIR, '..', '..', 'data') 

def preprocess_rivers_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Realiza o pré-processamento e padronização das colunas do DataFrame de rios.
    """
    if df.empty:
        return df

    # Limpar espaços em branco e padronizar 'Classificacao_Risco'
    if 'Classificacao_Risco' in df.columns:
        logger.info(f"Classificações de risco únicas ANTES da padronização: {df['Classificacao_Risco'].dropna().unique().tolist()}")
        df['Classificacao_Risco'] = df['Classificacao_Risco'].astype(str).str.strip().str.capitalize()
        # Tratamentos específicos para dados "sujos"
        df['Classificacao_Risco'] = df['Classificacao_Risco'].replace({
            'Critico': 'Crítico',
            'Cr\x92tico': 'Crítico',
            'Nan': 'Sem Dados',
            'None': 'Sem Dados',
            '': 'Sem Dados'
        }, regex=False)
        df['Classificacao_Risco'] = df['Classificacao_Risco'].fillna('Sem Dados')
        logger.info(f"Classificações de risco únicas DEPOIS da padronização: {df['Classificacao_Risco'].dropna().unique().tolist()}")
    else:
        logger.warning("Coluna 'Classificacao_Risco' não encontrada.")

    # Limpar espaços em branco em 'Sigla do Estado'
    if 'Sigla do Estado' in df.columns:
        df['Sigla do Estado'] = df['Sigla do Estado'].astype(str).str.strip().fillna('Sem Sigla')
    else:
        logger.warning("Coluna 'Sigla do Estado' não encontrada.")
        
    # NOVO: Padroniza o nome do município (essencial para a fusão)
    # Assumindo que o nome da coluna é 'NM_MUN' (comum em dados da ANA) ou 'Nome do Municipio'
    # Por favor, verifique o nome exato no seu CSV
    coluna_municipio = None
    if 'NM_MUN' in df.columns:
        coluna_municipio = 'NM_MUN'
    elif 'Nome do Municipio' in df.columns:
        coluna_municipio = 'Nome do Municipio'
        
    if coluna_municipio:
        df[coluna_municipio] = df[coluna_municipio].astype(str).str.strip().str.upper() # Padroniza para MAIÚSCULAS
        df[coluna_municipio] = df[coluna_municipio].fillna('Sem Município')
        logger.info("Coluna de município padronizada.")
    else:
        logger.error("ERRO CRÍTICO DE FUSÃO: Nenhuma coluna de nome de município (ex: 'NM_MUN') foi encontrada no CSV de rios.")

    # Converter 'Nota_de_Risco' para numérico
    if 'Nota_de_Risco' in df.columns:
        df['Nota_de_Risco'] = df['Nota_de_Risco'].astype(str).str.replace(',', '.', regex=False)
        df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce').fillna(0)
    else:
        logger.warning("Coluna 'Nota_de_Risco' não encontrada.")

    if 'length_m' in df.columns:
        df['length_m'] = pd.to_numeric(df['length_m'], errors='coerce').fillna(0)
    
    return df

# --- NOVAS FUNÇÕES PARA A FUSÃO MESTRA ---

def _calculate_vulnerability_factor(risk_score: float) -> float:
    """
    Converte uma Nota de Risco (0-10) em um multiplicador de vulnerabilidade.
    Esta é a "receita" de conversão do Ecologic 1.0 para o 2.0.
    """
    if risk_score >= 8: return 1.5  # Risco Crítico = Multiplicador de 1.5x
    if risk_score >= 6: return 1.3  # Risco Alto = Multiplicador de 1.3x
    if risk_score >= 4: return 1.15 # Risco Médio = Multiplicador de 1.15x
    return 1.0 # Risco Baixo ou Mínimo = Multiplicador neutro

def generate_municipal_risk_map(rivers_df: pd.DataFrame) -> dict:
    """
    Cria o "dicionário de risco por município" a partir dos dados dos rios.
    Este é o coração da fusão Ecologic 1.0 -> 2.0.
    """
    logger.info("Iniciando a geração do mapa de risco de rios por município...")
    
    # Confirma qual coluna de município usar
    coluna_municipio = None
    if 'NM_MUN' in rivers_df.columns:
        coluna_municipio = 'NM_MUN'
    elif 'Nome do Municipio' in rivers_df.columns:
        coluna_municipio = 'Nome do Municipio'

    if not coluna_municipio or 'Nota_de_Risco' not in rivers_df.columns:
        logger.error("Não foi possível gerar o mapa de risco municipal. Colunas essenciais (município ou nota) estão faltando.")
        return {}

    # 1. Agrupa todos os rios pelo município
    # 2. Para cada município, pega a Nota de Risco MÁXIMA entre todos os seus rios
    #    (Se um município tem 10 rios "Baixo" e 1 "Crítico", o risco do município é "Crítico")
    municipal_risk = rivers_df.groupby(coluna_municipio)['Nota_de_Risco'].max()
    
    # 3. Converte a nota de risco (0-10) no nosso multiplicador (1.0-1.5)
    municipal_vulnerability_factor = municipal_risk.apply(_calculate_vulnerability_factor)
    
    # 4. Transforma em um dicionário para consulta rápida
    risk_map_dict = municipal_vulnerability_factor.to_dict()
    
    logger.info(f"✅ Mapa de risco de rios por município gerado. {len(risk_map_dict)} municípios mapeados.")
    return risk_map_dict

# --- FUNÇÃO PRINCIPAL (ATUALIZADA) ---

def load_all_map_data():
    """
    Carrega e pré-processa os dados essenciais:
    - Dados de rios (CSV)
    - GeoJSON de estados
    - GERA O DICIONÁRIO DE RISCO POR MUNICÍPIO
    
    Retorna (df_rivers, gdf_states, municipal_risk_map)
    """
    logger.info(f"Buscando arquivos na pasta: {DATA_DIR}")

    rivers_df = None
    states_gdf = None
    municipal_risk_map = {} # Dicionário vazio por padrão

    # --- 1. Carregar dados de rios (CSV) ---
    rivers_csv_path = os.path.join(DATA_DIR, 'dados_risco_rios.csv')
    try:
        rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='utf-8')
        logger.info(f"✅ CSV de rios carregado com sucesso (UTF-8): {rivers_csv_path}")
    except UnicodeDecodeError:
        try:
            rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='latin1')
            logger.info(f"✅ CSV de rios carregado com sucesso (latin1): {rivers_csv_path}")
        except Exception as e:
            logger.error(f"❌ ERRO ao carregar CSV de rios em {rivers_csv_path}: {e}")
            
    if rivers_df is not None:
        rivers_df = preprocess_rivers_dataframe(rivers_df)
        # GERA O DICIONÁRIO DE RISCO
        municipal_risk_map = generate_municipal_risk_map(rivers_df)
    else:
        logger.error("Rivers DataFrame não carregado. Pulando pré-processamento e geração do mapa de risco.")

    # --- 2. Carregar GeoJSON de estados ---
    states_geojson_path = os.path.join(DATA_DIR, 'estados_brasil.json')
    try:
        states_gdf = gpd.read_file(states_geojson_path, encoding='utf-8')
        logger.info(f"✅ GeoJSON de estados carregado com sucesso: {states_geojson_path}")
    except Exception as e:
        logger.error(f"❌ ERRO ao carregar GeoJSON de estados em {states_geojson_path}: {e}")

    # MUDANÇA: Retorna o novo dicionário de risco
    return rivers_df, states_gdf, municipal_risk_map

if __name__ == '__main__':
    # Configura o logger para exibir mensagens durante o teste
    logging.basicConfig(level=logging.INFO)
    logger.info("--- Testando o carregamento de dados com map_data_loader.py ---")
    
    rivers, states = load_all_map_data()

    if rivers is not None:
        logger.info(f"\nRivers DataFrame (primeiras 5 linhas):\n{rivers.head()}")
        logger.info(f"\nColunas dos rios: {rivers.columns.tolist()}")
        logger.info(f"\nClassificações de Risco únicas nos dados de rios processados (após padronização):")
        logger.info(rivers['Classificacao_Risco'].unique().tolist())
        logger.info(f"Contagem de rios 'Crítico' no teste: {rivers[rivers['Classificacao_Risco'] == 'Crítico'].shape[0]}")
    else:
        logger.info("\nRivers DataFrame não carregado.")

    if states is not None:
        logger.info(f"\nStates GeoDataFrame (primeiras 5 linhas):\n{states.head()}")
        logger.info(f"\nColunas dos estados: {states.columns.tolist()}")
    else:
        logger.info("\nStates GeoDataFrame não carregado.")
    
    logger.info("\nMunicipalities GeoDataFrame NÃO é carregado por este módulo (conforme o plano final).")