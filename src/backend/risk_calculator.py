# --- risk_calculator.py --- (VERSÃO FINAL DA "FUSÃO MESTRA")

# --- (Funções de classificação diária e horária permanecem as mesmas) ---
def classify_rain_severity(volume_mm):
    if volume_mm > 25: return "Crítico"
    if volume_mm > 10: return "Alto"
    if volume_mm > 1: return "Moderado"
    return "Baixo"

def classify_wind_severity(speed_kmh):
    if speed_kmh > 60: return "Crítico"
    if speed_kmh > 40: return "Alto"
    if speed_kmh > 20: return "Moderado"
    return "Baixo"

def classify_elevation_severity(elevation_m):
    if elevation_m < 50: return "Crítico"
    if elevation_m < 400: return "Alto"
    if elevation_m < 800: return "Moderado"
    return "Baixo"

def classify_prob_severity(prob_percent):
    if prob_percent > 95: return "Alto"
    if prob_percent > 70: return "Moderado"
    return "Baixo"

def classify_hourly_rain_severity(volume_mm):
    if volume_mm > 10: return "Crítico"
    if volume_mm > 5: return "Alto"
    if volume_mm > 0.5: return "Moderado"
    return "Baixo"

def classify_hourly_wind_severity(speed_kmh):
    return classify_wind_severity(speed_kmh)

# --- NOVA FUNÇÃO AUXILIAR PARA FATOR DE ELEVAÇÃO ---
def get_elevation_vulnerability_factor(elevation_m):
    """Calcula o multiplicador de vulnerabilidade com base na elevação."""
    if elevation_m < 50: return 1.5
    elif elevation_m < 400: return 1.2
    elif elevation_m < 800: return 1.0
    else: return 0.8

