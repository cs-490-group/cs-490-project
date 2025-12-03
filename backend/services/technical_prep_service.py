import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from mongo.technical_prep_dao import technical_prep_dao
from schema.TechnicalChallenge import (
    TechnicalChallenge, CodingChallenge, TestCase, SolutionFramework,
    SystemDesignQuestion, CaseStudy, ChallengeAttempt
)

# Default coding challenges templates
CODING_CHALLENGES_TEMPLATES = [
    {
        "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
        "difficulty": "easy",
        "required_languages": ["Python", "JavaScript", "Java"],
        "required_skills": ["Arrays", "Hash Maps"],
        "time_limit_minutes": 30,
        "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
        "example_input": "nums = [2,7,11,15], target = 9",
        "example_output": "[0,1]",
        "coding_challenge": {
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
            "difficulty": "easy",
            "required_languages": ["Python", "JavaScript", "Java"],
            "required_skills": ["Arrays", "Hash Maps"],
            "time_limit_minutes": 30,
            "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
            "test_cases": [
                {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected_output": [0, 1], "description": "Basic case"},
                {"input": {"nums": [3, 2, 4], "target": 6}, "expected_output": [1, 2], "description": "Another case"},
            ],
            "solution_framework": {
                "title": "Hash Map Approach",
                "overview": "Use a hash map to store values and their indices for O(n) solution",
                "steps": [
                    "Create an empty hash map",
                    "Iterate through the array",
                    "For each number, check if (target - number) exists in hash map",
                    "If exists, return both indices",
                    "Otherwise, add current number and index to hash map"
                ],
                "pseudocode": """
hash_map = {}
for i, num in enumerate(nums):
    complement = target - num
    if complement in hash_map:
        return [hash_map[complement], i]
    hash_map[num] = i
return []
                """,
                "time_complexity": "O(n)",
                "space_complexity": "O(n)",
                "common_mistakes": [
                    "Using nested loops (O(n^2)) instead of hash map",
                    "Not handling duplicate values correctly",
                    "Using same element twice"
                ],
                "alternative_approaches": [
                    "Brute force nested loops O(n^2)",
                    "Two pointer approach on sorted array"
                ],
                "real_world_correlation": "This appears in recommendation systems where you need to find matching pairs efficiently",
                "whiteboard_checklist": [
                    "Clarify if we can use the same element twice",
                    "Confirm return format (indices or values)",
                    "Discuss space/time tradeoffs"
                ]
            },
            "follow_up_questions": [
                "What if we need to return all pairs?",
                "Can we solve it with O(1) space?",
                "How would you handle duplicates?"
            ]
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["array", "hash-map", "two-pointer"]
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "description": "Given a string s, find the length of the longest substring without repeating characters.",
        "difficulty": "medium",
        "required_languages": ["Python", "JavaScript", "Java"],
        "required_skills": ["Strings", "Sliding Window"],
        "time_limit_minutes": 40,
        "constraints": ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces"],
        "coding_challenge": {
            "title": "Longest Substring Without Repeating Characters",
            "description": "Given a string s, find the length of the longest substring without repeating characters.",
            "difficulty": "medium",
            "required_languages": ["Python", "JavaScript", "Java"],
            "required_skills": ["Strings", "Sliding Window"],
            "time_limit_minutes": 40,
            "constraints": ["0 <= s.length <= 5 * 10^4"],
            "test_cases": [
                {"input": {"s": "abcabcbb"}, "expected_output": 3, "description": "abc"},
                {"input": {"s": "bbbbb"}, "expected_output": 1, "description": "b"},
                {"input": {"s": "pwwkew"}, "expected_output": 3, "description": "wke"},
            ],
            "solution_framework": {
                "title": "Sliding Window with Hash Set",
                "overview": "Use sliding window technique with a hash set to track characters",
                "steps": [
                    "Initialize left pointer and empty hash set",
                    "Expand right pointer and add characters",
                    "If duplicate found, shrink from left until no duplicate",
                    "Track maximum length"
                ],
                "time_complexity": "O(n)",
                "space_complexity": "O(min(m, n)) where m is charset size",
                "common_mistakes": [
                    "Not removing characters when shrinking window",
                    "Not tracking max length correctly"
                ],
                "alternative_approaches": [
                    "Using dictionary to track character indices",
                    "Two nested loops (O(n^2))"
                ],
                "real_world_correlation": "Token identification in compilers uses similar sliding window concepts",
                "whiteboard_checklist": [
                    "Define what 'substring' means",
                    "Discuss charset size implications",
                    "Explain sliding window movement"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["string", "sliding-window", "hash-set"]
    }
]

# System design questions templates
SYSTEM_DESIGN_TEMPLATES = [
    {
        "title": "Design a URL Shortening Service",
        "challenge_type": "system_design",
        "difficulty": "senior",
        "required_skills": ["Database Design", "API Design", "Scalability"],
        "time_limit_minutes": 60,
        "system_design": {
            "title": "Design a URL Shortening Service",
            "prompt": "Design a system like bit.ly that takes long URLs and returns a shortened URL. The service should redirect users back to the original URL when they visit the short URL.",
            "difficulty": "senior",
            "required_skills": ["Database Design", "API Design", "Scalability", "Caching"],
            "time_limit_minutes": 60,
            "architecture_focus": ["Scalability", "Availability", "Latency", "Storage"],
            "evaluation_metrics": {
                "Throughput": "100K requests/second",
                "Latency": "< 100ms p99",
                "Availability": "> 99.99%"
            },
            "diagram_requirements": [
                "System architecture diagram",
                "Database schema diagram",
                "Request flow diagram"
            ],
            "solution_framework": {
                "title": "URL Shortening Architecture",
                "overview": "Distributed system with hash generation, caching, and database optimization",
                "steps": [
                    "Design API endpoints (POST /shorten, GET /{shortCode})",
                    "Choose hash algorithm (Base62 encoding or MD5)",
                    "Design database schema (id, shortCode, originalUrl, createdAt)",
                    "Implement caching layer (Redis for hot URLs)",
                    "Plan sharding strategy for database",
                    "Consider collision handling and uniqueness"
                ],
                "time_complexity": "O(1) for shortening, O(1) for redirects",
                "common_mistakes": [
                    "Using random strings without collision handling",
                    "Not considering database scalability",
                    "Ignoring cache strategy for popular URLs"
                ],
                "alternative_approaches": [
                    "Zookeeper for ID generation",
                    "Consistent hashing for sharding",
                    "Cache-aside vs Write-through patterns"
                ],
                "real_world_correlation": "Production systems like bit.ly and TinyURL use similar approaches",
                "whiteboard_checklist": [
                    "Define functional requirements",
                    "Estimate scale (QPS, storage)",
                    "Discuss bottlenecks",
                    "Propose solutions for each bottleneck"
                ]
            },
            "follow_up_questions": [
                "How would you handle duplicate long URLs?",
                "How would you track analytics?",
                "How would you implement expiration for short URLs?"
            ]
        },
        "source": "template",
        "tags": ["distributed-systems", "database-design", "scalability"]
    }
]

# Case study templates
CASE_STUDY_TEMPLATES = [
    {
        "title": "Market Sizing: Streaming Service Growth",
        "challenge_type": "case_study",
        "difficulty": "medium",
        "industry": "Technology",
        "case_study": {
            "title": "Market Sizing: Streaming Service Growth",
            "scenario": "A new streaming service wants to understand the potential market opportunity in the US",
            "industry": "Technology/Media",
            "company_size": "Startup",
            "problem_statement": "Estimate the revenue potential for a streaming service in the US market over 5 years",
            "constraints": [
                "Initial budget: $50M",
                "Team size: 50 people",
                "Target: <$20/month subscription"
            ],
            "data_provided": {
                "us_population": 330000000,
                "internet_penetration": 0.88,
                "current_streaming_adoption": 0.65,
                "avg_household_income": 70000,
                "churn_rate_industry_avg": 0.05
            },
            "questions": [
                "Estimate the addressable market size",
                "Project subscriber growth over 5 years",
                "Calculate revenue and profitability",
                "Identify key assumptions and risks"
            ],
            "evaluation_criteria": [
                "Logical thinking",
                "Use of data and assumptions",
                "Business acumen",
                "Communication clarity"
            ]
        },
        "source": "template",
        "tags": ["market-sizing", "business-strategy"]
    }
]


class TechnicalPrepService:
    """Service for generating and managing technical interview preparation"""

    async def get_recommended_challenges(
        self,
        uuid: str,
        job_role: Optional[str] = None,
        user_skills: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recommended challenges based on user profile"""
        challenges = []

        # Try to fetch from database first
        if job_role:
            db_challenges = await technical_prep_dao.get_challenges_by_role(job_role, limit=limit)
            challenges.extend(db_challenges)

        if user_skills:
            skill_challenges = await technical_prep_dao.get_challenges_by_skills(user_skills, limit=limit)
            challenges.extend(skill_challenges)

        # Remove duplicates
        seen_ids = set()
        unique_challenges = []
        for c in challenges:
            cid = c.get("_id")
            if cid not in seen_ids:
                seen_ids.add(cid)
                unique_challenges.append(c)

        return unique_challenges[:limit]

    async def generate_coding_challenge(
        self,
        uuid: str,
        difficulty: str = "medium",
        skills: Optional[List[str]] = None,
        job_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate or fetch a coding challenge"""
        # Start with templates
        challenges = [c for c in CODING_CHALLENGES_TEMPLATES if c.get("difficulty") == difficulty]

        if skills:
            filtered = [
                c for c in challenges
                if any(skill in c.get("required_skills", []) for skill in skills)
            ]
            challenges = filtered if filtered else challenges

        if not challenges:
            challenges = CODING_CHALLENGES_TEMPLATES

        template = challenges[0]
        challenge_data = {
            "uuid": uuid,
            "challenge_type": "coding",
            "title": template.get("title"),
            "description": template.get("description"),
            "difficulty": template.get("difficulty"),
            "job_role": job_role,
            "required_skills": template.get("required_skills", []),
            "required_tech_stack": template.get("required_languages", []),
            "time_limit_minutes": template.get("time_limit_minutes"),
            "coding_challenge": template.get("coding_challenge"),
            "source": "template",
            "ai_generated": False,
            "tags": template.get("tags", []),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        return challenge_data

    async def generate_system_design_challenge(
        self,
        uuid: str,
        seniority: str = "senior",
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate or fetch a system design challenge"""
        template = SYSTEM_DESIGN_TEMPLATES[0]

        challenge_data = {
            "uuid": uuid,
            "challenge_type": "system_design",
            "title": template.get("title"),
            "description": template.get("system_design", {}).get("prompt"),
            "difficulty": seniority,
            "required_skills": template.get("required_skills", []),
            "time_limit_minutes": template.get("time_limit_minutes"),
            "system_design": template.get("system_design"),
            "source": "template",
            "ai_generated": False,
            "tags": template.get("tags", []),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        return challenge_data

    async def generate_case_study(
        self,
        uuid: str,
        industry: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate or fetch a case study"""
        template = CASE_STUDY_TEMPLATES[0]

        challenge_data = {
            "uuid": uuid,
            "challenge_type": "case_study",
            "title": template.get("title"),
            "description": template.get("case_study", {}).get("problem_statement"),
            "difficulty": "medium",
            "industry": industry or template.get("industry"),
            "case_study": template.get("case_study"),
            "source": "template",
            "ai_generated": False,
            "tags": template.get("tags", []),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        return challenge_data

    async def start_challenge_attempt(
        self,
        uuid: str,
        challenge_id: str
    ) -> str:
        """Start a new challenge attempt"""
        attempt_data = {
            "uuid": uuid,
            "challenge_id": challenge_id,
            "start_time": datetime.now(timezone.utc),
            "attempts": 0,
            "status": "in_progress",
            "test_results": [],
            "improvement_trend": []
        }

        # Get challenge to populate challenge_type
        challenge = await technical_prep_dao.get_challenge(challenge_id)
        if challenge:
            attempt_data["challenge_type"] = challenge.get("challenge_type", "unknown")

        return await technical_prep_dao.create_attempt(attempt_data)

    async def submit_challenge_code(
        self,
        attempt_id: str,
        code: str,
        language: str
    ) -> Dict[str, Any]:
        """Submit code for a challenge"""
        attempt = await technical_prep_dao.get_attempt(attempt_id)
        if not attempt:
            return {"success": False, "error": "Attempt not found"}

        # Get challenge
        challenge = await technical_prep_dao.get_challenge(attempt["challenge_id"])
        if not challenge:
            return {"success": False, "error": "Challenge not found"}

        # Simulate test runner
        test_results = await self._run_tests(challenge, code, language)

        passed = sum(1 for t in test_results if t.get("passed"))
        total = len(test_results)
        score = (passed / total * 100) if total > 0 else 0

        # Update attempt
        update_data = {
            "user_code": code,
            "language": language,
            "test_results": test_results,
            "passed_tests": passed,
            "total_tests": total,
            "failed_tests": total - passed,
            "attempts": attempt.get("attempts", 0) + 1,
            "score": score
        }

        await technical_prep_dao.update_attempt(attempt_id, update_data)

        return {
            "success": True,
            "passed": passed,
            "total": total,
            "score": score,
            "test_results": test_results
        }

    async def complete_challenge(
        self,
        attempt_id: str,
        score: float,
        passed_tests: int,
        total_tests: int,
        code: Optional[str] = None
    ) -> bool:
        """Mark a challenge attempt as complete"""
        return await technical_prep_dao.complete_attempt(
            attempt_id, score, passed_tests, total_tests, code
        )

    async def _run_tests(self, challenge: Dict[str, Any], code: str, language: str) -> List[Dict[str, Any]]:
        """Simulate running tests (real implementation would compile and execute code)"""
        test_cases = []

        if challenge.get("challenge_type") == "coding":
            coding = challenge.get("coding_challenge", {})
            test_cases = coding.get("test_cases", [])

        # For now, simulate test results
        results = []
        for i, test in enumerate(test_cases):
            # In production, this would actually compile and run the code
            passed = i == 0  # Simulate first test passes
            results.append({
                "test_number": i + 1,
                "input": test.get("input"),
                "expected": test.get("expected_output"),
                "passed": passed,
                "description": test.get("description")
            })

        return results

    async def get_user_progress(self, uuid: str) -> Dict[str, Any]:
        """Get user's technical prep progress"""
        stats = await technical_prep_dao.get_user_statistics(uuid)
        return stats

    async def get_challenge_leaderboard(self, challenge_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leaderboard for a challenge"""
        attempts = await technical_prep_dao.get_challenge_attempts(challenge_id)

        # Group by user and get best score
        user_scores = {}
        for attempt in attempts:
            uuid = attempt.get("uuid")
            score = attempt.get("score", 0)
            if uuid not in user_scores or score > user_scores[uuid]:
                user_scores[uuid] = score

        # Sort and return
        leaderboard = [
            {"uuid": u, "score": s}
            for u, s in sorted(user_scores.items(), key=lambda x: x[1], reverse=True)
        ]

        return leaderboard[:limit]


# Export singleton
technical_prep_service = TechnicalPrepService()
