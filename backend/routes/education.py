from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import DuplicateKeyError

from mongo.education_dao import education_dao
from sessions.session_authorizer import authorize
from schema.Education import Education

education_router = APIRouter(prefix = "/education")

@education_router.post("", tags = ["education"])
async def add_education(education: Education, uuid: str = Depends(authorize)):
    try:
        model = education.model_dump()

        if not model.get("institution_name"):
            raise HTTPException(422, "Education requires an institution name")

        model["uuid"] = uuid
        result = await education_dao.add_education(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Education already exists") # FIXME: redundant since keys are generated uniquely?
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Sucessfully added education", "education_id": result}

@education_router.get("", tags = ["education"])
async def get_education(education_id: str, uuid: str = Depends(authorize)):
    try:
        result = await education_dao.get_education(education_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        result["_id"] = str(result["_id"])
        return result
    else:
        raise HTTPException(400, "Education not found")

@education_router.get("/me", tags = ["education"])
async def get_all_education(uuid: str = Depends(authorize)):
    try:
        results = await education_dao.get_all_education(uuid)
        # NOTE: do not raise http exception for empty education, as it can lead to inconsistent behavior on the frontend
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results

@education_router.put("", tags = ["education"])
async def update_education(education_id: str, education: Education, uuid: str = Depends(authorize)):    
    try:
        model = education.model_dump(exclude_unset = True)
        updated = await education_dao.update_education(education_id, model)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if updated == 0:
        raise HTTPException(400, "Education not found")
    else:
        return {"detail": "Successfully updated education"}
    
@education_router.delete("", tags = ["education"])
async def delete_education(education_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await education_dao.delete_education(education_id)
    except Exception as e:
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(400, "Education not found")
    else:
        return {"detail": "Successfully deleted education"}
    