"""
API Call Wrapper Service
Wraps all external API calls with logging, metrics tracking, and fallback handling
"""
import time
import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, Optional
from openai import OpenAI
import cohere

from services.api_key_manager import api_key_manager
from mongo.api_metrics_dao import api_metrics_dao


class APICallWrapper:
    def __init__(self):
        self.openai_fallback_client = None

    def get_openai_fallback_client(self) -> AsyncOpenAI:
        """Lazy initialize OpenAI fallback client"""
        if not self.openai_fallback_client:
            fallback_key = api_key_manager.get_openai_fallback_key()
            if not fallback_key:
                raise ValueError("OpenAI fallback key not configured")
            self.openai_fallback_client = AsyncOpenAI(api_key=fallback_key)
        return self.openai_fallback_client

    async def call_cohere_api(
        self,
        cohere_function: Callable,
        *args,
        endpoint: str = "generate",
        **kwargs
    ) -> Any:
        """
        Wrapper for Cohere API calls with automatic fallback to OpenAI

        Args:
            cohere_function: The Cohere API function to call
            endpoint: The endpoint name (for logging)
            *args, **kwargs: Arguments to pass to the Cohere function

        Returns:
            API response (Cohere or OpenAI fallback)
        """
        # Select a Cohere key
        key_owner, api_key = api_key_manager.select_cohere_key()

        start_time = time.time()
        success = False
        error_message = None
        tokens_used = 0
        result = None

        try:
            # Execute Cohere API call
            result = await cohere_function(*args, **kwargs)
            success = True

            # Extract token usage if available
            if hasattr(result, 'usage'):
                tokens_used = getattr(result.usage, 'total_tokens', 0) or \
                             (getattr(result.usage, 'input_tokens', 0) +
                              getattr(result.usage, 'output_tokens', 0))

        except Exception as e:
            error_message = str(e)
            print(f"[APIWrapper] Cohere API call failed: {error_message}")

            # Try OpenAI fallback
            try:
                print(f"[APIWrapper] Attempting OpenAI fallback...")
                result = await self._fallback_to_openai(*args, **kwargs)
                success = True

                # Log fallback event
                await api_metrics_dao.log_fallback_event(
                    primary_provider="cohere",
                    fallback_provider="openai",
                    success=True,
                    original_error=error_message
                )
                print(f"[APIWrapper] OpenAI fallback successful")

                # Update key_owner to indicate fallback was used
                key_owner = "openai_fallback"

                # Extract OpenAI token usage
                if hasattr(result, 'usage'):
                    tokens_used = result.usage.total_tokens

            except Exception as fallback_error:
                error_message = f"Cohere failed: {error_message}. OpenAI fallback failed: {str(fallback_error)}"
                success = False

                # Log failed fallback
                await api_metrics_dao.log_fallback_event(
                    primary_provider="cohere",
                    fallback_provider="openai",
                    success=False,
                    original_error=str(e)
                )
                print(f"[APIWrapper] OpenAI fallback failed: {fallback_error}")

        finally:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Determine provider for logging
            provider = "openai" if key_owner == "openai_fallback" else "cohere"

            # Log the API call
            await api_metrics_dao.log_api_call(
                provider=provider,
                endpoint=endpoint,
                key_owner=key_owner,
                duration_ms=duration_ms,
                success=success,
                error_message=error_message,
                tokens_used=tokens_used
            )

            # Update usage quotas
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            await api_metrics_dao.increment_usage(
                provider=provider,
                key_owner=key_owner,
                period=current_month,
                calls=1,
                tokens=tokens_used,
                errors=0 if success else 1
            )

        if not success:
            raise Exception(error_message)

        return result

    async def _fallback_to_openai(self, *args, **kwargs) -> Any:
        """
        Fallback to OpenAI when Cohere fails
        Converts Cohere-style parameters to OpenAI format
        """
        openai_client = self.get_openai_fallback_client()

        # Extract common parameters from kwargs
        model = kwargs.get('model', 'gpt-4o-mini')  # Default fallback model
        messages = kwargs.get('messages')
        prompt = kwargs.get('prompt')

        # Convert prompt to messages if needed
        if prompt and not messages:
            messages = [{"role": "user", "content": prompt}]

        # Build OpenAI request
        openai_params = {
            "model": model if model.startswith('gpt') else 'gpt-4o-mini',
            "messages": messages or [{"role": "user", "content": str(args[0]) if args else ""}],
        }

        # Optional parameters
        if 'temperature' in kwargs:
            openai_params['temperature'] = kwargs['temperature']
        if 'max_tokens' in kwargs:
            openai_params['max_tokens'] = kwargs['max_tokens']

        # Call OpenAI API
        response = await openai_client.chat.completions.create(**openai_params)
        return response

    async def call_openai_api(
        self,
        openai_function: Callable,
        *args,
        endpoint: str = "chat.completions",
        key_owner: str = "system",
        **kwargs
    ) -> Any:
        """
        Wrapper for OpenAI API calls with logging and metrics tracking

        Args:
            openai_function: The OpenAI API function to call
            endpoint: The endpoint name (for logging)
            key_owner: The key owner identifier
            *args, **kwargs: Arguments to pass to the OpenAI function

        Returns:
            API response
        """
        start_time = time.time()
        success = False
        error_message = None
        tokens_used = 0
        result = None

        try:
            # Execute OpenAI API call
            result = await openai_function(*args, **kwargs)
            success = True

            # Extract token usage
            if hasattr(result, 'usage'):
                tokens_used = result.usage.total_tokens

        except Exception as e:
            error_message = str(e)
            print(f"[APIWrapper] OpenAI API call failed: {error_message}")
            success = False

        finally:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log the API call
            await api_metrics_dao.log_api_call(
                provider="openai",
                endpoint=endpoint,
                key_owner=key_owner,
                duration_ms=duration_ms,
                success=success,
                error_message=error_message,
                tokens_used=tokens_used
            )

            # Update usage quotas
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            await api_metrics_dao.increment_usage(
                provider="openai",
                key_owner=key_owner,
                period=current_month,
                calls=1,
                tokens=tokens_used,
                errors=0 if success else 1
            )

        if not success:
            raise Exception(error_message)

        return result


# Global instance
api_call_wrapper = APICallWrapper()
