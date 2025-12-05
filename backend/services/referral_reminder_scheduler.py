"""
Referral Reminder Scheduler
Monitors referral request dates and sends reminder emails at:
- 24 hours before request date (preparation reminder)
- On request date (urgent action reminder)
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import atexit

from mongo.referrals_dao import referrals_dao
from mongo.network_dao import network_dao
from mongo.profiles_dao import UserDataDAO
from services.referral_reminder_service import referral_reminder_service
from mongo.dao_setup import db_client

# Initialize DAOs
profile_dao = UserDataDAO()

# Scheduler instance
referral_reminder_scheduler = AsyncIOScheduler()


def make_aware(dt):
    """Convert datetime to timezone-aware UTC if naive"""
    if dt is None:
        return None
    if dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None:
        return dt.astimezone(timezone.utc)
    return dt.replace(tzinfo=timezone.utc)


async def parse_date_string(date_str):
    """Parse date string to datetime"""
    if isinstance(date_str, datetime):
        return date_str
    
    if isinstance(date_str, str):
        # Try common date formats
        formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%S%z",
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If no format matches, try ISO format
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            print(f"⚠️  Could not parse date: {date_str}")
            return None
    
    return None


async def check_and_send_referral_reminders():
    """
    Check for referrals needing reminders and send them.
    
    LOGIC:
    - Get current time in UTC
    - For each referral with a request_date:
      - If request_date is 24h away AND no 24h reminder sent -> send 24h reminder
      - If request_date is TODAY AND no same-day reminder sent -> send urgent reminder
    - Mark reminders as sent to prevent duplicates
    """
    try:
        now = datetime.now(timezone.utc)
        print(f"\n{'='*80}")
        print(f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] 🎯 REFERRAL REMINDER CHECK")
        print(f"{'='*80}")
        
        # Get all referrals
        # Since we need to check all referrals across all users, we need direct DB access
        try:
            collection = db_client.get_collection("referrals")
            all_referrals = []
            async for doc in collection.find({}):
                all_referrals.append(doc)
        except Exception as e:
            print(f"❌ Error fetching referrals: {e}")
            return
        
        print(f"📊 Found {len(all_referrals)} total referrals")
        
        if len(all_referrals) == 0:
            print("⚠️  No referrals in database")
            print(f"{'='*80}\n")
            return
        
        reminders_sent = 0
        
        for idx, referral in enumerate(all_referrals, 1):
            try:
                # Check if referral is in pending status
                status = referral.get('status', 'pending')
                if status != 'pending':
                    continue
                
                # Check if referral has a request_date and contact
                request_date_raw = referral.get('request_date')
                contact_id = referral.get('contact_id')
                uuid = referral.get('uuid')
                
                if not request_date_raw:
                    continue
                
                if not contact_id:
                    print(f"⚠️  Referral {idx} has no contact_id - SKIP")
                    continue
                
                if not uuid:
                    print(f"⚠️  Referral {idx} has no uuid - SKIP")
                    continue
                
                # Parse request date
                request_date = await parse_date_string(request_date_raw)
                if not request_date:
                    print(f"⚠️  Could not parse request_date for referral {idx} - SKIP")
                    continue
                
                # Ensure timezone-aware UTC
                request_date = make_aware(request_date)
                
                company = referral.get('company', 'Company')
                position = referral.get('position', 'Position')
                contact_id_str = str(contact_id)
                referral_id_str = str(referral['_id'])
                
                # Get current time at UTC
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1)
                tomorrow_start = today_end
                tomorrow_end = today_end + timedelta(days=1)
                
                # Calculate time difference
                time_diff = request_date - now
                hours_until = time_diff.total_seconds() / 3600
                
                # Check if request_date is in the past
                if hours_until < -1:  # Allow -1 hour grace period
                    print(f"  ⏭️  Referral {idx} request date is in the past - SKIP")
                    continue
                
                # Get reminder status
                reminders_sent_obj = referral.get('reminders_sent', {})
                
                print(f"\n--- Referral {idx}/{len(all_referrals)} ---")
                print(f"  📋 {position} at {company}")
                print(f"  📅 Request Date: {request_date.strftime('%Y-%m-%d %H:%M:%S UTC')}")
                print(f"  ⏱️  Time until: {hours_until:.2f} hours")
                print(f"  📨 Reminders sent: {reminders_sent_obj}")
                
                # ===================================================================
                # REMINDER DECISION LOGIC
                # ===================================================================
                
                sent_24h = reminders_sent_obj.get('24h_before', False)
                sent_same_day = reminders_sent_obj.get('same_day', False)
                
                should_send_24h = False
                should_send_same_day = False
                
                # Check if request_date is tomorrow (between tomorrow_start and tomorrow_end)
                if tomorrow_start <= request_date < tomorrow_end and not sent_24h:
                    should_send_24h = True
                    print(f"  ✅ REQUEST DATE IS TOMORROW - will send 24h reminder")
                
                # Check if request_date is today (between today_start and today_end)
                elif today_start <= request_date < today_end and not sent_same_day:
                    should_send_same_day = True
                    print(f"  ✅ REQUEST DATE IS TODAY - will send urgent reminder")
                
                # Send 24h reminder
                if should_send_24h:
                    try:
                        # Get user email and contact info
                        profile = await profile_dao.get_profile(uuid)
                        if not profile or not profile.get('email'):
                            print(f"  ❌ No user email found")
                            continue
                        
                        user_email = profile.get('email')
                        
                        # Get contact info
                        contact = await network_dao.get_contact(contact_id_str)
                        if not contact:
                            print(f"  ❌ Contact not found")
                            continue
                        
                        contact_info = {
                            'name': contact.get('name', 'Contact'),
                            'email': contact.get('email', ''),
                            'company': contact.get('company', ''),
                            'title': contact.get('title', '')
                        }
                        
                        # Send reminder email
                        result = referral_reminder_service.send_referral_reminder_email(
                            recipient_email=user_email,
                            referral_data=referral,
                            contact_info=contact_info,
                            hours_until=24
                        )
                        
                        # Mark reminder as sent
                        await referrals_dao.update_referral(
                            referral_id_str,
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
                
                # Send same-day urgent reminder
                elif should_send_same_day:
                    try:
                        # Get user email and contact info
                        profile = await profile_dao.get_profile(uuid)
                        if not profile or not profile.get('email'):
                            print(f"  ❌ No user email found")
                            continue
                        
                        user_email = profile.get('email')
                        
                        # Get contact info
                        contact = await network_dao.get_contact(contact_id_str)
                        if not contact:
                            print(f"  ❌ Contact not found")
                            continue
                        
                        contact_info = {
                            'name': contact.get('name', 'Contact'),
                            'email': contact.get('email', ''),
                            'company': contact.get('company', ''),
                            'title': contact.get('title', '')
                        }
                        
                        # Send urgent reminder email
                        result = referral_reminder_service.send_referral_reminder_email(
                            recipient_email=user_email,
                            referral_data=referral,
                            contact_info=contact_info,
                            hours_until=0
                        )
                        
                        # Mark reminder as sent
                        await referrals_dao.update_referral(
                            referral_id_str,
                            {
                                'reminders_sent': {
                                    **reminders_sent_obj,
                                    'same_day': True,
                                    'same_day_sent_at': datetime.now(timezone.utc)
                                }
                            }
                        )
                        
                        reminders_sent += 1
                        print(f"  ✅ Urgent reminder sent to {user_email}")
                        
                    except Exception as e:
                        print(f"  ❌ Failed to send urgent reminder: {e}")
                        import traceback
                        traceback.print_exc()
                
            except Exception as e:
                print(f"❌ Error processing referral {idx}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"\n{'='*80}")
        if reminders_sent > 0:
            print(f"\033[92m✅ REFERRAL REMINDER CHECK COMPLETE - Sent {reminders_sent} reminder(s)\033[0m")
        else:
            print(f"\033[92m✓ REFERRAL REMINDER CHECK COMPLETE - No reminders sent\033[0m")
        print(f"{'='*80}\n")
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()


def start_referral_reminder_scheduler():
    """Start the referral reminder scheduler - checks every 1 MINUTE"""
    try:
        if referral_reminder_scheduler.running:
            print("⚠️  Referral reminder scheduler already running")
            return
            
        referral_reminder_scheduler.add_job(
            check_and_send_referral_reminders,
            trigger=IntervalTrigger(minutes=1),
            id='referral_reminders',
            name='Referral Reminders',
            replace_existing=True,
            max_instances=1
        )
        
        referral_reminder_scheduler.start()
        print("✅ REFERRAL REMINDER SCHEDULER STARTED")
        print("   ⏰ Checking every 1 MINUTE")
        print("   📧 Sends 24h reminder day before request date")
        print("   📧 Sends urgent reminder on request date")
        
    except Exception as e:
        print(f"❌ Failed to start referral reminder scheduler: {e}")


def stop_referral_reminder_scheduler():
    """Stop the referral reminder scheduler"""
    try:
        if referral_reminder_scheduler.running:
            referral_reminder_scheduler.shutdown(wait=False)
            print("✅ Referral reminder scheduler stopped")
    except Exception as e:
        print(f"⚠️  Error stopping referral reminder scheduler: {e}")


# AUTO-START
try:
    start_referral_reminder_scheduler()
except Exception as e:
    print(f"⚠️  Could not auto-start referral reminder scheduler: {e}")

# AUTO-STOP
atexit.register(stop_referral_reminder_scheduler)
