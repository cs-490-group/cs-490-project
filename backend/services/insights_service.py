# backend/services/insights_service.py

class InterviewInsightsService:
    async def get_insights(self, company: str, role: str | None = None):
        """
        Mock interview insights — to be replaced with Cohere/API scraping later.
        """

        return {
            "company": company,
            "role": role,

            "overview": f"The interview process at {company} typically includes 2–4 stages and evaluates culture fit, communication, and technical competence.",

            "stages": [
                "Initial recruiter screen",
                "Technical assessment or coding challenge",
                "Hiring manager interview",
                "Onsite / panel interview"
            ],

            "common_questions": [
                "Tell me about yourself.",
                f"Why do you want to work at {company}?",
                "Describe a time you solved a difficult problem.",
                "How do you work on a team with conflicting opinions?"
            ],

            "interviewer_background": {
                "hint": "Interviewer backgrounds vary; research via LinkedIn for more details."
            },

            "company_specific_format": [
                f"{company} commonly uses behavioral-style questions.",
                "Expect scenario-based questions using STAR format.",
                "Technical candidates may complete a skills test."
            ],

            "recommendations": [
                "Prepare stories using STAR method.",
                "Practice common behavioral questions.",
                "Review any posted interview experiences on Glassdoor.",
                "Prepare questions to ask at the end of each interview."
            ],

            "timeline_expectations": "Most candidates complete the process in 1–3 weeks.",

            "candidate_tips": [
                "Be specific in answers — use measurable impact.",
                "Show enthusiasm for both role and company mission."
            ],

            "checklist": [
                "Research the company thoroughly",
                "Prepare STAR stories",
                "Rehearse common interview questions",
                "Update resume and portfolio",
                "Practice mock interviews"
            ]
        }


interview_insights_service = InterviewInsightsService()
