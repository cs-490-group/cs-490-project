"""
API Metrics Routes
UC-117: API Rate Limiting and Error Handling Dashboard
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional

from sessions.admin_authorizer import authorize_admin
from mongo.api_metrics_dao import api_metrics_dao
from services.api_metrics_report import generate_weekly_pdf_report
from services.api_key_manager import api_key_manager

router = APIRouter()


@router.get("/usage")
async def get_usage_stats(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    key_owner: Optional[str] = Query(None, description="Filter by key owner"),
    uuid: str = Depends(authorize_admin)
):
    """
    Get API usage statistics
    Admin only
    """
    try:
        # Default to last 7 days if no dates provided
        if not start_date:
            start_dt = datetime.now(timezone.utc) - timedelta(days=7)
        else:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        if not end_date:
            end_dt = datetime.now(timezone.utc)
        else:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        stats = await api_metrics_dao.get_usage_stats(start_dt, end_dt, provider, key_owner)

        return {
            "success": True,
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat()
            },
            "stats": stats
        }

    except Exception as e:
        raise HTTPException(500, f"Error fetching usage stats: {str(e)}")


@router.get("/quota")
async def get_quota_status(
    uuid: str = Depends(authorize_admin)
):
    """
    Get current quota status for all providers
    Admin only
    """
    try:
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")

        # Get Cohere usage
        cohere_usage = await api_metrics_dao.get_monthly_usage("cohere", current_month)
        cohere_limit = api_key_manager.get_quota_limit("cohere")
        cohere_remaining = cohere_limit - cohere_usage
        cohere_percent_used = (cohere_usage / cohere_limit * 100) if cohere_limit > 0 else 0

        # Get OpenAI usage (no limit set)
        openai_usage = await api_metrics_dao.get_monthly_usage("openai", current_month)

        return {
            "success": True,
            "month": current_month,
            "quotas": {
                "cohere": {
                    "used": cohere_usage,
                    "limit": cohere_limit,
                    "remaining": cohere_remaining,
                    "percent_used": round(cohere_percent_used, 2),
                    "percent_remaining": round(100 - cohere_percent_used, 2),
                    "warning": cohere_percent_used > 85  # Warning if > 85% used
                },
                "openai": {
                    "used": openai_usage,
                    "limit": None,  # No limit set
                    "remaining": None,
                    "percent_used": None,
                    "percent_remaining": None,
                    "warning": False
                }
            }
        }

    except Exception as e:
        raise HTTPException(500, f"Error fetching quota status: {str(e)}")


@router.get("/errors")
async def get_recent_errors(
    limit: int = Query(50, ge=1, le=100, description="Number of errors to return"),
    uuid: str = Depends(authorize_admin)
):
    """
    Get recent API errors
    Admin only
    """
    try:
        errors = await api_metrics_dao.get_recent_errors(limit)

        # Convert ObjectId and datetime to strings for JSON serialization
        for error in errors:
            error['_id'] = str(error['_id'])
            error['timestamp'] = error['timestamp'].isoformat()

        return {
            "success": True,
            "count": len(errors),
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(500, f"Error fetching errors: {str(e)}")


@router.get("/fallbacks")
async def get_fallback_events(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    uuid: str = Depends(authorize_admin)
):
    """
    Get fallback events
    Admin only
    """
    try:
        # Default to last 7 days
        if not start_date:
            start_dt = datetime.now(timezone.utc) - timedelta(days=7)
        else:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        if not end_date:
            end_dt = datetime.now(timezone.utc)
        else:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        events = await api_metrics_dao.get_fallback_events(start_dt, end_dt)

        # Convert for JSON serialization
        for event in events:
            event['_id'] = str(event['_id'])
            event['timestamp'] = event['timestamp'].isoformat()

        successful_fallbacks = sum(1 for e in events if e.get('success'))

        return {
            "success": True,
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat()
            },
            "total_events": len(events),
            "successful_fallbacks": successful_fallbacks,
            "failed_fallbacks": len(events) - successful_fallbacks,
            "events": events
        }

    except Exception as e:
        raise HTTPException(500, f"Error fetching fallback events: {str(e)}")


@router.get("/response-times")
async def get_response_times(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    uuid: str = Depends(authorize_admin)
):
    """
    Get response time data for charting
    Admin only
    """
    try:
        # Default to last 30 days
        if not start_date:
            start_dt = datetime.now(timezone.utc) - timedelta(days=30)
        else:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        if not end_date:
            end_dt = datetime.now(timezone.utc)
        else:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        response_times = await api_metrics_dao.get_response_times(start_dt, end_dt, provider)

        return {
            "success": True,
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat()
            },
            "data": response_times
        }

    except Exception as e:
        raise HTTPException(500, f"Error fetching response times: {str(e)}")


@router.get("/export/weekly-report")
async def export_weekly_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    uuid: str = Depends(authorize_admin)
):
    """
    Export weekly API metrics report as PDF
    Admin only
    """
    try:
        # Default to last 7 days
        if not start_date:
            start_dt = datetime.now(timezone.utc) - timedelta(days=7)
        else:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        if not end_date:
            end_dt = datetime.now(timezone.utc)
        else:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        # Generate PDF
        pdf_buffer = await generate_weekly_pdf_report(start_dt, end_dt)

        # Return as downloadable file
        filename = f"api_metrics_report_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"[API Metrics] Error generating report: {e}")
        raise HTTPException(500, f"Error generating report: {str(e)}")
