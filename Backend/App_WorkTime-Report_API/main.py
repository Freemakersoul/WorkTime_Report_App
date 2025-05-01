#######################
# LIBRARIES & MODULES #
#######################
from fastapi import Query, Form, File, UploadFile, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import re
from datetime import datetime
from dynamics_auth import get_access_token
from config import DYNAMICS_URL
from pydantic import BaseModel
from typing import Optional
from fastapi.staticfiles import StaticFiles
import base64
import logging

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
            raise HTTPException(status_code=400, detail="Unable to obtain acess token")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Accept": "application/json",
            "Prefer": "odata.include-annotations=*"
        }

        # Defining the fields to send to Dynamics 365 API
        data = {
        "cr6ca_email": user.email,
        "cr6ca_name": user.name, 
        "cr6ca_password": user.password,
        "cr6ca_usertype": user.usertype,
        "overriddencreatedon": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ') 
        }

        # Sending data to Dynamics 365 API
        dynamics_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees"
        response = requests.post(dynamics_url, json=data, headers=headers)

        if response.status_code in [201, 204]:
            # Trying to extract the systemuserid from header "OData-EntityId"
            entity_id = response.headers.get("OData-EntityId")
            cr6ca_employeeid = None
            if entity_id:
                match = re.search(r"\(([^)]+)\)", entity_id)
                cr6ca_employeeid = match.group(1) if match else None
            return {
                "message": "User sucessfully registered!",
                "cr6ca_employeeid": cr6ca_employeeid
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error registering user: {response.text}"
            )
    except Exception as e:
        print("Server error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

#########################################   
# REQUEST MODEL TO LOGIN AUTHENTICATION #
#########################################   
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
            raise HTTPException(status_code=400, detail="Invalid token access")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Retrieving user from Dynamics filtered by email
        query = f"$filter=cr6ca_email eq '{login_data.email}'"
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees?{query}"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            results = response.json().get("value", [])
            if not results:
                raise HTTPException(status_code=401, detail="User not found")

            user = results[0]

            # Password verification
            if user.get("cr6ca_password") != login_data.password:
                raise HTTPException(status_code=401, detail="Wrong password")

            return {
                "message": "Successful login!",
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
    
##################
# GET USERS LIST #
##################  
@app.get("/get-all-users")
async def get_all_users():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json().get("value", [])
            users = []

            for user in data:
                photo_base64 = user.get("cr6ca_photo")
                users.append({
                    "id": user.get("cr6ca_employeeid"),
                    "name": user.get("cr6ca_name"),
                    "email": user.get("cr6ca_email"),
                    "password":user.get("cr6ca_password"),
                    "usertype": user.get("cr6ca_usertype"),
                    "photo_url": f"data:image/png;base64,{photo_base64}" if photo_base64 else None
                })

            return {"users": users}

        raise HTTPException(status_code=response.status_code, detail="Failed to retrieve users")

    except Exception as e:
        print("Error retrieving users:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

####################
# UPDATE USER DATA #
####################
@app.patch("/update-user/{cr6ca_employeeid}")
async def update_user(
    cr6ca_employeeid: str,  
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

        # If it has photo
        if file:
            file_bytes = file.file.read()
            
            # Encodes in base64
            encoded_string = base64.b64encode(file_bytes).decode("utf-8")

            # Content encoded
            data["cr6ca_photo"] = encoded_string

        dynamics_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees({cr6ca_employeeid})"
        response = requests.patch(dynamics_url, json=data, headers=headers)

        if response.status_code in [200, 204]:
            return {
                "message": "User successfully updated",
                "user_id": cr6ca_employeeid,
                "photo_url": f"data:image/png;base64,{encoded_string}" if file else None
            }
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Updating user error: {response.text}")
    
    except Exception as e:
        print("Server error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error.")

#######################
# DELETE USER BY ID   #
#######################
@app.delete("/delete-user/{cr6ca_employeeid}")
async def delete_user(cr6ca_employeeid: str):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        # URL da entidade
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_employees({cr6ca_employeeid})"
        response = requests.delete(url, headers=headers)

        if response.status_code in [204, 200]:
            return {"message": "Utilizador eliminado com sucesso!"}
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Erro ao eliminar utilizador: {response.text}")
        
    except Exception as e:
        print("Erro ao apagar utilizador:", str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

###########################
# GET MEMBER ROLE OPTIONS #
###########################
@app.get("/get-role-values")
async def get_role_values():
    try:
        token = get_access_token()
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_memberroles?$select=cr6ca_memberroleid,cr6ca_name"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error retrieving role options.")

        roles = []
        records = response.json().get("value", [])

        for record in records:
            role_id = record.get("cr6ca_memberroleid")
            role_name = record.get("cr6ca_name")
            if role_id and role_name:
                roles.append({"value": role_id, "label": role_name})

        return {"roles": roles}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving options: {str(e)}")

#############################
# GET USER VACATION BALANCE #
#############################
@app.get("/get-vacation-balance/{user_id}")
async def get_vacation_balance(user_id: str):
    try:
        token = get_access_token()

        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacationbalances?$select=cr6ca_year,cr6ca_availabledays,cr6ca_carriedoverdays&$filter=_cr6ca_userid_value eq '{user_id}'"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error fetching vacation balances")

        data = response.json().get("value", [])

        if not data:
            return {"message": "No vacation balance found for this user."}

        vacation_balances = []
        for item in data:
            vacation_balances.append({
                "year": item.get("cr6ca_year"),
                "available_days": item.get("cr6ca_availabledays"),
                "carried_over_days": item.get("cr6ca_carriedoverdays")
            })

        return {"vacation_balances": vacation_balances}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")  
 
#########################
# USER VACATION REQUEST #
#########################   
class VacationCreateRequest(BaseModel):
    start_date: str  
    end_date: str
    half_day: float
    vacation_status: int = 313330000 
    user_id: str
    
@app.post("/create-vacation")
async def create_vacation(request: VacationCreateRequest):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Accept": "application/json",
            "Prefer": "odata.include-annotations=*"
        }

        data = {
            "cr6ca_startdate": request.start_date,
            "cr6ca_enddate": request.end_date,
            "cr6ca_halfday": request.half_day,
            "cr6ca_vacationstatus": request.vacation_status,
            "cr6ca_UserID@odata.bind": f"/cr6ca_employees({request.user_id})"
        }

        # Remove valores None
        data = {k: v for k, v in data.items() if v is not None}

        dynamics_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations"
        response = requests.post(dynamics_url, json=data, headers=headers)

        if response.status_code in [201, 204]:
            entity_id = response.headers.get("OData-EntityId")
            vacation_id = None
            if entity_id:
                match = re.search(r"\(([^)]+)\)", entity_id)
                vacation_id = match.group(1) if match else None
            return {
                "message": "Vacation request successfully created!",
                "vacation_id": vacation_id
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error creating vacation: {response.text}"
            )

    except Exception as e:
        print("Vacation creation error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
 
#############################
# GET USER VACATION REQUEST #
#############################  
@app.get("/get-all-vacations")
async def get_all_vacations():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Expandindo o User relacionado (cr6ca_UserID)
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations?$expand=cr6ca_UserID($select=cr6ca_name,cr6ca_email)&$select=cr6ca_startdate,cr6ca_enddate,cr6ca_halfday,cr6ca_vacationstatus"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            raw_data = response.json().get("value", [])
            formatted = []

            for item in raw_data:
                user = item.get("cr6ca_UserID", {})
                formatted.append({
                    "vacation_id": item.get("cr6ca_vacationid"),
                    "start_date": item.get("cr6ca_startdate"),
                    "end_date": item.get("cr6ca_enddate"),
                    "half_day": item.get("cr6ca_halfday"),
                    "vacation_status": item.get("cr6ca_vacationstatus"),
                    "user": {
                        "name": user.get("cr6ca_name"),
                        "email": user.get("cr6ca_email"),
                    }
                })

            return {"vacations": formatted}

        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error fetching vacation requests: {response.text}"
            )

    except Exception as e:
        print("Error fetching all vacation requests:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

################################
# UPDATE USER VACATION REQUEST #
################################ 
class VacationStatusUpdateRequest(BaseModel):
    vacation_status: int  # 313330001 = Aprovado, 313330002 = Rejeitado
    reason_if_rejected: Optional[str] = None

@app.patch("/update-vacation-status/{cr6ca_vacationid}")
async def update_vacation_status(cr6ca_vacationid: str, data: VacationStatusUpdateRequest):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Accept": "application/json"
        }

        update_data = {
            "cr6ca_vacationstatus": data.vacation_status
        }

        if data.reason_if_rejected:
            update_data["cr6ca_reasonifrejected"] = data.reason_if_rejected

        # Atualiza o status da solicitação de férias
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations({cr6ca_vacationid})"
        response = requests.patch(url, json=update_data, headers=headers)

        if response.status_code not in [200, 204]:
            raise HTTPException(status_code=response.status_code, detail=f"Error updating vacation status: {response.text}")

        ### NOVO: Se for aprovado, atualiza saldo de férias ###
        if data.vacation_status == 313330001:  # Approved
            
            # 1. Buscar detalhes da solicitação de férias (start, end, half day, user)
            vacation_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations({cr6ca_vacationid})?$select=cr6ca_startdate,cr6ca_enddate,cr6ca_halfday,_cr6ca_userid_value"
            vacation_resp = requests.get(vacation_url, headers=headers)

            if vacation_resp.status_code != 200:
                raise HTTPException(status_code=vacation_resp.status_code, detail="Error fetching vacation details")

            vacation = vacation_resp.json()
            start_date = datetime.fromisoformat(vacation["cr6ca_startdate"])
            end_date = datetime.fromisoformat(vacation["cr6ca_enddate"])
            half_day = vacation.get("cr6ca_halfday", 1.0)
            user_id = vacation["_cr6ca_userid_value"]

            # 2. Buscar o saldo atual do utilizador
            balance_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacationbalances?$filter=_cr6ca_userid_value eq {user_id}&$orderby=cr6ca_year desc&$top=1"
            balance_resp = requests.get(balance_url, headers=headers)

            if balance_resp.status_code != 200:
                raise HTTPException(status_code=balance_resp.status_code, detail="Error fetching vacation balance")

            balances = balance_resp.json().get("value", [])
            if not balances:
                raise HTTPException(status_code=404, detail="No vacation balance found for this user")

            balance = balances[0]
            balance_id = balance["cr6ca_vacationbalanceid"]
            available_days = balance["cr6ca_availabledays"]

            # 3. Calcular quantos dias foram pedidos
            total_days = (end_date - start_date).days + 1
            if half_day == 0.5:
                total_days = 0.5
                
            if total_days > available_days:
                raise HTTPException(status_code=400, detail="O utilizador não tem dias suficientes para esta marcação.")

            new_available_days = available_days - total_days

            if new_available_days < 0:
                new_available_days = 0  

            # 4. Atualizar o saldo
            update_balance_data = {
                "cr6ca_availabledays": new_available_days
            }

            balance_update_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacationbalances({balance_id})"
            balance_update_resp = requests.patch(balance_update_url, json=update_balance_data, headers=headers)

            if balance_update_resp.status_code not in [200, 204]:
                raise HTTPException(status_code=balance_update_resp.status_code, detail="Error updating vacation balance")

        return {"message": "Vacation status and balance updated successfully."}

    except Exception as e:
        print("Update vacation status error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

############################
# GET USER VACATION STATUS #
############################ 
@app.get("/get-vacation-status-by-user-id/{user_id}")
async def get_vacation_status_by_user_id(user_id: str):
    try:
        token = get_access_token()

        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        # Cabeçalhos da requisição
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Busca as férias mais recentes do utilizador, ordenadas pela data de criação (descendente)
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations?$filter=_cr6ca_userid_value eq {user_id}&$orderby=createdon desc&$top=1&$select=cr6ca_vacationstatus,cr6ca_reasonifrejected,cr6ca_vacationid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            result = response.json()

            if result.get("value"):
                vacation = result["value"][0]

                vacation_status = vacation.get("cr6ca_vacationstatus")
                reason_if_rejected = vacation.get("cr6ca_reasonifrejected", "No reason provided")
                vacation_id = vacation.get("cr6ca_vacationid")

                return {
                    "vacation_status": vacation_status,
                    "reason_if_rejected": reason_if_rejected,
                    "vacation_id": vacation_id
                }
            else:
                raise HTTPException(status_code=404, detail="No vacation request found for this user")

        else:
            raise HTTPException(status_code=response.status_code, detail=f"Error fetching vacation status: {response.text}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
################################
# DELETE USER VACATION REQUEST #
################################ 
@app.delete("/delete-vacation/{cr6ca_vacationid}")
async def delete_vacation(cr6ca_vacationid: str):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        dynamics_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations({cr6ca_vacationid})"
        response = requests.delete(dynamics_url, headers=headers)

        if response.status_code == 204:
            return {"message": "Vacation request deleted successfully!"}
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Vacation request not found")
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error deleting vacation: {response.text}"
            )

    except Exception as e:
        print("Vacation deletion error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
    
############################
# GET PUBLIC HOLIDAYS LIST #
############################
@app.get("/get-public-holidays")
async def get_public_holidays():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_publicholidaies?$select=cr6ca_description,cr6ca_holidaydate"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            result = response.json()
            holidays = result.get("value", [])

            return {"holidays": holidays}
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error fetching public holidays: {response.text}"
            )

    except Exception as e:
        print("Public holiday fetch error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

####################
# GET CLIENTS LIST #
####################
@app.get("/get-account-options")
async def get_account_options():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Traz os campos name (nome da conta) e accountid (GUID)
        url = f"{DYNAMICS_URL}/api/data/v9.2/accounts?$select=name,accountid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            accounts = response.json().get("value", [])
            return [
                {"name": acc["name"], "id": acc["accountid"]}
                for acc in accounts if "name" in acc and "accountid" in acc
            ]
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
 
##########################
# GET ACTIVITY TYPE LIST #
##########################
@app.get("/get-activitytype-options")
async def get_activitytype_options():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Endpoint para buscar tipos de atividade
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_activitytypes?$select=cr6ca_name,cr6ca_activitytypeid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            items = response.json().get("value", [])
            return [
                {"name": item["cr6ca_name"], "id": item["cr6ca_activitytypeid"]}
                for item in items if "cr6ca_name" in item and "cr6ca_activitytypeid" in item
            ]
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
#####################
# GET PROJECTS LIST #
#####################
@app.get("/get-project-options")
async def get_project_options():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Endpoint para buscar projetos
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_projects?$select=cr6ca_name,cr6ca_projectid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            items = response.json().get("value", [])
            return [
                {"name": item["cr6ca_name"], "id": item["cr6ca_projectid"]}
                for item in items if "cr6ca_name" in item and "cr6ca_projectid" in item
            ]
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
#########################
# GET PROJECT TYPE LIST #
#########################
@app.get("/get-projecttype-options")
async def get_projecttype_options():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Endpoint para buscar tipos de projeto
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_projecttypes?$select=cr6ca_name,cr6ca_projecttypeid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            items = response.json().get("value", [])
            return [
                {"name": item["cr6ca_name"], "id": item["cr6ca_projecttypeid"]}
                for item in items if "cr6ca_name" in item and "cr6ca_projecttypeid" in item
            ]
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
 
#################
# GET TASK LIST #
#################    
@app.get("/get-task-options")
async def get_task_options():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Busca tarefas (campo subject e activityid)
        url = f"{DYNAMICS_URL}/api/data/v9.2/tasks?$select=subject,activityid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            items = response.json().get("value", [])
            return [
                {"name": item["subject"], "id": item["activityid"]}
                for item in items if "subject" in item and "activityid" in item
            ]
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
######################
# GET TIME TYPE LIST #
######################
@app.get("/get-timetype-options")
async def get_timetype_options():
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
        }

        # Endpoint para buscar tipos de tempo
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_timetypes?$select=cr6ca_name,cr6ca_timetypeid"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            items = response.json().get("value", [])
            return [
                {"name": item["cr6ca_name"], "id": item["cr6ca_timetypeid"]}
                for item in items if "cr6ca_name" in item and "cr6ca_timetypeid" in item
            ]
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

######################
# CREATE TIME REPORT #
######################
class TimeReportInput(BaseModel):
    cr6ca_activitytypeid: str
    accountid: str
    cr6ca_comment: str
    cr6ca_employeeid: str
    cr6ca_hoursworked: float
    cr6ca_projectid: str
    cr6ca_projecttypeid: str
    activityid: str
    cr6ca_timetypeid: str
    cr6ca_reportstatus: Optional[int] = 313330000


@app.post("/create-timereport")
async def create_timereport(input: TimeReportInput):
    try:
        
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_timereports"
        logging.debug(f"URL de requisição: {url}")

        # Dados a serem enviados para o Dynamics
        data = {
            "cr6ca_ActivityTypeID@odata.bind": f"/cr6ca_activitytypes({input.cr6ca_activitytypeid})",  # Atividade
            "cr6ca_AccountID@odata.bind": f"/accounts({input.accountid})",  # Conta
            "cr6ca_comment": input.cr6ca_comment,  # Comentário
            "cr6ca_EmployeeID@odata.bind": f"/cr6ca_employees({input.cr6ca_employeeid})",  # Funcionário
            "cr6ca_hoursworked": input.cr6ca_hoursworked,  # Horas trabalhadas
            "cr6ca_ProjectID@odata.bind": f"/cr6ca_projects({input.cr6ca_projectid})",  # Projeto
            "cr6ca_ProjectTypeID@odata.bind": f"/cr6ca_projecttypes({input.cr6ca_projecttypeid})",  # Tipo de projeto
            "cr6ca_TaskID@odata.bind": f"/tasks({input.activityid})",  # Tarefa
            "cr6ca_TimeTypeID@odata.bind": f"/cr6ca_timetypes({input.cr6ca_timetypeid})",  # Tipo de tempo
            "cr6ca_reportstatus": input.cr6ca_reportstatus
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code in [201,201,204]:
            return {"status": "success", "message": "Timereport created successfully"}
        else:
            logging.error(f"Erro na requisição para o Dynamics: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        logging.error(f"Erro no servidor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
 
 
###################
# GET TIME REPORT #
###################     
@app.get("/get-user-timereports")
async def get_user_timeline(employee_id: Optional[str] = None, createdon: Optional[str] = None):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": "odata.include-annotations=*"
        }

        base_url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_timereports"
        select = (
            "$select=cr6ca_comment,cr6ca_hoursworked,createdon,cr6ca_reportstatus"
        )
        expand = (
            "$expand="
            "cr6ca_AccountID($select=name),"
            "cr6ca_ActivityTypeID($select=cr6ca_name),"
            "cr6ca_EmployeeID($select=cr6ca_name),"
            "cr6ca_ProjectID($select=cr6ca_name),"
            "cr6ca_ProjectTypeID($select=cr6ca_name),"
            "cr6ca_TaskID($select=subject),"
            "cr6ca_TimeTypeID($select=cr6ca_name)"
        )

        # Se o `employee_id` for fornecido, filtra por ele
        if employee_id:
            filter_clause = f"$filter=cr6ca_EmployeeID/cr6ca_employeeid eq {employee_id}"
            url = f"{base_url}?{select}&{filter_clause}&{expand}"

        else:
            # Se não tiver filtro, vai retornar todos os relatórios
            url = f"{base_url}?{select}&$orderby=createdon desc&{expand}"

        # Se `createdon` for passado, pode-se adicionar o filtro para a data
        if createdon:
            url += f"&$filter=createdon ge {createdon}"

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return JSONResponse(content=response.json())
        else:
            logging.error(f"Erro ao buscar timereports: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        logging.error(f"Erro interno: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

#######################
# UPDATE TIME REPORT #
#######################
@app.patch("/update-timereport/{cr6ca_timereportid}")
async def update_timereport(cr6ca_timereportid: str, input: TimeReportInput):
    try:
        
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")
        logging.debug(f"Token de acesso: {token}")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        # URL para atualizar o timereport específico
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_timereports({cr6ca_timereportid})"
        logging.debug(f"URL de requisição para atualizar o relatório: {url}")

        # Dados a serem atualizados
        data = {
            "cr6ca_ActivityTypeID@odata.bind": f"/cr6ca_activitytypes({input.cr6ca_activitytypeid})",  # Atividade
            "cr6ca_AccountID@odata.bind": f"/accounts({input.accountid})",  # Conta
            "cr6ca_comment": input.cr6ca_comment,  # Comentário
            "cr6ca_EmployeeID@odata.bind": f"/cr6ca_employees({input.cr6ca_employeeid})",  # Funcionário
            "cr6ca_hoursworked": input.cr6ca_hoursworked,  # Horas trabalhadas
            "cr6ca_ProjectID@odata.bind": f"/cr6ca_projects({input.cr6ca_projectid})",  # Projeto
            "cr6ca_ProjectTypeID@odata.bind": f"/cr6ca_projecttypes({input.cr6ca_projecttypeid})",  # Tipo de projeto
            "cr6ca_TaskID@odata.bind": f"/tasks({input.activityid})",  # Tarefa
            "cr6ca_TimeTypeID@odata.bind": f"/cr6ca_timetypes({input.cr6ca_timetypeid})",  # Tipo de tempo
        }

        # Envia a requisição para atualizar o relatório
        response = requests.patch(url, headers=headers, json=data)

        if response.status_code == 204:  # 204 indica sucesso na atualização
            return {"status": "success", "message": "Time report updated successfully"}
        else:
            logging.error(f"Erro na requisição para o Dynamics: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        logging.error(f"Erro no servidor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
#############################
# UPDATE TIME REPORT STATUS #
#############################
class ReportStatusUpdate(BaseModel):
    cr6ca_reportstatus: int

@app.patch("/update-reportstatus/{cr6ca_timereportid}")
async def update_report_status(cr6ca_timereportid: str, input: ReportStatusUpdate):
    try:

        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_timereports({cr6ca_timereportid})"

        data = {
            "cr6ca_reportstatus": input.cr6ca_reportstatus
        }

        response = requests.patch(url, headers=headers, json=data)

        if response.status_code == 204:
            return {"status": "success", "message": "Report status updated successfully"}
        else:
            logging.error(f"Erro na atualização de status: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        logging.error(f"Erro no servidor ao atualizar status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

  
######################
# DELETE TIME REPORT #
###################### 
@app.delete("/delete-timereport/{cr6ca_timereportid}")
async def delete_timereport(cr6ca_timereportid: str):
    try:
        token = get_access_token()
        if not token:
            raise HTTPException(status_code=400, detail="Invalid access token")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        # URL do Dynamics para deletar um registro específico com o campo cr6ca_timereportid
        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_timereports({cr6ca_timereportid})"

        response = requests.delete(url, headers=headers)

        if response.status_code == 204:
            # 204 significa que a exclusão foi bem-sucedida e não há conteúdo na resposta
            return {"status": "success", "message": "Time report deleted successfully"}
        else:
            logging.error(f"Erro ao deletar o time report: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)

    except Exception as e:
        logging.error(f"Erro interno: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")