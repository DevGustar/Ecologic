# Ecologic/src/backend/map_data_loader.py (ATUALIZADO COM PADRONIZAÇÃO DE CLASSIFICAÇÃO)

import os
import pandas as pd
import geopandas as gpd
import logging

# Configuração de logging
logger = logging.getLogger(__name__)

# Define o caminho base do projeto (subindo de src/backend para Ecologic/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', '..', 'data') # <-- ESTÁ É A CORREÇÃO

# Por favor, verifique se este DATA_DIR está correto para a sua estrutura:
# Se o seu projeto é assim:
# Ecologic/
# ├── src/
# │   ├── backend/
# │   │   ├── main.py
# │   │   └── map_data_loader.py  <- ESTE ARQUIVO
# │   └── frontend/
# └── data/               <- SUA PASTA DE DADOS
#
# Então o DATA_DIR DEVE ser:
# DATA_DIR = os.path.join(BASE_DIR, '..', '..', 'data')

# Se a sua pasta 'data' está DENTRO de 'src/backend/data', o caminho é:
# DATA_DIR = os.path.join(BASE_DIR, 'data')

# Se a sua pasta 'data' está DENTRO de 'src/data', o caminho é:
# DATA_DIR = os.path.join(BASE_DIR, '..', 'data')

# *** POR FAVOR, CONFIRME O CAMINHO CORRETO PARA SUA PASTA 'data' ***

def preprocess_rivers_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Realiza o pré-processamento e padronização das colunas do DataFrame de rios.
    """
    if df.empty:
        return df

    # Limpar espaços em branco e padronizar 'Classificacao_Risco'
    if 'Classificacao_Risco' in df.columns:
        logger.info(f"Classificações de risco únicas ANTES da padronização: {df['Classificacao_Risco'].dropna().unique().tolist()}")

        df['Classificacao_Risco'] = df['Classificacao_Risco'].astype(str).str.strip()
        df['Classificacao_Risco'] = df['Classificacao_Risco'].replace({
            'Critico': 'Crítico',  # Padroniza sem acento para com acento
            'critico': 'Crítico',  # Ignora caixa
            'CRÍTICO': 'Crítico',  # Ignora caixa
            'Cr\x92tico': 'Crítico',
            'alto': 'Alto',
            'ALTO': 'Alto',
            'moderado': 'Moderado',
            'MODERADO': 'Moderado',
            'baixo': 'Baixo',
            'BAIXO': 'Baixo',
            'nan': 'Sem Dados', # Tratamento de NaN que virou string
            'None': 'Sem Dados', # Tratamento de None que virou string
            '': 'Sem Dados' # Tratamento de string vazia
        }, regex=False) # regex=False para evitar interpretação de padrões

        # Preencher NaNs remanescentes com 'Sem Dados'
        df['Classificacao_Risco'] = df['Classificacao_Risco'].fillna('Sem Dados')
        
        logger.info(f"Classificações de risco únicas DEPOIS da padronização: {df['Classificacao_Risco'].dropna().unique().tolist()}")
    else:
        logger.warning("Coluna 'Classificacao_Risco' não encontrada no DataFrame de rios.")


    # Limpar espaços em branco em 'Sigla do Estado'
    if 'Sigla do Estado' in df.columns:
        df['Sigla do Estado'] = df['Sigla do Estado'].astype(str).str.strip()
        df['Sigla do Estado'] = df['Sigla do Estado'].fillna('Sem Sigla')
    else:
        logger.warning("Coluna 'Sigla do Estado' não encontrada no DataFrame de rios.")


    # Converter 'Nota_de_Risco' para numérico, tratando vírgulas como decimais
    if 'Nota_de_Risco' in df.columns:
        df['Nota_de_Risco'] = df['Nota_de_Risco'].astype(str).str.replace(',', '.', regex=False)
        df['Nota_de_Risco'] = pd.to_numeric(df['Nota_de_Risco'], errors='coerce')
        df['Nota_de_Risco'] = df['Nota_de_Risco'].fillna(0) # Preenche NaN com 0 após conversão
    else:
        logger.warning("Coluna 'Nota_de_Risco' não encontrada no DataFrame de rios.")

    # Garante que 'length_m' seja numérico e preenche NaN com 0 (como já estava na sua base)
    if 'length_m' in df.columns:
        df['length_m'] = pd.to_numeric(df['length_m'], errors='coerce').fillna(0)
    else:
        logger.warning("Coluna 'length_m' não encontrada no DataFrame de rios.")

    return df

def load_all_map_data():
    """
    Carrega e pré-processa os dados essenciais para os mapas:
    - Dados de rios (CSV)
    - GeoJSON de estados (apenas a geometria)
    Retorna (df_rivers_processed, gdf_states_geojson) ou (None, None) em caso de erro.
    """
    logger.info(f"Buscando arquivos na pasta: {DATA_DIR}")

    rivers_df = None
    states_gdf = None

    # --- 1. Carregar dados de rios (CSV) ---
    rivers_csv_path = os.path.join(DATA_DIR, 'dados_risco_rios.csv')
    try:
        # Tenta ler com UTF-8, se falhar, tenta latin1 (para acentos)
        rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='utf-8')
        logger.info(f"✅ CSV de rios carregado com sucesso (UTF-8): {rivers_csv_path}")
    except UnicodeDecodeError:
        try:
            rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='latin1')
            logger.info(f"✅ CSV de rios carregado com sucesso (latin1): {rivers_csv_path}")
        except Exception as e:
            logger.error(f"❌ ERRO ao carregar CSV de rios com UTF-8 ou latin1 em {rivers_csv_path}: {e}")
            logger.error("Por favor, verifique a codificação do seu arquivo CSV.")
            
    if rivers_df is not None:
        # >>> APLICAR PRÉ-PROCESSAMENTO AQUI <<<
        rivers_df = preprocess_rivers_dataframe(rivers_df)
    else:
        logger.error("Rivers DataFrame não carregado. Pulando pré-processamento.")


    # --- 2. Carregar GeoJSON de estados ---
    states_geojson_path = os.path.join(DATA_DIR, 'estados_brasil.json')
    try:
        states_gdf = gpd.read_file(states_geojson_path, encoding='utf-8')
        logger.info(f"✅ GeoJSON de estados carregado com sucesso: {states_geojson_path}")
    except Exception as e:
        logger.error(f"❌ ERRO ao carregar GeoJSON de estados em {states_geojson_path}: {e}")
        logger.error("Certifique-se de que 'estados_brasil.json' está na pasta 'Ecologic/data/'.")

    return rivers_df, states_gdf

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