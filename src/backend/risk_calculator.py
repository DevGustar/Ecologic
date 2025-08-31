def calculate_daily_risk(daily_forecast_data: dict) -> float:
    """
    Função que recebe parametro quando for chamado
        : dict ---> quer dizer que a função espera receber um tipo dicionario python
        se não for esse ele retorna um erro
        -> float ---> é a dica para o valor que vai ser retonado
    """
    # Recebe os dados do dicionario que foram passados e começa a guarda em variaveis
    #? Extraindo os dados por "get" e não [] para caso o valor não exista
    #? ele retorne o número 0, evitando que o codigo quebre
    rain_volume = daily_forecast_data.get("volume_chuva_mm", 0)
    rain_prob = daily_forecast_data.get("prob_chuva_%", 0)
    wind_gust_kmh = daily_forecast_data.get("rajadas_kmh", 0)

    #! Define os pesos para cada variável
    peso_chuva = 0.5
    peso_prob = 0.05
    peso_vento = 0.08

    #! Aplica os cálculos de risco
    risk_score_bruto = (rain_volume * peso_chuva) + (rain_prob * peso_prob) + (wind_gust_kmh * peso_vento)
    
    # Garante que os valores fiquem entre 0 e 10
    # max(risco, 0) --> pega o max entre 2 valores, garantindo que o risco não fique negativo
    # min(risco, 10) --> pega o min entre 2 valores, garantindo que o risco não passe de 10
    final_score = min(max(risk_score_bruto, 0), 10)
    
    return round(final_score, 2) # retorna o valor final com 2 casas decimais

# Este código só roda quando executamos "py risk_calculator.py" 
if __name__ == "__main__":
    import requests
    from datetime import datetime
    import sys

    # len(sys.argv) retorna uma lista do que foi digitado no terminal
    #? se o usuario digitou menos de 2 argumentos ele printa erro
    #? (sys.argv) = {'risk_calculator.py', '<ID_DO_ATIVO_PARA_TESTE>'} => 2 itens
    if len(sys.argv) < 2: 
        print("!!! ERRO: Uso incorreto.")
        print("!!! Como usar: py risk_calculator.py <ID_DO_ATIVO_PARA_TESTE>")
        sys.exit(1) # para tudo e fecha o programa
    
    target_asset_id = sys.argv[1] # Pega o segundo argumento da lista que é o ID do ativo 
    
    print(f"--- MODO DE TESTE DO CALCULADOR DE RISCO PARA O ATIVO: {target_asset_id} ---")
    
    # Para testar, este script busca os dados diretamente do nosso backend
    BACKEND_URL = "http://127.0.0.1:8000"
    url = f"{BACKEND_URL}/assets/{target_asset_id}/climate"
    
    try:
        print(f"Buscando dados brutos do nosso backend em: {url}")
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        print("Dados recebidos com sucesso!\n")
        
        # Agora, vamos pegar a lista de previsão diária
        lista_previsao_diaria = data.get('daily', [])
        
        # Passa por cada dia da lista de previsão e faz os comandos
        print("--- CÁLCULO DE RISCO PARA OS PRÓXIMOS DIAS ---")
        for previsao_de_um_dia in lista_previsao_diaria:
            # Preparamos os dados
            dados_para_calculo = {
                "dia": datetime.fromtimestamp(previsao_de_um_dia['dt']).strftime('%d/%m (%a)'),
                "volume_chuva_mm": previsao_de_um_dia.get('rain'), # Passamos o dado "cru"
                "prob_chuva_%": previsao_de_um_dia.get('pop', 0) * 100,
                "rajadas_kmh": previsao_de_um_dia.get('wind_gust', 0) * 3.6
            }
            # Tratamos o valor nulo de chuva aqui mesmo, antes de enviar para o cálculo
            if dados_para_calculo["volume_chuva_mm"] is None:
                dados_para_calculo["volume_chuva_mm"] = 0
            
            # O momento chave: chamamos nosso "Chef" para calcular a nota
            nota_de_risco = calculate_daily_risk(dados_para_calculo)
            
            # Imprimimos o resultado para ver se a lógica está correta
            print(f"Dia: {dados_para_calculo['dia']} -> Nota de Risco: {nota_de_risco}")

    except Exception as e:
        print(f"Ocorreu um erro durante o teste: {e}")