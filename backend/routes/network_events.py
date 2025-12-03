from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.NetworkEvent import NetworkingEvent, EventPreparation, EventFollowUp
from mongo.network_events_dao import network_events_dao

network_events_router = APIRouter(prefix="/events")

@network_events_router.post("", tags=["events"])
async def create_event(event: NetworkingEvent, uuid: str = Depends(authorize)):
    try:
        model = event.model_dump()
        model["uuid"] = uuid
        result = await network_events_dao.add_event(model)
        return {"event_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.get("", tags=["events"])
async def get_all_events(uuid: str = Depends(authorize)):
    try:
        results = await network_events_dao.get_all_events(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.get("/{event_id}", tags=["events"])
async def get_event(event_id: str, uuid: str = Depends(authorize)):
    try:
        result = await network_events_dao.get_event(event_id)
        if not result:
            raise HTTPException(404, "Event not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.put("/{event_id}", tags=["events"])
async def update_event(event_id: str, event: NetworkingEvent, uuid: str = Depends(authorize)):
    try:
        result = await network_events_dao.update_event(event_id, event.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Event not found")
        return {"detail": "Event updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.delete("/{event_id}", tags=["events"])
async def delete_event(event_id: str, uuid: str = Depends(authorize)):
    try:
        result = await network_events_dao.delete_event(event_id)
        if result == 0:
            raise HTTPException(404, "Event not found")
        return {"detail": "Event deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.get("/upcoming", tags=["events"])
async def get_upcoming_events(uuid: str = Depends(authorize)):
    try:
        results = await network_events_dao.get_upcoming_events(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.get("/past", tags=["events"])
async def get_past_events(uuid: str = Depends(authorize)):
    try:
        results = await network_events_dao.get_past_events(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.get("/range", tags=["events"])
async def get_events_by_date_range(
    start_date: str, 
    end_date: str, 
    uuid: str = Depends(authorize)
):
    try:
        results = await network_events_dao.get_events_by_date_range(uuid, start_date, end_date)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.post("/{event_id}/preparation", tags=["events"])
async def add_event_preparation(event_id: str, preparation: EventPreparation, uuid: str = Depends(authorize)):
    try:
        # Verify event belongs to user
        event = await network_events_dao.get_event(event_id)
        if not event or event.get("uuid") != uuid:
            raise HTTPException(404, "Event not found")
        
        # Store preparation as part of event or separate collection
        update_data = {"preparation_data": preparation.model_dump()}
        result = await network_events_dao.update_event(event_id, update_data)
        return {"detail": "Event preparation added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@network_events_router.post("/{event_id}/followup", tags=["events"])
async def add_event_follow_up(event_id: str, follow_up: EventFollowUp, uuid: str = Depends(authorize)):
    try:
        # Verify event belongs to user
        event = await network_events_dao.get_event(event_id)
        if not event or event.get("uuid") != uuid:
            raise HTTPException(404, "Event not found")
        
        # Add follow-up to event's follow_up_actions list
        current_followups = event.get("follow_up_actions", [])
        follow_up_data = follow_up.model_dump()
        current_followups.append(follow_up_data)
        
        update_data = {"follow_up_actions": current_followups}
        result = await network_events_dao.update_event(event_id, update_data)
        return {"detail": "Event follow-up added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
