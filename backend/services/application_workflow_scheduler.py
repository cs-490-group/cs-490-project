# backend/services/application_workflow_scheduler.py

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from services.automation_engine import process_due_schedules

_scheduler: AsyncIOScheduler | None = None


def start_workflow_scheduler():
    """
    Called on FastAPI startup (see main.py).
    Schedules process_due_schedules() to run every 60 seconds.
    """
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        print("✅ Workflow scheduler already running")
        return

    _scheduler = AsyncIOScheduler()

    # Every 60 seconds, run process_due_schedules
    @_scheduler.scheduled_job("interval", seconds=60, id="workflow_auto_submit")
    def _run_due_schedules():
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.create_task(process_due_schedules())

    _scheduler.start()
    print("✅ WORKFLOW AUTOMATION SCHEDULER STARTED")


def stop_workflow_scheduler():
    """
    Called on FastAPI shutdown.
    """
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown()
        print("✅ WORKFLOW AUTOMATION SCHEDULER STOPPED")
    else:
        print("⚠️ Workflow scheduler was not running")


