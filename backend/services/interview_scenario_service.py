"""
Interview Scenario Generation Service

This service generates mock interview scenarios based on a user's target role, industry, and difficulty level.
It orchestrates the question bank to build a structured interview progression.
"""

import uuid
from typing import Dict, List, Any, Optional
from mongo.dao_setup import db_client

class InterviewScenarioService:
    """Service for generating interview scenarios and managing interview progression"""

    def __init__(self):
        self.db = db_client
        self.question_collection = db_client["questions"]
        self.role_collection = db_client["question_roles"]
        self.industry_collection = db_client["question_industries"]

    async def generate_interview_scenario(
        self,
        role_uuid: str,
        industry_uuid: str,
        difficulty_level: str,
        include_behavioral: bool = True,
        include_technical: bool = True,
        include_situational: bool = True,
        num_questions: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete interview scenario with a structured question progression.

        Args:
            role_uuid: UUID of the target role
            industry_uuid: UUID of the target industry
            difficulty_level: entry, mid, or senior
            include_behavioral: Include behavioral questions
            include_technical: Include technical questions
            include_situational: Include situational questions
            num_questions: Override total questions count (useful for testing)

        Returns:
            Dictionary with scenario details including question progression
        """

        # Fetch role and industry details
        role = await self.role_collection.find_one({"uuid": role_uuid})
        industry = await self.industry_collection.find_one({"uuid": industry_uuid})

        if not role or not industry:
            raise ValueError(f"Invalid role_uuid or industry_uuid provided")

        # Get questions by category and difficulty from the question bank
        behavioral_questions = await self._get_questions_by_category_difficulty(
            role_uuid, "behavioral", difficulty_level
        )
        technical_questions = await self._get_questions_by_category_difficulty(
            role_uuid, "technical", difficulty_level
        )
        situational_questions = await self._get_questions_by_category_difficulty(
            role_uuid, "situational", difficulty_level
        )
        company_questions = await self._get_questions_by_category_difficulty(
            role_uuid, "company", difficulty_level
        )

        # Build question sequence based on interview progression
        # Standard progression: Behavioral → Technical → Situational → Company
        question_sequence = []
        question_categories = {"behavioral": 0, "technical": 0, "situational": 0, "company": 0}

        # Determine how many questions of each type (flexible based on difficulty)
        if difficulty_level == "entry":
            counts = {
                "behavioral": 3 if include_behavioral else 0,
                "technical": 2 if include_technical else 0,
                "situational": 2 if include_situational else 0,
                "company": 1
            }
            estimated_duration = 30
        elif difficulty_level == "mid":
            counts = {
                "behavioral": 4 if include_behavioral else 0,
                "technical": 3 if include_technical else 0,
                "situational": 2 if include_situational else 0,
                "company": 1
            }
            estimated_duration = 45
        else:  # senior
            counts = {
                "behavioral": 3 if include_behavioral else 0,
                "technical": 4 if include_technical else 0,
                "situational": 2 if include_situational else 0,
                "company": 1
            }
            estimated_duration = 60

        # Override counts if num_questions is specified (for testing)
        if num_questions:
            total = num_questions
            if include_behavioral and include_technical and include_situational:
                counts = {
                    "behavioral": max(1, total // 3),
                    "technical": max(1, total // 3),
                    "situational": max(1, total // 3),
                    "company": total - (total // 3) * 3
                }
            else:
                # Simplified distribution if not all types included
                counts = {
                    "behavioral": total // 2 if include_behavioral else 0,
                    "technical": total // 2 if include_technical else 0,
                    "situational": 0 if not include_situational else 1,
                    "company": total - (total // 2 * 2) if total % 2 else 0
                }

        # Build question progression
        # Behavioral questions first (warm-up)
        if include_behavioral and behavioral_questions:
            selected = self._select_random_questions(
                behavioral_questions,
                min(counts["behavioral"], len(behavioral_questions))
            )
            question_sequence.extend(selected)
            question_categories["behavioral"] = len(selected)

        # Technical questions middle (core challenge)
        if include_technical and technical_questions:
            selected = self._select_random_questions(
                technical_questions,
                min(counts["technical"], len(technical_questions))
            )
            question_sequence.extend(selected)
            question_categories["technical"] = len(selected)

        # Situational questions (application of knowledge)
        if include_situational and situational_questions:
            selected = self._select_random_questions(
                situational_questions,
                min(counts["situational"], len(situational_questions))
            )
            question_sequence.extend(selected)
            question_categories["situational"] = len(selected)

        # Company questions (closing)
        if company_questions:
            selected = self._select_random_questions(
                company_questions,
                min(counts["company"], len(company_questions))
            )
            question_sequence.extend(selected)
            question_categories["company"] = len(selected)

        # If no questions were selected (shouldn't happen in normal operation),
        # fallback to at least getting some questions
        if not question_sequence:
            all_questions = behavioral_questions + technical_questions + situational_questions + company_questions
            if all_questions:
                question_sequence = self._select_random_questions(all_questions, min(5, len(all_questions)))
            else:
                raise ValueError(f"No questions available for role {role_uuid} at difficulty {difficulty_level}")

        # Create scenario name and description
        scenario_name = f"{role['name']} - {difficulty_level.title()} Interview"
        scenario_description = (
            f"Mock interview for {role['name']} position in {industry['name']}. "
            f"This {difficulty_level}-level interview includes "
            f"{question_categories['behavioral']} behavioral, "
            f"{question_categories['technical']} technical, "
            f"{question_categories['situational']} situational, and "
            f"{question_categories['company']} company-specific questions. "
            f"Estimated duration: {estimated_duration} minutes."
        )

        return {
            "role_name": role["name"],
            "industry_name": industry["name"],
            "difficulty_level": difficulty_level,
            "scenario_name": scenario_name,
            "scenario_description": scenario_description,
            "behavioral_questions": [q["uuid"] for q in behavioral_questions if q["uuid"] in question_sequence],
            "technical_questions": [q["uuid"] for q in technical_questions if q["uuid"] in question_sequence],
            "situational_questions": [q["uuid"] for q in situational_questions if q["uuid"] in question_sequence],
            "company_questions": [q["uuid"] for q in company_questions if q["uuid"] in question_sequence],
            "question_sequence": question_sequence,  # Ordered list of question UUIDs
            "question_categories": question_categories,
            "total_questions": len(question_sequence),
            "estimated_duration_minutes": estimated_duration
        }

    async def _get_questions_by_category_difficulty(
        self,
        role_uuid: str,
        category: str,
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """
        Get questions filtered by role, category, and difficulty.
        Returns full question documents (needed for fetching during interview).
        """
        cursor = self.question_collection.find({
            "role_uuid": role_uuid,
            "category": category,
            "difficulty": difficulty
        })
        questions = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            questions.append(doc)
        return questions

    @staticmethod
    def _select_random_questions(questions: List[Dict], count: int) -> List[str]:
        """
        Select a random subset of questions and return their UUIDs.
        This uses a simple selection algorithm (in production, could use weighted random).
        """
        if count >= len(questions):
            return [q["uuid"] for q in questions]

        # Simple random selection (pseudo-random based on list order)
        import random
        selected = random.sample(questions, count)
        return [q["uuid"] for q in selected]

    async def get_question_details(self, question_uuid: str) -> Optional[Dict[str, Any]]:
        """
        Get full details of a specific question for display during interview.
        """
        doc = await self.question_collection.find_one({"uuid": question_uuid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def get_questions_in_sequence(self, question_uuids: List[str]) -> List[Dict[str, Any]]:
        """
        Get full details for multiple questions in order.
        """
        questions = []
        for uuid in question_uuids:
            question = await self.get_question_details(uuid)
            if question:
                questions.append(question)
        return questions
