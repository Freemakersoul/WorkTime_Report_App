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
        url = f"{DYNAMICS_URL}/api/data/v9.2/EntityDefinitions(LogicalName='cr6ca_memberrole')/Attributes(LogicalName='cr6ca_rolename')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error retrieving role options.")

        options = response.json()["OptionSet"]["Options"]
        roles = []

        for option in options:
            value = option["Value"]
            label = option["Label"]["UserLocalizedLabel"]["Label"]
            roles.append({"value": value, "label": label})

        return {"roles": roles}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro retrieving options. {str(e)}")

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
            update_data["cr6ca_reason_if_rejected"] = data.reason_if_rejected

        url = f"{DYNAMICS_URL}/api/data/v9.2/cr6ca_vacations({cr6ca_vacationid})"
        response = requests.patch(url, json=update_data, headers=headers)

        if response.status_code in [200, 204]:
            return {"message": "Vacation status successfully updated."}
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Error updating vacation status: {response.text}")

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