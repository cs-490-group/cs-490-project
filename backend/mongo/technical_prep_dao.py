from mongo.dao_setup import db_client, TECHNICAL_CHALLENGES, CHALLENGE_ATTEMPTS
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class TechnicalPrepDAO:
    """DAO for managing technical challenges and user attempts"""

    def __init__(self):
        self.challenges_collection = db_client.get_collection(TECHNICAL_CHALLENGES)
        self.attempts_collection = db_client.get_collection(CHALLENGE_ATTEMPTS)

    # ============ CHALLENGE MANAGEMENT ============

    async def create_challenge(self, challenge_data: Dict[str, Any]) -> str:
        """Create a new technical challenge"""
        challenge_data["created_at"] = datetime.now(timezone.utc)
        challenge_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.challenges_collection.insert_one(challenge_data)
        return str(result.inserted_id)

    async def get_challenge(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Get a single challenge by ID"""
        try:
            challenge = await self.challenges_collection.find_one({"_id": ObjectId(challenge_id)})
            if challenge:
                challenge["_id"] = str(challenge["_id"])
            return challenge
        except Exception as e:
            print(f"Error fetching challenge: {e}")
            return None

    async def get_challenges_by_user(self, uuid: str) -> List[Dict[str, Any]]:
        """Get all challenges created by or recommended for a user"""
        cursor = self.challenges_collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_challenges_by_type(self, challenge_type: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get challenges filtered by type (coding, system_design, case_study)"""
        cursor = self.challenges_collection.find({"challenge_type": challenge_type}).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_challenges_by_difficulty(self, difficulty: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get challenges filtered by difficulty"""
        cursor = self.challenges_collection.find({"difficulty": difficulty}).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_challenges_by_role(self, job_role: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get challenges recommended for a specific role"""
        cursor = self.challenges_collection.find({"job_role": job_role}).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_challenges_by_skills(self, skills: List[str], limit: int = 10) -> List[Dict[str, Any]]:
        """Get challenges that match user skills"""
        cursor = self.challenges_collection.find(
            {"required_skills": {"$in": skills}}
        ).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def search_challenges(self, query: str, challenge_type: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Search challenges by title/description"""
        search_filter = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }
        if challenge_type:
            search_filter["challenge_type"] = challenge_type

        cursor = self.challenges_collection.find(search_filter).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_challenge(self, challenge_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a challenge"""
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.challenges_collection.update_one(
            {"_id": ObjectId(challenge_id)},
            {"$set": update_data}
        )
        return result.matched_count > 0

    async def delete_challenge(self, challenge_id: str) -> bool:
        """Delete a challenge"""
        result = await self.challenges_collection.delete_one({"_id": ObjectId(challenge_id)})
        return result.deleted_count > 0

    # ============ CHALLENGE ATTEMPTS ============

    async def create_attempt(self, attempt_data: Dict[str, Any]) -> str:
        """Create a new challenge attempt"""
        attempt_data["created_at"] = datetime.now(timezone.utc)
        result = await self.attempts_collection.insert_one(attempt_data)
        return str(result.inserted_id)

    async def get_attempt(self, attempt_id: str) -> Optional[Dict[str, Any]]:
        """Get a single attempt by ID"""
        try:
            attempt = await self.attempts_collection.find_one({"_id": ObjectId(attempt_id)})
            if attempt:
                attempt["_id"] = str(attempt["_id"])
            return attempt
        except Exception as e:
            print(f"Error fetching attempt: {e}")
            return None

    async def get_user_attempts(self, uuid: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all attempts by a user"""
        cursor = self.attempts_collection.find({"uuid": uuid}).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_challenge_attempts(self, challenge_id: str) -> List[Dict[str, Any]]:
        """Get all attempts for a specific challenge"""
        cursor = self.attempts_collection.find({"challenge_id": challenge_id}).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_user_challenge_attempts(self, uuid: str, challenge_id: str) -> List[Dict[str, Any]]:
        """Get all attempts by a user for a specific challenge"""
        cursor = self.attempts_collection.find({
            "uuid": uuid,
            "challenge_id": challenge_id
        }).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_attempts_by_type(self, uuid: str, challenge_type: str) -> List[Dict[str, Any]]:
        """Get all attempts of a specific type for a user"""
        cursor = self.attempts_collection.find({
            "uuid": uuid,
            "challenge_type": challenge_type
        }).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_attempt(self, attempt_id: str, update_data: Dict[str, Any]) -> bool:
        """Update an attempt"""
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.attempts_collection.update_one(
            {"_id": ObjectId(attempt_id)},
            {"$set": update_data}
        )
        return result.matched_count > 0

    async def complete_attempt(self, attempt_id: str, score: float, passed_tests: int,
                               total_tests: int, code: Optional[str] = None) -> bool:
        """Complete an attempt with results"""
        end_time = datetime.now(timezone.utc)

        # Calculate duration
        attempt = await self.get_attempt(attempt_id)
        if not attempt:
            return False

        duration = int((end_time - attempt["start_time"]).total_seconds())

        update_data = {
            "end_time": end_time,
            "duration_seconds": duration,
            "score": score,
            "passed_tests": passed_tests,
            "failed_tests": total_tests - passed_tests,
            "total_tests": total_tests,
            "status": "completed",
            "updated_at": end_time
        }

        if code:
            update_data["user_code"] = code

        return await self.update_attempt(attempt_id, update_data)

    async def get_user_statistics(self, uuid: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a user"""
        attempts = await self.get_user_attempts(uuid, limit=1000)

        if not attempts:
            return {
                "total_attempts": 0,
                "completed_attempts": 0,
                "average_score": 0,
                "attempts_by_type": {},
                "best_score": 0,
                "total_time_spent_minutes": 0,
                "challenges_by_difficulty": {}
            }

        completed = [a for a in attempts if a.get("status") == "completed"]
        scores = [a.get("score", 0) for a in completed if a.get("score") is not None]

        # Group by type
        attempts_by_type = {}
        for attempt in attempts:
            challenge_type = attempt.get("challenge_type", "unknown")
            attempts_by_type[challenge_type] = attempts_by_type.get(challenge_type, 0) + 1

        # Calculate total time
        total_time = sum(a.get("duration_seconds", 0) for a in completed) // 60

        return {
            "total_attempts": len(attempts),
            "completed_attempts": len(completed),
            "average_score": sum(scores) / len(scores) if scores else 0,
            "attempts_by_type": attempts_by_type,
            "best_score": max(scores) if scores else 0,
            "total_time_spent_minutes": total_time,
            "recent_attempts": attempts[:5]
        }

    async def delete_attempt(self, attempt_id: str) -> bool:
        """Delete an attempt"""
        result = await self.attempts_collection.delete_one({"_id": ObjectId(attempt_id)})
        return result.deleted_count > 0


# Export singleton instance
technical_prep_dao = TechnicalPrepDAO()