# --- FERRAMENTA DE CÁLCULO DIÁRIO (ATUALIZADA PARA FUSÃO) ---
def calculate_daily_risk(climate_data: dict, structural_data: dict) -> dict:
    """
    (VERSÃO FUSÃO MESTRA) Calcula o risco diário combinando Risco de Clima (2.0)
    com a Vulnerabilidade de Elevação E Risco de Rio (1.0).
    """
    # --- 1. Coleta de Dados de Perigo (Clima) ---
    rain_volume = climate_data.get("volume_chuva_mm", 0)
    rain_prob = climate_data.get("prob_chuva_%", 0)
    wind_gust_kmh = climate_data.get("rajadas_kmh", 0)
    pressure_hpa = climate_data.get("pressao_hpa", 1013)
    humidity = climate_data.get("umidade_%", 50)
    
    fatores = []
    
    # --- 2. Coleta de Dados de Vulnerabilidade (Estrutural) ---
    elevation = structural_data.get("elevation_m", 500)
    # NOVO FATOR: Pega o Risco de Rio que veio do DB (padrão 1.0 se não existir)
    river_risk_factor = structural_data.get("river_risk_factor", 1.0)

    # --- 3. Cálculo do Perigo Base (Hazard Score) ---
    peso_chuva = 0.30
    peso_prob = 0.005
    peso_vento = 0.07
    base_hazard_score = (rain_volume * peso_chuva) + (rain_prob * peso_prob) + (wind_gust_kmh * peso_vento)
    
    # Adiciona fatores de perigo à explicação
    fatores.append({"nome": "Volume de Chuva", "valor_raw": f"{rain_volume:.2f} mm", "score_atribuido": rain_volume, "peso_no_calculo": peso_chuva, "severidade": classify_rain_severity(rain_volume)})
    fatores.append({"nome": "Prob. de Chuva", "valor_raw": f"{rain_prob:.0f}%", "score_atribuido": rain_prob, "peso_no_calculo": peso_prob, "severidade": classify_prob_severity(rain_prob)})
    fatores.append({"nome": "Rajadas de Vento", "valor_raw": f"{wind_gust_kmh:.1f} km/h", "score_atribuido": wind_gust_kmh, "peso_no_calculo": peso_vento, "severidade": classify_wind_severity(wind_gust_kmh)})
    
    # --- 4. Cálculo dos Multiplicadores de Perigo ---
    if pressure_hpa < 1005: pressure_factor = 1.2
    elif pressure_hpa < 1012: pressure_factor = 1.1
    else: pressure_factor = 1.0
    if humidity > 85: humidity_factor = 1.1
    else: humidity_factor = 1.0
    hazard_score = base_hazard_score * pressure_factor * humidity_factor
    
    fatores.append({"nome": "Fator Pressão Atmosf.", "valor_raw": f"{pressure_hpa:.0f} hPa (x{pressure_factor})", "score_atribuido": pressure_factor, "peso_no_calculo": 0, "severidade": "Moderado" if pressure_factor > 1.0 else "Baixo"})
    fatores.append({"nome": "Fator Umidade", "valor_raw": f"{humidity:.0f}% (x{humidity_factor})", "score_atribuido": humidity_factor, "peso_no_calculo": 0, "severidade": "Moderado" if humidity_factor > 1.0 else "Baixo"})

    # --- 5. O CÁLCULO MESTRE (A FUSÃO) ---
    elevation_factor = get_elevation_vulnerability_factor(elevation)
    
    # Ponderamos a vulnerabilidade total: 70% Elevação, 30% Risco de Rio
    # (Podemos ajustar esses pesos depois)
    vulnerability_total_factor = (elevation_factor * 0.7) + (river_risk_factor * 0.3)
        
    risk_score_bruto = hazard_score * vulnerability_total_factor

    # Adiciona os fatores de vulnerabilidade à explicação
    fatores.append({"nome": "Fator Vulnerab. (Elevação)", "valor_raw": f"{elevation:.0f} m (x{elevation_factor:.1f})", "score_atribuido": elevation_factor, "peso_no_calculo": 0.7, "severidade": classify_elevation_severity(elevation)})
    fatores.append({"nome": "Fator Risco de Rio (Município)", "valor_raw": f"Risco Municipal (x{river_risk_factor:.1f})", "score_atribuido": river_risk_factor, "peso_no_calculo": 0.3, "severidade": "Crítico" if river_risk_factor > 1.3 else "Moderado"})
    
    final_score = min(max(risk_score_bruto, 0), 10)
    
    return { "score_final": round(final_score, 2), "fatores_contribuintes": fatores }


