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
