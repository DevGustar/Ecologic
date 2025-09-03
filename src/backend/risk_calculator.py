# --- risk_calculator.py ---
# O "Cérebro" da EcoLogic 2.0 (v2.0 - com noção de vulnerabilidade)

# --- 1. A Ferramenta Principal (O "Chef" que só sabe a receita) ---
# A "porta de entrada" da função agora aceita DOIS pacotes de dados
def calculate_daily_risk(climate_data: dict, structural_data: dict) -> float:
    """
    Função que recebe parametro quando for chamado
        : dict ---> quer dizer que a função espera receber um tipo dicionario python
        se não for esse ele retorna um erro
        -> float ---> é a dica para o valor que vai ser retonado
    """
    
    # --- ETAPA 1: Calcular o "Score de Perigo Meteorológico" ---
    
    # Recebe os dados do dicionario que foram passados e começa a guarda em variaveis
    #? Extraindo os dados por "get" e não [] para caso o valor não exista
    #? ele retorne o número 0, evitando que o codigo quebre
    rain_volume = climate_data.get("volume_chuva_mm", 0)
    rain_prob = climate_data.get("prob_chuva_%", 0)
    wind_gust_kmh = climate_data.get("rajadas_kmh", 0)

    #! Define os pesos para cada variável de PERIGO
    peso_chuva = 0.5
    peso_prob = 0.05
    peso_vento = 0.08

    #! Aplica os cálculos para o perigo do clima
    hazard_score = (rain_volume * peso_chuva) + (rain_prob * peso_prob) + (wind_gust_kmh * peso_vento)

    # --- ETAPA 2: Calcular o "Fator de Vulnerabilidade do Terreno" ---
    #? Pegamos o dado de elevação que veio no novo parâmetro 'structural_data'
    elevation = structural_data.get("elevation_m", 500) # 500m como uma média segura se o dado falhar

    #? Lógica simples para a v1.0: quanto mais baixo, maior a vulnerabilidade.
    if elevation < 50:
        vulnerability_factor = 1.5  # Risco 50% maior em áreas muito baixas
    elif elevation < 400:
        vulnerability_factor = 1.2  # Risco 20% maior
    elif elevation < 800:
        vulnerability_factor = 1.0  # Risco normal (base)
    else:
        vulnerability_factor = 0.8  # Risco 20% menor em áreas altas
    
    # --- ETAPA 3: Calcular a Nota de Risco Final ---
    risk_score_bruto = hazard_score * vulnerability_factor
    
    # Garante que os valores fiquem entre 0 e 10
    final_score = min(max(risk_score_bruto, 0), 10)
    
    return round(final_score, 2) # retorna o valor final com 2 casas decimais

# Este código só roda quando executamos "py risk_calculator.py" 
if __name__ == "__main__":
    import requests
    from datetime import datetime
    import sys

    # len(sys.argv) retorna uma lista do que foi digitado no terminal
    if len(sys.argv) < 2: 
        print("!!! ERRO: Uso incorreto.")
        print("!!! Como usar: py risk_calculator.py <ID_DO_ATIVO_PARA_TESTE>")
        sys.exit(1) # para tudo e fecha o programa
    
    target_asset_id = sys.argv[1] # Pega o segundo argumento da lista que é o ID do ativo 
    
    print(f"--- MODO DE TESTE DO CALCULADOR DE RISCO PARA O ATIVO: {target_asset_id} ---")
    
    BACKEND_URL = "http://127.0.0.1:8000"
    # O "Gerente de Testes" agora precisa de dois endereços: um para os dados do ativo e outro para o clima
    url_asset = f"{BACKEND_URL}/assets/{target_asset_id}"
    url_clima = f"{BACKEND_URL}/assets/{target_asset_id}/climate"
    
    try:
        # Primeiro, o "Gerente" busca os dados estruturais do ativo para saber a elevação
        print(f"Buscando dados estruturais do ativo em: {url_asset}")
        asset_response = requests.get(url_asset, verify=False)
        asset_response.raise_for_status()
        asset_data = asset_response.json()

        # Depois, ele busca os dados do clima
        print(f"Buscando dados de clima em: {url_clima}")
        climate_response = requests.get(url_clima, verify=False)
        climate_response.raise_for_status()
        climate_data = climate_response.json()
        print("Dados recebidos com sucesso!\n")
        
        lista_previsao_diaria = climate_data.get('daily', [])
        
        # Preparamos o pacote de dados ESTRUTURAIS (que é o mesmo para todos os dias)
        dados_estruturais_ativo = {
            "elevation_m": asset_data.get("elevation_m", 500)
        }

        print("--- CÁLCULO DE RISCO (COM VULNERABILIDADE) PARA OS PRÓXIMOS DIAS ---")
        for previsao_de_um_dia in lista_previsao_diaria:
            # Preparamos o pacote de dados CLIMÁTICOS para aquele dia
            dados_climaticos_dia = {
                "volume_chuva_mm": previsao_de_um_dia.get('rain', 0),
                "prob_chuva_%": previsao_de_um_dia.get('pop', 0) * 100,
                "rajadas_kmh": previsao_de_um_dia.get('wind_gust', 0) * 3.6
            }
            if dados_climaticos_dia["volume_chuva_mm"] is None:
                dados_climaticos_dia["volume_chuva_mm"] = 0
            
            # O momento chave: agora chamamos a função com os DOIS pacotes
            nota_de_risco = calculate_daily_risk(
                climate_data=dados_climaticos_dia, 
                structural_data=dados_estruturais_ativo
            )
            
            dia_formatado = datetime.fromtimestamp(previsao_de_um_dia['dt']).strftime('%d/%m (%a)')
            print(f"Dia: {dia_formatado} -> Nota de Risco: {nota_de_risco}")

    except Exception as e:
        print(f"Ocorreu um erro durante o teste: {e}")