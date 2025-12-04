"""
Writing Practice DAO
Handles all database operations for writing practice sessions and responses
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from bson import ObjectId


class WritingPracticeDAO:
    """Data Access Object for writing practice sessions"""

    def __init__(self, db_client):
        self.db = db_client
        self.sessions_collection = db_client["writing_practice_sessions"]
        self.questions_collection = db_client["writing_practice_questions"]

    # ============ SESSION MANAGEMENT ============

    async def create_session(self, session_data: Dict[str, Any]) -> str:
        """Create a new writing practice session"""
        session_data["created_at"] = datetime.now(timezone.utc)
        session_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.sessions_collection.insert_one(session_data)
        return str(result.inserted_id)

    async def update_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """Update an existing session"""
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific session by ID"""
        try:
            session = await self.sessions_collection.find_one({"_id": ObjectId(session_id)})
            if session:
                session["_id"] = str(session["_id"])
            return session
        except Exception as e:
            print(f"Error fetching session: {e}")
            return None

    async def get_user_sessions(self, uuid: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all sessions for a user"""
        try:
            cursor = self.sessions_collection.find({"uuid": uuid}).sort("created_at", -1).limit(limit)
            sessions = []
            async for session in cursor:
                session["_id"] = str(session["_id"])
                sessions.append(session)
            return sessions
        except Exception as e:
            print(f"Error fetching user sessions: {e}")
            return []

    async def get_sessions_by_question(self, uuid: str, question_id: str) -> List[Dict[str, Any]]:
        """Get all sessions for a user on a specific question"""
        try:
            cursor = self.sessions_collection.find({
                "uuid": uuid,
                "question_id": question_id
            }).sort("created_at", -1)
            sessions = []
            async for session in cursor:
                session["_id"] = str(session["_id"])
                sessions.append(session)
            return sessions
        except Exception as e:
            print(f"Error fetching sessions by question: {e}")
            return []

    async def get_latest_session(self, uuid: str, question_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get the latest session for a user (optionally for a specific question)"""
        try:
            query = {"uuid": uuid}
            if question_id:
                query["question_id"] = question_id

            session = await self.sessions_collection.find_one(query, sort=[("created_at", -1)])
            if session:
                session["_id"] = str(session["_id"])
            return session
        except Exception as e:
            print(f"Error fetching latest session: {e}")
            return None

    # ============ QUESTION MANAGEMENT ============

    async def create_question(self, question_data: Dict[str, Any]) -> str:
        """Create a new writing practice question"""
        question_data["created_at"] = datetime.now(timezone.utc)
        result = await self.questions_collection.insert_one(question_data)
        return str(result.inserted_id)

    async def get_question(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific question by ID"""
        try:
            question = await self.questions_collection.find_one({"_id": ObjectId(question_id)})
            if question:
                question["_id"] = str(question["_id"])
            return question
        except Exception as e:
            print(f"Error fetching question: {e}")
            return None

    async def get_all_questions(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all questions, optionally filtered by category"""
        try:
            query = {}
            if category:
                query["category"] = category

            cursor = self.questions_collection.find(query).sort("created_at", 1)
            questions = []
            async for question in cursor:
                question["_id"] = str(question["_id"])
                questions.append(question)
            return questions
        except Exception as e:
            print(f"Error fetching questions: {e}")
            return []

    async def get_random_question(self, category: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a random question, optionally from a specific category"""
        try:
            query = {}
            if category:
                query["category"] = category

            # Use aggregation to get random document
            pipeline = [
                {"$match": query},
                {"$sample": {"size": 1}}
            ]
            cursor = self.questions_collection.aggregate(pipeline)
            async for question in cursor:
                question["_id"] = str(question["_id"])
                return question
            return None
        except Exception as e:
            print(f"Error fetching random question: {e}")
            return None

    # ============ STATISTICS & TRACKING ============

    async def get_user_stats(self, uuid: str) -> Dict[str, Any]:
        """Get writing practice statistics for a user"""
        try:
            sessions = await self.get_user_sessions(uuid, limit=1000)

            if not sessions:
                return {
                    "total_sessions": 0,
                    "average_clarity": 0,
                    "average_professionalism": 0,
                    "average_structure": 0,
                    "total_words_written": 0,
                    "improvement_trend": []
                }

            total_clarity = sum(s.get("clarity_score", 0) for s in sessions)
            total_professionalism = sum(s.get("professionalism_score", 0) for s in sessions)
            total_structure = sum(s.get("structure_score", 0) for s in sessions)
            total_words = sum(s.get("word_count", 0) for s in sessions)

            return {
                "total_sessions": len(sessions),
                "average_clarity": round(total_clarity / len(sessions), 2) if sessions else 0,
                "average_professionalism": round(total_professionalism / len(sessions), 2) if sessions else 0,
                "average_structure": round(total_structure / len(sessions), 2) if sessions else 0,
                "total_words_written": total_words,
                "latest_session": sessions[0] if sessions else None,
                "improvement_trend": self._calculate_trend(sessions)
            }
        except Exception as e:
            print(f"Error calculating stats: {e}")
            return {}

    @staticmethod
    def _calculate_trend(sessions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate improvement trend from sessions"""
        if len(sessions) < 2:
            return []

        trend = []
        for i in range(min(5, len(sessions) - 1)):
            current = sessions[i]
            previous = sessions[i + 1]

            clarity_delta = current.get("clarity_score", 0) - previous.get("clarity_score", 0)
            professionalism_delta = current.get("professionalism_score", 0) - previous.get("professionalism_score", 0)
            structure_delta = current.get("structure_score", 0) - previous.get("structure_score", 0)

            trend.append({
                "session_date": current.get("created_at"),
                "clarity_delta": round(clarity_delta, 2),
                "professionalism_delta": round(professionalism_delta, 2),
                "structure_delta": round(structure_delta, 2),
                "overall_delta": round((clarity_delta + professionalism_delta + structure_delta) / 3, 2)
            })

        return trend
