"""
Script to set initial admin access for specified users
Run this once to grant admin tier to ninja33910@gmail.com and davep218@gmail.com
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from mongo.profiles_dao import profiles_dao

async def set_initial_admins():
    admin_emails = [
        "ninja33910@gmail.com",
        "davep218@gmail.com"
    ]

    print("Setting initial admin access...")

    for email in admin_emails:
        # Find user by email
        profile = await profiles_dao.get_profile_by_email(email)

        if profile:
            uuid = profile["_id"]
            # Update to admin tier
            updated = await profiles_dao.update_account_tier(uuid, "admin")

            if updated:
                print(f"[SUCCESS] Granted admin access to: {email} (uuid: {uuid})")
            else:
                print(f"[FAILED] Failed to update: {email} (uuid: {uuid})")
        else:
            print(f"[NOT FOUND] User not found: {email}")

    print("\nAdmin setup complete!")

if __name__ == "__main__":
    try:
        asyncio.run(set_initial_admins())
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"Error: {e}")
