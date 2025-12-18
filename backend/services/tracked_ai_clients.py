import time
import os
import certifi
from datetime import datetime, timezone
from typing import Any
import cohere
from openai import OpenAI
from pymongo import MongoClient

from services.api_key_manager import api_key_manager

class TrackedCohereClient:
    """
    Drop-in replacement for cohere.ClientV2 that tracks all API calls
    Includes automatic fallback to OpenAI on failures
    """

    def __init__(self, api_key: str = None, key_owner: str = None):
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
        """
        Synchronous wrapper to log API call.
        Uses standard pymongo (Sync) to avoid complex asyncio event loop conflicts.
        This is safe to run in threads AND on the main loop.
        """
        client = None
        try:
            mongo_url = os.getenv("MONGO_CONNECTION_STRING")
            db_name = os.getenv("MONGO_APPLICATION_DATABASE")
            
            # Connect Synchronously (with 2s timeout to prevent hanging)
            client = MongoClient(mongo_url, tls=True, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=2000)
            db = client.get_database(db_name)
            
            # 1. Log the API Call
            db.api_call_logs.insert_one({
                "timestamp": datetime.now(timezone.utc),
                "provider": provider,
                "endpoint": endpoint,
                "key_owner": key_owner,
                "duration_ms": duration_ms,
                "success": success,
                "error_message": error_message,
                "tokens_used": tokens_used
            })

            # 2. Update Usage Quotas
            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            db.api_usage_quotas.update_one(
                {"provider": provider, "key_owner": key_owner, "period": current_month},
                {
                    "$inc": {
                        "calls": 1,
                        "tokens": tokens_used,
                        "errors": 0 if success else 1
                    },
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                },
                upsert=True
            )

        except Exception as e:
            # We silently catch logging errors so they don't crash the actual AI feature
            print(f"[TrackedClient] Logging Error: {e}")
        finally:
            if client:
                client.close()

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
            # --- 1. Attempt Cohere ---
            result = self.client.chat(**kwargs)
            success = True

            # --- 2. Robust Token Extraction (Fixes UsageTokens Crash) ---
            if hasattr(result, 'usage') and result.usage:
                usage = result.usage
                # Check for V2 'total_tokens' attribute
                if getattr(usage, 'total_tokens', None):
                    tokens_used = usage.total_tokens
                # Check for 'tokens' (Dict or Object)
                elif hasattr(usage, 'tokens') and usage.tokens:
                    t = usage.tokens
                    if isinstance(t, dict):
                        tokens_used = t.get('input_tokens', 0) + t.get('output_tokens', 0)
                    else:
                        tokens_used = (getattr(t, 'input_tokens', 0) or 0) + (getattr(t, 'output_tokens', 0) or 0)

        except Exception as e:
            error_message = str(e)
            print(f"[TrackedCohereClient] Primary API Failed: {error_message}")

            # --- 3. Attempt OpenAI Fallback ---
            try:
                print(f"[TrackedCohereClient] Initiating Fallback...")
                openai_client = self._get_openai_fallback()
                
                # Map params
                model = kwargs.get('model', 'gpt-4o-mini')
                fallback_model = 'gpt-4o-mini' if not model.startswith('gpt') else model
                
                response = openai_client.chat.completions.create(
                    model=fallback_model,
                    messages=kwargs.get('messages', []),
                    temperature=kwargs.get('temperature', 0.7),
                    max_tokens=kwargs.get('max_tokens', 1500)
                )

                # Mock a Cohere-like response object
                class FallbackResponse:
                    def __init__(self, oa_resp):
                        self.message = type('obj', (), {'content': [type('obj', (), {'text': oa_resp.choices[0].message.content})()]})()
                        self.usage = oa_resp.usage

                result = FallbackResponse(response)
                success = True
                provider = "openai"
                key_owner = "openai_fallback"
                tokens_used = response.usage.total_tokens
                print(f"[TrackedCohereClient] Fallback Successful")

            except Exception as fb_error:
                error_message = f"Primary: {error_message} | Fallback: {str(fb_error)}"
                print(f"[TrackedCohereClient] Fallback Failed: {fb_error}")

        finally:
            # --- 4. Log Everything ---
            duration = (time.time() - start_time) * 1000
            self._log_call_sync(provider, "chat", key_owner, duration, success, error_message, tokens_used)

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
        client = None
        try:
            mongo_url = os.getenv("MONGO_CONNECTION_STRING")
            db_name = os.getenv("MONGO_APPLICATION_DATABASE")
            
            client = MongoClient(mongo_url, tls=True, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=2000)
            db = client.get_database(db_name)
            
            db.api_call_logs.insert_one({
                "timestamp": datetime.now(timezone.utc),
                "provider": "openai",
                "endpoint": endpoint,
                "key_owner": key_owner,
                "duration_ms": duration_ms,
                "success": success,
                "error_message": error_message,
                "tokens_used": tokens_used
            })

            current_month = datetime.now(timezone.utc).strftime("%Y-%m")
            db.api_usage_quotas.update_one(
                {"provider": "openai", "key_owner": key_owner, "period": current_month},
                {
                    "$inc": {
                        "calls": 1, 
                        "tokens": tokens_used, 
                        "errors": 0 if success else 1
                    },
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                },
                upsert=True
            )
        except Exception as e:
            print(f"[TrackedOpenAIClient] Logging failed: {e}")
        finally:
            if client:
                client.close()

    @property
    def chat(self):
        return TrackedChatInterface(self)


class TrackedChatInterface:
    def __init__(self, tracked_client):
        self.tracked_client = tracked_client
        self.client = tracked_client.client

    @property
    def completions(self):
        return TrackedCompletionsInterface(self.tracked_client)


class TrackedCompletionsInterface:
    def __init__(self, tracked_client):
        self.tracked_client = tracked_client
        self.client = tracked_client.client

    def create(self, **kwargs):
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
            print(f"[TrackedOpenAIClient] Request Failed: {error_message}")

        finally:
            duration = (time.time() - start_time) * 1000
            self.tracked_client._log_call_sync(
                "chat.completions", self.tracked_client.key_owner, duration, success, error_message, tokens_used
            )

        if not success:
            raise Exception(error_message)

        return result