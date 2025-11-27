# ============================================================================
# UC-076: AI-POWERED RESPONSE COACHING SERVICE
# ============================================================================
# This service generates AI-powered coaching feedback for interview responses.
# It analyzes content quality, structure, STAR framework compliance, and more.
# ============================================================================

import json
import random
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from mongo.AI_dao import ai_dao
import os

# ============================================================================
# CONFIGURATION & DUMMY DATA
# ============================================================================

# Global flag to enable/disable AI coaching (set to False in production)
USE_DUMMY_AI_COACHING = os.getenv("USE_DUMMY_AI_COACHING", "false").lower() == "true"


# ============================================================================
# STAR FRAMEWORK ANALYSIS
# ============================================================================

class STARFrameworkAnalyzer:
    """Analyzes responses for STAR (Situation, Task, Action, Result) compliance"""

    @staticmethod
    def analyze_star_framework(response_text: str, is_behavioral: bool = True) -> Dict[str, Any]:
        """
        Analyze response against STAR framework for behavioral questions.

        Args:
            response_text: User's response text
            is_behavioral: Whether this is a behavioral question (default True)

        Returns:
            Dict with STAR analysis results
        """
        if not is_behavioral:
            return {
                "framework": "N/A",
                "applicable": False,
                "reason": "STAR framework only applies to behavioral questions"
            }

        # Tokenize response for analysis
        response_lower = response_text.lower()

        # Simple keyword-based detection for STAR elements
        situation_indicators = ["at my previous", "in my role", "when i was", "during", "worked at", "situation:", "faced"]
        task_indicators = ["my task", "responsible for", "needed to", "tasked with", "my responsibility", "task:", "had to"]
        action_indicators = ["i took", "i implemented", "i led", "i created", "i developed", "action:", "i did", "i worked"]
        result_indicators = ["resulted in", "outcome", "the result", "improved", "increased", "delivered", "achieved", "result:"]

        has_situation = any(indicator in response_lower for indicator in situation_indicators)
        has_task = any(indicator in response_lower for indicator in task_indicators)
        has_action = any(indicator in response_lower for indicator in action_indicators)
        has_result = any(indicator in response_lower for indicator in result_indicators)

        # Calculate STAR score
        star_elements_present = sum([has_situation, has_task, has_action, has_result])
        star_score = (star_elements_present / 4) * 100

        # Generate specific feedback for missing elements
        missing_elements = []
        if not has_situation:
            missing_elements.append("Situation: Set the context and background of the challenge")
        if not has_task:
            missing_elements.append("Task: Explain your specific responsibility or goal")
        if not has_action:
            missing_elements.append("Action: Detail the specific steps you took")
        if not has_result:
            missing_elements.append("Result: Quantify the impact or measurable outcome")

        return {
            "framework": "STAR",
            "applicable": True,
            "situation_present": has_situation,
            "task_present": has_task,
            "action_present": has_action,
            "result_present": has_result,
            "star_score": round(star_score, 1),
            "elements_present": star_elements_present,
            "missing_elements": missing_elements,
            "assessment": "Complete STAR usage" if star_elements_present == 4 else f"Missing {4 - star_elements_present} STAR elements"
        }


# ============================================================================
# WEAK LANGUAGE DETECTION
# ============================================================================

class WeakLanguageDetector:
    """Detects filler words and vague language in responses"""

    # Mapping of weak phrases to stronger alternatives
    WEAK_LANGUAGE_REPLACEMENTS = {
        "helped with": "led and delivered",
        "tried to": "successfully",
        "sort of": "specifically",
        "kind of": "distinctly",
        "maybe": "definitely",
        "might": "clearly",
        "a bit": "significantly",
        "pretty much": "precisely",
        "basically": "fundamentally",
        "literally": "actually",
        "honestly": "genuinely",
        "actually": "factually",
        "just": "specifically",
        "really": "demonstrably",
        "very": "substantially",
        "good": "excellent",
        "bad": "suboptimal",
        "thing": "solution",
        "stuff": "deliverables",
        "worked": "executed",
        "did": "implemented",
        "got": "achieved",
        "went": "progressed",
    }

    FILLER_WORDS = ["um", "uh", "like", "you know", "so", "well", "anyway", "i mean"]

    @staticmethod
    def detect_weak_language(response_text: str) -> Dict[str, Any]:
        """
        Detect weak language patterns and suggest improvements.

        Args:
            response_text: User's response text

        Returns:
            Dict with weak language analysis
        """
        response_lower = response_text.lower()

        # Count instances of weak phrases
        weak_phrases_found = []
        for weak_phrase, strong_alternative in WeakLanguageDetector.WEAK_LANGUAGE_REPLACEMENTS.items():
            count = response_lower.count(weak_phrase)
            if count > 0:
                weak_phrases_found.append({
                    "weak_phrase": weak_phrase,
                    "count": count,
                    "suggestion": f"Replace with '{strong_alternative}'",
                    "strong_alternative": strong_alternative
                })

        # Detect filler words
        fillers_found = []
        for filler in WeakLanguageDetector.FILLER_WORDS:
            count = response_lower.count(filler)
            if count > 0:
                fillers_found.append({
                    "filler": filler,
                    "count": count,
                    "feedback": "Minimize filler words for clarity"
                })

        return {
            "weak_phrases_detected": len(weak_phrases_found),
            "weak_phrases": weak_phrases_found,
            "filler_words_detected": len(fillers_found),
            "filler_words": fillers_found,
            "total_issues": len(weak_phrases_found) + len(fillers_found),
            "overall_language_quality": "Strong" if len(weak_phrases_found) < 3 else "Needs improvement"
        }


