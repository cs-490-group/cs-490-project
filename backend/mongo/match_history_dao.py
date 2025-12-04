from datetime import datetime, timezone
from typing import Any, Dict, List

from mongo.dao_setup import db_client, MATCH_HISTORY


class MatchHistoryDAO:
    def __init__(self):
        self.collection = db_client.get_collection(MATCH_HISTORY)

    async def log_match(self, uuid: str, match: Dict[str, Any]) -> str:
        """
        match is the dict returned from compute_match_for_job.
        We store a subset + metadata.
        """
        doc = {
            "uuid": uuid,
            "jobId": match.get("jobId"),
            "jobTitle": match.get("jobTitle"),
            "company": match.get("company"),
            "overallScore": match.get("overallScore"),
            "categoryBreakdown": match.get("categoryBreakdown"),
            "profileWarnings": match.get("profileWarnings", []),
            "usedCategories": match.get("usedCategories", {}),
            "generatedAt": match.get("generatedAt"),
            "createdAt": datetime.now(timezone.utc),
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def get_history_for_user(self, uuid: str, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = (
            self.collection.find({"uuid": uuid})
            .sort("createdAt", -1)
            .limit(limit)
        )
        docs: List[Dict[str, Any]] = []
        async for d in cursor:
            d["_id"] = str(d["_id"])
            docs.append(d)
        return docs

    async def get_history_for_job(self, uuid: str, job_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = (
            self.collection.find({"uuid": uuid, "jobId": job_id})
            .sort("createdAt", -1)
            .limit(limit)
        )
        docs: List[Dict[str, Any]] = []
        async for d in cursor:
            d["_id"] = str(d["_id"])
            docs.append(d)
        return docs


match_history_dao = MatchHistoryDAO()
