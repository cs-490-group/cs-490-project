"""
Network Event Reminder Scheduler
Monitors event dates and sends reminder emails at:
- 1 day before event date (preparation reminder)
- 1 hour before event start time (urgent action reminder)
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import atexit

from mongo.network_events_dao import network_events_dao
from mongo.profiles_dao import UserDataDAO
from services.event_reminder_service import event_reminder_service
from mongo.dao_setup import db_client

# Initialize DAOs
profile_dao = UserDataDAO()

# Scheduler instance
event_reminder_scheduler = AsyncIOScheduler()


def make_aware(dt):
    """Convert datetime to timezone-aware UTC if naive"""
    if dt is None:
        return None
    if dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None:
        return dt.astimezone(timezone.utc)
    return dt.replace(tzinfo=timezone.utc)


async def parse_event_datetime(event_data: Dict[str, Any]) -> tuple:
    """
    Parse event date and time into a datetime object.
    
    Returns:
        Tuple of (event_datetime, error_message)
    """
    try:
        event_date_raw = event_data.get('event_date')
        start_time_raw = event_data.get('start_time')
        
        if not event_date_raw:
            return None, "No event_date provided"
        
        # Parse event date
        if isinstance(event_date_raw, str):
            try:
                # Try ISO format first
                event_date = datetime.fromisoformat(event_date_raw.replace('Z', '+00:00'))
            except:
                try:
                    # Try common date formats
                    event_date = datetime.strptime(event_date_raw, "%Y-%m-%d")
                    event_date = event_date.replace(tzinfo=timezone.utc)
                except:
                    return None, f"Could not parse event_date: {event_date_raw}"
        elif isinstance(event_date_raw, datetime):
            event_date = event_date_raw
        else:
            return None, f"Invalid event_date type: {type(event_date_raw)}"
        
        # If start_time is provided, parse and combine
        if start_time_raw:
            if isinstance(start_time_raw, str):
                try:
                    # Parse time (HH:MM or HH:MM:SS format)
                    start_time = datetime.strptime(start_time_raw, "%H:%M").time()
                except:
                    try:
                        start_time = datetime.strptime(start_time_raw, "%H:%M:%S").time()
                    except:
                        # If time parsing fails, use noon as default
                        start_time = datetime.strptime("12:00", "%H:%M").time()
                
                # Combine date and time
                event_datetime = datetime.combine(event_date.date(), start_time)
                event_datetime = event_datetime.replace(tzinfo=timezone.utc)
            else:
                event_datetime = event_date
        else:
            # No start time, use noon as default
            event_datetime = event_date.replace(hour=12, minute=0, second=0, microsecond=0)
        
        return make_aware(event_datetime), None
        
    except Exception as e:
        return None, f"Error parsing event datetime: {str(e)}"


async def check_and_send_event_reminders():
    """
    Check for events needing reminders and send them.
    
    LOGIC:
    - Get current time in UTC
    - For each event with an event_date:
      - If event_date is 1 day away AND no 24h reminder sent -> send 24h reminder
      - If event starts in ~1h AND no 1h reminder sent -> send urgent reminder
    - Mark reminders as sent to prevent duplicates
    """
    try:
        now = datetime.now(timezone.utc)
        print(f"\n{'='*80}")
        print(f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] 🎪 EVENT REMINDER CHECK")
        print(f"{'='*80}")
        
        # Get all events
        try:
            collection = db_client.get_collection("networking_events")
            all_events = []
            async for doc in collection.find({}):
                all_events.append(doc)
        except Exception as e:
            print(f"❌ Error fetching events: {e}")
            return
        
        print(f"📊 Found {len(all_events)} total events")
        
        if len(all_events) == 0:
            print("⚠️  No events in database")
            print(f"{'='*80}\n")
            return
        
        reminders_sent = 0
        
        for idx, event in enumerate(all_events, 1):
            try:
                # Parse event datetime
                event_datetime, parse_error = await parse_event_datetime(event)
                if not event_datetime:
                    if parse_error:
                        print(f"  ⚠️  Event {idx}: {parse_error} - SKIP")
                    continue
                
                uuid = event.get('uuid')
                if not uuid:
                    continue
                
                event_name = event.get('event_name', 'Event')
                event_id_str = str(event['_id'])
                
                # Calculate time difference
                time_diff = event_datetime - now
                hours_until = time_diff.total_seconds() / 3600
                minutes_until = time_diff.total_seconds() / 60
                
                # Skip past events (more than 2 hours past)
                if hours_until < -2:
                    continue
                
                # Get reminder status
                reminders_sent_obj = event.get('reminders_sent', {})
                
                print(f"\n--- Event {idx}/{len(all_events)} ---")
                print(f"  🎪 {event_name}")
                print(f"  📅 Event Date/Time: {event_datetime.strftime('%Y-%m-%d %H:%M:%S UTC')}")
                print(f"  ⏱️  Time until: {hours_until:.2f} hours ({minutes_until:.1f} minutes)")
                print(f"  📨 Reminders sent: {reminders_sent_obj}")
                
                # ===================================================================
                # REMINDER DECISION LOGIC
                # ===================================================================
                
                sent_24h = reminders_sent_obj.get('24h_before', False)
                sent_1h = reminders_sent_obj.get('1h_before', False)
                
                should_send_24h = False
                should_send_1h = False
                
                # Check 24h reminder (between 24-25 hours before)
                if 24 <= hours_until <= 25 and not sent_24h:
                    should_send_24h = True
                    print(f"  ✅ EVENT IS 1 DAY AWAY - will send 24h reminder")
                
                # Check 1h reminder (between 0.5-1.5 hours before)
                elif 0.5 <= hours_until <= 1.5 and not sent_1h:
                    should_send_1h = True
                    print(f"  ✅ EVENT STARTS IN ~1 HOUR - will send urgent reminder")
                
                # Send 24h reminder
                if should_send_24h:
                    try:
                        # Get user email
                        profile = await profile_dao.get_profile(uuid)
                        if not profile or not profile.get('email'):
                            print(f"  ❌ No user email found")
                            continue
                        
                        user_email = profile.get('email')
                        
                        # Send reminder email
                        result = event_reminder_service.send_event_reminder_email(
                            recipient_email=user_email,
                            event_data=event,
                            hours_until=24
                        )
                        
                        # Mark reminder as sent
                        await network_events_dao.update_event(
                            event_id_str,
                            {
                                'reminders_sent': {
                                    **reminders_sent_obj,
                                    '24h_before': True,
                                    '24h_before_sent_at': datetime.now(timezone.utc)
                                }
                            }
                        )
                        
                        reminders_sent += 1
                        print(f"  ✅ 24h reminder sent to {user_email}")
                        
                    except Exception as e:
                        print(f"  ❌ Failed to send 24h reminder: {e}")
                        import traceback
                        traceback.print_exc()
                
                # Send 1h urgent reminder
                elif should_send_1h:
                    try:
                        # Get user email
                        profile = await profile_dao.get_profile(uuid)
                        if not profile or not profile.get('email'):
                            print(f"  ❌ No user email found")
                            continue
                        
                        user_email = profile.get('email')
                        
                        # Send urgent reminder email
                        result = event_reminder_service.send_event_reminder_email(
                            recipient_email=user_email,
                            event_data=event,
                            hours_until=1
                        )
                        
                        # Mark reminder as sent
                        await network_events_dao.update_event(
                            event_id_str,
                            {
                                'reminders_sent': {
                                    **reminders_sent_obj,
                                    '1h_before': True,
                                    '1h_before_sent_at': datetime.now(timezone.utc)
                                }
                            }
                        )
                        
                        reminders_sent += 1
                        print(f"  ✅ Urgent 1h reminder sent to {user_email}")
                        
                    except Exception as e:
                        print(f"  ❌ Failed to send urgent reminder: {e}")
                        import traceback
                        traceback.print_exc()
                
            except Exception as e:
                print(f"❌ Error processing event {idx}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"\n{'='*80}")
        if reminders_sent > 0:
            print(f"\033[92m✅ EVENT REMINDER CHECK COMPLETE - Sent {reminders_sent} reminder(s)\033[0m")
        else:
            print(f"\033[92m✓ EVENT REMINDER CHECK COMPLETE - No reminders sent\033[0m")
        print(f"{'='*80}\n")
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()


def start_event_reminder_scheduler():
    """Start the event reminder scheduler - checks every 1 MINUTE"""
    try:
        if event_reminder_scheduler.running:
            print("⚠️  Event reminder scheduler already running")
            return
            
        event_reminder_scheduler.add_job(
            check_and_send_event_reminders,
            trigger=IntervalTrigger(minutes=1),
            id='event_reminders',
            name='Event Reminders',
            replace_existing=True,
            max_instances=1
        )
        
        event_reminder_scheduler.start()
        print("✅ EVENT REMINDER SCHEDULER STARTED")
        print("   ⏰ Checking every 1 MINUTE")
        print("   📧 Sends 24h reminder when event is 1 day away")
        print("   📧 Sends urgent 1h reminder when event starts in ~1 hour")
        
    except Exception as e:
        print(f"❌ Failed to start event reminder scheduler: {e}")


def stop_event_reminder_scheduler():
    """Stop the event reminder scheduler"""
    try:
        if event_reminder_scheduler.running:
            event_reminder_scheduler.shutdown(wait=False)
            print("✅ Event reminder scheduler stopped")
    except Exception as e:
        print(f"⚠️  Error stopping event reminder scheduler: {e}")


# AUTO-START
try:
    start_event_reminder_scheduler()
except Exception as e:
    print(f"⚠️  Could not auto-start event reminder scheduler: {e}")

# AUTO-STOP
atexit.register(stop_event_reminder_scheduler)
