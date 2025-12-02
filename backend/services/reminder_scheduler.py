from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import atexit

from mongo.interview_schedule_dao import InterviewScheduleDAO
from mongo.profiles_dao import UserDataDAO
from services.calendar_service import calendar_service
from mongo.dao_setup import db_client

# Initialize DAOs
schedule_dao = InterviewScheduleDAO(db_client)
profile_dao = UserDataDAO()

# Scheduler instance
reminder_scheduler = AsyncIOScheduler()


def make_aware(dt):
    """Convert datetime to timezone-aware if naive"""
    if dt is None:
        return None
    if dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None:
        return dt
    return dt.replace(tzinfo=timezone.utc)


async def check_and_send_reminders():
    """
    Check for interviews needing reminders and send them.
    Runs every 1 minute to catch all reminder windows.
    
    FAILSAFE LOGIC:
    - If interview is <2 hours away and NO reminders sent yet: Send 2h reminder immediately
    - Otherwise: Send reminders at their designated times (24h, 2h)
    """
    try:
        now = datetime.now(timezone.utc)
        print(f"\n[{now.strftime('%Y-%m-%d %H:%M:%S')}] 🔔 Checking for interviews needing reminders...")
        
        # Get ALL scheduled interviews (we'll filter by time ourselves)
        all_scheduled = await schedule_dao.get_all_scheduled_interviews()
        
        reminders_sent = 0
        
        for interview in all_scheduled:
            try:
                interview_time = make_aware(interview.get('interview_datetime'))
                if not interview_time:
                    continue
                
                time_until = interview_time - now
                hours_until = time_until.total_seconds() / 3600
                
                # Get reminder tracking
                reminders_sent_obj = interview.get('reminders_sent', {})
                reminder_prefs = interview.get('reminder_preferences', {'email': True})
                
                # Only send email reminders if user wants them
                if not reminder_prefs.get('email', True):
                    continue
                
                # FAILSAFE: If interview is less than 2 hours away and NO reminders were sent
                # Send the 2-hour reminder immediately as a last-ditch notification
                if hours_until < 2 and not reminders_sent_obj.get('24h') and not reminders_sent_obj.get('2h'):
                    print(f"  ⚠️  FAILSAFE TRIGGERED: Interview in {hours_until:.1f}h with no reminders sent!")
                    await send_reminder_email(interview, 2)
                    await schedule_dao.mark_reminder_sent(str(interview['_id']), '2h')
                    reminders_sent += 1
                    print(f"  ✅ Sent FAILSAFE 2h reminder for {interview.get('scenario_name', 'Interview')}")
                    continue
                
                # Normal reminder logic
                # Check if we should send 24h reminder (within 30 min window)
                if 23.5 <= hours_until <= 24.5 and not reminders_sent_obj.get('24h', False):
                    await send_reminder_email(interview, 24)
                    await schedule_dao.mark_reminder_sent(str(interview['_id']), '24h')
                    reminders_sent += 1
                    print(f"  ✅ Sent 24h reminder for {interview.get('scenario_name', 'Interview')}")
                
                # Check if we should send 2h reminder (within 15 min window)
                elif 1.75 <= hours_until <= 2.25 and not reminders_sent_obj.get('2h', False):
                    await send_reminder_email(interview, 2)
                    await schedule_dao.mark_reminder_sent(str(interview['_id']), '2h')
                    reminders_sent += 1
                    print(f"  ✅ Sent 2h reminder for {interview.get('scenario_name', 'Interview')}")
                
            except Exception as e:
                print(f"  ❌ Error processing interview {interview.get('_id')}: {e}")
                continue
        
        if reminders_sent > 0:
            print(f"✅ Reminder check complete. Sent {reminders_sent} reminder(s)")
        else:
            print(f"✓ Reminder check complete. No reminders needed at this time")
            
    except Exception as e:
        print(f"❌ Error in reminder check: {e}")
        import traceback
        traceback.print_exc()


