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
    """Convert datetime to timezone-aware UTC if naive"""
    if dt is None:
        return None
    if dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None:
        return dt.astimezone(timezone.utc)
    return dt.replace(tzinfo=timezone.utc)


async def check_and_send_reminders():
    """
    Check for interviews needing reminders and send them.
    
    LOGIC:
    - Get current time in UTC
    - For each scheduled interview, calculate hours until interview
    - If <= 24h and >2h away AND no 24h reminder sent -> send 24h reminder
    - If <= 2h away AND no 2h reminder sent -> send 2h reminder
    - Skip if interview is in the past (hours_until < 0)
    """
    try:
        now = datetime.now(timezone.utc)
        #print(f"\n{'='*80}")
        #print(f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] 🔔 REMINDER CHECK")
        #print(f"{'='*80}")
        
        # Get ALL scheduled interviews
        all_scheduled = await schedule_dao.get_all_scheduled_interviews()
        #print(f"📊 Found {len(all_scheduled)} scheduled interviews")
        
        if len(all_scheduled) == 0:
            print("⚠️  No scheduled interviews in database")
            print(f"{'='*80}\n")
            return
        
        reminders_sent = 0
        
        for idx, interview in enumerate(all_scheduled, 1):
            try:
                #print(f"\n--- Interview {idx}/{len(all_scheduled)} ---")
                
                # Get interview datetime from database
                interview_time_raw = interview.get('interview_datetime')
                if not interview_time_raw:
                    print("❌ No interview_datetime - SKIP")
                    continue
                
                # Ensure timezone-aware UTC
                interview_time = make_aware(interview_time_raw)
                
                scenario_name = interview.get('scenario_name', 'Interview')
                company_name = interview.get('company_name', 'Company')
                
                #print(f"📋 {scenario_name} at {company_name}")
                #print(f"🕐 Interview Time: {interview_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
                #print(f"🕐 Current Time:   {now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
                
                # Calculate time difference
                time_diff = interview_time - now
                hours_until = time_diff.total_seconds() / 3600
                minutes_until = time_diff.total_seconds() / 60
                
                #print(f"⏱️  Time until: {hours_until:.2f} hours ({minutes_until:.1f} minutes)")
                
                # Skip past interviews
                if hours_until < 0:
                #    print(f"⏭️  PAST - Skip")
                    continue
                
                # Get reminder status
                reminders_sent_obj = interview.get('reminders_sent', {})
                reminder_prefs = interview.get('reminder_preferences', {'email': True})
                
                #print(f"📧 Email enabled: {reminder_prefs.get('email', True)}")
                #print(f"📨 Reminders sent: {reminders_sent_obj}")
                
                # Check if user wants email reminders
                if not reminder_prefs.get('email', True):
                #    print("📧 User disabled email reminders - SKIP")
                    continue
                
                interview_id = str(interview['_id'])
                
                # ===================================================================
                # REMINDER DECISION LOGIC
                # ===================================================================
                
                sent_24h = reminders_sent_obj.get('24h', False)
                sent_2h = reminders_sent_obj.get('2h', False)
                
                #print(f"\n🔍 Reminder Logic:")
                #print(f"   Hours until: {hours_until:.2f}")
                #print(f"   24h sent: {sent_24h}")
                #print(f"   2h sent: {sent_2h}")
                
                # Check 24h reminder
                if hours_until <= 24 and not sent_24h and hours_until > 2:
                #    print(f"✅ SEND 24h reminder")
                    try:
                        await send_reminder_email(interview, 24)
                        await schedule_dao.mark_reminder_sent(interview_id, '24h')
                        reminders_sent += 1
                        print(f"✅ 24h reminder sent and marked")
                    except Exception as e:
                        print(f"❌ Failed to send 24h: {e}")
                    continue
                
                # Check 2h reminder
                if hours_until <= 2 and not sent_2h:
                 #   print(f"✅ SEND 2h reminder")
                    try:
                        await send_reminder_email(interview, 2)
                        await schedule_dao.mark_reminder_sent(interview_id, '2h')
                        reminders_sent += 1
                        print(f"✅ 2h reminder sent and marked")
                    except Exception as e:
                        print(f"❌ Failed to send 2h: {e}")
                    continue
                
                #print(f"✓ No reminders needed")
                
            except Exception as e:
                print(f"❌ Error processing interview {interview.get('_id')}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        #print(f"\n{'='*80}")
        if reminders_sent > 0:
            print(f"✅ INTERVIEW REMINDER CHECK COMPLETE - Sent {reminders_sent} reminder(s)")
        else:
            print(f"✓ INTERVIEW REMINDER CHECK COMPLETE - No reminders sent")
        #print(f"{'='*80}\n")
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()


async def send_reminder_email(interview: Dict[str, Any], hours_until: int):
    """Send reminder email"""
    try:
        user_uuid = interview.get('uuid')
        
        print(f"  📧 Getting email for user: {user_uuid}")
        
        # Get user email from profile
        profile = await profile_dao.get_profile(user_uuid)
        if not profile:
            print(f"  ❌ No profile found for user {user_uuid}")
            return
        
        user_email = profile.get('email')
        if not user_email:
            print(f"  ❌ No email in profile")
            return
        
        print(f"  ✓ Email: {user_email}")
        
        # Prepare interview data
        interview_datetime = make_aware(interview.get('interview_datetime'))
        
        interview_data = {
            'schedule_uuid': str(interview.get('_id')),
            'interview_datetime': interview_datetime,
            'job_title': interview.get('scenario_name', 'Position'),
            'company_name': interview.get('company_name', 'Company'),
            'timezone': interview.get('timezone', 'UTC'),
            'duration_minutes': interview.get('duration_minutes', 60),
            'location_type': interview.get('location_type', 'video'),
            'location_details': interview.get('location_details'),
            'video_link': interview.get('video_link'),
            'video_platform': interview.get('video_platform', 'Zoom'),
            'phone_number': interview.get('phone_number'),
            'interviewer_name': interview.get('interviewer_name'),
            'interviewer_title': interview.get('interviewer_title'),
            'interviewer_email': interview.get('interviewer_email'),
            'preparation_completion_percentage': interview.get('preparation_completion_percentage', 0),
            'notes': interview.get('notes')
        }
        
        print(f"  📤 Sending {hours_until}h reminder...")
        
        # Send email
        email_sent = calendar_service.send_email_reminder(
            recipient_email=user_email,
            interview_data=interview_data,
            hours_until=hours_until
        )
        
        if email_sent:
            print(f"  ✅ Email sent to {user_email}")
        else:
            print(f"  ❌ Email failed")
            
    except Exception as e:
        print(f"  ❌ Error sending email: {e}")
        import traceback
        traceback.print_exc()


def start_reminder_scheduler():
    """Start the reminder scheduler - checks every 1 MINUTE"""
    try:
        if reminder_scheduler.running:
            print("⚠️  Scheduler already running")
            return
            
        reminder_scheduler.add_job(
            check_and_send_reminders,
            trigger=IntervalTrigger(minutes=1),
            id='interview_reminders',
            name='Interview Reminders',
            replace_existing=True,
            max_instances=1
        )
        
        reminder_scheduler.start()
    #    print("\n" + "="*80)
        print("✅ REMINDER SCHEDULER STARTED")
    #    print("="*80)
    #    print("   ⏰ Checking every 1 MINUTE")
    #    print("   📧 Sends 24h reminder when ≤24h away (but >2h)")
    #    print("   📧 Sends 2h reminder when ≤2h away")
    #    print("="*80 + "\n")
        
    except Exception as e:
        print(f"❌ Failed to start scheduler: {e}")


def stop_reminder_scheduler():
    """Stop the reminder scheduler"""
    try:
        if reminder_scheduler.running:
            reminder_scheduler.shutdown(wait=False)
            print("✅ Scheduler stopped")
    except Exception as e:
        print(f"⚠️  Error stopping: {e}")


# AUTO-START
try:
    start_reminder_scheduler()
except Exception as e:
    print(f"⚠️  Could not auto-start: {e}")

# AUTO-STOP
atexit.register(stop_reminder_scheduler)