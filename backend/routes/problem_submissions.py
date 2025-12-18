from fastapi import APIRouter, Depends, HTTPException

from mongo.problem_submissions_dao import problem_submissions_dao
from schema.ProblemSubmissions import ProblemSubmissionCreate, ProblemSubmissionUpdate
from sessions.session_authorizer import authorize


problem_submissions_router = APIRouter(prefix="/problem-submissions")


def _validate_platform(platform: str) -> str:
    if platform not in {"hackerrank", "codecademy"}:
        raise HTTPException(422, "platform must be one of: hackerrank, codecademy")
    return platform


@problem_submissions_router.get("/{platform}", tags=["problem-submissions"])
async def list_problem_submissions(platform: str, uuid: str = Depends(authorize)):
    platform = _validate_platform(platform)
    return await problem_submissions_dao.list_submissions(uuid, platform)


@problem_submissions_router.post("/{platform}", tags=["problem-submissions"])
async def create_problem_submission(
    platform: str,
    submission: ProblemSubmissionCreate,
    uuid: str = Depends(authorize),
):
    platform = _validate_platform(platform)
    data = submission.model_dump()
    data["platform"] = platform
    submission_id = await problem_submissions_dao.create_submission(uuid, platform, data)
    return {"detail": "Submission created", "submission_id": submission_id}


@problem_submissions_router.put("/{platform}/{submission_id}", tags=["problem-submissions"])
async def update_problem_submission(
    platform: str,
    submission_id: str,
    patch: ProblemSubmissionUpdate,
    uuid: str = Depends(authorize),
):
    _validate_platform(platform)
    updated = await problem_submissions_dao.update_submission(uuid, submission_id, patch.model_dump())
    if not updated:
        raise HTTPException(404, "Submission not found")
    return {"detail": "Submission updated"}


@problem_submissions_router.delete("/{platform}/{submission_id}", tags=["problem-submissions"])
async def delete_problem_submission(platform: str, submission_id: str, uuid: str = Depends(authorize)):
    _validate_platform(platform)
    deleted = await problem_submissions_dao.delete_submission(uuid, submission_id)
    if not deleted:
        raise HTTPException(404, "Submission not found")
    return {"detail": "Submission deleted"}

