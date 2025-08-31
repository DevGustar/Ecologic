import requests # para fazer requisições
import pandas as pd # importa a biblioteca pandas com alias pd
from datetime import datetime # importa a classe datetime do módulo datetime
import json # importa a biblioteca json
import sys # ponte de comunicação entre o script Python e o terminal

BACKEND_URL = "http://127.0.0.1:8000" # URL do servidor backend feito em fastAPI

def fetch_climate_data_from_backend(asset_id: str): #* aqui parametro que sera passado por mim no terminal
    """
    Esta função faz uma requisição para a NOSSA PRÓPRIA API,
    no endpoint que busca o clima de um ativo específico.
    """
    url = f"{BACKEND_URL}/assets/{asset_id}/climate" 
    print(f"Fazendo requisição para nosso backend no endereço {url}")

    try:
        response = requests.get(url) # armazena na variavel o get os dados de clima do ID
        response.raise_for_status() # verifica se o status e se houve erro
        return response.json() # retorna a resposta em formato JSON
    except requests.exceptions.RequestException as e: # se o protocolo de erro for esse - caminho errado
        print(f"!!! ERRO: Não foi possível conectar ao nosso backend em {BACKEND_URL}.")
        print(f"!!! Verifique se o servidor 'uvicorn main:app --reload' está rodando.")
        print(f"!!! Detalhe do erro: {e}")
        return None

def process_and_save_data(data, asset_id: str):
    """
    Esta função pega o JSON completo da outra função e processa
    gerando arquivos derivados (csv, txt, json)
    """
    print("Processando os dados recebidos...")

    #? --- A. CLIMA ATUAL ---
    current_data = data["current"] # armazena a pasta "current" em um variável
    current_weather_summary = f"""
--- RESUMO DO CLIMA ATUAL ({datetime.fromtimestamp(current_data['dt']).strftime('%H:%M')}) ---
Condição: {current_data["weather"][0]["description"].capitalize()}
Temperatura: {current_data["temp"]}°C (Sensação: {current_data["feels_like"]}°C)
Chuva (última hora): {current_data.get("rain", {}).get("1h", 0)} mm
Umidade: {current_data["humidity"]}%
Vento: {current_data["wind_speed"] * 3.6:.2f} km/h
Rajadas de Vento: {current_data.get("wind_gust", 0) * 3.6:.2f} km/h
Pressão Atmosférica: {current_data["pressure"]} hPa
Cobertura de Nuvens: {current_data["clouds"]}%
    """
    with open(f"analise_atual_{asset_id}.txt", "w", encoding='utf-8') as f: # abre o arquivo em modo escrita
        f.write(current_weather_summary) # escreve o resumo no arquivo
    print(f"✅ -> Arquivo 'analise_atual_{asset_id}.txt' gerado.")

    #? --- B. PREVISÃO DIÁRIA ---
    # 1. Extração dos Dados Brutos
    daily_df = pd.DataFrame(data["daily"])
    daily_filtered_data = []
    for index, row in daily_df.iterrows():
        daily_filtered_data.append({
            "dia": datetime.fromtimestamp(row['dt']).strftime('%d/%m (%a)'),
            "temp_min_c": row['temp']['min'],
            "temp_max_c": row['temp']['max'],
            "condicao": row['weather'][0]['description'],
            "prob_chuva_%": row['pop'] * 100,
            "volume_chuva_mm": row.get('rain'), # Extraímos o dado como ele vem (pode ser None)
            "vento_kmh": row.get('wind_speed', 0) * 3.6,
            "rajadas_kmh": row.get('wind_gust', 0) * 3.6,
            "pressao_hpa": row.get('pressure', 0),
            "nuvens_%": row.get('clouds', 0)
        })
    
    # 2. Criação do DataFrame Inicial (ainda pode ter vazios)
    final_daily_df = pd.DataFrame(daily_filtered_data)

    # --- 3. LIMPEZA E TRATAMENTO DOS DADOS 
    # É aqui que usamos o poder do Pandas para resolver o problema de uma vez só.
    # É a forma do Pandas de dizer: "Em todas as células vazias (NaN) desta coluna, preencha com o valor 0".
    final_daily_df['volume_chuva_mm'] = final_daily_df['volume_chuva_mm'].fillna(0)
    
    # Arredondamos as colunas para ficar mais limpo
    for col in ['vento_kmh', 'rajadas_kmh']:
        final_daily_df[col] = final_daily_df[col].round(2)
        
    # 4. Salvando o DataFrame Limpo e Tratado
    final_daily_df.to_csv(f"analise_diaria_{asset_id}.csv", index=False, sep=';', encoding='utf-8-sig')
    print(f"✅ -> Arquivo 'analise_diaria_{asset_id}.csv' gerado (com dados limpos).")


#? --- CORAÇÃO DO SCRIPT ---
if __name__ == "__main__":
    if len(sys.argv) < 2: 
        print("!!! ERRO: Uso incorreto.")
        print("!!! Como usar: py data_explorer.py <ID_DO_ATIVO>")
        sys.exit(1)

    target_asset_id = sys.argv[1] 
    climate_data = fetch_climate_data_from_backend(target_asset_id) 

    if climate_data and "error" not in climate_data: 
        process_and_save_data(climate_data, target_asset_id) 
        print("\n--- Análise concluída! ---")