# ============================================================================
# RESPONSE QUALITY ANALYZER
# ============================================================================

class ResponseQualityAnalyzer:
    """Analyzes response quality metrics"""

    @staticmethod
    def analyze_length_and_timing(
        response_text: str,
        response_duration_seconds: int,
        question_category: str,
        question_difficulty: str
    ) -> Dict[str, Any]:
        """
        Analyze response length and timing metrics.

        Args:
            response_text: User's response text
            response_duration_seconds: Duration in seconds
            question_category: Category of question (behavioral, technical, etc.)
            question_difficulty: Difficulty level (entry, mid, senior)

        Returns:
            Dict with length and timing analysis
        """
        words = len(response_text.split())

        # Expected word counts by category and difficulty
        expected_ranges = {
            "behavioral": {"entry": (60, 150), "mid": (100, 200), "senior": (150, 250)},
            "technical": {"entry": (40, 100), "mid": (80, 150), "senior": (120, 200)},
            "situational": {"entry": (50, 120), "mid": (80, 180), "senior": (120, 220)},
            "company": {"entry": (40, 100), "mid": (60, 150), "senior": (100, 180)},
        }

        min_words, max_words = expected_ranges.get(question_category, expected_ranges["behavioral"]).get(
            question_difficulty, (60, 150)
        )

        # Determine length assessment
        if words < min_words:
            length_assessment = f"Too brief ({words} words). Target {min_words}-{max_words} words."
            length_score = 40 + (words / min_words) * 30
        elif words > max_words:
            length_assessment = f"Overly long ({words} words). Keep to {min_words}-{max_words} words."
            length_score = 70 - ((words - max_words) / max_words) * 20
        else:
            length_assessment = f"Good length ({words} words). Right in target range."
            length_score = 95

        # Duration assessment (assuming 2-3 minutes per question is ideal)
        ideal_duration = 120  # 2 minutes
        duration_variance = abs(response_duration_seconds - ideal_duration)

        if response_duration_seconds < 30:
            timing_assessment = "Too quick - risk of insufficient detail"
        elif response_duration_seconds > 300:
            timing_assessment = "Too long - consider being more concise"
        elif duration_variance < 60:
            timing_assessment = "Good pacing for response depth"
        else:
            timing_assessment = "Adjust pacing to better manage interview time"

        return {
            "word_count": words,
            "word_count_assessment": length_assessment,
            "word_count_score": round(min(length_score, 100), 1),
            "response_duration_seconds": response_duration_seconds,
            "timing_assessment": timing_assessment,
            "ideal_range_words": f"{min_words}-{max_words}",
            "length_verdict": "Appropriate" if length_score > 70 else "Needs adjustment"
        }

    @staticmethod
    def analyze_content_quality(
        response_text: str,
        question_text: str,
        expected_skills: List[str],
        interviewer_guidance: str
    ) -> Dict[str, Any]:
        """
        Analyze content quality against question requirements.

        Args:
            response_text: User's response
            question_text: The question asked
            expected_skills: Skills the question tests
            interviewer_guidance: What interviewer should look for

        Returns:
            Dict with content quality analysis
        """
        response_lower = response_text.lower()

        # Simple heuristic: check if response addresses key terms from guidance
        quality_indicators = {
            "addresses_question": len(response_text) > 20,
            "provides_examples": any(phrase in response_lower for phrase in ["for example", "example", "specifically", "instance", "when"]),
            "shows_learning": any(phrase in response_lower for phrase in ["learned", "discovered", "realized", "improved", "growth"]),
            "demonstrates_skills": len([skill for skill in expected_skills if skill.lower() in response_lower]) > 0 if expected_skills else False,
            "measurable_results": any(phrase in response_lower for phrase in ["increased", "improved", "reduced", "achieved", "delivered", "%", "x2", "doubled"]),
        }

        # Calculate content score
        content_score = sum(quality_indicators.values()) / len(quality_indicators) * 100

        strengths = []
        if quality_indicators["addresses_question"]:
            strengths.append("Directly addresses the question")
        if quality_indicators["provides_examples"]:
            strengths.append("Uses concrete examples")
        if quality_indicators["shows_learning"]:
            strengths.append("Demonstrates growth mindset")
        if quality_indicators["demonstra tes_skills"]:
            strengths.append("Relevant to required skills")
        if quality_indicators["measurable_results"]:
            strengths.append("Includes measurable outcomes")

        improvements = []
        if not quality_indicators["provides_examples"]:
            improvements.append("Add specific examples or stories")
        if not quality_indicators["shows_learning"]:
            improvements.append("Show what you learned from the experience")
        if not quality_indicators["measurable_results"]:
            improvements.append("Quantify the impact or results")

        return {
            "content_score": round(content_score, 1),
            "quality_indicators": quality_indicators,
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "overall_assessment": "Strong content" if content_score > 70 else "Needs development"
        }

    @staticmethod
    def analyze_structure_and_clarity(response_text: str) -> Dict[str, Any]:
        """
        Analyze response structure, flow, and readability.

        Args:
            response_text: User's response

        Returns:
            Dict with structure analysis
        """
        sentences = [s.strip() for s in response_text.split('.') if s.strip()]
        words = response_text.split()

        # Average sentence length (ideal: 15-20 words per sentence)
        avg_sentence_length = len(words) / len(sentences) if sentences else 0

        # Check for structure markers
        has_intro = response_text.lower().startswith(("i", "in", "during", "when"))
        has_transitions = any(phrase in response_text.lower() for phrase in ["then", "therefore", "as a result", "ultimately", "consequently"])
        has_clear_conclusion = len(sentences) > 2

        # Assess readability
        if avg_sentence_length < 10:
            sentence_assessment = "Sentences are very short - might lack detail"
        elif avg_sentence_length > 25:
            sentence_assessment = "Sentences are long - break into shorter units for clarity"
        else:
            sentence_assessment = "Sentence length is well-balanced"

        structure_score = 0
        if has_intro:
            structure_score += 25
        if has_transitions:
            structure_score += 25
        if has_clear_conclusion:
            structure_score += 25
        if 15 <= avg_sentence_length <= 22:
            structure_score += 25
        else:
            structure_score += 15

        return {
            "sentence_count": len(sentences),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "sentence_assessment": sentence_assessment,
            "has_clear_introduction": has_intro,
            "has_transitions": has_transitions,
            "has_clear_conclusion": has_clear_conclusion,
            "structure_score": round(min(structure_score, 100), 1),
            "clarity_verdict": "Clear" if structure_score > 65 else "Could be clearer"
        }


