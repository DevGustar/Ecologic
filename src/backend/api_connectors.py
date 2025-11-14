# Ecologic/src/backend/api_connectors.py (ATUALIZADO PARA A FUSÃO MESTRA)

import requests #permiite fazer requisições
import pprint #permite imprimir de forma mais legível

# Estas duas linhas foram adicionadas para "silenciar" os avisos de segurança (InsecureRequestWarning)
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# MUDANÇA: Chave da API agora é uma constante global para ser reutilizada
API_KEY = "e0a38376d4c46a8fec65aeafaa6fdeed"


def buscar_clima_openweather(lat: float, lon: float):
    """Função que junta tudo e faz a busca do clima usando os parametro para latitude e longitude"""
    LINK_BASE = "https://api.openweathermap.org/data/3.0/onecall"

    parameters = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY, # Usa a chave global
        "units": "metric",
        "lang": "pt_br"
    }

    try: 
        response = requests.get(LINK_BASE, params=parameters, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e: 
        print(f"ERRO ao conectar com a API de clima: {e}")
        return {"error": "Falha na comunicação com o serviço de clima."}

def fetch_elevation_data(lat: float, lon: float) -> float:
    """
    Busca dados de elevação (altitude) para uma dada coordenada.
    """
    url = "https://api.open-elevation.com/api/v1/lookup"
    params = {
        "locations": f"{lat},{lon}"
    }
    
    try:
        response = requests.get(url, params=params, verify=False)
        response.raise_for_status()
        data = response.json()
        
        if data['results']:
            elevation = data['results'][0]['elevation']
            return elevation
        return 0.0
        
    except requests.exceptions.RequestException as e:
        print(f"ERRO ao conectar com a API de elevação: {e}")
        return 0.0

# --- NOVA FUNÇÃO PARA A "FUSÃO MESTRA" ---
def get_municipality_from_coords(lat: float, lon: float) -> str | None:
    """
    Usa a API de Reverse Geocoding da OpenWeather para encontrar o nome
    do município a partir de uma coordenada (lat/lon).
    Retorna o nome do município em MAIÚSCULAS para consistência.
    """
    LINK_BASE = "http://api.openweathermap.org/geo/1.0/reverse"
    parameters = {
        "lat": lat,
        "lon": lon,
        "limit": 1,         # Queremos apenas o resultado mais provável
        "appid": API_KEY    # Usa a mesma chave global
    }
    
    try:
        response = requests.get(LINK_BASE, params=parameters, verify=False)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            # A API retorna 'name' como o nome da cidade/município
            municipality_name = data[0]['name']
            
            # Padroniza para MAIÚSCULAS para bater com o nosso dicionário de rios (ex: "SÃO PAULO")
            return municipality_name.upper()
        else:
            print(f"WARN: API de Reverse Geocoding não retornou dados para {lat}, {lon}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"ERRO ao conectar com a API de Reverse Geocoding: {e}")
        return None