# Ecologic/src/backend/data_loader.py

import pandas as pd
import geopandas as gpd
import os

# Caminho base para a pasta de dados.
# '__file__' é o caminho para este script (data_loader.py)
# 'os.path.dirname(__file__)' => Ecologic/src/backend/
# '..' => Ecologic/src/
# '..' => Ecologic/
# 'data' => Ecologic/data/
DATA_PATH_BASE = os.path.join(os.path.dirname(__file__), '..', '..', 'data')

def load_and_preprocess_rivers_data():
    """
    Carrega o CSV de dados de risco de rios, renomeia colunas para padronização.
    Retorna um DataFrame pandas.
    """
    csv_path = os.path.join(DATA_PATH_BASE, "dados_risco_rios.csv")
    try:
        df_rivers = pd.read_csv(csv_path)
        print(f"[DataLoader] Carregados {len(df_rivers)} registos do '{os.path.basename(csv_path)}'.")
        
        # === AJUSTE CRÍTICO AQUI PARA OS NOMES REAIS DAS COLUNAS DO SEU CSV ===
        # Com base nas suas colunas: NORIOCOMP, Frequencia, Impacto, Vulnerabil, NM_MUN, SIGLA_UF, Length_m
        df_rivers = df_rivers.rename(columns={
            'NORIOCOMP': 'Nome do rio',
            'Frequencia': 'Frequencia',
            'Impacto': 'Impacto',
            'Vulnerabil': 'Vulnerabilidade',  # Ajustado
            'NM_MUN': 'Nome do municipio',
            'SIGLA_UF': 'Sigla do estado',
            'Length_m': 'length_m' # Mantive 'length_m' em minúsculas como no log, se for para ter maiúscula, ajustar aqui.
        })
        print(f"[DataLoader] Colunas do CSV padronizadas: {df_rivers.columns.tolist()}")
        return df_rivers
    except FileNotFoundError:
        print(f"ERRO: Ficheiro CSV '{os.path.basename(csv_path)}' não encontrado em {csv_path}. Verifique o caminho: {csv_path}")
        return pd.DataFrame()
    except Exception as e:
        print(f"ERRO ao carregar/pré-processar CSV: {os.path.basename(csv_path)} - {e}")
        return pd.DataFrame()

def load_and_preprocess_municipal_geojson():
    """
    Carrega o GeoJSON dos municípios, renomeia a coluna 'name' para 'Nome do municipio'.
    Retorna um GeoDataFrame geopandas.
    """
    geojson_path = os.path.join(DATA_PATH_BASE, "municipios_brasil.json")
    if not os.path.exists(geojson_path):
        print(f"ERRO: Ficheiro GeoJSON '{os.path.basename(geojson_path)}' não encontrado em {geojson_path}. Verifique o caminho: {geojson_path}")
        return None
    try:
        gdf_mun = gpd.read_file(geojson_path)
        print(f"[DataLoader] Carregadas {len(gdf_mun)} geometrias de municípios do '{os.path.basename(geojson_path)}'.")
        
        # === AJUSTE CRÍTICO AQUI PARA O NOME REAL DA COLUNA DE MUNICÍPIO NO SEU GEOJSON ===
        # Você identificou que a coluna com o nome do município é 'name'
        if 'name' in gdf_mun.columns:
            gdf_mun = gdf_mun.rename(columns={'name': 'Nome do municipio'})
            print(f"[DataLoader] Coluna 'name' renomeada para 'Nome do municipio' no GeoJSON de municípios.")
        else:
            print(f"AVISO: Coluna 'name' não encontrada em '{os.path.basename(geojson_path)}'. Colunas disponíveis: {gdf_mun.columns.tolist()}. Verifique o GeoJSON.")
        
        print(f"[DataLoader] Colunas do GeoJSON de municípios: {gdf_mun.columns.tolist()}")
        return gdf_mun
    except Exception as e:
        print(f"ERRO ao carregar/pré-processar GeoJSON de municípios: {os.path.basename(geojson_path)} - {e}")
        return None