# ============================================================================
# INTERVIEW COACHING SERVICE
# ============================================================================

class InterviewCoachingService:
    """
    Main service for generating AI-powered coaching feedback on interview responses.
    Orchestrates analysis and generates comprehensive feedback.
    """

    def __init__(self, db_client=None):
        """
        Initialize the coaching service.

        Args:
            db_client: MongoDB client (optional, for future enhancements)
        """
        self.db = db_client
        self.star_analyzer = STARFrameworkAnalyzer()
        self.weak_language_detector = WeakLanguageDetector()
        self.quality_analyzer = ResponseQualityAnalyzer()

    async def generate_response_feedback(
        self,
        response_text: str,
        response_duration_seconds: int,
        question_text: str,
        question_category: str,
        question_difficulty: str,
        expected_skills: List[str] = None,
        interviewer_guidance: str = "",
        question_id: str = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive AI coaching feedback for an interview response.

        This function:
        1. Analyzes content quality
        2. Evaluates structure and clarity
        3. Assesses STAR framework compliance (if behavioral)
        4. Detects weak language patterns
        5. Provides actionable recommendations
        6. Generates a rewritten version if needed
        7. Produces overall scoring

        Args:
            response_text: User's response text
            response_duration_seconds: Time spent on question
            question_text: The question that was asked
            question_category: Category (behavioral/technical/etc.)
            question_difficulty: Difficulty level (entry/mid/senior)
            expected_skills: List of skills the question tests
            interviewer_guidance: Guidance for interviewers
            question_id: Optional question UUID for tracking

        Returns:
            Dict with comprehensive coaching feedback
        """

        try:
            if USE_DUMMY_AI_COACHING:
                return self._generate_dummy_feedback(
                    response_text, response_duration_seconds, question_category, question_difficulty
                )

            # Perform all analyses
            star_analysis = self.star_analyzer.analyze_star_framework(
                response_text, is_behavioral=(question_category == "behavioral")
            )

            weak_language_analysis = self.weak_language_detector.detect_weak_language(response_text)

            length_timing_analysis = self.quality_analyzer.analyze_length_and_timing(
                response_text, response_duration_seconds, question_category, question_difficulty
            )

            content_quality = self.quality_analyzer.analyze_content_quality(
                response_text, question_text, expected_skills or [], interviewer_guidance
            )

            structure_clarity = self.quality_analyzer.analyze_structure_and_clarity(response_text)

            # Calculate overall coaching score
            overall_score = self._calculate_overall_score(
                content_quality["content_score"],
                structure_clarity["structure_score"],
                length_timing_analysis["word_count_score"],
                star_analysis.get("star_score", 75),
                weak_language_analysis["overall_language_quality"]
            )

            # Generate AI-enhanced feedback using Cohere
            ai_feedback = await self._generate_ai_feedback(
                response_text, question_text, content_quality, weak_language_analysis
            )

            # Generate alternative response
            alternative_response = await self._generate_alternative_response(
                response_text, question_text, question_category, content_quality, weak_language_analysis
            )

            # Build comprehensive feedback object
            coaching_feedback = {
                "overall_score": round(overall_score, 1),
                "score_breakdown": {
                    "content_quality": round(content_quality["content_score"], 1),
                    "structure_clarity": round(structure_clarity["structure_score"], 1),
                    "length_appropriateness": round(length_timing_analysis["word_count_score"], 1),
                    "star_compliance": round(star_analysis.get("star_score", 75), 1) if question_category == "behavioral" else None,
                    "language_quality": 100 if weak_language_analysis["overall_language_quality"] == "Strong" else 70
                },
                "strengths": content_quality["strengths"],
                "areas_for_improvement": content_quality["areas_for_improvement"],
                "detailed_feedback": {
                    "content": content_quality,
                    "structure": structure_clarity,
                    "length_and_timing": length_timing_analysis,
                    "star_framework": star_analysis if question_category == "behavioral" else None,
                    "language": weak_language_analysis
                },
                "ai_commentary": ai_feedback,
                "recommended_improvements": self._compile_recommendations(
                    content_quality, structure_clarity, weak_language_analysis, star_analysis
                ),
                "alternative_response": alternative_response,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

            return coaching_feedback

        except Exception as e:
            # Return error feedback instead of crashing
            print(f"Error generating coaching feedback: {str(e)}")
            return self._generate_error_feedback(str(e))

    def _calculate_overall_score(
        self, content: float, structure: float, length: float, star: float, language: str
    ) -> float:
        """Calculate weighted overall coaching score"""
        language_score = 90 if language == "Strong" else 65

        # Weighted average: content=30%, structure=20%, length=15%, STAR=25%, language=10%
        overall = (
            content * 0.30 +
            structure * 0.20 +
            length * 0.15 +
            star * 0.25 +
            language_score * 0.10
        )

        return min(overall, 100)

    async def _generate_ai_feedback(
        self, response_text: str, question_text: str, content_quality: Dict, weak_language: Dict
    ) -> str:
        """Generate AI commentary using Cohere API"""
        try:
            prompt = f"""Provide brief, actionable coaching feedback for this interview response.

Question: {question_text}

Response: {response_text}

Focus on:
1. How well it answers the question
2. Key strengths to build on
3. One specific area to improve

Keep feedback to 2-3 sentences, positive but direct."""

            ai_response = await ai_dao.generate_text(
                prompt,
                system_message="You are an expert interview coach providing constructive feedback on candidate responses."
            )

            return ai_response
        except Exception as e:
            print(f"Error generating AI feedback: {str(e)}")
            return "Unable to generate AI feedback at this time."

    async def _generate_alternative_response(
        self, response_text: str, question_text: str, category: str,
        content_quality: Dict, weak_language: Dict
    ) -> str:
        """Generate improved version of response using AI"""
        try:
            key_issues = weak_language.get("weak_phrases", [])[:3]
            issues_str = "; ".join([p["weak_phrase"] for p in key_issues]) if key_issues else "vague phrasing"

            prompt = f"""Rewrite this interview response to be stronger and more impactful.

Original response: {response_text}

Question: {question_text}

Improvement areas: {issues_str}, more specific examples

Rewritten response (same length, more compelling):"""

            improved = await ai_dao.generate_text(
                prompt,
                system_message="You are an expert at strengthening interview responses. Rewrite to be more specific, powerful, and impactful while keeping similar length."
            )

            return improved.strip() if improved else response_text
        except Exception as e:
            print(f"Error generating alternative response: {str(e)}")
            return response_text

    def _compile_recommendations(
        self, content: Dict, structure: Dict, weak_language: Dict, star: Dict
    ) -> List[str]:
        """Compile specific actionable recommendations"""
        recommendations = []

        # Content recommendations
        if content["content_score"] < 70:
            if "Add specific examples or stories" in content["areas_for_improvement"]:
                recommendations.append("Include 2-3 concrete examples with measurable outcomes")
            if "Quantify the impact or results" in content["areas_for_improvement"]:
                recommendations.append("Replace vague outcomes with specific metrics (percentages, numbers, timeframes)")

        # Structure recommendations
        if structure["structure_score"] < 70:
            recommendations.append(f"Break response into shorter sentences ({structure['avg_sentence_length']:.0f} avg → target 18)")

        # STAR recommendations
        if star.get("applicable"):
            if star.get("missing_elements"):
                for element in star.get("missing_elements", [])[:2]:
                    recommendations.append(element)

        # Language recommendations
        if weak_language.get("weak_phrases"):
            top_issue = weak_language["weak_phrases"][0]
            recommendations.append(f"Replace '{top_issue['weak_phrase']}' with '{top_issue['strong_alternative']}'")

        return recommendations[:5]  # Return top 5 recommendations

    def _generate_dummy_feedback(
        self, response_text: str, response_duration_seconds: int,
        question_category: str, question_difficulty: str
    ) -> Dict[str, Any]:
        """Generate realistic dummy coaching feedback for development"""

        words = len(response_text.split())
        base_score = random.randint(65, 95)

        # Make score more realistic based on response length
        if words < 30 or words > 300:
            base_score -= random.randint(10, 20)

        return {
            "overall_score": base_score,
            "score_breakdown": {
                "content_quality": base_score - random.randint(0, 15),
                "structure_clarity": base_score - random.randint(0, 10),
                "length_appropriateness": 100 if 50 < words < 200 else base_score - 20,
                "star_compliance": base_score - random.randint(0, 20) if question_category == "behavioral" else None,
                "language_quality": base_score - random.randint(0, 15)
            },
            "strengths": [
                "Clear communication of key points",
                "Good use of specific examples",
                "Well-structured response"
            ],
            "areas_for_improvement": [
                "Add more quantifiable results",
                "Strengthen the action details",
                "Improve transition between ideas"
            ],
            "detailed_feedback": {
                "content": {
                    "content_score": base_score - random.randint(0, 15),
                    "strengths": ["Addresses the question", "Includes examples"],
                    "areas_for_improvement": ["More measurable outcomes"],
                    "overall_assessment": "Strong content"
                },
                "structure": {
                    "structure_score": base_score - random.randint(0, 10),
                    "clarity_verdict": "Clear"
                },
                "length_and_timing": {
                    "word_count": words,
                    "word_count_score": 90 if 50 < words < 200 else 70,
                    "length_verdict": "Appropriate"
                },
                "star_framework": {
                    "applicable": question_category == "behavioral",
                    "star_score": base_score - 10 if question_category == "behavioral" else None,
                    "assessment": "Good STAR usage" if question_category == "behavioral" else "N/A"
                },
                "language": {
                    "total_issues": random.randint(0, 3),
                    "overall_language_quality": "Strong" if base_score > 75 else "Needs improvement"
                }
            },
            "ai_commentary": f"Your response effectively addresses the core question. Focus on adding more specific metrics to show impact. The structure is clear; consider adding a brief transition to strengthen flow.",
            "recommended_improvements": [
                "Include quantifiable business impact metrics",
                "Strengthen the action section with specific decisions",
                "Add a closing that reinforces key learnings"
            ],
            "alternative_response": f"[Improved version: {response_text[:100]}... with stronger metrics and clearer structure]",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    def _generate_error_feedback(self, error_message: str) -> Dict[str, Any]:
        """Generate feedback when an error occurs"""
        return {
            "overall_score": None,
            "error": True,
            "error_message": f"Unable to generate coaching feedback: {error_message}",
            "fallback_suggestions": [
                "Ensure response is at least 30 words",
                "Include specific examples from your experience",
                "Structure using clear beginning, middle, end"
            ]
        }
