"""
Prompt Templates for AI Resume Generation
Uses variable substitution for context-aware prompts
Related to UC-047, UC-049, UC-050
"""


class PromptTemplates:
    """Structured prompts with variable substitution for OpenAI"""

    # UC-047: Generate Resume Content
    GENERATE_CONTENT_PROMPT = """
You are an expert resume writer. Based on the provided resume and job posting, generate tailored resume content.

RESUME:
- Name: {user_name}
- Current Summary: {current_summary}
- Skills: {user_skills}
- Experience: {user_experience}

JOB POSTING:
- Title: {job_title}
- Company: {job_company}
- Description: {job_description}
- Requirements: {job_requirements}

Generate the following in JSON format:
1. A tailored professional summary (2-3 sentences, highlighting relevant experience)
2. 3-4 tailored bullet points for work experience emphasizing relevant accomplishments
3. 5-8 skills to add/highlight based on the job requirements

Return as valid JSON with keys: "summary", "bullets", "skills"
Each bullet should start with a strong action verb and include quantifiable results where possible.
Skills should be in priority order (most relevant first).
"""

    # UC-049: Optimize Skills
    OPTIMIZE_SKILLS_PROMPT = """
You are an ATS (Applicant Tracking System) expert specializing in skills optimization.

USER'S CURRENT SKILLS:
{user_skills}

JOB POSTING:
- Title: {job_title}
- Description: {job_description}
- Requirements: {job_requirements}

Analyze the job posting and provide:
1. Which of the user's skills should be emphasized (most relevant to the job)
2. What skills are missing but critical for this role
3. Recommended skills to add (based on industry trends and job requirements)
4. An optimization score (0-100) representing how well the skills match

Provide response in JSON format with keys:
"skills_to_emphasize" (array of user's skills that match job),
"missing_critical_skills" (array of skills the user doesn't have but job requires),
"recommended_skills" (array of valuable skills to add),
"optimization_score" (number 0-100),
"reasoning" (brief explanation of gaps and recommendations)
"""

    # UC-050: Tailor Experience
    TAILOR_EXPERIENCE_PROMPT = """
You are an expert career coach specializing in tailoring resumes for specific roles.

USER'S WORK EXPERIENCE:
{user_experience}

JOB POSTING:
- Title: {job_title}
- Company: {job_company}
- Description: {job_description}
- Requirements: {job_requirements}

For each work experience, analyze EACH BULLET POINT and generate alternatives.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "experiences": [
    {{
      "title": "Job Title",
      "original_description": "Full original description",
      "relevance_score": 75,
      "matched_keywords": ["keyword1", "keyword2"],
      "bullet_alternatives": [
        {{
          "original_bullet": "Original bullet text",
          "alternatives": ["Better version 1", "Better version 2"]
        }}
      ]
    }}
  ]
}}

Instructions:
1. For EACH bullet point in the experience, create one bullet_alternatives object
2. Keep original_bullet exactly as it appears
3. Provide 2 alternatives that emphasize job-relevant skills
4. Use action verbs from job requirements
5. Add metrics/quantification where possible
6. relevance_score: how well this experience matches (0-100)
7. matched_keywords: top job requirements found in this experience

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown, no explanation.
"""

    @staticmethod
    def format_generate_content_prompt(
        user_name: str,
        current_summary: str,
        user_skills: list,
        user_experience: list,
        job_title: str,
        job_company: str,
        job_description: str,
        job_requirements: str,
    ) -> str:
        """Format UC-047 prompt with user data"""
        skills_text = ", ".join(user_skills) if user_skills else "Not specified"

        experience_text = ""
        for exp in user_experience:
            exp_str = f"- {exp.get('title', 'Position')}: {exp.get('description', 'No description provided')}"
            experience_text += exp_str + "\n"

        return PromptTemplates.GENERATE_CONTENT_PROMPT.format(
            user_name=user_name or "User",
            current_summary=current_summary or "No summary provided",
            user_skills=skills_text,
            user_experience=experience_text or "No experience provided",
            job_title=job_title or "Unknown Position",
            job_company=job_company or "Unknown Company",
            job_description=job_description or "No description provided",
            job_requirements=job_requirements or "No requirements provided",
        )

    @staticmethod
    def format_optimize_skills_prompt(
        user_skills: list,
        job_title: str,
        job_description: str,
        job_requirements: str,
    ) -> str:
        """Format UC-049 prompt with user data"""
        skills_text = ", ".join(user_skills) if user_skills else "Not specified"

        return PromptTemplates.OPTIMIZE_SKILLS_PROMPT.format(
            user_skills=skills_text,
            job_title=job_title or "Unknown Position",
            job_description=job_description or "No description provided",
            job_requirements=job_requirements or "No requirements provided",
        )

    @staticmethod
    def format_tailor_experience_prompt(
        user_experience: list,
        job_title: str,
        job_company: str,
        job_description: str,
        job_requirements: str,
    ) -> str:
        """Format UC-050 prompt with user data"""
        experience_text = ""
        for idx, exp in enumerate(user_experience, 1):
            exp_str = (
                f"{idx}. Title: {exp.get('title', 'Position')}\n"
                f"   Company: {exp.get('company', 'Unknown')}\n"
                f"   Description: {exp.get('description', 'No description provided')}\n"
            )
            experience_text += exp_str

        return PromptTemplates.TAILOR_EXPERIENCE_PROMPT.format(
            user_experience=experience_text or "No experience provided",
            job_title=job_title or "Unknown Position",
            job_company=job_company or "Unknown Company",
            job_description=job_description or "No description provided",
            job_requirements=job_requirements or "No requirements provided",
        )
