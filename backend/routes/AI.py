from fastapi import APIRouter
from schema.AI import AIGenerate
from mongo.AI_dao import ai_dao



ai_router = APIRouter(prefix="/ai")



@ai_router.post("/generate")
async def generate_ai_test(request: AIGenerate):
    response = await ai_dao.generate_text(request.prompt, request.system_message)
    return {"response": response}