def load_and_preprocess_state_geojson():
    """
    Carrega o GeoJSON dos estados, renomeia colunas para 'Nome do estado' e 'Sigla do estado'.
    Retorna um GeoDataFrame geopandas.
    """
    geojson_path = os.path.join(DATA_PATH_BASE, "estados_brasil.json")
    if not os.path.exists(geojson_path):
        print(f"ERRO: Ficheiro GeoJSON '{os.path.basename(geojson_path)}' não encontrado em {geojson_path}. Verifique o caminho: {geojson_path}")
        return None
    try:
        gdf_states = gpd.read_file(geojson_path)
        print(f"[DataLoader] Carregadas {len(gdf_states)} geometrias de estados do '{os.path.basename(geojson_path)}'.")
        
        # === AJUSTE CORRIGIDO PARA OS NOMES REAIS DAS COLUNAS DE ESTADO NO SEU GEOJSON ===
        # Com base no seu log, as colunas são 'SIGLA' (para a sigla) e 'Estado' (para o nome do estado).
        if 'SIGLA' in gdf_states.columns and 'Estado' in gdf_states.columns:
            gdf_states = gdf_states.rename(columns={'SIGLA': 'Sigla do estado', 'Estado': 'Nome do estado'})
            print(f"[DataLoader] Colunas 'SIGLA' e 'Estado' renomeadas para 'Sigla do estado' e 'Nome do estado' no GeoJSON de estados.")
        # Este bloco 'elif' permanece como fallback caso outro GeoJSON seja usado no futuro
        elif 'name' in gdf_states.columns and 'uf' in gdf_states.columns:
            gdf_states = gdf_states.rename(columns={'name': 'Nome do estado', 'uf': 'Sigla do estado'})
            print(f"[DataLoader] Colunas 'name' e 'uf' renomeadas para 'Nome do estado' e 'Sigla do estado' no GeoJSON de estados.")
        else:
            # Mensagem de aviso atualizada para refletir as colunas esperadas
            print(f"AVISO: Colunas esperadas para estado ('SIGLA' e 'Estado' ou 'name' e 'uf') não encontradas/padronizadas em '{os.path.basename(geojson_path)}'. Colunas disponíveis: {gdf_states.columns.tolist()}. Verifique o GeoJSON.")

        print(f"[DataLoader] Colunas do GeoJSON de estados: {gdf_states.columns.tolist()}")
        return gdf_states
    except Exception as e:
        print(f"ERRO ao carregar/pré-processar GeoJSON de estados: {os.path.basename(geojson_path)} - {e}")
        return None

# --- Bloco de teste de verificação ---
if __name__ == "__main__":
    print("\n--- Testando data_loader.py ---")
    
    # Testando carga de dados de rios
    print("\n--- Carregando dados de rios ---")
    df_rios = load_and_preprocess_rivers_data()
    if not df_rios.empty:
        print("\nSucesso ao carregar e preprocessar dados de rios. Primeiras 5 linhas:")
        print(df_rios.head().to_string()) # Usar .to_string() para imprimir no terminal
    else:
        print("\nFalha ao carregar dados de rios.")

    # Testando carga de geometrias de municípios
    print("\n--- Carregando geometrias de municípios ---")
    gdf_muns = load_and_preprocess_municipal_geojson()
    if gdf_muns is not None and not gdf_muns.empty:
        print("\nSucesso ao carregar e preprocessar geometrias de municípios. Primeiras 5 linhas:")
        print(gdf_muns.head().to_string())
    else:
        print("\nFalha ao carregar geometrias de municípios.")

    # Testando carga de geometrias de estados
    print("\n--- Carregando geometrias de estados ---")
    gdf_sts = load_and_preprocess_state_geojson()
    if gdf_sts is not None and not gdf_sts.empty:
        print("\nSucesso ao carregar e preprocessar geometrias de estados. Primeiras 5 linhas:")
        # Imprime as colunas relevantes para o teste, incluindo as renomeadas
        cols_to_print = ['Nome do estado', 'Sigla do estado', 'geometry']
        # Filtra para apenas as colunas que realmente existem no gdf_sts
        existing_cols = [col for col in cols_to_print if col in gdf_sts.columns]
        print(gdf_sts[existing_cols].head().to_string())
    else:
        print("\nFalha ao carregar geometrias de estados.")

    print("\n--- Teste de data_loader.py concluído ---")