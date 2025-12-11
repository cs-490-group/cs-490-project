import uuid
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

from schema.QuestionBank import (
    QuestionIndustry,
    QuestionRole,
    Question,
    UserPracticedQuestion,
    SaveQuestionResponseRequest,
    SaveQuestionResponseResponse,
)
from mongo.question_bank_dao import (
    QuestionIndustryDAO,
    QuestionRoleDAO,
    QuestionDAO,
    UserPracticedQuestionDAO,
)
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize router
question_bank_router = APIRouter(prefix="/question-bank", tags=["question-bank"])

# Initialize DAOs
industry_dao = QuestionIndustryDAO()
role_dao = QuestionRoleDAO()
question_dao = QuestionDAO()
practiced_dao = UserPracticedQuestionDAO()


# ============================================================================
# INDUSTRY ENDPOINTS
# ============================================================================

@question_bank_router.get("/industries")
async def get_all_industries():
    """Get all industries in the question bank"""
    industries = await industry_dao.get_all_industries()
    return industries


@question_bank_router.get("/industries/{industry_id}")
async def get_industry(industry_id: str):
    """Get a specific industry by ID"""
    industry = await industry_dao.get_industry(industry_id)
    if not industry:
        raise HTTPException(status_code=404, detail="Industry not found")
    return industry


@question_bank_router.post("/industries")
async def create_industry(data: QuestionIndustry, uuid_val: str = Depends(authorize)):
    """Create a new industry (admin only)"""
    industry_dict = data.dict(exclude={"date_created", "date_updated"})
    industry_dict["uuid"] = str(uuid.uuid4())
    industry_id = await industry_dao.add_industry(industry_dict)
    return {
        "detail": "Industry created successfully",
        "industry_id": industry_id,
        "uuid": industry_dict["uuid"]
    }


# ============================================================================
# ROLE ENDPOINTS
# ============================================================================

@question_bank_router.get("/industries/{industry_id}/roles")
async def get_roles_by_industry(industry_id: str):
    """Get all roles for a specific industry"""
    roles = await role_dao.get_roles_by_industry(industry_id)
    if not roles:
        raise HTTPException(status_code=404, detail="No roles found for this industry")
    return roles


@question_bank_router.get("/roles/{role_id}")
async def get_role(role_id: str):
    """Get a specific role by ID"""
    role = await role_dao.get_role(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@question_bank_router.post("/roles")
async def create_role(data: QuestionRole, uuid_val: str = Depends(authorize)):
    """Create a new role (admin only)"""
    role_dict = data.dict(exclude={"date_created", "date_updated"})
    role_dict["uuid"] = str(uuid.uuid4())
    role_id = await role_dao.add_role(role_dict)

    # Add role to industry's role list
    await industry_dao.add_role_to_industry(role_dict["industry_uuid"], role_dict["uuid"])

    return {
        "detail": "Role created successfully",
        "role_id": role_id,
        "uuid": role_dict["uuid"]
    }


# ============================================================================
# QUESTION ENDPOINTS
# ============================================================================

@question_bank_router.get("/roles/{role_id}/questions")
async def get_questions_by_role(role_id: str):
    """Get all questions for a specific role"""
    questions = await question_dao.get_questions_by_role(role_id)
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this role")
    return questions


@question_bank_router.get("/roles/{role_id}/questions/category/{category}")
async def get_questions_by_category(role_id: str, category: str):
    """Get questions by role and category (behavioral, technical, situational, company)"""
    valid_categories = ["behavioral", "technical", "situational", "company"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )

    questions = await question_dao.get_questions_by_category(role_id, category)
    if not questions:
        raise HTTPException(status_code=404, detail=f"No {category} questions found for this role")
    return questions


@question_bank_router.get("/roles/{role_id}/questions/difficulty/{difficulty}")
async def get_questions_by_difficulty(role_id: str, difficulty: str):
    """Get questions by role and difficulty (entry, mid, senior)"""
    valid_difficulties = ["entry", "mid", "senior"]
    if difficulty not in valid_difficulties:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid difficulty. Must be one of: {', '.join(valid_difficulties)}"
        )

    questions = await question_dao.get_questions_by_difficulty(role_id, difficulty)
    if not questions:
        raise HTTPException(status_code=404, detail=f"No {difficulty}-level questions found for this role")
    return questions


