from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
from datetime import datetime
from dynamics_auth import get_access_token
from config import DYNAMICS_URL
from pydantic import BaseModel

# Inicializar a FastAPI
app = FastAPI()

# Middleware CORS (permitir requisições do frontend React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
# Modelo para os dados que vao ser recebidos no corpo da requisição
class UserCreateRequest(BaseModel):
  email: str
  name: str
  password: str
  usertype:int=313330000

@app.post("/create-user")
async def create_user(user: UserCreateRequest):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Não foi possível obter o token de acesso")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Accept": "application/json",
            "Prefer": "odata.include-annotations=*"
        }

        # Definindo os campos que serão enviados para a API do Dynamics 365
        data = {
        "cr6ca_email": user.email,
        "cr6ca_name": user.name, 
        "cr6ca_password": user.password,
        "cr6ca_usertype": user.usertype,
        "overriddencreatedon": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ') 
        }

        # Enviando os dados para a API do Dynamics 365 
        dynamics_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees"
        response = requests.post(dynamics_url, json=data, headers=headers)

        if response.status_code in [201, 204]:
            # Tentar extrair o systemuserid do header "OData-EntityId"
            entity_id = response.headers.get("OData-EntityId")
            cr6ca_employeeid = None
            if entity_id:
                match = re.search(r"\(([^)]+)\)", entity_id)
                cr6ca_employeeid = match.group(1) if match else None
            return {
                "message": "Usuário criado com sucesso",
                "cr6ca_employeeid": cr6ca_employeeid
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Erro ao criar usuário: {response.text}"
            )
    except Exception as e:
        print("Erro no servidor:", str(e))
        raise HTTPException(status_code=500, detail="Erro interno no servidor")
    
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
async def login_user(login_data: LoginRequest):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Token de acesso inválido")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Buscar o usuário no Dynamics filtrando pelo email
        query = f"$filter=cr6ca_email eq '{login_data.email}'"
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees?{query}"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            results = response.json().get("value", [])
            if not results:
                raise HTTPException(status_code=401, detail="Usuário não encontrado")

            user = results[0]

            # Verificar senha
            if user.get("cr6ca_password") != login_data.password:
                raise HTTPException(status_code=401, detail="Senha incorreta")

            return {
                "message": "Login bem-sucedido",
                "user": {
                    "id": user.get("cr6ca_employeeid"),
                    "name": user.get("cr6ca_name"),
                    "email": user.get("cr6ca_email"),
                    "usertype": user.get("cr6ca_usertype")
                }
            }

        else:
            raise HTTPException(status_code=response.status_code, detail="Erro ao consultar usuário")

    except Exception as e:
        print("Erro no login:", str(e))
        raise HTTPException(status_code=500, detail="Erro interno no servidor")
