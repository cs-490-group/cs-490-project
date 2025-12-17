"""
UC-121: Backfill response_tracking for existing jobs

This script populates the response_tracking field for all existing jobs in the database.
It should be run once after deploying UC-121.

Usage:
    python -m backend.scripts.backfill_response_tracking
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_CONNECTION_STRING = os.getenv("MONGO_CONNECTION_STRING")
DATABASE_NAME = os.getenv("MONGO_APPLICATION_DATABASE")
JOBS_COLLECTION = os.getenv("JOBS_COLLECTION", "jobs")


async def backfill_response_tracking():
    """Backfill response_tracking for all existing jobs"""

    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_CONNECTION_STRING)
    db = client[DATABASE_NAME]
    jobs_collection = db[JOBS_COLLECTION]

    print("🔄 Starting response tracking backfill...")
    print(f"📊 Database: {DATABASE_NAME}")
    print(f"📁 Collection: {JOBS_COLLECTION}")
    print("-" * 60)

    # Find all jobs without response_tracking
    query = {
        "$or": [
            {"response_tracking": {"$exists": False}},
            {"response_tracking": None}
        ]
    }

    cursor = jobs_collection.find(query)
    jobs_to_update = await cursor.to_list(length=None)

    print(f"📋 Found {len(jobs_to_update)} jobs to backfill")

    if len(jobs_to_update) == 0:
        print("✅ No jobs need backfilling. All done!")
        return

    updated_count = 0
    skipped_count = 0

    for job in jobs_to_update:
        job_id = job["_id"]

        # Determine submitted_at
        submitted_at = None
        if job.get("submitted_at"):
            submitted_at = job["submitted_at"]
        elif job.get("date_created"):
            submitted_at = job["date_created"]
        else:
            print(f"⚠️  Skipping job {job_id}: No submitted_at or date_created")
            skipped_count += 1
            continue

        # Ensure timezone-aware
        if submitted_at and submitted_at.tzinfo is None:
            submitted_at = submitted_at.replace(tzinfo=timezone.utc)

        # Check status_history for first response
        responded_at = None
        response_days = None

        status_history = job.get("status_history", [])
        if status_history:
            # Find first occurrence of screening, interview, or rejected
            for entry in status_history:
                if isinstance(entry, list) and len(entry) >= 2:
                    status, timestamp = entry[0], entry[1]
                    status_lower = status.lower() if status else ""

                    if status_lower in ["screening", "interview", "rejected"]:
                        # Parse timestamp
                        if isinstance(timestamp, str):
                            try:
                                responded_at = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                            except:
                                try:
                                    responded_at = datetime.fromisoformat(timestamp)
                                except:
                                    continue
                        elif isinstance(timestamp, datetime):
                            responded_at = timestamp

                        # Ensure timezone-aware
                        if responded_at and responded_at.tzinfo is None:
                            responded_at = responded_at.replace(tzinfo=timezone.utc)

                        # Calculate days
                        if responded_at and submitted_at:
                            response_days = (responded_at - submitted_at).days

                        break  # Take first response only

        # Build response_tracking object
        response_tracking = {
            "submitted_at": submitted_at,
            "responded_at": responded_at,
            "response_days": response_days,
            "manually_entered": False
        }

        # Update job
        result = await jobs_collection.update_one(
            {"_id": job_id},
            {"$set": {"response_tracking": response_tracking}}
        )

        if result.modified_count > 0:
            updated_count += 1
            status_msg = f"responded in {response_days} days" if response_days else "pending"
            print(f"✓ Updated job {job_id}: {status_msg}")
        else:
            skipped_count += 1
            print(f"⚠️  Failed to update job {job_id}")

    print("-" * 60)
    print(f"✅ Backfill complete!")
    print(f"   Updated: {updated_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Total processed: {len(jobs_to_update)}")

    # Close connection
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("UC-121: Response Tracking Backfill Script")
    print("=" * 60)

    asyncio.run(backfill_response_tracking())
