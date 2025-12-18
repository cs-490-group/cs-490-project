from datetime import datetime, timezone
from bson import ObjectId

from mongo.dao_setup import db_client, PROBLEM_SUBMISSIONS


class ProblemSubmissionsDAO:
    def __init__(self):
        self.collection = db_client.get_collection(PROBLEM_SUBMISSIONS)

    def _serialize(self, doc: dict) -> dict:
        if not doc:
            return doc
        doc["_id"] = str(doc.get("_id"))
        for k in ["date_created", "date_updated", "submission_date"]:
            if k in doc and doc[k]:
                if isinstance(doc[k], str):
                    continue
                doc[k] = doc[k].isoformat()
        return doc

    async def list_submissions(self, uuid: str, platform: str) -> list:
        cursor = self.collection.find({"user_id": uuid, "platform": platform})
        submissions = []
        async for s in cursor:
            submissions.append(self._serialize(s))
        submissions.sort(key=lambda x: x.get("submission_date") or x.get("date_created") or "", reverse=True)
        return submissions

    async def create_submission(self, uuid: str, platform: str, data: dict) -> str:
        now = datetime.now(timezone.utc)
        doc = {
            "_id": str(ObjectId()),
            "user_id": uuid,
            "platform": platform,
            "problem_title": data.get("problem_title"),
            "description": data.get("description"),
            "difficulty": data.get("difficulty"),
            "language": data.get("language"),
            "submission_date": data.get("submission_date") or now,
            "date_created": now,
            "date_updated": now,
        }
        await self.collection.insert_one(doc)
        return doc["_id"]

    async def get_submission(self, uuid: str, submission_id: str) -> dict | None:
        doc = await self.collection.find_one({"user_id": uuid, "_id": submission_id})
        return self._serialize(doc) if doc else None

    async def update_submission(self, uuid: str, submission_id: str, patch: dict) -> int:
        patch = {k: v for k, v in patch.items() if v is not None}
        patch["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"user_id": uuid, "_id": submission_id}, {"$set": patch})
        return updated.matched_count

    async def delete_submission(self, uuid: str, submission_id: str) -> int:
        res = await self.collection.delete_one({"user_id": uuid, "_id": submission_id})
        return res.deleted_count


problem_submissions_dao = ProblemSubmissionsDAO()

