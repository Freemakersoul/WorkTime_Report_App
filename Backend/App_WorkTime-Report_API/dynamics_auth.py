import requests
from config import CLIENT_ID, CLIENT_SECRET, TENANT_ID, DYNAMICS_URL, AUTH_URL

def get_access_token():
    # Dados necessários para a requisição
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": f"{DYNAMICS_URL}/.default"
    }

    # Realiza a requisição POST para obter o token
    response = requests.post(AUTH_URL, data=data)

    # Verifica se a resposta foi bem-sucedida
    if response.status_code == 200:
        token_info = response.json()
        access_token = token_info.get("access_token")
        print("Token de acesso obtido com sucesso!")
        return access_token
    else:
        print("Erro ao obter o token de acesso:", response.text)
        return None