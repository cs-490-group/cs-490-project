"""
API Routes for AI-Powered Referral Message Generation
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from services.referral_message_service import ReferralMessageService
from sessions.session_authorizer import authorize
import logging

# Create router
referral_message_router = APIRouter()

# Pydantic models for request/response
class MessageGenerationRequest(BaseModel):
    user_profile: Dict[str, Any]
    job_details: Dict[str, Any]
    contact_info: Dict[str, Any]
    relationship_context: Optional[str] = "professional"
    tone: Optional[str] = "professional"

class MessageVariationsRequest(BaseModel):
    user_profile: Dict[str, Any]
    job_details: Dict[str, Any]
    contact_info: Dict[str, Any]
    relationship_context: Optional[str] = "professional"
    num_variations: Optional[int] = 3

class MessageAnalysisRequest(BaseModel):
    message: str
    job_details: Dict[str, Any]
    contact_info: Dict[str, Any]

@referral_message_router.post("/referral-message/generate")
async def generate_referral_message(
    request: MessageGenerationRequest,
    uuid: str = Depends(authorize)
):
    """
    Generate AI-powered referral request message
    """
    try:
        # Generate message
        result = await ReferralMessageService.generate_referral_message(
            user_profile=request.user_profile,
            job_details=request.job_details,
            contact_info=request.contact_info,
            relationship_context=request.relationship_context,
            tone=request.tone
        )
        
        return {
            'success': True,
            'data': result
        }
        
    except Exception as e:
        logging.error(f"Error generating referral message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@referral_message_router.post("/referral-message/variations")
async def generate_message_variations(
    request: MessageVariationsRequest,
    uuid: str = Depends(authorize)
):
    """
    Generate multiple message variations for A/B testing
    """
    try:
        # Generate variations
        variations = await ReferralMessageService.generate_multiple_variations(
            user_profile=request.user_profile,
            job_details=request.job_details,
            contact_info=request.contact_info,
            relationship_context=request.relationship_context,
            num_variations=request.num_variations
        )
        
        return {
            'success': True,
            'data': variations
        }
        
    except Exception as e:
        logging.error(f"Error generating message variations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@referral_message_router.post("/referral-message/analyze")
async def analyze_message_quality(
    request: MessageAnalysisRequest,
    uuid: str = Depends(authorize)
):
    """
    Analyze the quality and personalization of a message
    """
    try:
        message = request.message
        job_details = request.job_details
        contact_info = request.contact_info
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Simple analysis (can be enhanced with AI)
        analysis = {
            'word_count': len(message.split()),
            'character_count': len(message),
            'has_personalization': bool(
                contact_info.get('name', '') and contact_info.get('name', '') in message
            ),
            'has_job_reference': bool(
                job_details.get('title', '') and job_details.get('title', '') in message
            ),
            'has_company_reference': bool(
                job_details.get('company', '') and job_details.get('company', '') in message
            ),
            'has_call_to_action': any(phrase in message.lower() for phrase in [
                'would you', 'could you', 'would you be', 'are you', 'let me know'
            ]),
            'quality_score': 0  # Will be calculated
        }
        
        # Calculate quality score
        score_factors = [
            analysis['has_personalization'],
            analysis['has_job_reference'],
            analysis['has_company_reference'],
            analysis['has_call_to_action'],
            50 <= analysis['word_count'] <= 300,  # Good length
            100 <= analysis['character_count'] <= 2000  # Good length
        ]
        
        analysis['quality_score'] = int((sum(score_factors) / len(score_factors)) * 100)
        
        return {
            'success': True,
            'data': analysis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
