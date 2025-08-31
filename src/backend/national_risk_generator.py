# --- national_risk_generator.py ---
# Ferramenta para gerar um "Censo de Risco Climático" para as principais cidades do Brasil.

import pandas as pd
import requests
import time

# Importamos a nossa ferramenta de cálculo de risco
from risk_calculator import calculate_daily_risk

# URL da nossa lista completa de municípios
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
        response = requests.get(url_base, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  -> Erro ao conectar com Open-Meteo: {e}")
        return None

def generate_national_risk_report():
    """
    Função principal que orquestra a criação do nosso dataset.
    """
    print("--- Iniciando a geração do Relatório de Risco para Cidades Selecionadas ---")
    
    # 1. Carregar a lista COMPLETA de todos os municípios
    print(f"Baixando a lista completa de municípios de: {URL_MUNICIPIOS}")
    try:
        todos_municipios_df = pd.read_csv(URL_MUNICIPIOS)
        print(f"Sucesso! {len(todos_municipios_df)} municípios encontrados.")
    except Exception as e:
        print(f"!!! ERRO: Não foi possível baixar a lista de municípios. Causa: {e}")
        return

    # --- A GRANDE MUDANÇA ESTÁ AQUI: A NOSSA LISTA QUALIFICADA ---
    # Criamos uma lista com as capitais e outros municípios importantes.
    cidades_selecionadas = [
        # Capitais
        'Rio Branco', 'Maceió', 'Macapá', 'Manaus', 'Salvador', 'Fortaleza', 'Brasília', 
        'Vitória', 'Goiânia', 'São Luís', 'Cuiabá', 'Campo Grande', 'Belo Horizonte', 
        'Belém', 'João Pessoa', 'Curitiba', 'Recife', 'Teresina', 'Rio de Janeiro', 'Natal', 
        'Porto Alegre', 'Porto Velho', 'Boa Vista', 'Florianópolis', 'São Paulo', 'Aracaju', 'Palmas',
        # Outros municípios relevantes
        'Campinas', 'Guarulhos', 'Joinville', 'Uberlândia', 'Santos'
    ]
    
    # Usamos o Pandas para filtrar a tabela completa e pegar apenas as cidades da nossa lista.
    municipios_df = todos_municipios_df[todos_municipios_df['nome'].isin(cidades_selecionadas)]
    print(f"\n--- Processando uma lista selecionada de {len(municipios_df)} municípios importantes. ---\n")
    
    # 2. Preparar para coletar os resultados
    resultados_finais = []

    # 3. "Caminhar" por cada município, buscar dados e calcular o risco
    print("Iniciando a coleta de dados e cálculo de risco...")
    for index, municipio in municipios_df.iterrows():
        lat = municipio['latitude']
        lon = municipio['longitude']
        nome_municipio = municipio['nome']
        uf_municipio = municipio['codigo_uf']
        
        print(f"Processando {index + 1}/{len(municipios_df)}: {nome_municipio} ({uf_municipio})...")

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
    nome_arquivo_final = "risk_report_capitais.csv" # Novo nome para o arquivo
    resultados_df = pd.DataFrame(resultados_finais)
    resultados_df.to_csv(nome_arquivo_final, index=False, sep=';', encoding='utf-8-sig')
    
    print(f"\n--- Relatório Concluído! ---")
    print(f"✅ -> Arquivo '{nome_arquivo_final}' foi gerado com os dados de {len(resultados_df)} municípios.")
    print("Agora você pode usar este arquivo no seu ambiente Jupyter para praticar com o Folium.")

# --- Coração do Script ---
if __name__ == "__main__":
    generate_national_risk_report()