# --- risk_calculator.py ---
# O "Cérebro" da EcoLogic 2.0 (v2.2 - com telemetria profissional)

def calculate_daily_risk(climate_data: dict, structural_data: dict) -> float:
    """
    Calcula uma nota de risco diária (v2.2) combinando múltiplos fatores de PERIGO
    com a VULNERABILIDADE do local.
    """
    
    # --- ETAPA 1: Calcular o "Score de Perigo Meteorológico" ---
    rain_volume = climate_data.get("volume_chuva_mm", 0)
    rain_prob = climate_data.get("prob_chuva_%", 0)
    wind_gust_kmh = climate_data.get("rajadas_kmh", 0)
    pressure_hpa = climate_data.get("pressao_hpa", 1013)
    humidity = climate_data.get("umidade_%", 50)

    # --- Lógica de Ponderação v2.2 ---
    peso_chuva = 0.5
    peso_prob = 0.05
    peso_vento = 0.08
    
    base_hazard_score = (rain_volume * peso_chuva) + (rain_prob * peso_prob) + (wind_gust_kmh * peso_vento)
    
    # Fatores Multiplicadores (A Nova Inteligência)
    if pressure_hpa < 1005: pressure_factor = 1.2
    elif pressure_hpa < 1012: pressure_factor = 1.1
    else: pressure_factor = 1.0
        
    if humidity > 85: humidity_factor = 1.1
    else: humidity_factor = 1.0

    hazard_score = base_hazard_score * pressure_factor * humidity_factor
    
    # --- ETAPA 2: Calcular o "Fator de Vulnerabilidade do Terreno" ---
    elevation = structural_data.get("elevation_m", 500)
    
    if elevation < 50: vulnerability_factor = 1.5
    elif elevation < 400: vulnerability_factor = 1.2
    elif elevation < 800: vulnerability_factor = 1.0
    else: vulnerability_factor = 0.8
        
    # --- ETAPA 3: Calcular a Nota de Risco Final ---
    risk_score_bruto = hazard_score * vulnerability_factor
    
    final_score = min(max(risk_score_bruto, 0), 10)
    
    # Devolvemos também os fatores para a telemetria
    debug_info = {
        "base_hazard_score": base_hazard_score,
        "pressure_factor": pressure_factor,
        "humidity_factor": humidity_factor,
        "vulnerability_factor": vulnerability_factor
    }

    return round(final_score, 2), debug_info

# O bloco de teste (if __name__ == "__main__") foi atualizado para usar a 'rich'
if __name__ == "__main__":
    import requests
    from datetime import datetime
    import sys
    from rich import print # Importamos o print "turbinado" da rich

    if len(sys.argv) < 2: 
        print("[bold red]!!! ERRO: Uso incorreto.[/bold red]")
        print("[bold yellow]!!! Como usar: py risk_calculator.py <ID_DO_ATIVO_PARA_TESTE>[/bold yellow]")
        sys.exit(1)
    
    target_asset_id = sys.argv[1]
    
    print(f"[bold cyan]--- MODO DE TESTE DO CALCULADOR DE RISCO v2.2 PARA O ATIVO: {target_asset_id} ---[/bold cyan]")
    
    BACKEND_URL = "http://127.0.0.1:8000"
    url_asset = f"{BACKEND_URL}/assets/{target_asset_id}"
    url_clima = f"{BACKEND_URL}/assets/{target_asset_id}/climate" # Usamos o climate, não o risk_analysis
    
    try:
        asset_response = requests.get(url_asset, verify=False)
        asset_response.raise_for_status()
        asset_data = asset_response.json()

        climate_response = requests.get(url_clima, verify=False)
        climate_response.raise_for_status()
        climate_data = climate_response.json()
        print("[green]Dados recebidos com sucesso![/green]\n")
        
        lista_previsao_diaria = climate_data.get('daily', [])
        dados_estruturais_ativo = { "elevation_m": asset_data.get("elevation_m", 500) }

        # --- NOVA PARTE: Exibir dados do ativo ---
        asset_name = asset_data.get('name', 'N/A')
        asset_elevation = dados_estruturais_ativo.get('elevation_m', 'N/A')
        print(f"[bold on grey23]Analisando Ativo: '{asset_name}' | Elevação: {asset_elevation}m[/bold on grey23]")


        print("[bold green]--- CÁLCULO DE RISCO v2.2 (COM TELEMETRIA COMPLETA) ---[/bold green]")
        for previsao_de_um_dia in lista_previsao_diaria:
            dados_climaticos_dia = {
                "volume_chuva_mm": previsao_de_um_dia.get('rain', 0) or 0,
                "prob_chuva_%": previsao_de_um_dia.get('pop', 0) * 100,
                "rajadas_kmh": previsao_de_um_dia.get('wind_gust', 0) * 3.6,
                "pressao_hpa": previsao_de_um_dia.get('pressure', 1013),
                "umidade_%": previsao_de_um_dia.get('humidity', 50)
            }
            if dados_climaticos_dia["volume_chuva_mm"] is None:
                dados_climaticos_dia["volume_chuva_mm"] = 0
            
            nota_de_risco, debug_info = calculate_daily_risk(
                climate_data=dados_climaticos_dia, 
                structural_data=dados_estruturais_ativo
            )
            
            dia_formatado = datetime.fromtimestamp(previsao_de_um_dia['dt']).strftime('%d/%m (%a)')
            
            # --- O NOVO LOG ORGANIZADO ---
            print(f"\n[bold white on blue] Dia: {dia_formatado} -> Nota de Risco Final: {nota_de_risco} [/bold white on blue]")
            print(f"  [cyan]Ingredientes do Perigo:[/cyan]")
            print(f"    - Chuva: {dados_climaticos_dia['volume_chuva_mm']:.1f} mm (Prob: {dados_climaticos_dia['prob_chuva_%']:.0f}%)")
            print(f"    - Vento (Rajada): {dados_climaticos_dia['rajadas_kmh']:.1f} km/h")
            print(f"    - Atmosfera: Pressão {dados_climaticos_dia['pressao_hpa']} hPa | Humidade {dados_climaticos_dia['umidade_%']}%")
            print(f"  [yellow]Fatores de Cálculo:[/yellow]")
            print(f"    - Score de Perigo Base: {debug_info['base_hazard_score']:.2f}")
            print(f"    - Multiplicadores: [Pressão: {debug_info['pressure_factor']}] [Humidade: {debug_info['humidity_factor']}] [Relevo: {debug_info['vulnerability_factor']}]")

    except Exception as e:
        print(f"[bold red]Ocorreu um erro durante o teste: {e}[/bold red]")

