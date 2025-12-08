"""
API Metrics DAO
Handles all database operations for API call logging, usage tracking, and metrics
"""
from mongo.dao_setup import db_client, API_CALL_LOGS, API_USAGE_QUOTAS, API_FALLBACK_EVENTS
from datetime import datetime, timezone
from typing import Dict, List, Optional

class APIMetricsDAO:
    def __init__(self):
        self.call_logs = db_client.get_collection(API_CALL_LOGS)
        self.usage_quotas = db_client.get_collection(API_USAGE_QUOTAS)
        self.fallback_events = db_client.get_collection(API_FALLBACK_EVENTS)

    async def log_api_call(
        self,
        provider: str,
        endpoint: str,
        key_owner: str,
        duration_ms: float,
        success: bool,
        error_message: Optional[str] = None,
        tokens_used: int = 0,
        rate_limit_remaining: Optional[int] = None,
        rate_limit_reset: Optional[datetime] = None
    ) -> str:
        """Log an individual API call"""
        log_entry = {
            "timestamp": datetime.now(timezone.utc),
            "provider": provider,
            "endpoint": endpoint,
            "key_owner": key_owner,
            "duration_ms": duration_ms,
            "success": success,
            "error_message": error_message,
            "tokens_used": tokens_used,
            "rate_limit_remaining": rate_limit_remaining,
            "rate_limit_reset": rate_limit_reset
        }
        result = await self.call_logs.insert_one(log_entry)
        return str(result.inserted_id)

    async def increment_usage(
        self,
        provider: str,
        key_owner: str,
        period: str,  # Format: "2025-12-08" for daily or "2025-12" for monthly
        calls: int = 1,
        tokens: int = 0,
        errors: int = 0
    ) -> None:
        """Increment usage counters using $inc operator"""
        await self.usage_quotas.update_one(
            {
                "provider": provider,
                "key_owner": key_owner,
                "period": period
            },
            {
                "$inc": {
                    "calls": calls,
                    "tokens": tokens,
                    "errors": errors
                },
                "$set": {
                    "updated_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )

    async def get_usage_stats(
        self,
        start_date: datetime,
        end_date: datetime,
        provider: Optional[str] = None,
        key_owner: Optional[str] = None
    ) -> List[Dict]:
        """Get aggregated usage statistics for a date range"""
        pipeline = [
            {
                "$match": {
                    "timestamp": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                }
            }
        ]

        if provider:
            pipeline[0]["$match"]["provider"] = provider

        if key_owner:
            pipeline[0]["$match"]["key_owner"] = key_owner

        pipeline.extend([
            {
                "$group": {
                    "_id": {
                        "provider": "$provider",
                        "key_owner": "$key_owner"
                    },
                    "total_calls": {"$sum": 1},
                    "successful_calls": {
                        "$sum": {"$cond": ["$success", 1, 0]}
                    },
                    "failed_calls": {
                        "$sum": {"$cond": ["$success", 0, 1]}
                    },
                    "total_tokens": {"$sum": "$tokens_used"},
                    "avg_duration_ms": {"$avg": "$duration_ms"},
                    "max_duration_ms": {"$max": "$duration_ms"},
                    "min_duration_ms": {"$min": "$duration_ms"}
                }
            },
            {
                "$project": {
                    "provider": "$_id.provider",
                    "key_owner": "$_id.key_owner",
                    "total_calls": 1,
                    "successful_calls": 1,
                    "failed_calls": 1,
                    "total_tokens": 1,
                    "avg_duration_ms": {"$round": ["$avg_duration_ms", 2]},
                    "max_duration_ms": 1,
                    "min_duration_ms": 1,
                    "_id": 0
                }
            }
        ])

        results = await self.call_logs.aggregate(pipeline).to_list(None)
        return results

    async def get_quota_status(self, provider: str, key_owner: Optional[str] = None) -> List[Dict]:
        """Get current quota usage for a provider"""
        query = {"provider": provider}
        if key_owner:
            query["key_owner"] = key_owner

        quotas = await self.usage_quotas.find(query).to_list(None)
        return quotas

    async def get_recent_errors(self, limit: int = 50) -> List[Dict]:
        """Get recent error logs"""
        errors = await self.call_logs.find(
            {"success": False}
        ).sort("timestamp", -1).limit(limit).to_list(None)

        return errors

    async def get_fallback_events(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Get fallback events within a date range"""
        events = await self.fallback_events.find({
            "timestamp": {
                "$gte": start_date,
                "$lte": end_date
            }
        }).sort("timestamp", -1).to_list(None)

        return events

    async def log_fallback_event(
        self,
        primary_provider: str,
        fallback_provider: str,
        success: bool,
        original_error: str
    ) -> str:
        """Log a fallback event"""
        event = {
            "timestamp": datetime.now(timezone.utc),
            "primary_provider": primary_provider,
            "fallback_provider": fallback_provider,
            "success": success,
            "original_error": original_error
        }
        result = await self.fallback_events.insert_one(event)
        return str(result.inserted_id)

    async def get_response_times(
        self,
        start_date: datetime,
        end_date: datetime,
        provider: Optional[str] = None
    ) -> List[Dict]:
        """Get response time data for charting"""
        match_stage = {
            "timestamp": {
                "$gte": start_date,
                "$lte": end_date
            },
            "success": True  # Only include successful calls
        }

        if provider:
            match_stage["provider"] = provider

        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": {
                        "provider": "$provider",
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$timestamp"
                            }
                        }
                    },
                    "avg_duration_ms": {"$avg": "$duration_ms"}
                }
            },
            {
                "$project": {
                    "provider": "$_id.provider",
                    "date": "$_id.date",
                    "avg_duration_ms": {"$round": ["$avg_duration_ms", 2]},
                    "_id": 0
                }
            },
            {"$sort": {"date": 1}}
        ]

        results = await self.call_logs.aggregate(pipeline).to_list(None)
        return results

    async def get_monthly_usage(self, provider: str, year_month: str) -> int:
        """Get total calls for a specific month (format: '2025-12')"""
        quota = await self.usage_quotas.find_one({
            "provider": provider,
            "period": year_month
        })

        if quota:
            return quota.get("calls", 0)
        return 0

# Global instance
api_metrics_dao = APIMetricsDAO()
