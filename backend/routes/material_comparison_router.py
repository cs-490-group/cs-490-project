"""
UC-120: Application Material Comparison Dashboard Routes

Endpoints for comparing performance of different resume and cover letter versions
"""

from fastapi import APIRouter, HTTPException, Depends
from sessions.session_authorizer import authorize
from services.material_comparison_service import material_comparison_service

material_comparison_router = APIRouter(prefix="/material-comparison")


@material_comparison_router.get("/resumes", tags=["material-comparison"])
async def get_resume_comparison(uuid: str = Depends(authorize)):
    """
    Get comparison data for all resume versions - UC-120

    Returns list of resume versions with performance metrics:
    - applications_count
    - response_rate %
    - interview_rate %
    - offer_rate %
    - avg_response_time_days
    """
    try:
        comparison = await material_comparison_service.get_resume_version_comparison(uuid)
        return {
            "detail": "Resume comparison data retrieved",
            "data": comparison
        }

    except Exception as e:
        print(f"Error getting resume comparison: {e}")
        raise HTTPException(500, str(e))


@material_comparison_router.get("/cover-letters", tags=["material-comparison"])
async def get_cover_letter_comparison(uuid: str = Depends(authorize)):
    """
    Get comparison data for all cover letter versions - UC-120

    Returns list of cover letters with performance metrics
    """
    try:
        comparison = await material_comparison_service.get_cover_letter_version_comparison(uuid)
        return {
            "detail": "Cover letter comparison data retrieved",
            "data": comparison
        }

    except Exception as e:
        print(f"Error getting cover letter comparison: {e}")
        raise HTTPException(500, str(e))


@material_comparison_router.get("/combined", tags=["material-comparison"])
async def get_combined_comparison(uuid: str = Depends(authorize)):
    """
    Get both resume and cover letter comparisons - UC-120

    Returns:
    - resumes: List of resume version comparisons
    - cover_letters: List of cover letter comparisons
    - summary: Totals and notes
    """
    try:
        comparison = await material_comparison_service.get_combined_comparison(uuid)
        return {
            "detail": "Combined comparison data retrieved",
            **comparison
        }

    except Exception as e:
        print(f"Error getting combined comparison: {e}")
        raise HTTPException(500, str(e))


@material_comparison_router.post("/resumes/{resume_id}/versions/{version_id}/archive", tags=["material-comparison"])
async def archive_resume_version(
    resume_id: str,
    version_id: str,
    uuid: str = Depends(authorize)
):
    """
    Archive a resume version - UC-120

    Marks version as archived (adds [ARCHIVED] prefix)
    """
    try:
        success = await material_comparison_service.archive_resume_version(resume_id, version_id)

        if success:
            return {"detail": "Resume version archived successfully"}
        else:
            raise HTTPException(404, "Resume version not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error archiving resume version: {e}")
        raise HTTPException(500, str(e))


@material_comparison_router.post("/cover-letters/{letter_id}/archive", tags=["material-comparison"])
async def archive_cover_letter(
    letter_id: str,
    uuid: str = Depends(authorize)
):
    """
    Archive a cover letter - UC-120

    Marks cover letter as archived (adds [ARCHIVED] prefix)
    """
    try:
        success = await material_comparison_service.archive_cover_letter(letter_id, uuid)

        if success:
            return {"detail": "Cover letter archived successfully"}
        else:
            raise HTTPException(404, "Cover letter not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error archiving cover letter: {e}")
        raise HTTPException(500, str(e))