@question_bank_router.post("/questions")
async def create_question(data: Question, uuid_val: str = Depends(authorize)):
    """Create a new question (admin only)"""
    # Validate category and difficulty
    valid_categories = ["behavioral", "technical", "situational", "company"]
    valid_difficulties = ["entry", "mid", "senior"]

    if data.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category: {data.category}")
    if data.difficulty not in valid_difficulties:
        raise HTTPException(status_code=400, detail=f"Invalid difficulty: {data.difficulty}")

    question_dict = data.dict(exclude={"date_created", "date_updated"})
    question_dict["uuid"] = str(uuid.uuid4())

    question_id = await question_dao.add_question(question_dict)

    # Add question to role's question list
    await role_dao.add_question_to_role(question_dict["role_uuid"], question_dict["uuid"])

    return {
        "detail": "Question created successfully",
        "question_id": question_id,
        "uuid": question_dict["uuid"]
    }


# ============================================================================
# USER PRACTICE ENDPOINTS (Must be BEFORE /questions/{question_id} route)
# ============================================================================

@question_bank_router.get("/questions/practiced")
async def get_practiced_questions(uuid_val: str = Depends(authorize)):
    """Get all questions the user has practiced"""
    practiced = await practiced_dao.get_user_practiced_questions(uuid_val)
    return practiced


@question_bank_router.post("/questions/{question_id}/save-response")
async def save_question_response(
    question_id: str,
    request_data: SaveQuestionResponseRequest,
    uuid_val: str = Depends(authorize)
):
    """Save or update a user's response to a question"""
    response_dict = {
        "uuid": str(uuid.uuid4()),
        "user_uuid": uuid_val,
        "question_uuid": question_id,
        "response_html": request_data.response_html,
        "is_marked_practiced": request_data.is_marked_practiced or False,
        "last_practiced": datetime.now(timezone.utc),
    }

    response_id = await practiced_dao.save_response(response_dict)

    return SaveQuestionResponseResponse(
        detail="Response saved successfully",
        response_id=response_id
    )


@question_bank_router.get("/questions/{question_id}/response")
async def get_question_response(question_id: str, uuid_val: str = Depends(authorize)):
    """Get user's response to a specific question"""
    response = await practiced_dao.get_response(uuid_val, question_id)
    if not response:
        raise HTTPException(status_code=404, detail="No response found for this question")
    return response


@question_bank_router.get("/roles/{role_id}/questions/practiced")
async def get_practiced_questions_by_role(role_id: str, uuid_val: str = Depends(authorize)):
    """Get all practiced questions for a user in a specific role"""
    practiced = await practiced_dao.get_user_practiced_questions_by_role(uuid_val, role_id)
    return practiced


@question_bank_router.put("/questions/{question_id}/mark-practiced")
async def mark_question_practiced(question_id: str, uuid_val: str = Depends(authorize)):
    """Mark a question as practiced"""
    matched = await practiced_dao.mark_as_practiced(uuid_val, question_id)
    if matched == 0:
        raise HTTPException(status_code=404, detail="Response not found")
    return {"detail": "Question marked as practiced"}


@question_bank_router.delete("/questions/{question_id}/response")
async def delete_question_response(question_id: str, uuid_val: str = Depends(authorize)):
    """Delete a user's response to a question"""
    deleted = await practiced_dao.delete_response(uuid_val, question_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Response not found")
    return {"detail": "Response deleted successfully"}



# ============================================================================
# GENERIC QUESTION ENDPOINT (Must be LAST to avoid conflicts)
# ============================================================================

@question_bank_router.get("/questions/{question_id}")
async def get_question(question_id: str):
    """Get a specific question by ID"""
    question = await question_dao.get_question(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
