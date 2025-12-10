"""
Seed test data for API Metrics Dashboard
Run this to populate the database with sample API call logs and usage data
"""
import asyncio
from datetime import datetime, timezone, timedelta
import random
from mongo.api_metrics_dao import api_metrics_dao

async def seed_api_metrics():
    print("Seeding API metrics test data...")

    # Current time
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")

    # Providers and key owners
    providers = ["cohere", "openai"]
    key_owners_cohere = ["team", "jon", "jon2"]
    key_owners_openai = ["system"]
    endpoints = [
        "/generate",
        "/chat",
        "/embed",
        "/summarize",
        "/rerank"
    ]

    # Generate logs for the last 7 days
    print("Creating API call logs...")
    log_count = 0

    for days_ago in range(7):
        calls_per_day = random.randint(20, 50)

        for _ in range(calls_per_day):
            # Random timestamp within the day
            timestamp = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            # Random provider
            provider = random.choice(providers)
            key_owner = random.choice(key_owners_cohere if provider == "cohere" else key_owners_openai)
            endpoint = random.choice(endpoints)

            # Simulate success/failure (90% success rate)
            success = random.random() > 0.1
            error_message = None if success else random.choice([
                "Rate limit exceeded",
                "Invalid API key",
                "Timeout error",
                "Service unavailable",
                "Bad request: missing parameter"
            ])

            # Random duration (50-500ms for success, higher for errors)
            duration_ms = random.uniform(50, 500) if success else random.uniform(500, 2000)

            # Random token usage
            tokens_used = random.randint(100, 5000) if success else 0

            await api_metrics_dao.log_api_call(
                provider=provider,
                endpoint=endpoint,
                key_owner=key_owner,
                duration_ms=duration_ms,
                success=success,
                error_message=error_message,
                tokens_used=tokens_used,
                rate_limit_remaining=random.randint(500, 10000) if success else 0
            )
            log_count += 1

    print(f"Created {log_count} API call logs")

    # Create monthly usage quotas
    print("Creating usage quota records...")

    # Cohere usage (simulate ~5000 calls this month)
    for key_owner in key_owners_cohere:
        calls = random.randint(1000, 2000)
        await api_metrics_dao.increment_usage(
            provider="cohere",
            key_owner=key_owner,
            period=current_month,
            calls=calls,
            tokens=calls * random.randint(100, 1000)
        )
        print(f"  - Cohere ({key_owner}): {calls} calls")

    # OpenAI usage (no limit)
    openai_calls = random.randint(3000, 5000)
    await api_metrics_dao.increment_usage(
        provider="openai",
        key_owner="system",
        period=current_month,
        calls=openai_calls,
        tokens=openai_calls * random.randint(200, 1500)
    )
    print(f"  - OpenAI (system): {openai_calls} calls")

    # Create some fallback events
    print("Creating fallback events...")
    fallback_count = 0

    for days_ago in range(7):
        # Random number of fallback events per day (0-5)
        events_today = random.randint(0, 5)

        for _ in range(events_today):
            timestamp = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            # Simulate fallback scenarios
            success = random.random() > 0.2  # 80% success rate

            await api_metrics_dao.log_fallback_event(
                primary_provider="cohere",
                fallback_provider="openai",
                success=success,
                original_error=random.choice([
                    "Rate limit exceeded on primary provider",
                    "Cohere API timeout",
                    "Primary provider unavailable",
                    "Request quota exceeded"
                ])
            )
            fallback_count += 1

    print(f"Created {fallback_count} fallback events")

    print("\n✅ API metrics test data seeded successfully!")
    print(f"\nYou can now view the API Metrics Dashboard at /api-metrics")
    print(f"Summary:")
    print(f"  - {log_count} API call logs over 7 days")
    print(f"  - Usage quotas for {current_month}")
    print(f"  - {fallback_count} fallback events")

if __name__ == "__main__":
    asyncio.run(seed_api_metrics())
