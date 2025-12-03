"""
Writing Practice Service
Analyzes written responses for quality, structure, and provides feedback using AI
"""

import re
import os
import json
from typing import Dict, List, Any
from collections import Counter
from openai import OpenAI
from pymongo.asynchronous.database import AsyncDatabase


class WritingPracticeService:
    """Service for analyzing interview response writing quality"""

    def __init__(self, db_client: AsyncDatabase):
        """Initialize with async database client"""
        self.db = db_client

    @staticmethod
    def analyze_response_quality(response_text: str, question_category: str = "general") -> Dict[str, Any]:
        """
        Analyze the quality of a written response
        
        Args:
            response_text: The user's written response
            question_category: Type of question (behavioral, technical, etc)
        
        Returns:
            Dictionary with scores and feedback
        """
        # Basic metrics
        word_count = len(response_text.split())
        sentence_count = len(re.split(r'[.!?]+', response_text.strip()))
        sentence_count = max(1, sentence_count)  # Avoid division by zero
        
        # Calculate scores
        clarity_score = WritingPracticeService._calculate_clarity_score(
            response_text, word_count, sentence_count
        )
        
        structure_score = WritingPracticeService._calculate_structure_score(
            response_text, question_category
        )
        
        conciseness_score = WritingPracticeService._calculate_conciseness_score(
            response_text, word_count
        )
        
        professionalism_score = WritingPracticeService._calculate_professionalism_score(
            response_text
        )
        
        # Overall score (weighted average)
        overall_score = (
            clarity_score * 0.3 +
            structure_score * 0.3 +
            conciseness_score * 0.2 +
            professionalism_score * 0.2
        )
        
        # Generate feedback
        strengths = WritingPracticeService._identify_strengths(
            clarity_score, structure_score, conciseness_score, professionalism_score
        )
        
        improvements = WritingPracticeService._identify_improvements(
            clarity_score, structure_score, conciseness_score, professionalism_score,
            response_text, question_category
        )
        
        suggestions = WritingPracticeService._generate_suggestions(
            improvements, response_text, question_category
        )
        
        # Additional metrics
        avg_sentence_length = word_count / sentence_count
        vocabulary_diversity = WritingPracticeService._calculate_vocabulary_diversity(response_text)
        
        return {
            "clarity_score": round(clarity_score, 2),
            "structure_score": round(structure_score, 2),
            "conciseness_score": round(conciseness_score, 2),
            "professionalism_score": round(professionalism_score, 2),
            "overall_score": round(overall_score, 2),
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "specific_suggestions": suggestions,
            "sentence_complexity_avg": round(avg_sentence_length, 2),
            "vocabulary_diversity_score": round(vocabulary_diversity, 2),
            "word_count": word_count,
            "sentence_count": sentence_count
        }
    
    @staticmethod
    def _calculate_clarity_score(text: str, word_count: int, sentence_count: int) -> float:
        """Calculate clarity score based on readability metrics"""
        # Ideal average sentence length: 15-20 words
        avg_sentence_length = word_count / sentence_count
        
        # Score based on sentence length (0-100)
        if 15 <= avg_sentence_length <= 20:
            length_score = 100
        elif avg_sentence_length < 10:
            length_score = 60  # Too choppy
        elif avg_sentence_length > 30:
            length_score = 50  # Too complex
        else:
            # Gradual decline from ideal
            length_score = 100 - abs(avg_sentence_length - 17.5) * 3
        
        # Check for transition words
        transition_words = [
            'however', 'therefore', 'additionally', 'furthermore', 'moreover',
            'consequently', 'meanwhile', 'subsequently', 'specifically', 'for example'
        ]
        text_lower = text.lower()
        transition_count = sum(1 for word in transition_words if word in text_lower)
        transition_score = min(100, transition_count * 20)
        
        # Weighted average
        clarity_score = (length_score * 0.6 + transition_score * 0.4)
        
        return max(0, min(100, clarity_score))
    
    @staticmethod
    def _calculate_structure_score(text: str, question_category: str) -> float:
        """Calculate structure score, especially STAR framework for behavioral"""
        text_lower = text.lower()
        
        if question_category == "behavioral":
            # Check for STAR framework elements
            star_indicators = {
                'situation': ['situation', 'context', 'background', 'scenario'],
                'task': ['task', 'goal', 'objective', 'responsibility', 'challenge'],
                'action': ['action', 'did', 'implemented', 'developed', 'created', 'led'],
                'result': ['result', 'outcome', 'achieved', 'improved', 'increased', 'impact']
            }
            
            components_found = 0
            for component, keywords in star_indicators.items():
                if any(keyword in text_lower for keyword in keywords):
                    components_found += 1
            
            # Score based on STAR components present
            structure_score = (components_found / 4) * 100
        else:
            # For other questions, check for logical flow
            # Introduction, explanation, conclusion
            has_intro = any(word in text_lower[:100] for word in ['first', 'initially', 'to begin'])
            has_conclusion = any(word in text_lower[-100:] for word in ['therefore', 'thus', 'in conclusion', 'overall'])
            
            structure_score = 50  # Base score
            if has_intro:
                structure_score += 25
            if has_conclusion:
                structure_score += 25
        
        return max(0, min(100, structure_score))
    
    @staticmethod
    def _calculate_conciseness_score(text: str, word_count: int) -> float:
        """Calculate conciseness score"""
        # Ideal range: 75-150 words for most answers
        if 75 <= word_count <= 150:
            conciseness_score = 100
        elif word_count < 50:
            conciseness_score = 40  # Too short
        elif word_count < 75:
            conciseness_score = 70 + (word_count - 50) * 1.2
        elif word_count <= 200:
            conciseness_score = 100 - (word_count - 150) * 0.6
        else:
            conciseness_score = max(30, 100 - (word_count - 150) * 0.8)
        
        # Check for filler words
        filler_words = ['very', 'really', 'just', 'actually', 'basically', 'literally']
        text_lower = text.lower()
        filler_count = sum(text_lower.count(word) for word in filler_words)
        
        # Penalize for excessive fillers
        filler_penalty = min(20, filler_count * 5)
        
        conciseness_score -= filler_penalty
        
        return max(0, min(100, conciseness_score))
    
    @staticmethod
    def _calculate_professionalism_score(text: str) -> float:
        """Calculate professionalism score"""
        score = 100
        
        # Check for contractions (reduce professionalism slightly)
        contractions = ["don't", "can't", "won't", "shouldn't", "wouldn't", "isn't", "aren't"]
        contraction_count = sum(text.lower().count(c) for c in contractions)
        score -= min(15, contraction_count * 3)
        
        # Check for informal language
        informal_words = ['gonna', 'wanna', 'yeah', 'stuff', 'things', 'kinda', 'sorta']
        informal_count = sum(text.lower().count(word) for word in informal_words)
        score -= min(20, informal_count * 10)
        
        # Check for first-person pronouns (should have some, but not excessive)
        first_person = ['i ', ' i ', 'my ', 'me ']
        first_person_count = sum(text.lower().count(word) for word in first_person)
        
        # Ideal: 5-15 first-person references
        if 5 <= first_person_count <= 15:
            score += 10
        elif first_person_count > 20:
            score -= 10  # Too self-focused
        
        return max(0, min(100, score))
    
    @staticmethod
    def _calculate_vocabulary_diversity(text: str) -> float:
        """Calculate vocabulary diversity (unique words / total words)"""
        words = re.findall(r'\b\w+\b', text.lower())
        if not words:
            return 0
        
        unique_words = len(set(words))
        total_words = len(words)
        
        diversity_ratio = unique_words / total_words
        
        # Convert to 0-100 scale (0.5-0.8 is good range)
        score = min(100, (diversity_ratio - 0.3) * 200)
        
        return max(0, score)
    
    @staticmethod
    def _identify_strengths(clarity: float, structure: float, conciseness: float, professionalism: float) -> List[str]:
        """Identify strengths based on scores"""
        strengths = []
        
        if clarity >= 75:
            strengths.append("Clear and easy to understand communication")
        
        if structure >= 75:
            strengths.append("Well-structured response with logical flow")
        
        if conciseness >= 75:
            strengths.append("Concise and focused answer without unnecessary detail")
        
        if professionalism >= 80:
            strengths.append("Professional tone appropriate for interview setting")
        
        if not strengths:
            # Find the highest score
            scores = {
                "clarity": clarity,
                "structure": structure,
                "conciseness": conciseness,
                "professionalism": professionalism
            }
            best = max(scores, key=scores.get)
            strengths.append(f"Good {best} in your response")
        
        return strengths
    
    @staticmethod
    def _identify_improvements(
        clarity: float,
        structure: float,
        conciseness: float,
        professionalism: float,
        text: str,
        question_category: str
    ) -> List[str]:
        """Identify areas needing improvement"""
        improvements = []
        
        if clarity < 60:
            improvements.append("Clarity")
        
        if structure < 60:
            if question_category == "behavioral":
                improvements.append("STAR framework structure")
            else:
                improvements.append("Response structure and organization")
        
        if conciseness < 60:
            word_count = len(text.split())
            if word_count < 50:
                improvements.append("Response length (too brief)")
            else:
                improvements.append("Conciseness (too wordy)")
        
        if professionalism < 70:
            improvements.append("Professional tone")
        
        return improvements
    
    @staticmethod
    def _generate_suggestions(improvements: List[str], text: str, question_category: str) -> List[str]:
        """Generate specific actionable suggestions"""
        suggestions = []
        
        word_count = len(text.split())
        
        for improvement in improvements:
            if "Clarity" in improvement:
                suggestions.append(
                    "Use transition words (however, therefore, for example) to connect ideas"
                )
                suggestions.append(
                    "Aim for 15-20 words per sentence for optimal readability"
                )
            
            if "STAR" in improvement:
                suggestions.append(
                    "Structure your answer using STAR: Situation, Task, Action, Result"
                )
                suggestions.append(
                    "Start with the context, explain what you did, and emphasize the outcome"
                )
            
            if "structure" in improvement.lower() and "STAR" not in improvement:
                suggestions.append(
                    "Organize your response with a clear beginning, middle, and end"
                )
                suggestions.append(
                    "Use phrases like 'First', 'Then', 'Finally' to guide the listener"
                )
            
            if "length" in improvement.lower():
                if word_count < 50:
                    suggestions.append(
                        "Expand your answer with more details and specific examples"
                    )
                    suggestions.append(
                        "Aim for 75-150 words to fully address the question"
                    )
                else:
                    suggestions.append(
                        "Focus on the most relevant points and remove unnecessary details"
                    )
                    suggestions.append(
                        "Cut filler words like 'very', 'really', 'just' to be more concise"
                    )
            
            if "Conciseness" in improvement:
                suggestions.append(
                    "Remove filler words and redundant phrases"
                )
                suggestions.append(
                    "Make every sentence count - focus on impact and relevance"
                )
            
            if "Professional" in improvement:
                suggestions.append(
                    "Avoid contractions (use 'do not' instead of 'don't')"
                )
                suggestions.append(
                    "Replace informal language with professional equivalents"
                )
        
        # If no improvements needed
        if not suggestions:
            suggestions.append(
                "Excellent response! Practice similar questions to maintain consistency"
            )
        
        return suggestions
    
    @staticmethod
    def compare_with_previous(current_analysis: Dict[str, Any], previous_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare current analysis with previous attempts"""
        if not previous_analyses:
            return {
                "is_first_attempt": True,
                "improvement": None
            }
        
        # Get most recent previous attempt
        prev = previous_analyses[-1]
        
        # Calculate improvement
        score_diff = current_analysis["overall_score"] - prev["overall_score"]
        
        improvements = []
        if current_analysis["clarity_score"] > prev["clarity_score"] + 5:
            improvements.append("clarity")
        if current_analysis["structure_score"] > prev["structure_score"] + 5:
            improvements.append("structure")
        if current_analysis["conciseness_score"] > prev["conciseness_score"] + 5:
            improvements.append("conciseness")
        
        return {
            "is_first_attempt": False,
            "score_improvement": round(score_diff, 2),
            "improved_areas": improvements,
            "trend": "improving" if score_diff > 5 else "stable" if score_diff > -5 else "declining",
            "attempt_number": len(previous_analyses) + 1
        }

    # ============ OPENAI ENHANCED ANALYSIS (UC-084) ============

    @staticmethod
    async def analyze_with_ai(response_text: str, question: str, question_category: str = "general") -> Dict[str, Any]:
        """
        Analyze response using OpenAI for enhanced feedback
        Falls back to manual analysis if AI fails
        """
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            # Get manual analysis first (quick baseline)
            manual_analysis = WritingPracticeService.analyze_response_quality(response_text, question_category)

            # Create AI prompt for enhanced analysis
            prompt = f"""Analyze this interview response and provide detailed feedback.

Question: {question}
Response: {response_text}

Provide analysis in JSON format with these exact fields:
{{
  "clarity_score": <0-100>,
  "professionalism_score": <0-100>,
  "structure_analysis": "<2-3 sentences about structure>",
  "storytelling_effectiveness": <0-100>,
  "star_compliance": {{"has_situation": boolean, "has_task": boolean, "has_action": boolean, "has_result": boolean}},
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvement_suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "overall_feedback": "<2-3 sentences of encouraging feedback>",
  "engagement_level": <0-100>
}}"""

            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interview coach analyzing written responses. Provide constructive, encouraging feedback in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.7,
            )

            response_text_ai = response.choices[0].message.content.strip()

            # Parse AI response
            try:
                ai_feedback = json.loads(response_text_ai)
            except json.JSONDecodeError:
                # If JSON parsing fails, return manual analysis with note
                manual_analysis["ai_feedback_available"] = False
                manual_analysis["note"] = "Using standard analysis (AI parsing failed)"
                return manual_analysis

            # Merge AI insights with manual analysis
            merged = {
                **manual_analysis,
                "clarity_score": ai_feedback.get("clarity_score", manual_analysis["clarity_score"]),
                "professionalism_score": ai_feedback.get("professionalism_score", manual_analysis["professionalism_score"]),
                "structure_analysis": ai_feedback.get("structure_analysis", ""),
                "storytelling_effectiveness": ai_feedback.get("storytelling_effectiveness", 75),
                "star_compliance": ai_feedback.get("star_compliance", {}),
                "overall_feedback": ai_feedback.get("overall_feedback", ""),
                "engagement_level": ai_feedback.get("engagement_level", 75),
                "ai_feedback_available": True,
                "strengths": ai_feedback.get("strengths", manual_analysis["strengths"]),
                "specific_suggestions": ai_feedback.get("improvement_suggestions", manual_analysis["specific_suggestions"]),
            }

            return merged

        except Exception as e:
            print(f"AI analysis error: {e}, falling back to manual analysis")
            # Fall back to manual analysis
            analysis = WritingPracticeService.analyze_response_quality(response_text, question_category)
            analysis["ai_feedback_available"] = False
            analysis["note"] = "Using standard analysis (AI unavailable)"
            return analysis

    @staticmethod
    def get_nerves_management_exercises() -> List[Dict[str, Any]]:
        """
        Provide exercises for managing interview nerves before writing practice
        """
        return [
            {
                "id": "breathing",
                "title": "Box Breathing Exercise",
                "duration_seconds": 60,
                "description": "Calm your nervous system with structured breathing",
                "instructions": [
                    "Breathe in for 4 counts",
                    "Hold for 4 counts",
                    "Exhale for 4 counts",
                    "Hold for 4 counts",
                    "Repeat 4 times"
                ],
                "benefits": "Reduces anxiety and improves focus"
            },
            {
                "id": "confidence_reframe",
                "title": "Confidence Reframing",
                "duration_seconds": 90,
                "description": "Shift negative thoughts to positive ones",
                "prompts": [
                    "I've prepared well for this",
                    "This is an opportunity to showcase my skills",
                    "I have valuable experiences to share",
                    "I can think on my feet and handle this",
                    "My authentic voice is my strength"
                ],
                "benefits": "Build mental confidence and positivity"
            },
            {
                "id": "warmup_drill",
                "title": "Quick Warm-up Writing Drill",
                "duration_seconds": 120,
                "description": "Get your thoughts flowing with a quick exercise",
                "prompt": "Describe a time you solved a problem in 1-2 minutes",
                "benefits": "Primes your mind for structured responses"
            },
            {
                "id": "power_pose",
                "title": "Power Pose Exercise",
                "duration_seconds": 30,
                "description": "Build confidence through body language",
                "instructions": [
                    "Stand with feet shoulder-width apart",
                    "Put your hands on your hips or raise arms in victory",
                    "Hold for 30 seconds",
                    "Feel the confidence building"
                ],
                "benefits": "Increases confidence and reduces stress hormones"
            }
        ]

    @staticmethod
    def get_writing_tips() -> Dict[str, List[str]]:
        """
        Provide tips for crafting engaging written responses
        """
        return {
            "engagement_techniques": [
                "Open with a specific, relevant detail or example",
                "Use active voice instead of passive voice",
                "Include quantifiable results (numbers, percentages)",
                "Create a narrative arc with clear beginning, middle, end",
                "Use specific action verbs (led, implemented, developed)",
                "Connect your answer to the company or role when possible"
            ],
            "strong_openers": [
                "\"In my previous role...\"",
                "\"When faced with...\"",
                "\"The situation required...\"",
                "\"I learned that...\"",
                "\"Our team accomplished...\"",
                "\"I took initiative to...\"",
                "\"The challenge taught me...\"",
                "\"By leveraging my skills in...\"",
            ],
            "memorable_finishes": [
                "Highlight the impact or lesson learned",
                "Relate back to the job description",
                "Show growth or future application",
                "End with enthusiasm or confidence",
                "Summarize key accomplishment or skill",
                "Connect to company values or mission"
            ],
            "dos": [
                "✓ Be specific with examples and numbers",
                "✓ Show clear problem-solving approach",
                "✓ Demonstrate relevant skills for the role",
                "✓ Use the STAR method for behavioral questions",
                "✓ Show enthusiasm and genuine interest",
                "✓ Keep responses concise (75-150 words)",
                "✓ Practice speaking your answer aloud"
            ],
            "donts": [
                "✗ Avoid generic answers that could apply anywhere",
                "✗ Don't use passive voice or be vague",
                "✗ Avoid rambling or going off-topic",
                "✗ Don't be overly self-deprecating",
                "✗ Avoid filler words (like, um, uh, just, really)",
                "✗ Don't focus only on failures without lessons",
                "✗ Avoid speaking too fast or running out of breath"
            ],
            "avoiding_rambling": [
                "State your main point in the first sentence",
                "Use transitional phrases: first, then, finally",
                "Limit each section to 2-3 sentences max",
                "Check word count - aim for 75-150 words",
                "Practice your answer multiple times",
                "Record yourself and listen for unnecessary details"
            ]
        }

    @staticmethod
    def generate_improvement_checklist(analysis: Dict[str, Any], communication_style: str = "direct") -> List[Dict[str, Any]]:
        """
        Generate a checklist of specific improvements based on analysis
        """
        checklist = []

        # Content improvements
        if analysis.get("overall_score", 0) < 70:
            checklist.append({
                "category": "Content",
                "item": "Add more specific, quantifiable examples",
                "priority": "high",
                "why": "Concrete details make answers more compelling"
            })

        # Structure improvements
        if analysis.get("structure_score", 0) < 75:
            if "behavioral" in str(analysis.get("question_category", "")).lower():
                checklist.append({
                    "category": "Structure",
                    "item": "Follow STAR framework more clearly",
                    "priority": "high",
                    "why": "STAR structure is expected for behavioral questions"
                })

        # Clarity improvements
        if analysis.get("clarity_score", 0) < 75:
            checklist.append({
                "category": "Clarity",
                "item": "Use more transition words between ideas",
                "priority": "medium",
                "why": "Transitions help listeners follow your logic"
            })

        # Length improvements
        word_count = analysis.get("word_count", 0)
        if word_count < 75:
            checklist.append({
                "category": "Completeness",
                "item": "Expand your answer with more details",
                "priority": "medium",
                "why": "75-150 words gives you space to explain fully"
            })
        elif word_count > 200:
            checklist.append({
                "category": "Conciseness",
                "item": "Cut unnecessary details and filler words",
                "priority": "medium",
                "why": "Concise answers show focused thinking"
            })

        # Professionalism improvements
        if analysis.get("professionalism_score", 0) < 80:
            checklist.append({
                "category": "Tone",
                "item": "Replace contractions with formal language",
                "priority": "low",
                "why": "Professional tone is expected in interviews"
            })

        # Engagement improvements
        if analysis.get("engagement_level", 0) < 70:
            checklist.append({
                "category": "Engagement",
                "item": "Make your opening hook more compelling",
                "priority": "medium",
                "why": "A strong opening captures immediate attention"
            })

        # Practice reminder
        checklist.append({
            "category": "Practice",
            "item": "Practice speaking this answer aloud",
            "priority": "high",
            "why": "Written and spoken delivery require different skills"
        })

        # Communication style specific tips
        if communication_style == "technical":
            checklist.append({
                "category": "Style",
                "item": "Balance technical terms with clear explanations",
                "priority": "medium",
                "why": "Clarity matters more than jargon"
            })
        elif communication_style == "narrative":
            checklist.append({
                "category": "Style",
                "item": "Strengthen the story arc and emotional connection",
                "priority": "medium",
                "why": "Stories are memorable and engaging"
            })

        return checklist

    @staticmethod
    def generate_detailed_comparison(current_analysis: Dict[str, Any], previous_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate detailed comparison between practice sessions
        Returns side-by-side improvements and trends
        """
        if not previous_analyses:
            return {
                "can_compare": False,
                "message": "This is your first attempt - no previous sessions to compare",
                "recommendation": "Complete more practice sessions to track your improvement"
            }

        latest_previous = previous_analyses[0]

        # Calculate improvements
        clarity_improvement = current_analysis.get("clarity_score", 0) - latest_previous.get("clarity_score", 0)
        professionalism_improvement = current_analysis.get("professionalism_score", 0) - latest_previous.get("professionalism_score", 0)
        structure_improvement = current_analysis.get("structure_score", 0) - latest_previous.get("structure_score", 0)
        overall_improvement = current_analysis.get("overall_score", 0) - latest_previous.get("overall_score", 0)

        comparison = {
            "can_compare": True,
            "comparison_with_last_attempt": {
                "clarity": {
                    "previous": round(latest_previous.get("clarity_score", 0), 2),
                    "current": round(current_analysis.get("clarity_score", 0), 2),
                    "improvement": round(clarity_improvement, 2),
                    "improved": clarity_improvement > 0,
                    "status": "↑ Improved" if clarity_improvement > 5 else "→ Stable" if clarity_improvement > -5 else "↓ Declined"
                },
                "professionalism": {
                    "previous": round(latest_previous.get("professionalism_score", 0), 2),
                    "current": round(current_analysis.get("professionalism_score", 0), 2),
                    "improvement": round(professionalism_improvement, 2),
                    "improved": professionalism_improvement > 0,
                    "status": "↑ Improved" if professionalism_improvement > 5 else "→ Stable" if professionalism_improvement > -5 else "↓ Declined"
                },
                "structure": {
                    "previous": round(latest_previous.get("structure_score", 0), 2),
                    "current": round(current_analysis.get("structure_score", 0), 2),
                    "improvement": round(structure_improvement, 2),
                    "improved": structure_improvement > 0,
                    "status": "↑ Improved" if structure_improvement > 5 else "→ Stable" if structure_improvement > -5 else "↓ Declined"
                },
                "overall": {
                    "previous": round(latest_previous.get("overall_score", 0), 2),
                    "current": round(current_analysis.get("overall_score", 0), 2),
                    "improvement": round(overall_improvement, 2),
                    "improved": overall_improvement > 0,
                    "status": "↑ Improved" if overall_improvement > 5 else "→ Stable" if overall_improvement > -5 else "↓ Declined"
                }
            },
            "highlights": [],
            "areas_to_focus": []
        }

        # Add highlights
        if clarity_improvement > 5:
            comparison["highlights"].append("Great improvement in clarity!")
        if structure_improvement > 5:
            comparison["highlights"].append("Your structure is getting much better!")
        if overall_improvement > 5:
            comparison["highlights"].append("Overall strong improvement - keep it up!")

        # Add areas to focus
        if clarity_improvement < -5:
            comparison["areas_to_focus"].append("Clarity seems to have slipped - remember your transition words")
        if structure_improvement < -5:
            comparison["areas_to_focus"].append("Try to maintain the structure framework you've been working on")

        if not comparison["highlights"]:
            comparison["highlights"].append("You're maintaining your strong performance")

        return comparison