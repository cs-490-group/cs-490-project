"""
Informational Interview Reminder Scheduler

Monitors scheduled informational interviews and sends reminders at strategic intervals:
- 24 hours before: Preparation reminder
- 1 hour before: Urgent action reminder (attend now)

Uses APScheduler to check every 1 minute for upcoming interviews.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone, timedelta
import logging

scheduler = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_and_send_interview_reminders():
    """
    Main scheduler job: Check all interviews and send reminders

    Checks every minute for interviews that need reminders.
    Sends reminders based on:
    - 24-hour reminder: if scheduled_date + start_time is 23-25 hours away
    - 1-hour reminder: if scheduled_date + start_time is 0.5-1.5 hours away
    """
    try:
        from mongo.informational_interviews_dao import informational_interviews_dao
        from mongo.network_dao import network_dao
        from mongo.profiles_dao import profiles_dao
        from services.interview_reminder_service import interview_reminder_service

        current_time = datetime.now(timezone.utc)

        # Fetch all interviews (we'll filter by status and date)
        interviews = await informational_interviews_dao.collection.find({}).to_list(None)

        if not interviews:
            return

        reminders_sent = 0

        print("\n" + "=" * 80)
        print(f"[{current_time.strftime('%Y-%m-%d %H:%M:%S')} UTC] 🎙️ INTERVIEW REMINDER CHECK")
        print("=" * 80)
        print(f"📊 Found {len(interviews)} total interviews\n")

        for idx, interview in enumerate(interviews, 1):
            try:
                # Skip if no scheduled_date or start_time
                if not interview.get("scheduled_date") or not interview.get("start_time"):
                    print(
                        f"--- Interview {idx}/{len(interviews)} ---"
                    )
                    print(f"  ⚠️  No scheduled_date or start_time - SKIP\n")
                    continue

                # Skip if status is not scheduled/confirmed
                status = interview.get("status", "requested")
                if status not in ["scheduled", "confirmed"]:
                    continue

                # Parse interview datetime
                try:
                    interview_date_str = interview.get("scheduled_date")
                    interview_time_str = interview.get("start_time")

                    # Handle both ISO format and simple date formats
                    if "T" in interview_date_str:
                        interview_datetime = datetime.fromisoformat(interview_date_str.replace("Z", "+00:00"))
                    else:
                        # Combine date and time
                        datetime_str = f"{interview_date_str}T{interview_time_str}:00"
                        interview_datetime = datetime.fromisoformat(datetime_str).replace(tzinfo=timezone.utc)

                except Exception as e:
                    print(
                        f"--- Interview {idx}/{len(interviews)} ---"
                    )
                    print(f"  ⚠️  Could not parse interview datetime: {str(e)} - SKIP\n")
                    continue

                # Get contact information
                contact_id = interview.get("contact_id")
                contact = await network_dao.get_contact(contact_id)
                if not contact:
                    print(
                        f"--- Interview {idx}/{len(interviews)} ---"
                    )
                    print(f"  ❌ Contact not found - SKIP\n")
                    continue

                # Get user profile for email
                user_uuid = interview.get("uuid")
                profile = await profiles_dao.get_profile(user_uuid)
                if not profile or not profile.get("email"):
                    print(
                        f"--- Interview {idx}/{len(interviews)} ---"
                    )
                    print(f"  ❌ User email not found - SKIP\n")
                    continue

                # Calculate hours until interview
                hours_until = (interview_datetime - current_time).total_seconds() / 3600

                # Skip if interview is in the past (>2 hours ago)
                if hours_until < -2:
                    continue

                interview_company = interview.get("company", contact.get("company", "Unknown"))
                contact_name = contact.get("name", "Contact")

                print(f"--- Interview {idx}/{len(interviews)} ---")
                print(f"  🎙️ Interview with {contact_name} at {interview_company}")
                print(f"  📅 Scheduled Date: {interview.get('scheduled_date')} {interview.get('start_time')}")
                print(f"  ⏱️  Time until: {hours_until:.2f} hours")

                reminders_sent_obj = interview.get("reminders_sent", {})
                print(f"  📨 Reminders sent: {reminders_sent_obj}\n")

                # Check 24-hour reminder
                if 23 < hours_until < 25 and not reminders_sent_obj.get("24h_before"):
                    print(f"  ✅ INTERVIEW IS TOMORROW - will send 24h reminder")
                    result = await interview_reminder_service.send_interview_reminder_email(
                        recipient_email=profile.get("email"),
                        interview_data=interview,
                        contact_info=contact,
                        hours_until=24,
                    )
                    if result.get("success"):
                        print(f"  ✅ 24h reminder sent to {profile.get('email')}")
                        await informational_interviews_dao.mark_reminder_sent(
                            str(interview["_id"]), "24h_before"
                        )
                        reminders_sent += 1
                    else:
                        print(f"  ❌ Failed to send 24h reminder: {result.get('message')}")

                # Check 1-hour reminder
                if 0.5 < hours_until < 1.5 and not reminders_sent_obj.get("1h_before"):
                    print(f"  ✅ INTERVIEW STARTS IN 1 HOUR - will send urgent reminder")
                    result = await interview_reminder_service.send_interview_reminder_email(
                        recipient_email=profile.get("email"),
                        interview_data=interview,
                        contact_info=contact,
                        hours_until=1,
                    )
                    if result.get("success"):
                        print(f"  ✅ 1h reminder sent to {profile.get('email')}")
                        await informational_interviews_dao.mark_reminder_sent(
                            str(interview["_id"]), "1h_before"
                        )
                        reminders_sent += 1
                    else:
                        print(f"  ❌ Failed to send 1h reminder: {result.get('message')}")

            except Exception as e:
                print(f"❌ Error processing interview {idx}: {str(e)}")
                import traceback

                traceback.print_exc()

        print("\n" + "=" * 80)
        print(f"✅ INTERVIEW REMINDER CHECK COMPLETE - Sent {reminders_sent} reminder(s)")
        print("=" * 80 + "\n")

    except Exception as e:
        print(f"\n❌ Error in interview reminder scheduler: {str(e)}")
        import traceback

        traceback.print_exc()


def start_interview_reminder_scheduler():
    """Initialize and start the interview reminder scheduler"""
    global scheduler
    try:
        scheduler = AsyncIOScheduler()

        # Add job to check every 1 minute
        scheduler.add_job(
            check_and_send_interview_reminders,
            "interval",
            minutes=1,
            id="interview_reminder_job",
            replace_existing=True,
        )

        scheduler.start()
        print("✅ INTERVIEW REMINDER SCHEDULER STARTED")
    except Exception as e:
        print(f"❌ Error starting interview reminder scheduler: {str(e)}")
        import traceback

        traceback.print_exc()


def stop_interview_reminder_scheduler():
    """Stop the interview reminder scheduler"""
    global scheduler
    try:
        if scheduler and scheduler.running:
            scheduler.shutdown(wait=False)
            print("✅ Interview reminder scheduler stopped")
    except Exception as e:
        print(f"❌ Error stopping interview reminder scheduler: {str(e)}")
        import traceback

        traceback.print_exc()
