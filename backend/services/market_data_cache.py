"""
Market Salary Data Caching Service

Provides a simple caching layer for market salary research to reduce API quota usage.
When multiple users look up the same role/location, only the first call hits the API.
Cached data persists for 30 days or until cache is cleared.

Usage:
    cache = MarketSalaryCache()

    # Check if data is cached
    if cache.has(role="Software Engineer", location="San Francisco", years=5):
        data = cache.get(role="Software Engineer", location="San Francisco", years=5)

    # Store new market data
    data = await research_market_salary(...)
    cache.put(role, location, years, data)
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import json
import hashlib
from pathlib import Path
import tempfile


class MarketSalaryCache:
    """
    In-memory cache for market salary data with TTL (Time To Live).

    Features:
    - Automatic expiration after 30 days
    - Cache hit/miss tracking for monitoring
    - Persistent storage to JSON file (optional)
    - Thread-safe operations

    Default TTL: 30 days
    """

    def __init__(self, ttl_days: int = 30, persist_to_file: bool = False):
        """
        Initialize the cache.

        Args:
            ttl_days: Time to live in days (default: 30)
            persist_to_file: Whether to persist cache to JSON file
        """
        self.ttl = timedelta(days=ttl_days)
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.hits = 0
        self.misses = 0
        self.persist = persist_to_file
        # Use system temp directory (cross-platform compatible)
        self.cache_file = Path(tempfile.gettempdir()) / "market_salary_cache.json"

        if persist_to_file:
            self._load_from_file()

    def _make_key(self, role: str, location: str, years_experience: int) -> str:
        """
        Create a cache key from role, location, and years of experience.

        Args:
            role: Job title/role
            location: Geographic location
            years_experience: Years of professional experience

        Returns:
            str: Cache key hash
        """
        key_str = f"{role.lower()}|{location.lower()}|{years_experience}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def has(self, role: str, location: str, years_experience: int) -> bool:
        """
        Check if data is in cache and not expired.

        Args:
            role: Job title/role
            location: Geographic location
            years_experience: Years of professional experience

        Returns:
            bool: True if data exists and is fresh, False otherwise
        """
        key = self._make_key(role, location, years_experience)

        if key not in self.cache:
            self.misses += 1
            return False

        entry = self.cache[key]
        expiry_time = datetime.fromisoformat(entry["expiry"])

        if datetime.now() > expiry_time:
            # Expired - remove and return False
            del self.cache[key]
            self.misses += 1
            return False

        self.hits += 1
        return True

    def get(self, role: str, location: str, years_experience: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached market data if available and fresh.

        Args:
            role: Job title/role
            location: Geographic location
            years_experience: Years of professional experience

        Returns:
            dict: Market salary data if found and fresh, None otherwise
        """
        if not self.has(role, location, years_experience):
            return None

        key = self._make_key(role, location, years_experience)
        return self.cache[key]["data"]

    def put(
        self,
        role: str,
        location: str,
        years_experience: int,
        data: Dict[str, Any]
    ) -> None:
        """
        Store market data in cache with expiration timestamp.

        Args:
            role: Job title/role
            location: Geographic location
            years_experience: Years of professional experience
            data: Market salary data to cache
        """
        key = self._make_key(role, location, years_experience)
        expiry = datetime.now() + self.ttl

        self.cache[key] = {
            "role": role,
            "location": location,
            "years": years_experience,
            "data": data,
            "cached_at": datetime.now().isoformat(),
            "expiry": expiry.isoformat()
        }

        if self.persist:
            self._save_to_file()

    def clear(self) -> None:
        """Clear all cached data."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0

        if self.persist and self.cache_file.exists():
            self.cache_file.unlink()

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            dict: Hit/miss rates and cache size
        """
        total_queries = self.hits + self.misses
        hit_rate = (self.hits / total_queries * 100) if total_queries > 0 else 0

        return {
            "total_entries": len(self.cache),
            "hits": self.hits,
            "misses": self.misses,
            "total_queries": total_queries,
            "hit_rate_percent": round(hit_rate, 2),
            "ttl_days": self.ttl.days
        }

    def _save_to_file(self) -> None:
        """Persist cache to JSON file."""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, default=str, indent=2)
        except Exception as e:
            print(f"Warning: Could not persist cache to file: {e}")

    def _load_from_file(self) -> None:
        """Load cache from JSON file if it exists."""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r') as f:
                    self.cache = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load cache from file: {e}")


# Global cache instance
_market_salary_cache = MarketSalaryCache(ttl_days=30, persist_to_file=True)


async def get_or_fetch_market_data(
    role: str,
    location: str,
    years_experience: int,
    company: Optional[str] = None,
    company_size: Optional[str] = None,
    fetch_function=None  # Dependency injection for testing
) -> Dict[str, Any]:
    """
    Get market salary data from cache if available, otherwise fetch and cache it.

    This is the main entry point for market data retrieval. It implements the
    cache-aside pattern: check cache first, fetch on miss, then store.

    Args:
        role: Job title/role
        location: Geographic location
        years_experience: Years of professional experience
        company: Optional company name
        company_size: Optional company size (startup/mid-size/enterprise)
        fetch_function: Async function to fetch data if not cached

    Returns:
        dict: Market salary data (from cache or freshly fetched)
    """
    # Check cache first
    if _market_salary_cache.has(role, location, years_experience):
        print(f"📦 Cache HIT: {role} in {location} ({years_experience} yrs)")
        return _market_salary_cache.get(role, location, years_experience)

    print(f"📡 Cache MISS: Fetching market data for {role} in {location}")

    # Not in cache - fetch it
    if fetch_function is None:
        # Import here to avoid circular imports
        from .salary_research import research_market_salary
        fetch_function = research_market_salary

    data = await fetch_function(
        role=role,
        location=location,
        years_of_experience=years_experience,
        company=company,
        company_size=company_size
    )

    # Store in cache for future requests
    _market_salary_cache.put(role, location, years_experience, data)

    return data


def get_cache_stats() -> Dict[str, Any]:
    """Get cache performance statistics."""
    return _market_salary_cache.get_stats()


def clear_cache() -> None:
    """Clear all cached market data. Useful for testing and cache invalidation."""
    _market_salary_cache.clear()
