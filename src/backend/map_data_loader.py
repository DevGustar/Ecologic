# Ecologic/src/backend/map_data_loader.py (VERSÃO FINAL E CORRIGIDA)

import os
import pandas as pd
import geopandas as gpd

# Define o caminho base do projeto (subindo de src/backend para Ecologic/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', '..', 'data')

def load_all_map_data():
    """
    Carrega os dados essenciais para os mapas:
    - Dados de rios (CSV)
    - GeoJSON de estados (apenas a geometria, para o frontend desenhar o mapa)
    Retorna os DataFrames/GeoDataFrames carregados.
    """
    print(f"Buscando arquivos na pasta: {DATA_DIR}")

    # --- 1. Carregar dados de rios (CSV) ---
    rivers_csv_path = os.path.join(DATA_DIR, 'dados_risco_rios.csv')
    rivers_df = None
    try:
        # Tenta ler com UTF-8, se falhar, tenta latin1 (para acentos)
        rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='utf-8')
        print(f"✅ CSV de rios carregado com sucesso (UTF-8): {rivers_csv_path}")
    except UnicodeDecodeError:
        try:
            rivers_df = pd.read_csv(rivers_csv_path, sep=';', encoding='latin1')
            print(f"✅ CSV de rios carregado com sucesso (latin1): {rivers_csv_path}")
        except Exception as e:
            print(f"❌ ERRO ao carregar CSV de rios com UTF-8 ou latin1 em {rivers_csv_path}: {e}")
            print("Por favor, verifique a codificação do seu arquivo CSV.")
            
    if rivers_df is not None:
        # Garante que 'length_m' seja numérico
        rivers_df['length_m'] = pd.to_numeric(rivers_df['length_m'], errors='coerce').fillna(0)

    # --- 2. Carregar GeoJSON de estados ---
    states_geojson_path = os.path.join(DATA_DIR, 'estados_brasil.json')
    states_gdf = None
    try:
        states_gdf = gpd.read_file(states_geojson_path, encoding='utf-8')
        print(f"✅ GeoJSON de estados carregado com sucesso: {states_geojson_path}")
    except Exception as e:
        print(f"❌ ERRO ao carregar GeoJSON de estados em {states_geojson_path}: {e}")
        print("Certifique-se de que 'estados_brasil.json' está na pasta 'Ecologic/data/'.")

    # Retorna APENAS o DataFrame de rios e o GeoDataFrame de estados.
    # O GeoJSON de municípios não será mais carregado ou retornado por este módulo.
    return rivers_df, states_gdf

if __name__ == '__main__':
    print("--- Testando o carregamento de dados com map_data_loader.py ---")
    
    # Agora só espera 2 retornos
    rivers, states = load_all_map_data()

    if rivers is not None:
        print(f"\nRivers DataFrame (primeiras 5 linhas):\n{rivers.head()}")
        print(f"\nColunas dos rios: {rivers.columns.tolist()}")
    else:
        print("\nRivers DataFrame não carregado.")

    if states is not None:
        print(f"\nStates GeoDataFrame (primeiras 5 linhas):\n{states.head()}")
        print(f"\nColunas dos estados: {states.columns.tolist()}")
    else:
        print("\nStates GeoDataFrame não carregado.")
    
    # Confirmamos que municípios não são carregados por este módulo
    print("\nMunicipalities GeoDataFrame NÃO é carregado por este módulo (conforme o plano final).")