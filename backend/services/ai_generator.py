"""
AI Resume Generator Service
Cohere-powered resume content generation
UC-047: Generate Resume Content
UC-049: Optimize Skills
UC-050: Tailor Experience
"""

import json
import os
import re
from typing import Dict, List, Any
import cohere
from services.prompt_templates import PromptTemplates
from services.tracked_ai_clients import TrackedCohereClient


class AIGenerator:
    """Generate AI-powered resume content and suggestions using Cohere"""

    # Initialize Cohere client
    _client = None

    @classmethod
    def get_client(cls):
        """Get or create Tracked Cohere client"""
        if cls._client is None:
            # Use TrackedCohereClient for automatic logging and fallback
            cls._client = TrackedCohereClient()
        return cls._client

    @staticmethod
    def parse_json_response(response_text: str) -> Dict[str, Any]:
        """
        Parse JSON from Cohere response
        Handles cases where JSON is wrapped in markdown code blocks
        """
        # Remove markdown code blocks if present
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]

        response_text = response_text.strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"[AIGenerator] JSON parse error: {e}")
            print(f"[AIGenerator] Response text: {response_text[:500]}")
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")

    @classmethod
    def generate_ai_content(cls, resume_data: Dict[str, Any], job_posting: Dict[str, Any]) -> Dict[str, Any]:
        """
        UC-047: Generate AI resume content based on job posting

        Args:
            resume_data: Resume object from MongoDB
            job_posting: Job posting with title, description, requirements

        Returns:
            {
                'generated_summary': str,
                'generated_bullets': [str],
                'suggested_skills': [str],
                'relevance_score': int (0-100)
            }
        """
        try:
            client = cls.get_client()

            # Get user data
            contact = resume_data.get('contact', {})
            user_name = contact.get('name', 'User')
            current_summary = resume_data.get('summary', '')
            user_skills = [s if isinstance(s, str) else s.get('name', '') for s in resume_data.get('skills', [])]
            user_experience = resume_data.get('experience', [])

            # Format prompt with variable substitution
            prompt = PromptTemplates.format_generate_content_prompt(
                user_name=user_name,
                current_summary=current_summary,
                user_skills=user_skills,
                user_experience=user_experience,
                job_title=job_posting.get('title', ''),
                job_company=job_posting.get('company', ''),
                job_description=job_posting.get('description', ''),
                job_requirements=job_posting.get('requirements', ''),
            )

            # Call Cohere API
            print(f"[AIGenerator] Calling Cohere for content generation...")
            response = client.chat(
                model="command-a-03-2025",
                messages=[
                    {"role": "system", "content": "You are an expert resume writer. Respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2500,
            )

            # Parse response
            response_text = response.message.content[0].text
            result = cls.parse_json_response(response_text)

            # Ensure expected fields exist
            return {
                'generated_summary': result.get('summary', ''),
                'generated_bullets': result.get('bullets', [])[:4],
                'suggested_skills': result.get('skills', [])[:8],
                'relevance_score': min(100, max(0, result.get('relevance_score', 75))),
                'keywords_found': result.get('keywords', [])[:5]
            }

        except ValueError as e:
            print(f"[AIGenerator] ValueError in generate_ai_content: {e}")
            raise
        except Exception as e:
            print(f"[AIGenerator] Error in generate_ai_content: {e}")
            raise ValueError(f"Failed to generate content: {str(e)}")

    @classmethod
    def optimize_skills(cls, resume_data: Dict[str, Any], job_posting: Dict[str, Any]) -> Dict[str, Any]:
        """
        UC-049: Optimize skills based on job posting

        Args:
            resume_data: Resume object from MongoDB
            job_posting: Job posting data

        Returns:
            {
                'skills_to_emphasize': [str],
                'recommended_skills': [str],
                'missing_skills': [str],
                'optimization_score': int (0-100)
            }
        """
        try:
            client = cls.get_client()

            # Get user skills
            user_skills = [s if isinstance(s, str) else s.get('name', '') for s in resume_data.get('skills', [])]

            # Format prompt with variable substitution
            prompt = PromptTemplates.format_optimize_skills_prompt(
                user_skills=user_skills,
                job_title=job_posting.get('title', ''),
                job_description=job_posting.get('description', ''),
                job_requirements=job_posting.get('requirements', ''),
            )

            # Call Cohere API
            print(f"[AIGenerator] Calling Cohere for skills optimization...")
            response = client.chat(
                model="command-a-03-2025",
                messages=[
                    {"role": "system", "content": "You are an ATS expert. Respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            # Parse response
            response_text = response.message.content[0].text
            result = cls.parse_json_response(response_text)

            # Ensure expected fields exist
            return {
                'skills_to_emphasize': result.get('skills_to_emphasize', [])[:5],
                'recommended_skills': result.get('recommended_skills', [])[:8],
                'missing_skills': result.get('missing_critical_skills', [])[:5],
                'optimization_score': min(100, max(0, result.get('optimization_score', 70))),
                'total_match': f"{len(result.get('skills_to_emphasize', []))}/{len(user_skills) + len(result.get('recommended_skills', []))}"
            }

        except ValueError as e:
            print(f"[AIGenerator] ValueError in optimize_skills: {e}")
            raise
        except Exception as e:
            print(f"[AIGenerator] Error in optimize_skills: {e}")
            raise ValueError(f"Failed to optimize skills: {str(e)}")

    @classmethod
    def tailor_experience(cls, resume_data: Dict[str, Any], job_posting: Dict[str, Any]) -> Dict[str, Any]:
        """
        UC-050: Generate tailored experience descriptions

        Args:
            resume_data: Resume object from MongoDB
            job_posting: Job posting data

        Returns:
            {
                'tailored_experiences': [
                    {
                        'index': int,
                        'original': str,
                        'variations': [str],
                        'relevance_score': int
                    }
                ]
            }
        """
        try:
            client = cls.get_client()

            # Get user experience
            user_experience = resume_data.get('experience', [])

            # Format prompt with variable substitution
            prompt = PromptTemplates.format_tailor_experience_prompt(
                user_experience=user_experience,
                job_title=job_posting.get('title', ''),
                job_company=job_posting.get('company', ''),
                job_description=job_posting.get('description', ''),
                job_requirements=job_posting.get('requirements', ''),
            )

            # Call Cohere API
            print(f"[AIGenerator] Calling Cohere for experience tailoring...")
            response = client.chat(
                model="command-a-03-2025",
                messages=[
                    {"role": "system", "content": "You are a career coach. Respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000,
            )

            # Parse response
            response_text = response.message.content[0].text
            print(f"[AIGenerator] Raw tailor_experience response: {response_text[:500]}")
            try:
                result = cls.parse_json_response(response_text)
            except ValueError as parse_err:
                print(f"[AIGenerator] JSON parse error details: {parse_err}")
                print(f"[AIGenerator] Response text (full): {response_text}")
                raise

            # Format tailored experiences
            tailored_experiences = []
            experiences_data = result.get('experiences', []) if isinstance(result.get('experiences', []), list) else [result]

            for idx, exp in enumerate(experiences_data):
                # Handle new bullet_alternatives structure
                bullet_alternatives = exp.get('bullet_alternatives', [])

                tailored_experiences.append({
                    'index': idx,
                    'original': exp.get('original_description', ''),
                    'title': exp.get('title', ''),
                    'bullet_alternatives': bullet_alternatives,  # New: per-bullet alternatives
                    'relevance_score': min(100, max(0, exp.get('relevance_score', 60))),
                    'matched_keywords': exp.get('matched_keywords', [])[:3]
                })

            # Calculate average relevance
            avg_relevance = int(
                sum(e['relevance_score'] for e in tailored_experiences) / max(len(tailored_experiences), 1)
            ) if tailored_experiences else 0

            return {
                'tailored_experiences': tailored_experiences,
                'total_experiences': len(user_experience),
                'average_relevance': avg_relevance
            }

        except ValueError as e:
            print(f"[AIGenerator] ValueError in tailor_experience: {e}")
            raise
        except Exception as e:
            print(f"[AIGenerator] Error in tailor_experience: {e}")
            raise ValueError(f"Failed to tailor experience: {str(e)}")
