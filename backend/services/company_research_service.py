"""
Company Research Automation Service (UC-074)

This service generates comprehensive company research reports for interview preparation.
It uses AI to gather insights about companies and creates talking points and interview questions.
"""

import json
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from mongo.AI_dao import ai_dao


class CompanyResearchService:
    """Service for generating company research reports for interviews"""

    @staticmethod
    async def generate_company_research(
        company_name: str,
        job_role: Optional[str] = None,
        job_description: Optional[str] = None,
        industry: Optional[str] = None,
        company_website: Optional[str] = None,
        company_info: Optional[Dict[str, Any]] = None,
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate comprehensive company research report.

        Args:
            company_name: Name of the company
            job_role: Job title/position
            job_description: Full job description text
            industry: Industry classification
            company_website: Company website URL
            company_info: Additional company metadata
            custom_prompt: Custom instructions for generation

        Returns:
            Dictionary containing company research report
        """

        # Prepare data for AI
        company_context = CompanyResearchService._prepare_context(
            company_name=company_name,
            job_role=job_role,
            job_description=job_description,
            industry=industry,
            company_website=company_website,
            company_info=company_info,
        )

        try:
            # Generate research sections
            research_report = {
                "company_profile": await CompanyResearchService._generate_company_profile(
                    company_name, company_context, custom_prompt
                ),
                "history": await CompanyResearchService._generate_company_history(
                    company_name, company_context, custom_prompt
                ),
                "mission_and_values": await CompanyResearchService._generate_mission_values(
                    company_name, company_context, custom_prompt
                ),
                "leadership_team": await CompanyResearchService._generate_leadership_team(
                    company_name, company_context, custom_prompt
                ),
                "recent_news": await CompanyResearchService._generate_recent_news(
                    company_name, company_context, custom_prompt
                ),
                "funding": await CompanyResearchService._generate_funding_info(
                    company_name, industry, company_context, custom_prompt
                ),
                "competition": await CompanyResearchService._generate_competition(
                    company_name, industry, company_context, custom_prompt
                ),
                "market_position": await CompanyResearchService._generate_market_position(
                    company_name, industry, company_context, custom_prompt
                ),
                "talking_points": await CompanyResearchService._generate_talking_points(
                    company_name, job_role, job_description, company_context, custom_prompt
                ),
                "intelligent_questions": await CompanyResearchService._generate_intelligent_questions(
                    company_name, job_role, industry, company_context, custom_prompt
                ),
                "generated_at": datetime.now(timezone.utc),
            }

            return research_report

        except Exception as e:
            # Fallback to deterministic generation
            error_msg = str(e)
            error_trace = traceback.format_exc()
            print(f"[UC-074 ERROR] Error during AI research generation for {company_name}:")
            print(f"[UC-074 ERROR] {error_msg}")
            print(f"[UC-074 ERROR] Stack trace:\n{error_trace}")
            return CompanyResearchService._generate_fallback_research(
                company_name=company_name,
                job_role=job_role,
                job_description=job_description,
                industry=industry,
                company_website=company_website,
                company_info=company_info,
            )

    @staticmethod
    def _prepare_context(
        company_name: str,
        job_role: Optional[str],
        job_description: Optional[str],
        industry: Optional[str],
        company_website: Optional[str],
        company_info: Optional[Dict],
    ) -> Dict[str, Any]:
        """Prepare context information for AI prompts"""
        context = {
            "company_name": company_name,
            "job_role": job_role or "Position",
            "industry": industry or "Technology",
            "company_website": company_website or f"https://www.{company_name.lower().replace(' ', '')}.com",
        }

        if company_info:
            context.update(company_info)

        if job_description:
            context["job_description"] = job_description[:1000]  # Limit to 1000 chars

        return context

    @staticmethod
    async def _generate_company_profile(
        company_name: str, context: Dict, custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate company profile overview"""
        prompt = custom_prompt or (
            f"Provide a concise company profile for {company_name}. Include: company description (1-2 sentences), "
            f"industry, company size (employee count), headquarters location, and key services/products. "
            f"Format as a structured JSON object with keys: description, industry, size, location, key_services. "
            f"Respond ONLY with valid JSON."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            # Extract JSON from response
            profile_data = CompanyResearchService._extract_json(response)
            return profile_data if profile_data else {"description": response}
        except Exception as e:
            print(f"[UC-074 WARN] Failed to generate company profile: {str(e)}")
            return {
                "description": f"{company_name} is a company in the {context.get('industry', 'Technology')} industry.",
                "industry": context.get("industry", "Technology"),
                "location": "Unknown",
            }

    @staticmethod
    async def _generate_company_history(
        company_name: str, context: Dict, custom_prompt: Optional[str] = None
    ) -> str:
        """Generate company history"""
        prompt = custom_prompt or (
            f"Provide a brief company history for {company_name}. Include founding date, "
            f"major milestones, and key turning points. Keep it to 2-3 paragraphs. "
            f"Be specific with dates when possible."
        )

        try:
            return await ai_dao.generate_text(prompt)
        except Exception as e:
            print(f"[UC-074 WARN] Failed to generate company history: {str(e)}")
            return f"{company_name} was founded as a company in the {context.get('industry', 'Technology')} industry."

    @staticmethod
    async def _generate_mission_values(
        company_name: str, context: Dict, custom_prompt: Optional[str] = None
    ) -> str:
        """Generate mission and values statement"""
        prompt = custom_prompt or (
            f"What is {company_name}'s mission statement and core values? "
            f"Provide in 1-2 paragraphs, highlighting their stated mission, vision, and core values. "
            f"Be authentic and based on publicly available information."
        )

        try:
            return await ai_dao.generate_text(prompt)
        except Exception:
            return f"{company_name} is committed to innovation and excellence in the {context.get('industry', 'Technology')} sector."

    @staticmethod
    async def _generate_leadership_team(
        company_name: str, context: Dict, custom_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate leadership team information"""
        prompt = custom_prompt or (
            f"List the key leadership team members of {company_name}. Include CEO, CTO/VP Engineering, and 2-3 other key executives. "
            f"For each person, provide: name, title, background summary (1 sentence). "
            f"Format as a JSON array of objects with keys: name, title, background. "
            f"Respond ONLY with valid JSON array."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            leaders = CompanyResearchService._extract_json(response)
            return leaders if isinstance(leaders, list) else []
        except Exception:
            return [
                {
                    "name": "Leadership Team",
                    "title": "Executive Leadership",
                    "background": f"Key leaders driving {company_name}'s vision and strategy.",
                }
            ]

    @staticmethod
    async def _generate_recent_news(
        company_name: str, context: Dict, custom_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate recent news and announcements"""
        prompt = custom_prompt or (
            f"What is recent news about {company_name}? List 3-5 significant announcements, partnerships, "
            f"product launches, or company developments from the past 12 months. "
            f"Format as a JSON array of objects with keys: title, description, date (YYYY-MM format), category (announcement/partnership/product/other). "
            f"Respond ONLY with valid JSON array."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            news = CompanyResearchService._extract_json(response)
            return news if isinstance(news, list) else []
        except Exception as e:
            print(f"[UC-074 WARN] Failed to generate recent news: {str(e)}")
            return [
                {
                    "title": "Company News",
                    "description": f"Stay updated on latest developments at {company_name}",
                    "category": "announcement",
                }
            ]

    @staticmethod
    async def _generate_funding_info(
        company_name: str, industry: Optional[str], context: Dict, custom_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate funding information (for startups)"""
        is_startup = industry and "startup" in industry.lower()

        prompt = custom_prompt or (
            f"Provide funding information for {company_name}. "
            f"{'If it is a startup, list' if is_startup else 'List'} funding rounds (Series A, B, C, etc.) with amounts and investors. "
            f"Format as a JSON array of objects with keys: round, amount_usd, date (YYYY format), investors (array), "
            f"total_raised_usd (number). If no funding data available, return empty array. "
            f"Respond ONLY with valid JSON array."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            funding = CompanyResearchService._extract_json(response)
            return funding if isinstance(funding, list) else []
        except Exception as e:
            print(f"[UC-074 WARN] Failed to generate funding info: {str(e)}")
            return []

    @staticmethod
    async def _generate_competition(
        company_name: str, industry: Optional[str], context: Dict, custom_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate competitive landscape analysis"""
        prompt = custom_prompt or (
            f"Analyze the competitive landscape for {company_name} in the {industry or 'Technology'} industry. "
            f"List 3-5 main competitors and their positioning. Also identify market threats and opportunities. "
            f"Format as a JSON object with keys: competitors (array of {{name, description, market_position}}), "
            f"threats (array of strings), opportunities (array of strings), market_trends (array of strings). "
            f"Respond ONLY with valid JSON object."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            competition = CompanyResearchService._extract_json(response)
            if isinstance(competition, dict) and "competitors" in competition:
                return competition.get("competitors", [])
            return []
        except Exception as e:
            print(f"[UC-074 WARN] Failed to generate competition analysis: {str(e)}")
            return []

    @staticmethod
    async def _generate_market_position(
        company_name: str, industry: Optional[str], context: Dict, custom_prompt: Optional[str] = None
    ) -> str:
        """Generate market position analysis"""
        prompt = custom_prompt or (
            f"Describe {company_name}'s market position and competitive advantages. "
            f"What makes them stand out in the {industry or 'Technology'} market? "
            f"What is their differentiation strategy? Keep to 2-3 paragraphs."
        )

        try:
            return await ai_dao.generate_text(prompt)
        except Exception:
            return f"{company_name} is a leading player in the {industry or 'Technology'} industry with strong market presence."

    @staticmethod
    async def _generate_talking_points(
        company_name: str,
        job_role: Optional[str],
        job_description: Optional[str],
        context: Dict,
        custom_prompt: Optional[str] = None,
    ) -> List[str]:
        """Generate personalized talking points for the interview"""
        prompt = custom_prompt or (
            f"Generate 8-10 personalized talking points for a candidate interviewing for the position of {job_role or 'a role'} "
            f"at {company_name}. The talking points should: "
            f"1) Demonstrate knowledge of {company_name}'s business and market "
            f"2) Connect the {job_role or 'role'}'s responsibilities to the company's goals "
            f"3) Show understanding of industry trends relevant to {company_name} "
            f"4) Highlight genuine interest and cultural fit "
            f"5) Demonstrate how your skills align with the role. "
            f"{'Job description: ' + job_description[:300] if job_description else ''} "
            f"Format as a JSON array of strings. Respond ONLY with valid JSON array."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            talking_points = CompanyResearchService._extract_json(response)
            return talking_points if isinstance(talking_points, list) else []
        except Exception:
            return [
                f"Strong understanding of {company_name}'s mission and market position",
                f"Knowledge of {company_name}'s recent announcements and direction",
                f"Alignment with {company_name}'s values and culture",
                f"Relevant experience for the {job_role or 'role'} position",
            ]

    @staticmethod
    async def _generate_intelligent_questions(
        company_name: str,
        job_role: Optional[str],
        industry: Optional[str],
        context: Dict,
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, List[str]]:
        """Generate intelligent questions to ask interviewers"""
        prompt = custom_prompt or (
            f"Generate intelligent questions for a candidate to ask during an interview for {job_role or 'a position'} "
            f"at {company_name} in the {industry or 'Technology'} industry. Organize questions into these categories: "
            f"1) role_alignment: Questions about the specific role, responsibilities, and success metrics "
            f"2) strategy: Questions about company strategy, growth plans, and market direction "
            f"3) team_culture: Questions about team dynamics, culture, and work environment "
            f"4) projects: Questions about current projects, technical challenges, and innovation. "
            f"Provide 2-3 questions per category. "
            f"Format as a JSON object with keys: role_alignment, strategy, team_culture, projects (each containing an array of question strings). "
            f"Respond ONLY with valid JSON object."
        )

        try:
            response = await ai_dao.generate_text(prompt)
            questions = CompanyResearchService._extract_json(response)
            if isinstance(questions, dict):
                # Ensure all expected keys exist
                default_questions = {
                    "role_alignment": [],
                    "strategy": [],
                    "team_culture": [],
                    "projects": [],
                }
                default_questions.update(questions)
                return default_questions
            return {
                "role_alignment": [],
                "strategy": [],
                "team_culture": [],
                "projects": [],
            }
        except Exception:
            return {
                "role_alignment": [f"What does success look like in this {job_role or 'role'}?"],
                "strategy": [f"What are {company_name}'s strategic priorities for the next year?"],
                "team_culture": ["How would you describe the team culture?"],
                "projects": ["What are the most exciting projects the team is working on?"],
            }

    @staticmethod
    def _extract_json(response: str) -> Any:
        """Extract JSON from AI response text"""
        try:
            # Try direct JSON parsing
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            start_idx = response.find("{")
            end_idx = response.rfind("}")
            if start_idx != -1 and end_idx != -1:
                try:
                    return json.loads(response[start_idx : end_idx + 1])
                except json.JSONDecodeError:
                    pass

            # Try to find JSON array
            start_idx = response.find("[")
            end_idx = response.rfind("]")
            if start_idx != -1 and end_idx != -1:
                try:
                    return json.loads(response[start_idx : end_idx + 1])
                except json.JSONDecodeError:
                    pass

            return None

    @staticmethod
    def _generate_fallback_research(
        company_name: str,
        job_role: Optional[str] = None,
        job_description: Optional[str] = None,
        industry: Optional[str] = None,
        company_website: Optional[str] = None,
        company_info: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Generate research using deterministic fallback when AI is unavailable.
        This ensures the feature works even if the AI service fails.
        """
        return {
            "company_profile": {
                "description": f"{company_name} is a company operating in the {industry or 'Technology'} industry.",
                "industry": industry or "Technology",
                "website": company_website or f"https://www.{company_name.lower().replace(' ', '')}.com",
            },
            "history": f"{company_name} has established itself as a notable player in the {industry or 'Technology'} space.",
            "mission_and_values": f"{company_name} is committed to innovation, quality, and customer success.",
            "leadership_team": [
                {
                    "name": "Company Leadership",
                    "title": "Executive Team",
                    "background": f"Driving {company_name}'s vision and strategy forward",
                }
            ],
            "recent_news": [
                {
                    "title": "Company News",
                    "description": f"Visit {company_name}'s official channels for latest announcements",
                    "category": "announcement",
                }
            ],
            "funding": [],
            "competition": [],
            "market_position": f"{company_name} is a notable company in the {industry or 'Technology'} market with competitive offerings.",
            "talking_points": [
                f"Knowledge of {company_name}'s mission and market presence",
                f"Understanding of opportunities in the {industry or 'Technology'} industry",
                f"Alignment with company values and culture",
                f"Relevant skills and experience for the {job_role or 'position'}",
                f"Interest in contributing to {company_name}'s success",
            ],
            "intelligent_questions": {
                "role_alignment": [
                    f"What does success look like in this {job_role or 'role'}?",
                    f"How does this role contribute to {company_name}'s broader goals?",
                ],
                "strategy": [
                    f"What are {company_name}'s strategic priorities for the next year?",
                    f"How does {company_name} differentiate itself in the market?",
                ],
                "team_culture": [
                    "How would you describe the team culture and work environment?",
                    "What values are most important to the team?",
                ],
                "projects": [
                    "What are the most exciting projects the team is working on?",
                    f"How do you see {company_name}'s technology evolving?",
                ],
            },
            "generated_at": datetime.now(timezone.utc),
        }


# Singleton instance
company_research_service = CompanyResearchService()
