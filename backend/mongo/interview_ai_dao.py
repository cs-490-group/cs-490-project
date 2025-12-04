from openai import OpenAI
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor


class InterviewAIDAO:
    """
    Dedicated AI DAO for interview coaching features.
    Uses OpenAI (gpt-3.5-turbo) for generating coaching feedback and response improvements.

    This is separate from the general AI_dao which uses Cohere for cover letters/resumes.
    Interview features get their own OpenAI integration for better consistency and reliability.
    """

    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def generate_text(self, prompt: str, system_message="") -> str:
        '''
        Generate text using OpenAI for interview coaching purposes.

        Args:
            prompt: The user prompt or context for text generation
            system_message: System guidelines/context for the AI to follow

        Returns:
            Generated text response from OpenAI
        '''
        try:
            # Run the synchronous OpenAI call in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                self.executor,
                self._call_openai,
                prompt,
                system_message
            )
            return response
        except Exception as e:
            raise Exception(f"Error generating interview coaching text: {str(e)}")

    def _call_openai(self, prompt: str, system_message: str) -> str:
        """Synchronous OpenAI API call wrapper for interview coaching"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error calling OpenAI API for interview coaching: {str(e)}")


# Singleton instance for interview coaching
interview_ai_dao = InterviewAIDAO()
