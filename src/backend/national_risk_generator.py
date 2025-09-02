# --- national_risk_generator.py ---
# Ferramenta para gerar um "Censo Nacional de Risco Climático" usando a API Open-Meteo.
# VERSÃO CORRIGIDA PARA REDES RESTRITIVAS (FACULDADE/CORPORATIVO)

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
        # --- A CORREÇÃO ESTÁ AQUI ---
        # Adicionamos 'verify=False' para contornar problemas de certificado SSL em redes restritivas.
        response = requests.get(url_base, params=params, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  -> Erro ao conectar com Open-Meteo: {e}")
        return None

# O resto do código (a função generate_full_national_risk_report e o if __name__ == "__main__")
# permanece exatamente igual. Cole esta função corrigida no lugar da antiga.

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
        print(f"!!! ERRO: Não foi possível baixar la lista de municípios. Causa: {e}")
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
        
        print(f"Processando {index + 1}/{total_municipios}: {nome_municipio} ({uf_municipio})...")

        dados_climaticos = buscar_clima_openmeteo(lat, lon)
        
        if not dados_climaticos or 'daily' not in dados_climaticos:
            print(f"  -> Falha ao obter dados para {nome_municipio}. Pulando.")
            time.sleep(1)
            continue

        previsao_amanha = {
            "volume_chuva_mm": dados_climaticos['daily']['precipitation_sum'][1],
            "prob_chuva_%": 0,
            "rajadas_kmh": dados_climaticos['daily']['windgusts_10m_max'][1]
        }
        
        nota_de_risco = calculate_daily_risk(previsao_amanha)

        resultados_finais.append({
            "municipio": nome_municipio,
            "uf": uf_municipio,
            "latitude": lat,
            "longitude": lon,
            "nota_de_risco": nota_de_risco,
        })

        time.sleep(0.5)

    # 4. Salvar o resultado final em um CSV
    nome_arquivo_final = "risk_report_todos_municipios.csv"
    resultados_df = pd.DataFrame(resultados_finais)
    resultados_df.to_csv(nome_arquivo_final, index=False, sep=';', encoding='utf-8-sig')
    
    print(f"\n--- Relatório Completo Concluído! ---")
    print(f"✅ -> Arquivo '{nome_arquivo_final}' foi gerado com os dados de {len(resultados_df)} municípios.")

# --- Coração do Script ---
if __name__ == "__main__":
    generate_full_national_risk_report()