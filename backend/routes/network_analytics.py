from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.NetworkAnalytics import NetworkAnalytics, PerformanceGoal, NetworkInsight, TrendAnalysis
from mongo.network_analytics_dao import network_analytics_dao

network_analytics_router = APIRouter(prefix="/analytics")

@network_analytics_router.post("", tags=["analytics"])
async def create_analytics_record(analytics: NetworkAnalytics, uuid: str = Depends(authorize)):
    try:
        model = analytics.model_dump()
        model["uuid"] = uuid
        result = await network_analytics_dao.add_analytics_record(model)
        return {"analytics_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.get("", tags=["analytics"])
async def get_all_analytics(uuid: str = Depends(authorize)):
    try:
        results = await network_analytics_dao.get_all_analytics(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.get("/latest", tags=["analytics"])
async def get_latest_analytics(uuid: str = Depends(authorize)):
    try:
        result = await network_analytics_dao.get_latest_analytics(uuid)
        if not result:
            raise HTTPException(404, "No analytics data found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.get("/{analytics_id}", tags=["analytics"])
async def get_analytics(analytics_id: str, uuid: str = Depends(authorize)):
    try:
        result = await network_analytics_dao.get_analytics(analytics_id)
        if not result:
            raise HTTPException(404, "Analytics not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.put("/{analytics_id}", tags=["analytics"])
async def update_analytics(analytics_id: str, analytics: NetworkAnalytics, uuid: str = Depends(authorize)):
    try:
        result = await network_analytics_dao.update_analytics(analytics_id, analytics.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Analytics not found")
        return {"detail": "Analytics updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.delete("/{analytics_id}", tags=["analytics"])
async def delete_analytics(analytics_id: str, uuid: str = Depends(authorize)):
    try:
        result = await network_analytics_dao.delete_analytics(analytics_id)
        if result == 0:
            raise HTTPException(404, "Analytics not found")
        return {"detail": "Analytics deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.get("/range", tags=["analytics"])
async def get_analytics_by_date_range(
    start_date: str, 
    end_date: str, 
    uuid: str = Depends(authorize)
):
    try:
        results = await network_analytics_dao.get_analytics_by_date_range(uuid, start_date, end_date)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.post("/goals", tags=["analytics"])
async def create_performance_goal(goal: PerformanceGoal, uuid: str = Depends(authorize)):
    try:
        # For now, store goals in the latest analytics record
        latest_analytics = await network_analytics_dao.get_latest_analytics(uuid)
        if not latest_analytics:
            # Create new analytics record if none exists
            analytics_data = {"performance_goals": [goal.model_dump()]}
            result = await network_analytics_dao.add_analytics_record({
                **analytics_data,
                "uuid": uuid,
                "analytics_date": goal.start_date,
                "period_type": "custom",
                "period_start": goal.start_date,
                "period_end": goal.target_date
            })
        else:
            # Add goal to existing analytics
            current_goals = latest_analytics.get("performance_goals", [])
            current_goals.append(goal.model_dump())
            update_data = {"performance_goals": current_goals}
            result = await network_analytics_dao.update_analytics(latest_analytics["_id"], update_data)
        
        return {"detail": "Performance goal created successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.post("/insights", tags=["analytics"])
async def create_network_insight(insight: NetworkInsight, uuid: str = Depends(authorize)):
    try:
        # For now, store insights in the latest analytics record
        latest_analytics = await network_analytics_dao.get_latest_analytics(uuid)
        if not latest_analytics:
            # Create new analytics record if none exists
            analytics_data = {"network_insights": [insight.model_dump()]}
            result = await network_analytics_dao.add_analytics_record({
                **analytics_data,
                "uuid": uuid,
                "analytics_date": insight.insight_date,
                "period_type": "daily",
                "period_start": insight.insight_date,
                "period_end": insight.insight_date
            })
        else:
            # Add insight to existing analytics
            current_insights = latest_analytics.get("network_insights", [])
            current_insights.append(insight.model_dump())
            update_data = {"network_insights": current_insights}
            result = await network_analytics_dao.update_analytics(latest_analytics["_id"], update_data)
        
        return {"detail": "Network insight created successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.post("/trends", tags=["analytics"])
async def create_trend_analysis(trend: TrendAnalysis, uuid: str = Depends(authorize)):
    try:
        # For now, store trends in the latest analytics record
        latest_analytics = await network_analytics_dao.get_latest_analytics(uuid)
        if not latest_analytics:
            # Create new analytics record if none exists
            analytics_data = {"trend_analyses": [trend.model_dump()]}
            result = await network_analytics_dao.add_analytics_record({
                **analytics_data,
                "uuid": uuid,
                "analytics_date": trend.analysis_period,
                "period_type": "custom",
                "period_start": trend.analysis_period,
                "period_end": trend.analysis_period
            })
        else:
            # Add trend to existing analytics
            current_trends = latest_analytics.get("trend_analyses", [])
            current_trends.append(trend.model_dump())
            update_data = {"trend_analyses": current_trends}
            result = await network_analytics_dao.update_analytics(latest_analytics["_id"], update_data)
        
        return {"detail": "Trend analysis created successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_analytics_router.get("/dashboard", tags=["analytics"])
async def get_dashboard_data(uuid: str = Depends(authorize)):
    try:
        # Get latest analytics data
        latest_analytics = await network_analytics_dao.get_latest_analytics(uuid)
        if not latest_analytics:
            # Return empty dashboard structure
            return {
                "performance_metrics": {},
                "goals": [],
                "insights": [],
                "trends": []
            }
        
        return {
            "performance_metrics": {
                "applications_sent": latest_analytics.get("applications_sent", 0),
                "interviews_scheduled": latest_analytics.get("interviews_scheduled", 0),
                "interviews_completed": latest_analytics.get("interviews_completed", 0),
                "offers_received": latest_analytics.get("offers_received", 0),
                "application_to_interview_rate": latest_analytics.get("application_to_interview_rate", 0.0),
                "interview_to_offer_rate": latest_analytics.get("interview_to_offer_rate", 0.0),
                "networking_activities": latest_analytics.get("networking_activities", 0),
                "referrals_generated": latest_analytics.get("referrals_generated", 0)
            },
            "goals": latest_analytics.get("performance_goals", []),
            "insights": latest_analytics.get("network_insights", []),
            "trends": latest_analytics.get("trend_analyses", [])
        }
    except Exception as e:
        raise HTTPException(500, str(e))
