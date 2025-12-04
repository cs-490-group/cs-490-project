from mongo.dao_setup import db_client
from datetime import datetime
from bson import ObjectId
from typing import List, Dict

class AuditDAO:
    def __init__(self):
        # Separate collection for security logs. This is used for the enterprises...
        self.collection = db_client.get_collection("audit_logs")

    async def log_event(self, data: dict) -> bool:
        """
        Record a security/compliance event.
        Fire-and-forget (don't await the result if performance is critical).
        """
        if "timestamp" not in data:
            data["timestamp"] = datetime.utcnow()
            
        await self.collection.insert_one(data)
        return True

    async def get_org_logs(self, org_id: str, limit: int = 100, action_filter: str = None) -> List[Dict]:
        """
        Retrieve logs for an Organization Admin to review.
        """
        query = {"organization_id": org_id}
        if action_filter:
            query["action"] = action_filter
            
        cursor = self.collection.find(query).sort("timestamp", -1).limit(limit)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

audit_dao = AuditDAO()