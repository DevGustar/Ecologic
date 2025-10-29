# --- risk_calculator.py --- (VERSÃO ATUALIZADA COM EXPLICAÇÃO)

def calculate_daily_risk(climate_data: dict, structural_data: dict) -> dict: # MUDANÇA: Agora retorna um dicionário
    """
    Calcula uma nota de risco diária (v2.1) e retorna a explicação detalhada.
    """
    # --- 1. Coleta dos Dados Brutos ---
    rain_volume = climate_data.get("volume_chuva_mm", 0)
    rain_prob = climate_data.get("prob_chuva_%", 0)
    wind_gust_kmh = climate_data.get("rajadas_kmh", 0)
    pressure_hpa = climate_data.get("pressao_hpa", 1013)
    humidity = climate_data.get("umidade_%", 50)
    elevation = structural_data.get("elevation_m", 500)

    # NOVO: Lista para armazenar os fatores da explicação
    fatores = []

    # --- 2. Cálculo do Risco Base (Hazard Score) ---
    peso_chuva = 0.5
    peso_prob = 0.05
    peso_vento = 0.08
    
    base_hazard_score = (rain_volume * peso_chuva) + (rain_prob * peso_prob) + (wind_gust_kmh * peso_vento)
    
    # NOVO: Adiciona os fatores base à explicação
    fatores.append({"nome": "Volume de Chuva", "valor_raw": f"{rain_volume:.2f} mm", "score_atribuido": rain_volume, "peso_no_calculo": peso_chuva})
    fatores.append({"nome": "Prob. de Chuva", "valor_raw": f"{rain_prob:.0f}%", "score_atribuido": rain_prob, "peso_no_calculo": peso_prob})
    fatores.append({"nome": "Rajadas de Vento", "valor_raw": f"{wind_gust_kmh:.1f} km/h", "score_atribuido": wind_gust_kmh, "peso_no_calculo": peso_vento})

    # --- 3. Aplicação dos Multiplicadores de Perigo ---
    if pressure_hpa < 1005: pressure_factor = 1.2
    elif pressure_hpa < 1012: pressure_factor = 1.1
    else: pressure_factor = 1.0
    
    if humidity > 85: humidity_factor = 1.1
    else: humidity_factor = 1.0

    hazard_score = base_hazard_score * pressure_factor * humidity_factor
    
    # NOVO: Adiciona os multiplicadores à explicação (representados com peso 0, pois são multiplicativos)
    fatores.append({"nome": "Fator Pressão Atmosf.", "valor_raw": f"{pressure_hpa:.0f} hPa (x{pressure_factor})", "score_atribuido": pressure_factor, "peso_no_calculo": 0})
    fatores.append({"nome": "Fator Umidade", "valor_raw": f"{humidity:.0f}% (x{humidity_factor})", "score_atribuido": humidity_factor, "peso_no_calculo": 0})
    
    # --- 4. Aplicação do Fator de Vulnerabilidade ---
    if elevation < 50: vulnerability_factor = 1.5
    elif elevation < 400: vulnerability_factor = 1.2
    elif elevation < 800: vulnerability_factor = 1.0
    else: vulnerability_factor = 0.8
        
    risk_score_bruto = hazard_score * vulnerability_factor

    # NOVO: Adiciona a vulnerabilidade à explicação
    fatores.append({"nome": "Fator Vulnerab. (Elevação)", "valor_raw": f"{elevation:.0f} m (x{vulnerability_factor})", "score_atribuido": vulnerability_factor, "peso_no_calculo": 0})
    
    # --- 5. Normalização Final ---
    final_score = min(max(risk_score_bruto, 0), 10)
    
    # --- MUDANÇA FINAL: Retorna o dicionário completo ---
    return {
        "score_final": round(final_score, 2),
        "fatores_contribuintes": fatores
    }

# --- 2. O Bloco de Teste (Agora a testar o endpoint de INTELIGÊNCIA) ---
if __name__ == "__main__":
    import requests
    import sys
    from rich.console import Console
    from rich.table import Table
    from datetime import datetime

    console = Console()

    if len(sys.argv) < 2: 
        console.print("!!! ERRO: Uso incorreto.", style="bold red")
        console.print("!!! Como usar: py risk_calculator.py <ID_DO_ATIVO_PARA_TESTE>", style="yellow")
        sys.exit(1)
    
    target_asset_id = sys.argv[1]
    
    BACKEND_URL = "http://127.0.0.1:8000"
    # A GRANDE MUDANÇA: Agora o nosso teste chama o endpoint final e mais inteligente
    url_analysis = f"{BACKEND_URL}/assets/{target_asset_id}/risk_analysis"
    
    try:
        console.print(f"--- Testando o endpoint de Análise de Risco para o ativo: [bold cyan]{target_asset_id}[/bold cyan] ---")
        console.print(f"URL da requisição: {url_analysis}")
        
        response = requests.get(url_analysis, verify=False)
        response.raise_for_status()
        analysis_data = response.json()
        
        console.print("\n✅ [green]Análise de Risco recebida com sucesso do backend![/green]")
        
        # Extraímos os dados da resposta
        asset_info = analysis_data.get("asset_info", {})
        daily_forecast = analysis_data.get("daily_forecast_with_risk", [])
        
        # Mostramos os dados do ativo que estamos a analisar
        asset_name = asset_info.get('name', 'N/A')
        asset_elevation = asset_info.get('elevation_m', 'N/A')
        console.print(f"\n[bold on grey23] ℹ️ Ativo Analisado: '{asset_name}' | Elevação: {asset_elevation:.2f}m [/bold on grey23]")

        # Criamos uma tabela para mostrar os resultados
        tabela_risco = Table(title=f"Previsão de Risco para os Próximos Dias")
        tabela_risco.add_column("Dia", justify="center", style="cyan", no_wrap=True)
        tabela_risco.add_column("Nota de Risco", justify="center")
        tabela_risco.add_column("Condição", justify="left", style="white")
        tabela_risco.add_column("Chuva (mm)", justify="right", style="bold blue")
        
        for previsao_de_um_dia in daily_forecast:
            nota_de_risco = previsao_de_um_dia.get('nota_de_risco', 0)
            cor_risco = "green"
            if nota_de_risco > 6.5: cor_risco = "bold red"
            elif nota_de_risco > 4.0: cor_risco = "yellow"

            tabela_risco.add_row(
                datetime.fromtimestamp(previsao_de_um_dia['dt']).strftime('%d/%m (%a)'),
                f"[{cor_risco}]{nota_de_risco:.2f}[/{cor_risco}]",
                previsao_de_um_dia['weather'][0]['description'],
                f"{previsao_de_um_dia.get('rain', 0):.2f}"
            )
        
        # Imprime a tabela final no terminal
        console.print(tabela_risco)

    except Exception as e:
        console.print(f"Ocorreu um erro durante o teste: {e}", style="bold red")