async def send_reminder_email(interview: Dict[str, Any], hours_until: int):
    """
    Send reminder email with complete logistics information
    """
    try:
        # Get user email from profile
        user_uuid = interview.get('uuid')
        user_email = None
        
        try:
            profile = await profile_dao.get_profile(user_uuid)
            if profile:
                user_email = profile.get('email')
        except Exception as e:
            print(f"  ⚠️  Could not fetch user email: {e}")
        
        if not user_email:
            print(f"  ⚠️  No email found for user {user_uuid}, skipping reminder")
            return
        
        # Build comprehensive interview data with logistics
        interview_data = {
            'schedule_uuid': str(interview.get('_id')),
            'interview_datetime': interview.get('interview_datetime'),
            'job_title': interview.get('scenario_name', 'Position'),
            'company_name': interview.get('company_name', 'Company'),
            'timezone': interview.get('timezone', 'UTC'),
            'duration_minutes': interview.get('duration_minutes', 60),
            
            # Location & Logistics
            'location_type': interview.get('location_type', 'video'),
            'location_details': interview.get('location_details'),
            'video_link': interview.get('video_link'),
            'video_platform': interview.get('video_platform', 'Zoom'),
            'phone_number': interview.get('phone_number'),
            
            # Interviewer Info
            'interviewer_name': interview.get('interviewer_name'),
            'interviewer_title': interview.get('interviewer_title'),
            'interviewer_email': interview.get('interviewer_email'),
            
            # Preparation Status
            'preparation_completion_percentage': interview.get('preparation_completion_percentage', 0),
            
            # Additional Info
            'notes': interview.get('notes')
        }
        
        # Send the email using calendar service
        email_sent = calendar_service.send_email_reminder(
            recipient_email=user_email,
            interview_data=interview_data,
            hours_until=hours_until
        )
        
        if email_sent:
            print(f"  📧 Sent {hours_until}h reminder to {user_email}")
        else:
            print(f"  ⚠️  Failed to send {hours_until}h reminder to {user_email}")
            
    except Exception as e:
        print(f"  ❌ Error sending reminder: {e}")
        import traceback
        traceback.print_exc()


def start_reminder_scheduler():
    """
    Start the reminder scheduler - checks every 1 MINUTE
    This ensures we catch reminders quickly
    
    AUTO-STARTS: Called automatically when this module is imported
    """
    try:
        if reminder_scheduler.running:
            print("⚠️  Reminder scheduler already running")
            return
            
        reminder_scheduler.add_job(
            check_and_send_reminders,
            trigger=IntervalTrigger(minutes=1),  # ⭐ CHECK EVERY 1 MINUTE
            id='interview_reminders',
            name='Check and send interview reminders',
            replace_existing=True,
            max_instances=1  # Prevent overlapping runs
        )
        
        reminder_scheduler.start()
        print("✅ Interview Reminder Scheduler started (checking every 1 MINUTE)")
        print("   - Will send reminders at 24h and 2h before interviews")
        print("   - FAILSAFE: Will send 2h reminder if <2h away and no reminders sent")
        
    except Exception as e:
        print(f"❌ Failed to start reminder scheduler: {e}")


def stop_reminder_scheduler():
    """
    Stop the reminder scheduler
    
    AUTO-STOPS: Called automatically on application shutdown
    """
    try:
        if reminder_scheduler.running:
            reminder_scheduler.shutdown(wait=False)
            print("✅ Interview Reminder Scheduler stopped")
    except Exception as e:
        print(f"⚠️  Error stopping reminder scheduler: {e}")


# ============================================================================
# AUTO-START: Start scheduler when module is imported
# ============================================================================
try:
    start_reminder_scheduler()
except Exception as e:
    print(f"⚠️  Could not auto-start reminder scheduler: {e}")

# AUTO-STOP: Register cleanup on application exit
atexit.register(stop_reminder_scheduler)