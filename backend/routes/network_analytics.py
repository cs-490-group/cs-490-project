from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.NetworkAnalytics import NetworkAnalytics, PerformanceGoal, NetworkInsight, TrendAnalysis
from mongo.network_analytics_dao import network_analytics_dao
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from schema.EnhancedNetwork import ROIMetricType
from services.networking_analytics_service import networking_analytics_service

network_analytics_router = APIRouter(prefix="/analytics")


class TrackROIOutcomePayload(BaseModel):
    roi_metric: str
    value_description: str
    source_event_id: str | None = None
    source_contact_id: str | None = None
    monetary_value: float | None = None
    confidence: float = 100.0

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
                "performance_metrics": {
                    "applications_sent": 0,
                    "interviews_scheduled": 0,
                    "interviews_completed": 0,
                    "offers_received": 0,
                    "application_to_interview_rate": 0.0,
                    "interview_to_offer_rate": 0.0,
                    "networking_activities": 0,
                    "referrals_generated": 0
                },
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
            "goals": latest_analytics.get("performance_goals", []) or [],
            "insights": latest_analytics.get("network_insights", []) or [],
            "trends": latest_analytics.get("trend_analyses", []) or []
        }
    except Exception as e:
        # Log error but don't crash
        print(f"Error getting dashboard data for {uuid}: {str(e)}")
        # Return safe defaults
        return {
            "performance_metrics": {
                "applications_sent": 0,
                "interviews_scheduled": 0,
                "interviews_completed": 0,
                "offers_received": 0,
                "application_to_interview_rate": 0.0,
                "interview_to_offer_rate": 0.0,
                "networking_activities": 0,
                "referrals_generated": 0
            },
            "goals": [],
            "insights": [],
            "trends": []
        }


