from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.NetworkCampaign import NetworkCampaign, CampaignOutreach, CampaignAnalytics
from mongo.network_campaigns_dao import network_campaigns_dao

network_campaigns_router = APIRouter(prefix="/campaigns")

@network_campaigns_router.post("", tags=["campaigns"])
async def create_campaign(campaign: NetworkCampaign, uuid: str = Depends(authorize)):
    try:
        model = campaign.model_dump()
        model["uuid"] = uuid
        result = await network_campaigns_dao.add_campaign(model)
        return {"campaign_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.get("", tags=["campaigns"])
async def get_all_campaigns(uuid: str = Depends(authorize)):
    try:
        results = await network_campaigns_dao.get_all_campaigns(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.get("/{campaign_id}", tags=["campaigns"])
async def get_campaign(campaign_id: str, uuid: str = Depends(authorize)):
    try:
        result = await network_campaigns_dao.get_campaign(campaign_id)
        if not result:
            raise HTTPException(404, "Campaign not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.put("/{campaign_id}", tags=["campaigns"])
async def update_campaign(campaign_id: str, campaign: NetworkCampaign, uuid: str = Depends(authorize)):
    try:
        result = await network_campaigns_dao.update_campaign(campaign_id, campaign.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Campaign not found")
        return {"detail": "Campaign updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.delete("/{campaign_id}", tags=["campaigns"])
async def delete_campaign(campaign_id: str, uuid: str = Depends(authorize)):
    try:
        result = await network_campaigns_dao.delete_campaign(campaign_id)
        if result == 0:
            raise HTTPException(404, "Campaign not found")
        return {"detail": "Campaign deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.get("/active", tags=["campaigns"])
async def get_active_campaigns(uuid: str = Depends(authorize)):
    try:
        results = await network_campaigns_dao.get_active_campaigns(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.get("/completed", tags=["campaigns"])
async def get_completed_campaigns(uuid: str = Depends(authorize)):
    try:
        results = await network_campaigns_dao.get_completed_campaigns(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.post("/{campaign_id}/outreach", tags=["campaigns"])
async def add_campaign_outreach(campaign_id: str, outreach: CampaignOutreach, uuid: str = Depends(authorize)):
    try:
        # Verify campaign belongs to user
        campaign = await network_campaigns_dao.get_campaign(campaign_id)
        if not campaign or campaign.get("uuid") != uuid:
            raise HTTPException(404, "Campaign not found")
        
        # Add outreach to campaign
        current_outreach = campaign.get("outreach_activities", [])
        outreach_data = outreach.model_dump()
        current_outreach.append(outreach_data)
        
        # Update campaign counts
        current_count = campaign.get("current_outreach_count", 0)
        update_data = {
            "outreach_activities": current_outreach,
            "current_outreach_count": current_count + 1
        }
        
        # Update response count if needed
        if outreach.response_status == "responded":
            response_count = campaign.get("current_response_count", 0)
            update_data["current_response_count"] = response_count + 1
        
        # Update meeting count if needed
        if outreach.meeting_scheduled:
            meeting_count = campaign.get("current_meeting_count", 0)
            update_data["current_meeting_count"] = meeting_count + 1
        
        result = await network_campaigns_dao.update_campaign(campaign_id, update_data)
        return {"detail": "Campaign outreach added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.post("/{campaign_id}/analytics", tags=["campaigns"])
async def add_campaign_analytics(campaign_id: str, analytics: CampaignAnalytics, uuid: str = Depends(authorize)):
    try:
        # Verify campaign belongs to user
        campaign = await network_campaigns_dao.get_campaign(campaign_id)
        if not campaign or campaign.get("uuid") != uuid:
            raise HTTPException(404, "Campaign not found")
        
        # Add analytics to campaign
        current_analytics = campaign.get("analytics_reports", [])
        analytics_data = analytics.model_dump()
        current_analytics.append(analytics_data)
        
        update_data = {
            "analytics_reports": current_analytics,
            "performance_tracking": analytics_data
        }
        
        result = await network_campaigns_dao.update_campaign(campaign_id, update_data)
        return {"detail": "Campaign analytics added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_campaigns_router.put("/{campaign_id}/status", tags=["campaigns"])
async def update_campaign_status(campaign_id: str, status_data: dict, uuid: str = Depends(authorize)):
    try:
        # Verify campaign belongs to user
        campaign = await network_campaigns_dao.get_campaign(campaign_id)
        if not campaign or campaign.get("uuid") != uuid:
            raise HTTPException(404, "Campaign not found")
        
        # Update campaign status and related fields
        update_data = {
            "status": status_data.get("status"),
            "effectiveness_rating": status_data.get("effectiveness_rating"),
            "lessons_learned": status_data.get("lessons_learned"),
            "roi_metrics": status_data.get("roi_metrics")
        }
        
        result = await network_campaigns_dao.update_campaign(campaign_id, update_data)
        return {"detail": "Campaign status updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
