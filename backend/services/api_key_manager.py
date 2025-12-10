"""
API Key Manager Service
Manages multiple API keys for different providers and handles key rotation
"""
import os
from typing import Dict, Optional

class APIKeyManager:
    def __init__(self):
        # Load all Cohere keys from environment
        self.cohere_keys = {
            "team": os.getenv("COHERE_API_KEY"),  # Team key (full)
            "jon": os.getenv("COHERE_API_KEY_JON"),  # Jon's first key
            "jon2": os.getenv("COHERE_API_KEY_JON2"),  # Jon's second key
        }

        # Remove None values
        self.cohere_keys = {k: v for k, v in self.cohere_keys.items() if v}

        # OpenAI fallback key
        self.openai_fallback_key = os.getenv("OPENAI_API_KEY")

        # Track usage for round-robin (simple counter-based)
        self.cohere_key_index = 0

        # Quota limits
        self.cohere_monthly_limit = int(os.getenv("COHERE_MONTHLY_LIMIT", 1000))

    def get_cohere_keys(self) -> Dict[str, str]:
        """Get all available Cohere API keys"""
        return self.cohere_keys.copy()

    def get_openai_fallback_key(self) -> Optional[str]:
        """Get OpenAI fallback key"""
        return self.openai_fallback_key

    def select_cohere_key(self) -> tuple[str, str]:
        """
        Select a Cohere API key using round-robin strategy
        Returns: (key_owner, api_key)
        """
        if not self.cohere_keys:
            raise ValueError("No Cohere API keys configured")

        # Get keys as list for indexing
        keys_list = list(self.cohere_keys.items())

        # Round-robin selection
        key_owner, api_key = keys_list[self.cohere_key_index % len(keys_list)]
        self.cohere_key_index += 1

        return key_owner, api_key

    def get_key_owner(self, api_key: str) -> str:
        """
        Get the owner name for a given API key
        Returns: key owner name (e.g., "team", "jon", "jon2")
        """
        for owner, key in self.cohere_keys.items():
            if key == api_key:
                return owner

        if api_key == self.openai_fallback_key:
            return "openai_fallback"

        return "unknown"

    def get_quota_limit(self, provider: str) -> int:
        """Get monthly quota limit for a provider"""
        if provider == "cohere":
            return self.cohere_monthly_limit
        return 0  # No limit set for other providers

# Global instance
api_key_manager = APIKeyManager()
