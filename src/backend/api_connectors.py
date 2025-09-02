import requests #permiite fazer requisições
import pprint #permite imprimir de forma mais legível

def buscar_clima_openweather(lat: float, lon: float): #função que junta tudo e faz a busca do clima usando os parametro para latitude e longitude
    api_key = "e0a38376d4c46a8fec65aeafaa6fdeed"
    LINK_BASE = "https://api.openweathermap.org/data/3.0/onecall"

    parameters = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "lang": "pt_br"
    }

    try: #* o caminho feliz se não houver erros
        response = requests.get(LINK_BASE, params=parameters)
        response.raise_for_status() #verifica se a requisição foi bem sucedida
        return response.json()
    except requests.exceptions.RequestException as e: #* caminho em caso de erros
        #* kit primeiros socorros para os tipos de erros acima
        # evita que a aplicação quebre e surte
        print(f"ERRO ao conectar com a API de clima: {e}") # log do erro, armazena o erro em uma variavel -> e
        return {"error": "Falha na comunicação com o serviço de clima."}

def fetch_elevation_data(lat: float, lon: float) -> float:
    """
    Busca dados de elevação (altitude) para uma dada coordenada
    usando a API pública Open-Elevation (MÉTODO GET OTIMIZADO).
    Retorna a altitude em metros.
    """
    url = "https://api.open-elevation.com/api/v1/lookup"
    # Para o método GET, passamos as localizações como um parâmetro na URL
    params = {
        "locations": f"{lat},{lon}"
    }
    
    try:
        # Usamos requests.get, que é mais simples para este caso
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # A resposta vem numa lista, então pegamos o primeiro resultado
        if data['results']:
            elevation = data['results'][0]['elevation']
            return elevation
        return 0.0 # Retorna 0 se não houver resultados
        
    except requests.exceptions.RequestException as e:
        print(f"ERRO ao conectar com a API de elevação: {e}")
        # Se a API de relevo falhar, retornamos 0 como um valor seguro
        return 0.0