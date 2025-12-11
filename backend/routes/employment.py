from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import DuplicateKeyError

from mongo.employment_dao import employment_dao
from sessions.session_authorizer import authorize
from schema.Employment import Employment

employment_router = APIRouter(prefix = "/employment")

@employment_router.post("", tags = ["employment"])
async def add_employment(employment: Employment, uuid: str = Depends(authorize)):
    try:
        model = employment.model_dump()

        if not model.get("title"):
            raise HTTPException(422, "Employment requires a title")
        
        model["uuid"] = uuid
        result = await employment_dao.add_employment(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Employment already exists") # FIXME: redundant since keys are generated uniquely?
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Sucessfully added employment", "employment_id": result}

@employment_router.get("", tags = ["employment"])
async def get_employment(employment_id: str, uuid: str = Depends(authorize)):
    try:
        result = await employment_dao.get_employment(employment_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        result["_id"] = str(result["_id"])
        return result
    else:
        raise HTTPException(400, "Employment not found")

@employment_router.get("/me", tags = ["employment"])
async def get_all_employment(uuid: str = Depends(authorize)):
    try:
        results = await employment_dao.get_all_employment(uuid)
        # NOTE: do not raise http exception for empty employment, as it can lead to inconsistent behavior on the frontend
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results

@employment_router.put("", tags = ["employment"])
async def update_employment(employment_id: str, employment: Employment, uuid: str = Depends(authorize)):    
    try:
        model = employment.model_dump(exclude_unset = True)
        updated = await employment_dao.update_employment(employment_id, model)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if updated == 0:
        raise HTTPException(400, "Employment not found")
    else:
        return {"detail": "Successfully updated employment"}
    
@employment_router.delete("", tags = ["employment"])
async def delete_employment(employment_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await employment_dao.delete_employment(employment_id)
    except Exception as e:
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(400, "Employment not found")
    else:
        return {"detail": "Successfully deleted employment"}
    