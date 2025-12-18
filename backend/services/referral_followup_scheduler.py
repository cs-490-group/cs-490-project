"""
Referral Follow-Up Reminder Scheduler
Monitors referral follow-up dates and sends reminder emails at:
- 24 hours before follow-up date (preparation reminder)
- On follow-up date (urgent action reminder)

Supports two follow-up types:
- "standard": Regular follow-up message
- "thank_you": Thank you message
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import atexit

from mongo.referrals_dao import referrals_dao
from mongo.network_dao import network_dao
from mongo.profiles_dao import UserDataDAO
from services.referral_followup_service import referral_followup_service
from mongo.dao_setup import db_client

# Initialize DAOs
profile_dao = UserDataDAO()

# Scheduler instance
referral_followup_scheduler = AsyncIOScheduler()


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


async def check_and_send_followup_reminders():
    """
    Check for referral follow-ups needing reminders and send them.
    
    Supports two follow-up types:
    - "standard": Regular follow-up message
    - "thank_you": Thank you message
    
    LOGIC:
    - Get current time in UTC
    - For each referral with follow-ups:
      - For each follow-up with a date:
        - If follow-up date is 24h away AND no 24h reminder sent -> send 24h reminder
        - If follow-up date is TODAY AND no same-day reminder sent -> send urgent reminder
    - Mark reminders as sent to prevent duplicates
    """
    try:
        now = datetime.now(timezone.utc)
        print(f"\n{'='*80}")
        print(f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] 📧 REFERRAL FOLLOW-UP REMINDER CHECK")
        print(f"{'='*80}")
        
        # Get all referrals
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
                # Check if referral has follow-ups
                follow_ups = referral.get('follow_ups', [])
                if not follow_ups:
                    continue
                
                uuid = referral.get('uuid')
                contact_id = referral.get('contact_id')
                
                if not uuid:
                    continue
                
                company = referral.get('company', 'Company')
                position = referral.get('position', 'Position')
                referral_id_str = str(referral['_id'])
                
                # Get current time at UTC
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1)
                tomorrow_start = today_end
                tomorrow_end = today_end + timedelta(days=1)
                
                # Process each follow-up
                for followup_idx, followup in enumerate(follow_ups):
                    followup_date_raw = followup.get('date')
                    followup_kind = followup.get('kind', 'standard')
                    followup_message = followup.get('message', '')
                    followup_status = followup.get('status', 'pending')
                    
                    if not followup_date_raw:
                        continue
                    
                    # Parse follow-up date
                    followup_date = await parse_date_string(followup_date_raw)
                    if not followup_date:
                        continue
                    
                    # Ensure timezone-aware UTC
                    followup_date = make_aware(followup_date)
                    
                    # Calculate time difference
                    time_diff = followup_date - now
                    hours_until = time_diff.total_seconds() / 3600
                    
                    # Check if follow-up date is in the past
                    if hours_until < -1:  # Allow -1 hour grace period
                        continue
                    
                    # Get reminder status for this specific follow-up
                    reminders_sent_obj = followup.get('reminders_sent', {})
                    
                    print(f"\n--- Follow-Up {followup_idx + 1} of Referral {idx}/{len(all_referrals)} ---")
                    print(f"  📋 {position} at {company}")
                    print(f"  📝 Type: {followup_kind}")
                    print(f"  📅 Follow-up Date: {followup_date.strftime('%Y-%m-%d %H:%M:%S UTC')}")
                    print(f"  ⏱️  Time until: {hours_until:.2f} hours")
                    print(f"  📨 Reminders sent: {reminders_sent_obj}")
                    
                    # ===================================================================
                    # REMINDER DECISION LOGIC
                    # ===================================================================
                    
                    sent_24h = reminders_sent_obj.get('24h_before', False)
                    sent_same_day = reminders_sent_obj.get('same_day', False)
                    
                    should_send_24h = False
                    should_send_same_day = False
                    
                    # Check if follow-up date is tomorrow
                    if tomorrow_start <= followup_date < tomorrow_end and not sent_24h:
                        should_send_24h = True
                        print(f"  ✅ FOLLOW-UP DATE IS TOMORROW - will send 24h reminder")
                    
                    # Check if follow-up date is today
                    elif today_start <= followup_date < today_end and not sent_same_day:
                        should_send_same_day = True
                        print(f"  ✅ FOLLOW-UP DATE IS TODAY - will send urgent reminder")
                    
                    # Send 24h reminder
                    if should_send_24h:
                        try:
                            # Get user email
                            profile = await profile_dao.get_profile(uuid)
                            if not profile or not profile.get('email'):
                                print(f"  ❌ No user email found")
                                continue
                            
                            user_email = profile.get('email')
                            
                            # Get contact info
                            contact = await network_dao.get_contact(str(contact_id))
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
                            result = referral_followup_service.send_followup_reminder_email(
                                recipient_email=user_email,
                                followup_data={
                                    'type': followup_kind,
                                    'message': followup_message,
                                    'date': followup_date_raw
                                },
                                referral_data=referral,
                                contact_info=contact_info,
                                hours_until=24
                            )
                            
                            # Mark reminder as sent in the follow-up
                            followup['reminders_sent'] = {
                                **reminders_sent_obj,
                                '24h_before': True,
                                '24h_before_sent_at': datetime.now(timezone.utc)
                            }
                            
                            # Update referral with modified follow-up
                            await referrals_dao.update_referral(
                                referral_id_str,
                                {'follow_ups': follow_ups}
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
                            # Get user email
                            profile = await profile_dao.get_profile(uuid)
                            if not profile or not profile.get('email'):
                                print(f"  ❌ No user email found")
                                continue
                            
                            user_email = profile.get('email')
                            
                            # Get contact info
                            contact = await network_dao.get_contact(str(contact_id))
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
                            result = referral_followup_service.send_followup_reminder_email(
                                recipient_email=user_email,
                                followup_data={
                                    'type': followup_kind,
                                    'message': followup_message,
                                    'date': followup_date_raw
                                },
                                referral_data=referral,
                                contact_info=contact_info,
                                hours_until=0
                            )
                            
                            # Mark reminder as sent in the follow-up
                            followup['reminders_sent'] = {
                                **reminders_sent_obj,
                                'same_day': True,
                                'same_day_sent_at': datetime.now(timezone.utc)
                            }
                            
                            # Update referral with modified follow-up
                            await referrals_dao.update_referral(
                                referral_id_str,
                                {'follow_ups': follow_ups}
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
            print(f"\033[92m✅ FOLLOW-UP REMINDER CHECK COMPLETE - Sent {reminders_sent} reminder(s)\033[0m")
        else:
            print(f"\033[92m✓ FOLLOW-UP REMINDER CHECK COMPLETE - No reminders sent\033[0m")
        print(f"{'='*80}\n")
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()


def start_referral_followup_scheduler():
    """Start the referral follow-up reminder scheduler - checks every 1 MINUTE"""
    try:
        if referral_followup_scheduler.running:
            print("⚠️  Referral follow-up scheduler already running")
            return
            
        referral_followup_scheduler.add_job(
            check_and_send_followup_reminders,
            trigger=IntervalTrigger(minutes=1),
            id='referral_followup_reminders',
            name='Referral Follow-Up Reminders',
            replace_existing=True,
            max_instances=1
        )
        
        referral_followup_scheduler.start()
        print("✅ REFERRAL FOLLOW-UP SCHEDULER STARTED")
        print("   ⏰ Checking every 1 MINUTE")
        print("   📧 Sends 24h reminder day before follow-up date")
        print("   📧 Sends urgent reminder on follow-up date")
        print("   📝 Supports: standard follow-ups & thank you messages")
        
    except Exception as e:
        print(f"❌ Failed to start referral follow-up scheduler: {e}")


def stop_referral_followup_scheduler():
    """Stop the referral follow-up reminder scheduler"""
    try:
        if referral_followup_scheduler.running:
            referral_followup_scheduler.shutdown(wait=False)
            print("✅ Referral follow-up scheduler stopped")
    except Exception as e:
        print(f"⚠️  Error stopping referral follow-up scheduler: {e}")


# AUTO-START
try:
    start_referral_followup_scheduler()
except Exception as e:
    print(f"⚠️  Could not auto-start referral follow-up scheduler: {e}")

# AUTO-STOP
atexit.register(stop_referral_followup_scheduler)
