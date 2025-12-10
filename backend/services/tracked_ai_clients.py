"""
Tracked AI Clients
Drop-in replacements for Cohere and OpenAI clients that automatically log all API calls
"""
import time
import asyncio
from datetime import datetime, timezone
from typing import Any
import threading
import cohere
from openai import OpenAI

from services.api_key_manager import api_key_manager

# Thread-local storage for event loops and DAOs
_thread_local = threading.local()


class TrackedCohereClient:
    """
    Drop-in replacement for cohere.ClientV2 that tracks all API calls
    Includes automatic fallback to OpenAI on failures
    """

    def __init__(self, api_key: str = None, key_owner: str = None):
        # If no key provided, select one from the manager
        if not api_key:
            key_owner, api_key = api_key_manager.select_cohere_key()

        self.api_key = api_key
        self.key_owner = key_owner or api_key_manager.get_key_owner(api_key)
        self.client = cohere.ClientV2(api_key=api_key)
        self.openai_fallback = None

    def _get_openai_fallback(self):
        """Lazy initialize OpenAI fallback client"""
        if not self.openai_fallback:
            fallback_key = api_key_manager.get_openai_fallback_key()
            self.openai_fallback = OpenAI(api_key=fallback_key)
        return self.openai_fallback

    def _log_call_sync(self, provider, endpoint, key_owner, duration_ms, success, error_message, tokens_used):
        """Synchronous wrapper to log API call"""
        try:
            # Get or create thread-local event loop
            if not hasattr(_thread_local, 'loop') or _thread_local.loop.is_closed():
                _thread_local.loop = asyncio.new_event_loop()
                asyncio.set_event_loop(_thread_local.loop)

            # Run the async log call in the thread-local event loop
            _thread_local.loop.run_until_complete(
                self._async_log_call_local(
                    provider, endpoint, key_owner, duration_ms, success, error_message, tokens_used
                )
            )
        except Exception as e:
            print(f"[TrackedClient] Error logging API call: {e}")

    async def _async_log_call_local(self, provider, endpoint, key_owner, duration_ms, success, error_message, tokens_used):
        """Async method to log API call using thread-local MongoDB connection"""
        try:
            import os
            import certifi
            from pymongo import AsyncMongoClient
            from datetime import datetime, timezone

            # Create a fresh MongoDB connection for this thread
            mongo_connection_string = os.getenv("MONGO_CONNECTION_STRING")
            database_name = os.getenv("MONGO_APPLICATION_DATABASE")

            client = AsyncMongoClient(mongo_connection_string, tls=True, tlsCAFile=certifi.where())
            db = client.get_database(database_name)
            call_logs = db.get_collection("api_call_logs")
            usage_quotas = db.get_collection("api_usage_quotas")

            # Log the API call
            log_entry = {
                "timestamp": datetime.now(timezone.utc),
                "provider": provider,
                "endpoint": endpoint,
                "key_owner": key_owner,
                "duration_ms": duration_ms,
                "success": success,
                "error_message": error_message,
                "tokens_used": tokens_used
            }
            await call_logs.insert_one(log_entry)

            # Update usage quotas
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            await usage_quotas.update_one(
                {
                    "provider": provider,
                    "key_owner": key_owner,
                    "period": current_month
                },
                {
                    "$inc": {
                        "calls": 1,
                        "tokens": tokens_used,
                        "errors": 0 if success else 1
                    },
                    "$set": {
                        "updated_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )

            # Properly close the async connection
            await client.close()

        except Exception as e:
            print(f"[TrackedClient] Error in _async_log_call_local: {e}")

    async def _async_log_call(self, provider, endpoint, key_owner, duration_ms, success, error_message, tokens_used):
        """Async method to log API call and update quotas"""
        try:
            await api_metrics_dao.log_api_call(
                provider=provider,
                endpoint=endpoint,
                key_owner=key_owner,
                duration_ms=duration_ms,
                success=success,
                error_message=error_message,
                tokens_used=tokens_used
            )

            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            await api_metrics_dao.increment_usage(
                provider=provider,
                key_owner=key_owner,
                period=current_month,
                calls=1,
                tokens=tokens_used,
                errors=0 if success else 1
            )
        except Exception as e:
            print(f"[TrackedClient] Error in _async_log_call: {e}")

    def chat(self, **kwargs):
        """Tracked version of Cohere chat() with OpenAI fallback"""
        start_time = time.time()
        success = False
        error_message = None
        tokens_used = 0
        result = None
        provider = "cohere"
        key_owner = self.key_owner

        try:
            # Try Cohere API
            result = self.client.chat(**kwargs)
            success = True

            # Extract token usage
            if hasattr(result, 'usage'):
                usage = result.usage
                tokens_used = getattr(usage, 'total_tokens', 0) or \
                             (getattr(usage, 'tokens', {}).get('input_tokens', 0) +
                              getattr(usage, 'tokens', {}).get('output_tokens', 0))

        except Exception as e:
            error_message = str(e)
            print(f"[TrackedCohereClient] Cohere API call failed: {error_message}")

            # Try OpenAI fallback
            try:
                print(f"[TrackedCohereClient] Attempting OpenAI fallback...")
                openai_client = self._get_openai_fallback()

                # Convert Cohere parameters to OpenAI format
                messages = kwargs.get('messages', [])
                model = kwargs.get('model', 'gpt-4o-mini')

                openai_response = openai_client.chat.completions.create(
                    model='gpt-4o-mini' if not model.startswith('gpt') else model,
                    messages=messages,
                    temperature=kwargs.get('temperature', 0.7),
                    max_tokens=kwargs.get('max_tokens', 1500)
                )

                # Convert OpenAI response to match Cohere structure
                class FallbackResponse:
                    def __init__(self, openai_resp):
                        self.message = type('obj', (object,), {
                            'content': [type('obj', (object,), {'text': openai_resp.choices[0].message.content})()]
                        })()
                        self.usage = openai_resp.usage

                result = FallbackResponse(openai_response)
                success = True
                provider = "openai"
                key_owner = "openai_fallback"
                tokens_used = openai_response.usage.total_tokens

                # Log fallback event (async)
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.create_task(api_metrics_dao.log_fallback_event(
                            primary_provider="cohere",
                            fallback_provider="openai",
                            success=True,
                            original_error=error_message
                        ))
                except:
                    pass

                print(f"[TrackedCohereClient] OpenAI fallback successful")

            except Exception as fallback_error:
                error_message = f"Cohere failed: {error_message}. OpenAI fallback failed: {str(fallback_error)}"
                print(f"[TrackedCohereClient] OpenAI fallback also failed: {fallback_error}")
                # Log failed fallback
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.create_task(api_metrics_dao.log_fallback_event(
                            primary_provider="cohere",
                            fallback_provider="openai",
                            success=False,
                            original_error=str(e)
                        ))
                except:
                    pass

        finally:
            duration_ms = (time.time() - start_time) * 1000
            self._log_call_sync(provider, "chat", key_owner, duration_ms, success, error_message, tokens_used)

        if not success:
            raise Exception(error_message)

        return result


class TrackedOpenAIClient:
    """
    Drop-in replacement for OpenAI client that tracks all API calls
    """

    def __init__(self, api_key: str = None, key_owner: str = "system"):
        if not api_key:
            api_key = api_key_manager.get_openai_fallback_key()
        self.api_key = api_key
        self.key_owner = key_owner
        self.client = OpenAI(api_key=api_key)

    def _log_call_sync(self, endpoint, key_owner, duration_ms, success, error_message, tokens_used):
        """Synchronous wrapper to log API call"""
        try:
            # Get or create thread-local event loop
            if not hasattr(_thread_local, 'loop') or _thread_local.loop.is_closed():
                _thread_local.loop = asyncio.new_event_loop()
                asyncio.set_event_loop(_thread_local.loop)

            # Run the async log call in the thread-local event loop
            _thread_local.loop.run_until_complete(
                self._async_log_call_local(
                    endpoint, key_owner, duration_ms, success, error_message, tokens_used
                )
            )
        except Exception as e:
            print(f"[TrackedOpenAIClient] Error logging API call: {e}")

    async def _async_log_call_local(self, endpoint, key_owner, duration_ms, success, error_message, tokens_used):
        """Async method to log API call using thread-local MongoDB connection"""
        try:
            import os
            import certifi
            from pymongo import AsyncMongoClient
            from datetime import datetime, timezone

            # Create a fresh MongoDB connection for this thread
            mongo_connection_string = os.getenv("MONGO_CONNECTION_STRING")
            database_name = os.getenv("MONGO_APPLICATION_DATABASE")

            client = AsyncMongoClient(mongo_connection_string, tls=True, tlsCAFile=certifi.where())
            db = client.get_database(database_name)
            call_logs = db.get_collection("api_call_logs")
            usage_quotas = db.get_collection("api_usage_quotas")

            # Log the API call
            log_entry = {
                "timestamp": datetime.now(timezone.utc),
                "provider": "openai",
                "endpoint": endpoint,
                "key_owner": key_owner,
                "duration_ms": duration_ms,
                "success": success,
                "error_message": error_message,
                "tokens_used": tokens_used
            }
            await call_logs.insert_one(log_entry)

            # Update usage quotas
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            await usage_quotas.update_one(
                {
                    "provider": "openai",
                    "key_owner": key_owner,
                    "period": current_month
                },
                {
                    "$inc": {
                        "calls": 1,
                        "tokens": tokens_used,
                        "errors": 0 if success else 1
                    },
                    "$set": {
                        "updated_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )

            # Properly close the async connection
            await client.close()

        except Exception as e:
            print(f"[TrackedOpenAIClient] Error in _async_log_call_local: {e}")

    async def _async_log_call(self, endpoint, key_owner, duration_ms, success, error_message, tokens_used):
        """Async method to log API call and update quotas"""
        try:
            await api_metrics_dao.log_api_call(
                provider="openai",
                endpoint=endpoint,
                key_owner=key_owner,
                duration_ms=duration_ms,
                success=success,
                error_message=error_message,
                tokens_used=tokens_used
            )

            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            await api_metrics_dao.increment_usage(
                provider="openai",
                key_owner=key_owner,
                period=current_month,
                calls=1,
                tokens=tokens_used,
                errors=0 if success else 1
            )
        except Exception as e:
            print(f"[TrackedOpenAIClient] Error in _async_log_call: {e}")

    @property
    def chat(self):
        """Return tracked chat interface"""
        return TrackedChatInterface(self)


class TrackedChatInterface:
    """Tracked wrapper for OpenAI chat interface"""

    def __init__(self, tracked_client):
        self.tracked_client = tracked_client
        self.client = tracked_client.client

    @property
    def completions(self):
        """Return tracked completions interface"""
        return TrackedCompletionsInterface(self.tracked_client)


class TrackedCompletionsInterface:
    """Tracked wrapper for OpenAI chat completions"""

    def __init__(self, tracked_client):
        self.tracked_client = tracked_client
        self.client = tracked_client.client

    def create(self, **kwargs):
        """Tracked version of OpenAI chat.completions.create()"""
        start_time = time.time()
        success = False
        error_message = None
        tokens_used = 0
        result = None

        try:
            result = self.client.chat.completions.create(**kwargs)
            success = True
            tokens_used = result.usage.total_tokens if hasattr(result, 'usage') else 0

        except Exception as e:
            error_message = str(e)
            print(f"[TrackedOpenAIClient] OpenAI API call failed: {error_message}")

        finally:
            duration_ms = (time.time() - start_time) * 1000
            self.tracked_client._log_call_sync(
                "chat.completions", self.tracked_client.key_owner, duration_ms, success, error_message, tokens_used
            )

        if not success:
            raise Exception(error_message)

        return result