# --- CÁLCULO HORÁRIO (ATUALIZADO PARA FUSÃO) ---
def calculate_hourly_risk(hourly_climate_data: dict, structural_data: dict) -> dict:
    """
    (VERSÃO FUSÃO MESTRA) Calcula o risco horário combinando Risco de Clima (2.0)
    com a Vulnerabilidade de Elevação E Risco de Rio (1.0).
    """
    # --- 1. Coleta de Dados de Perigo (Clima) ---
    rain_1h = hourly_climate_data.get("rain", {}).get("1h", 0)
    wind_speed_kmh = hourly_climate_data.get("wind_speed", 0) * 3.6
    prob_precip = hourly_climate_data.get("pop", 0) * 100
    pressure_hpa = hourly_climate_data.get("pressure", 1013)
    humidity = hourly_climate_data.get("humidity", 50)
    
    fatores = []

    # --- 2. Coleta de Dados de Vulnerabilidade (Estrutural) ---
    elevation = structural_data.get("elevation_m", 500)
    # NOVO FATOR: Pega o Risco de Rio que veio do DB
    river_risk_factor = structural_data.get("river_risk_factor", 1.0)
    
    # --- 3. Cálculo do Perigo Base (Hazard Score) ---
    peso_chuva_hora = 1.2
    peso_vento_hora = 0.15
    peso_prob_hora = 0.05
    base_hazard_score = (rain_1h * peso_chuva_hora) + (wind_speed_kmh * peso_vento_hora) + (prob_precip * peso_prob_hora)
    
    fatores.append({"nome": "Chuva (1h)", "valor_raw": f"{rain_1h:.2f} mm", "score_atribuido": rain_1h, "peso_no_calculo": peso_chuva_hora, "severidade": classify_hourly_rain_severity(rain_1h)})
    fatores.append({"nome": "Vento", "valor_raw": f"{wind_speed_kmh:.1f} km/h", "score_atribuido": wind_speed_kmh, "peso_no_calculo": peso_vento_hora, "severidade": classify_hourly_wind_severity(wind_speed_kmh)})
    fatores.append({"nome": "Prob. de Chuva", "valor_raw": f"{prob_precip:.0f}%", "score_atribuido": prob_precip, "peso_no_calculo": peso_prob_hora, "severidade": classify_prob_severity(prob_precip)})

    # --- 4. Cálculo dos Multiplicadores de Perigo ---
    if pressure_hpa < 1005: pressure_factor = 1.2
    elif pressure_hpa < 1012: pressure_factor = 1.1
    else: pressure_factor = 1.0
    if humidity > 85: humidity_factor = 1.1
    else: humidity_factor = 1.0
    hazard_score = base_hazard_score * pressure_factor * humidity_factor
    
    fatores.append({"nome": "Fator Pressão Atmosf.", "valor_raw": f"{pressure_hpa:.0f} hPa (x{pressure_factor})", "score_atribuido": pressure_factor, "peso_no_calculo": 0, "severidade": "Moderado" if pressure_factor > 1.0 else "Baixo"})
    fatores.append({"nome": "Fator Umidade", "valor_raw": f"{humidity:.0f}% (x{humidity_factor})", "score_atribuido": humidity_factor, "peso_no_calculo": 0, "severidade": "Moderado" if humidity_factor > 1.0 else "Baixo"})
    
    # --- 5. O CÁLCULO MESTRE (A FUSÃO) ---
    elevation_factor = get_elevation_vulnerability_factor(elevation)
    
    # Ponderamos a vulnerabilidade total: 70% Elevação, 30% Risco de Rio
    vulnerability_total_factor = (elevation_factor * 0.7) + (river_risk_factor * 0.3)
        
    risk_score_bruto = hazard_score * vulnerability_total_factor

    # Adiciona os fatores de vulnerabilidade à explicação
    fatores.append({"nome": "Fator Vulnerab. (Elevação)", "valor_raw": f"{elevation:.0f} m (x{elevation_factor:.1f})", "score_atribuido": elevation_factor, "peso_no_calculo": 0.7, "severidade": classify_elevation_severity(elevation)})
    fatores.append({"nome": "Fator Risco de Rio (Município)", "valor_raw": f"Risco Municipal (x{river_risk_factor:.1f})", "score_atribuido": river_risk_factor, "peso_no_calculo": 0.3, "severidade": "Crítico" if river_risk_factor > 1.3 else "Moderado"})
    
    final_score = min(max(risk_score_bruto, 0), 10)
    
    return {
        "score_final": round(final_score, 2),
        "fatores_contribuintes": fatores
    }
# --- Bloco de Teste (Inalterado) ---
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
    url_analysis = f"{BACKEND_URL}/assets/{target_asset_id}/risk_analysis"
    
    try:
        console.print(f"--- Testando o endpoint de Análise de Risco para o ativo: [bold cyan]{target_asset_id}[/bold cyan] ---")
        console.print(f"URL da requisição: {url_analysis}")
        
        response = requests.get(url_analysis, verify=False)
        response.raise_for_status()
        analysis_data = response.json()
        
        console.print("\n✅ [green]Análise de Risco recebida com sucesso do backend![/green]")
        
        asset_info = analysis_data.get("asset_info", {})
        daily_forecast = analysis_data.get("daily_forecast_with_risk", [])
        
        asset_name = asset_info.get('name', 'N/A')
        asset_elevation = asset_info.get('elevation_m', 'N/A')
        console.print(f"\n[bold on grey23] ℹ️ Ativo Analisado: '{asset_name}' | Elevação: {asset_elevation:.2f}m [/bold on grey23]")

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
        
        console.print(tabela_risco)

    except Exception as e:
        console.print(f"Ocorreu um erro durante o teste: {e}", style="bold red")