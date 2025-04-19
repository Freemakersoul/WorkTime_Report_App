#######################
# LIBRARIES & MODULES #
#######################
from fastapi import Query, Form, File, UploadFile, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
from datetime import datetime
from dynamics_auth import get_access_token
from config import DYNAMICS_URL
from pydantic import BaseModel
from typing import Optional
from fastapi.staticfiles import StaticFiles
import base64

##########################
# FastAPI INITIALIZATION #
##########################
app = FastAPI()

########################################################
# Middleware CORS (ALLOW REQUESTS FROM REACT FRONTEND) #
########################################################
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

################
# Images Route #
################
app.mount("/imgs", StaticFiles(directory="imgs"), name="imgs")

################################   
# REQUEST MODEL TO CREATE USER #
################################
class UserCreateRequest(BaseModel):
  email: str
  name: str
  password: str
  usertype:int=313330000

###############
# CREATE USER #
###############
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
    
########################
# LOGIN AUTHENTICATION #
########################
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
            raise HTTPException(status_code=response.status_code, detail="Failed to retreive user data")

    except Exception as e:
        print("Login error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

#################
# GET USER DATA #
#################
@app.get("/get-user/{cr6ca_employeeid}")
async def get_user(cr6ca_employeeid: str):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid acess token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees({cr6ca_employeeid})"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            user = response.json()
            photo_base64 = user.get("cr6ca_photo")

            return {
                "id": user.get("cr6ca_employeeid"),
                "name": user.get("cr6ca_name"),
                "email": user.get("cr6ca_email"),
                "password":user.get("cr6ca_password"),
                "usertype": user.get("cr6ca_usertype"),
                "photo_url": f"data:image/png;base64,{photo_base64}" if photo_base64 else None
            }
        else:
            raise HTTPException(status_code=response.status_code, detail="User not found")
    except Exception as e:
        print("User lookup error", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

####################
# UPDATE USER DATA #
####################
@app.patch("/update-user/{cr6ca_employeeid}")
async def update_user(
    cr6ca_employeeid: str,  # identificador que vem na URL
    email: str = Form(...),
    name: str = Form(...),
    password: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid acess token")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Accept": "application/json",
            "Prefer": "odata.include-annotations=*"
        }

        data = {
            "cr6ca_email": email,
            "cr6ca_name": name,
            "cr6ca_password": password
        }

        # Se tiver foto
        if file:
            file_bytes = file.file.read()
            
            # Codifica em base64
            encoded_string = base64.b64encode(file_bytes).decode("utf-8")

            # Aqui você envia o conteúdo Base64, como o Dynamics espera
            data["cr6ca_photo"] = encoded_string

        dynamics_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees({cr6ca_employeeid})"
        response = requests.patch(dynamics_url, json=data, headers=headers)

        if response.status_code in [200, 204]:
            return {
                "message": "Usuário atualizado com sucesso",
                "user_id": cr6ca_employeeid,
                "photo_url": f"data:image/png;base64,{encoded_string}" if file else None
            }
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Erro ao atualizar usuário: {response.text}")
    
    except Exception as e:
        print("Erro no servidor:", str(e))
        raise HTTPException(status_code=500, detail="Erro interno no servidor")

###########################
# GET MEMBER ROLE OPTIONS #
###########################
@app.get("/get-role-values")
async def get_role_values():
    try:
        token = get_access_token()
        url = f"{DYNAMICS_URL}/api/data/v9.2/EntityDefinitions(LogicalName='cr6ca_memberrole')/Attributes(LogicalName='cr6ca_rolename')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Erro ao buscar opções do campo")

        options = response.json()["OptionSet"]["Options"]
        roles = []

        for option in options:
            value = option["Value"]
            label = option["Label"]["UserLocalizedLabel"]["Label"]
            roles.append({"value": value, "label": label})

        return {"roles": roles}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao recuperar opções: {str(e)}")
    