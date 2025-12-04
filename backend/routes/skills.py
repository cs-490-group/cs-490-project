from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import DuplicateKeyError

from mongo.skills_dao import skills_dao
from sessions.session_authorizer import authorize
from schema.Skill import Skill

skills_router = APIRouter(prefix = "/skills")

@skills_router.post("", tags = ["skills"])
async def add_skill(skill: Skill, uuid: str = Depends(authorize)):
    try:
        model = skill.model_dump()

        if not model.get("name"):
            raise HTTPException(422, "Skill requires a name")

        model["uuid"] = uuid
        result = await skills_dao.add_skill(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Skill already exists") # FIXME: redundant since keys are generated uniquely?
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Sucessfully added skill", "skill_id": result}

@skills_router.get("", tags = ["skills"])
async def get_skill(skill_id: str, uuid: str = Depends(authorize)):
    try:
        result = await skills_dao.get_skill(skill_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        result["_id"] = str(result["_id"])
        return result
    else:
        raise HTTPException(400, "Skill not found")

@skills_router.get("/me", tags = ["skills"])
async def get_all_skills(uuid: str = Depends(authorize)):
    try:
        results = await skills_dao.get_all_skills(uuid)
        # NOTE: do not raise http exception for empty skills, as it can lead to inconsistent behavior on the frontend
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results

@skills_router.put("", tags = ["skills"])
async def update_skill(skill_id: str, skill: Skill, uuid: str = Depends(authorize)):    
    try:
        model = skill.model_dump(exclude_unset = True)
        updated = await skills_dao.update_skill(skill_id, model)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if updated == 0:
        raise HTTPException(400, "Skill not found")
    else:
        return {"detail": "Successfully updated skill"}
    
@skills_router.delete("", tags = ["skills"])
async def delete_skill(skill_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await skills_dao.delete_skill(skill_id)
    except Exception as e:
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(400, "Skill not found")
    else:
        return {"detail": "Successfully deleted skill"}
    