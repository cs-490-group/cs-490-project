"""
AI-Powered Referral Message Generation Service
Generates personalized referral request messages using Cohere AI
"""

import json
import os
from typing import Dict, Any, List
from mongo.AI_dao import ai_dao


class ReferralMessageService:
    """Generate AI-powered referral request messages"""

    @staticmethod
    async def generate_referral_message(
        user_profile: Dict[str, Any],
        job_details: Dict[str, Any],
        contact_info: Dict[str, Any],
        relationship_context: str = "professional",
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate a personalized referral request message
        
        Args:
            user_profile: User's resume/profile data
            job_details: Job posting details
            contact_info: Contact information
            relationship_context: Type of relationship (professional, personal, academic)
            tone: Message tone (professional, casual, formal)
            
        Returns:
            {
                'message': str,
                'subject_line': str,
                'personalization_score': int (0-100),
                'key_points_used': List[str],
                'tone_analysis': str
            }
        """
        try:
            # Build comprehensive prompt
            prompt = ReferralMessageService._build_message_prompt(
                user_profile, job_details, contact_info, relationship_context, tone
            )
            
            system_message = ReferralMessageService._get_system_message(tone)
            
            # Generate AI response
            ai_response = await ai_dao.generate_text(
                prompt=prompt,
                system_message=system_message
            )
            
            # Parse and structure the response
            result = ReferralMessageService._parse_ai_response(ai_response)
            
            return result
            
        except Exception as e:
            print(f"[ReferralMessageService] Error generating message: {e}")
            raise Exception(f"Failed to generate referral message: {str(e)}")

    @staticmethod
    def _build_message_prompt(
        user_profile: Dict[str, Any],
        job_details: Dict[str, Any], 
        contact_info: Dict[str, Any],
        relationship_context: str,
        tone: str
    ) -> str:
        """Build comprehensive prompt with all available information"""
        
        # Extract user information
        user_name = user_profile.get('contact', {}).get('name', 'User')
        user_skills = ReferralMessageService._format_skills(user_profile.get('skills', []))
        user_experience = ReferralMessageService._format_experience(user_profile.get('experience', []))
        user_education = ReferralMessageService._format_education(user_profile.get('education', []))
        user_summary = user_profile.get('summary', '')
        
        # Extract job information
        job_title = job_details.get('title', '')
        job_company = job_details.get('company', '')
        job_description = job_details.get('description', '')
        job_requirements = job_details.get('requirements', '')
        job_location = job_details.get('location', '')
        
        # Extract contact information
        contact_name = contact_info.get('name', '')
        contact_company = contact_info.get('employment', {}).get('company', '')
        contact_position = contact_info.get('employment', {}).get('position', '')
        contact_relationship = contact_info.get('relationship_type', '')
        contact_strength = contact_info.get('relationship_strength', '')
        contact_industry = contact_info.get('industry', '')
        
        prompt = f"""
Generate a personalized referral request message asking {contact_name} for a referral to {job_company}.

SENDER PROFILE:
- Name: {user_name}
- Summary: {user_summary}
- Skills: {user_skills}
- Experience: {user_experience}
- Education: {user_education}

TARGET JOB:
- Position: {job_title}
- Company: {job_company}
- Location: {job_location}
- Description: {job_description}
- Requirements: {job_requirements}

CONTACT INFORMATION:
- Name: {contact_name}
- Company: {contact_company}
- Position: {contact_position}
- Industry: {contact_industry}
- Relationship Type: {contact_relationship}
- Relationship Strength: {contact_strength}

CONTEXT:
- Relationship Context: {relationship_context}
- Desired Tone: {tone}

Generate a compelling referral request that:
1. Asks {contact_name} to refer {user_name} for the {job_title} position at {job_company}
2. Explains why {user_name} is a strong candidate for this role
3. Shows genuine interest in the target company and position
4. References your relationship with {contact_name} appropriately
5. Is concise yet personalized (150-250 words)
6. Includes a clear call to action
7. Makes it easy for them to help

This is YOU asking for a referral to get the job, not referring someone else.

Return response as valid JSON with this exact structure:
{{
    "message": "Complete referral request message",
    "subject_line": "Brief, compelling subject line",
    "personalization_score": 85,
    "key_points_used": [
        "Key point 1 from your background",
        "Key point 2 from job requirements", 
        "Key point 3 from connection"
    ],
    "tone_analysis": "Description of tone achieved",
    "word_count": 180
}}

Make the message feel authentic and personalized, not like a template.
"""
        return prompt

    @staticmethod
    def _get_system_message(tone: str) -> str:
        """Get appropriate system message based on desired tone"""
        base_message = "You are an expert networking and career coach who writes compelling referral request messages. You help job seekers ask their contacts for referrals to target companies. "
        
        tone_instructions = {
            "professional": base_message + "Write in a polished, business-appropriate tone that demonstrates competence and respect for the contact's time.",
            "casual": base_message + "Write in a friendly, approachable tone that feels natural and conversational while maintaining professionalism.",
            "formal": base_message + "Write in a very formal, respectful tone suitable for senior executives or formal relationships.",
            "enthusiastic": base_message + "Write with genuine enthusiasm and energy while maintaining professionalism and showing clear interest in the opportunity."
        }
        
        return tone_instructions.get(tone, tone_instructions["professional"])

    @staticmethod
    def _format_skills(skills: List) -> str:
        """Format skills list into readable string"""
        if not skills:
            return "No skills specified"
        
        formatted_skills = []
        for skill in skills[:8]:  # Limit to top 8 skills
            if isinstance(skill, str):
                formatted_skills.append(skill)
            elif isinstance(skill, dict):
                formatted_skills.append(skill.get('name', ''))
            else:
                formatted_skills.append(str(skill))
        
        return ", ".join(filter(None, formatted_skills))

    @staticmethod
    def _format_experience(experience: List) -> str:
        """Format experience into readable summary"""
        if not experience:
            return "No experience specified"
        
        experience_summary = []
        for exp in experience[:3]:  # Limit to top 3 experiences
            title = exp.get('title', 'Position')
            company = exp.get('company', 'Company')
            description = exp.get('description', '')[:100] + "..." if len(exp.get('description', '')) > 100 else exp.get('description', '')
            
            exp_str = f"- {title} at {company}: {description}"
            experience_summary.append(exp_str)
        
        return "\n".join(experience_summary)

    @staticmethod
    def _format_education(education: List) -> str:
        """Format education into readable summary"""
        if not education:
            return "No education specified"
        
        education_summary = []
        for edu in education[:2]:  # Limit to top 2 education entries
            degree = edu.get('degree', 'Degree')
            school = edu.get('school', 'School')
            field = edu.get('field_of_study', '')
            
            edu_str = f"- {degree} in {field} from {school}"
            education_summary.append(edu_str)
        
        return "\n".join(education_summary)

    @staticmethod
    def _parse_ai_response(ai_response: str) -> Dict[str, Any]:
        """Parse AI response and ensure proper structure"""
        try:
            # Try to parse as JSON directly
            if ai_response.strip().startswith('{'):
                result = json.loads(ai_response)
            else:
                # Remove markdown code blocks if present
                if '```json' in ai_response:
                    json_text = ai_response.split('```json')[1].split('```')[0]
                elif '```' in ai_response:
                    json_text = ai_response.split('```')[1].split('```')[0]
                else:
                    # Extract JSON from the response
                    start_idx = ai_response.find('{')
                    end_idx = ai_response.rfind('}') + 1
                    if start_idx != -1 and end_idx != -1:
                        json_text = ai_response[start_idx:end_idx]
                    else:
                        raise ValueError("No JSON found in AI response")
                
                result = json.loads(json_text.strip())
            
            # Ensure required fields exist
            return {
                'message': result.get('message', ''),
                'subject_line': result.get('subject_line', 'Referral Request'),
                'personalization_score': min(100, max(0, result.get('personalization_score', 75))),
                'key_points_used': result.get('key_points_used', [])[:5],
                'tone_analysis': result.get('tone_analysis', 'Professional tone achieved'),
                'word_count': result.get('word_count', len(result.get('message', '').split()))
            }
            
        except json.JSONDecodeError as e:
            print(f"[ReferralMessageService] JSON parse error: {e}")
            print(f"[ReferralMessageService] Response: {ai_response[:500]}")
            # Return fallback response
            return {
                'message': ai_response,
                'subject_line': 'Referral Request',
                'personalization_score': 60,
                'key_points_used': ['AI-generated message'],
                'tone_analysis': 'Professional tone',
                'word_count': len(ai_response.split())
            }
        except Exception as e:
            print(f"[ReferralMessageService] Parse error: {e}")
            raise Exception(f"Failed to parse AI response: {str(e)}")

    @staticmethod
    async def generate_multiple_variations(
        user_profile: Dict[str, Any],
        job_details: Dict[str, Any],
        contact_info: Dict[str, Any],
        relationship_context: str = "professional",
        num_variations: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate multiple message variations for A/B testing"""
        
        variations = []
        tones = ["professional", "enthusiastic", "casual"]
        
        for i in range(min(num_variations, len(tones))):
            try:
                tone = tones[i]
                variation = await ReferralMessageService.generate_referral_message(
                    user_profile=user_profile,
                    job_details=job_details,
                    contact_info=contact_info,
                    relationship_context=relationship_context,
                    tone=tone
                )
                variation['tone'] = tone
                variations.append(variation)
            except Exception as e:
                print(f"[ReferralMessageService] Error generating variation {i}: {e}")
                continue
        
        return variations
