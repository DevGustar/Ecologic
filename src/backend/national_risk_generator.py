# --- national_risk_generator.py ---
# Ferramenta para gerar um "Censo Nacional de Risco Climático" para TODOS os municípios do Brasil.
# ATENÇÃO: A execução deste script é muito demorada (mais de 1 hora).

import pandas as pd
import requests
import time

# Importamos a nossa ferramenta de cálculo de risco
from risk_calculator import calculate_daily_risk

# URL da nossa lista de municípios
URL_MUNICIPIOS = "https://raw.githubusercontent.com/kelvins/Municipios-Brasileiros/main/csv/municipios.csv"

def buscar_clima_openmeteo(lat: float, lon: float):
    """
    Função especialista em buscar dados da API Open-Meteo.
    """
    url_base = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "precipitation_sum,windgusts_10m_max",
        "timezone": "auto"
    }
    try:
        # Adicionamos 'verify=False' para contornar problemas de certificado SSL em redes restritivas.
        response = requests.get(url_base, params=params, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  -> Erro ao conectar com Open-Meteo: {e}")
        return None

def generate_full_national_risk_report():
    """
    Função principal que orquestra a criação do nosso dataset completo.
    """
    print("--- Iniciando a geração do Relatório Nacional de Risco (TODOS OS MUNICÍPIOS) ---")
    
    # 1. Carregar a lista COMPLETA de todos os municípios
    print(f"Baixando a lista de municípios de: {URL_MUNICIPIOS}")
    try:
        municipios_df = pd.read_csv(URL_MUNICIPIOS)
        print(f"Sucesso! {len(municipios_df)} municípios encontrados.")
    except Exception as e:
        print(f"!!! ERRO: Não foi possível baixar a lista de municípios. Causa: {e}")
        return

    # 2. Preparar para coletar os resultados
    resultados_finais = []

    # 3. "Caminhar" por cada município, buscar dados e calcular o risco
    print("\nIniciando a coleta de dados e cálculo de risco para todos os 5.570 municípios.")
    print("Este processo será muito demorado. Por favor, aguarde...")
    total_municipios = len(municipios_df)
    for index, municipio in municipios_df.iterrows():
        lat = municipio['latitude']
        lon = municipio['longitude']
        nome_municipio = municipio['nome']
        uf_municipio = municipio['codigo_uf']
        
        # Mostra o progresso no terminal
        print(f"Processando {index + 1}/{total_municipios}: {nome_municipio} ({uf_municipio})...")

        # Chama o nosso especialista em API
        dados_climaticos = buscar_clima_openmeteo(lat, lon)
        
        if not dados_climaticos or 'daily' not in dados_climaticos or not dados_climaticos['daily'].get('precipitation_sum'):
            print(f"  -> Falha ou dados incompletos para {nome_municipio}. Pulando.")
            time.sleep(1) # Pausa mesmo em caso de erro
            continue

        # Preparamos os dados para o cálculo, agora de forma mais segura
        previsao_amanha = {
            "volume_chuva_mm": dados_climaticos['daily']['precipitation_sum'][1] if dados_climaticos['daily']['precipitation_sum'] else 0,
            "prob_chuva_%": 0,
            "rajadas_kmh": dados_climaticos['daily']['windgusts_10m_max'][1] if dados_climaticos['daily']['windgusts_10m_max'] else 0
        }
        
        # Como não temos dados de elevação para cada município, passamos um dicionário vazio.
        # A nossa função `calculate_daily_risk` usará o valor padrão (500m).
        dados_estruturais_mock = {}
        
        # Chamamos o nosso "cérebro" para calcular o risco
        nota_de_risco = calculate_daily_risk(previsao_amanha, dados_estruturais_mock)

        resultados_finais.append({
            "municipio": nome_municipio,
            "uf": uf_municipio,
            "latitude": lat,
            "longitude": lon,
            "nota_de_risco": nota_de_risco,
        })

        time.sleep(0.5) # Pausa pequena para sermos gentis com a API

    # 4. Salvar o resultado final em um CSV
    nome_arquivo_final = "risk_report_todos_municipios.csv"
    resultados_df = pd.DataFrame(resultados_finais)
    resultados_df.to_csv(nome_arquivo_final, index=False, sep=';', encoding='utf-8-sig')
    
    print(f"\n--- Relatório Completo Concluído! ---")
    print(f"✅ -> Arquivo '{nome_arquivo_final}' foi gerado com os dados de {len(resultados_df)} municípios.")

# --- Coração do Script ---
if __name__ == "__main__":
    generate_full_national_risk_report()
