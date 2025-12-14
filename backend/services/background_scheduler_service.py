"""
Background Scheduler Service
Automatically processes scheduled application submissions
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import logging

from mongo.application_workflow_dao import application_workflow_dao
from mongo.jobs_dao import jobs_dao
from services.scheduling_service import scheduling_service

logger = logging.getLogger(__name__)


class BackgroundScheduler:
    """Service to check and process scheduled applications"""
    
    def __init__(self):
        self.is_running = False
        self.check_interval = 60  # Check every 60 seconds
        
    async def start(self):
        """Start the background scheduler"""
        if self.is_running:
            logger.warning("Scheduler already running")
            return
        
        self.is_running = True
        logger.info("Background scheduler started")
        
        while self.is_running:
            try:
                await self._process_scheduled_applications()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(self.check_interval)
    
    async def stop(self):
        """Stop the background scheduler"""
        self.is_running = False
        logger.info("Background scheduler stopped")
    
    async def _process_scheduled_applications(self):
        """Check for scheduled applications that are due"""
        try:
            now = datetime.now(timezone.utc)
            
            # Get all scheduled applications that are due (within next 5 minutes)
            due_schedules = await application_workflow_dao.get_due_schedules(
                before_time=now + timedelta(minutes=5)
            )
            
            logger.info(f"Found {len(due_schedules)} due schedules to process")
            
            for schedule in due_schedules:
                try:
                    await self._process_single_schedule(schedule)
                except Exception as e:
                    logger.error(f"Error processing schedule {schedule['_id']}: {e}")
        
        except Exception as e:
            logger.error(f"Error in _process_scheduled_applications: {e}")
    
    async def _process_single_schedule(self, schedule: Dict[str, Any]):
        """Process a single scheduled application"""
        schedule_id = str(schedule['_id'])
        job_id = schedule['job_id']
        package_id = schedule['package_id']
        user_uuid = schedule['uuid']
        
        logger.info(f"Processing schedule {schedule_id} for job {job_id}")
        
        try:
            # Update job status to submitted
            update_data = {
                'submitted': True,
                'submitted_at': datetime.now(timezone.utc).isoformat(),
                'status': 'SUBMITTED',
                'application_package_id': package_id
            }
            
            updated = await jobs_dao.update_job(job_id, update_data)
            
            if updated:
                # Mark schedule as completed
                await application_workflow_dao.update_schedule_status(
                    schedule_id,
                    status='completed',
                    notes='Automatically submitted by scheduler'
                )
                
                # Increment package usage counter
                await application_workflow_dao.increment_package_usage(package_id)
                
                logger.info(f"Successfully processed schedule {schedule_id}")
                
                # Send success notification email (if user has email configured)
                try:
                    # Get job details for email
                    job = await jobs_dao.get_job(job_id)
                    package = await application_workflow_dao.get_application_package(package_id)
                    
                    # You would need to get user email from user profile
                    # For now, we'll log it
                    logger.info(f"Would send success notification for schedule {schedule_id}")
                    
                except Exception as e:
                    logger.warning(f"Could not send notification email: {e}")
            else:
                logger.error(f"Failed to update job {job_id}")
                await application_workflow_dao.update_schedule_status(
                    schedule_id,
                    status='failed',
                    notes='Failed to update job status'
                )
        
        except Exception as e:
            logger.error(f"Error processing schedule {schedule_id}: {e}")
            await application_workflow_dao.update_schedule_status(
                schedule_id,
                status='failed',
                notes=f'Error: {str(e)}'
            )
    
    async def send_reminder_notifications(self):
        """Send reminder emails for upcoming scheduled applications"""
        try:
            now = datetime.now(timezone.utc)
            
            # Get schedules that are 24 hours away
            upcoming_schedules = await application_workflow_dao.get_schedules_by_time_range(
                start_time=now + timedelta(hours=23),
                end_time=now + timedelta(hours=25)
            )
            
            for schedule in upcoming_schedules:
                # Check if we already sent a reminder
                if schedule.get('reminder_sent'):
                    continue
                
                try:
                    # Get job and package details
                    job = await jobs_dao.get_job(schedule['job_id'])
                    package = await application_workflow_dao.get_application_package(schedule['package_id'])
                    
                    # You would get user email here
                    logger.info(f"Would send 24-hour reminder for schedule {schedule['_id']}")
                    
                    # Mark reminder as sent
                    await application_workflow_dao.mark_reminder_sent(str(schedule['_id']))
                    
                except Exception as e:
                    logger.error(f"Error sending reminder for schedule {schedule['_id']}: {e}")
        
        except Exception as e:
            logger.error(f"Error in send_reminder_notifications: {e}")


# Singleton instance
background_scheduler = BackgroundScheduler()


# FastAPI startup/shutdown hooks
async def start_scheduler():
    """Start the background scheduler on app startup"""
    asyncio.create_task(background_scheduler.start())


async def stop_scheduler():
    """Stop the background scheduler on app shutdown"""
    await background_scheduler.stop()