@network_analytics_router.get("/networking/dashboard", tags=["analytics"])
async def get_networking_dashboard(
    period_days: int = 30,
    industry: str = "tech",
    uuid: str = Depends(authorize),
):
    try:
        now = datetime.now(timezone.utc)
        period_start = now - timedelta(days=period_days)
        analytics = await networking_analytics_service.generate_comprehensive_analytics(
            user_uuid=uuid,
            period_start=period_start,
            period_end=now,
            industry=industry,
        )

        # Safely handle enum conversions
        relationship_strength_distribution = {}
        if analytics.relationship_strength_distribution:
            relationship_strength_distribution = {
                (k.value if hasattr(k, "value") else str(k)): v
                for k, v in analytics.relationship_strength_distribution.items()
            }

        opportunities_by_event_type = {}
        if analytics.opportunities_by_event_type:
            opportunities_by_event_type = {
                (k.value if hasattr(k, "value") else str(k)): v
                for k, v in analytics.opportunities_by_event_type.items()
            }

        event_roi_by_type = {}
        if analytics.event_roi_by_type:
            event_roi_by_type = {
                (k.value if hasattr(k, "value") else str(k)): v
                for k, v in analytics.event_roi_by_type.items()
            }

        most_profitable_event_types = []
        if analytics.most_profitable_event_types:
            most_profitable_event_types = [
                (t.value if hasattr(t, "value") else str(t))
                for t in analytics.most_profitable_event_types
            ]

        performance_metrics = {
            "networking_activities": analytics.total_networking_activities or 0,
            "total_contacts_made": analytics.total_contacts_made or 0,
            "quality_conversations_ratio": analytics.quality_conversations_ratio or 0,
            "average_event_satisfaction": analytics.average_event_satisfaction or 0,
        }

        relationship_analytics = {
            "new_relationships": analytics.new_relationships or 0,
            "strengthened_relationships": analytics.strengthened_relationships or 0,
            "relationship_strength_distribution": relationship_strength_distribution,
            "average_trust_score": analytics.average_trust_score or 0,
            "high_value_relationships": analytics.high_value_relationships or 0,
        }

        engagement_analytics = {
            "average_response_rate": analytics.average_response_rate or 0,
            "follow_up_completion_rate": analytics.follow_up_completion_rate or 0,
            "interaction_frequency_trend": analytics.interaction_frequency_trend or "stable",
        }

        opportunity_analytics = {
            "referrals_generated": analytics.referrals_generated or 0,
            "interviews_from_networking": analytics.interviews_from_networking or 0,
            "offers_from_networking": analytics.offers_from_networking or 0,
            "accepted_offers_from_networking": analytics.accepted_offers_from_networking or 0,
            "opportunities_by_event_type": opportunities_by_event_type,
        }

        roi_analytics = {
            "total_investment": analytics.total_investment or 0,
            "total_roi_value": analytics.total_roi_value or 0,
            "roi_percentage": analytics.roi_percentage or 0,
            "event_roi_by_type": event_roi_by_type,
            "most_profitable_event_types": most_profitable_event_types,
            "cost_per_opportunity": analytics.cost_per_opportunity or 0,
            "time_to_opportunity": analytics.time_to_opportunity or 0,
            "best_conversion_channels": analytics.best_conversion_channels or [],
        }

        return {
            "performance_metrics": performance_metrics,
            "relationship_analytics": relationship_analytics,
            "engagement_analytics": engagement_analytics,
            "opportunity_analytics": opportunity_analytics,
            "roi_analytics": roi_analytics,
            "industry_benchmarks": analytics.industry_benchmarks or {},
            "improvement_recommendations": analytics.improvement_recommendations or [],
        }
    except Exception as e:
        # Log the error for debugging but return safe defaults
        print(f"Error generating networking dashboard for {uuid}: {str(e)}")
        # Return empty but valid dashboard structure
        return {
            "performance_metrics": {
                "networking_activities": 0,
                "total_contacts_made": 0,
                "quality_conversations_ratio": 0,
                "average_event_satisfaction": 0,
            },
            "relationship_analytics": {
                "new_relationships": 0,
                "strengthened_relationships": 0,
                "relationship_strength_distribution": {},
                "average_trust_score": 0,
                "high_value_relationships": 0,
            },
            "engagement_analytics": {
                "average_response_rate": 0,
                "follow_up_completion_rate": 0,
                "interaction_frequency_trend": "stable",
            },
            "opportunity_analytics": {
                "referrals_generated": 0,
                "interviews_from_networking": 0,
                "offers_from_networking": 0,
                "accepted_offers_from_networking": 0,
                "opportunities_by_event_type": {},
            },
            "roi_analytics": {
                "total_investment": 0,
                "total_roi_value": 0,
                "roi_percentage": 0,
                "event_roi_by_type": {},
                "most_profitable_event_types": [],
                "cost_per_opportunity": 0,
                "time_to_opportunity": 0,
                "best_conversion_channels": [],
            },
            "industry_benchmarks": {},
            "improvement_recommendations": ["Start by adding networking events to track your activities"],
        }


@network_analytics_router.post("/networking/roi-outcome", tags=["analytics"])
async def track_networking_roi_outcome(
    payload: TrackROIOutcomePayload,
    uuid: str = Depends(authorize),
):
    try:
        try:
            metric_enum = ROIMetricType(payload.roi_metric)
        except ValueError:
            raise HTTPException(400, "Invalid ROI metric type")

        analytics_id = await networking_analytics_service.track_roi_outcome(
            user_uuid=uuid,
            roi_metric=metric_enum,
            value_description=payload.value_description,
            source_event_id=payload.source_event_id,
            source_contact_id=payload.source_contact_id,
            monetary_value=payload.monetary_value,
            confidence=payload.confidence,
        )

        return {"analytics_id": analytics_id}
    except HTTPException:
        raise
    except Exception as e:
        # Log error but provide meaningful response
        print(f"Error tracking ROI outcome for {uuid}: {str(e)}")
        raise HTTPException(500, "Failed to track ROI outcome. Please try again.")

