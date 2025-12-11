from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from mongo/.env file
env_path = Path(__file__).parent / 'mongo' / '.env'
load_dotenv(dotenv_path=env_path)

from routes.auth import auth_router
from routes.profiles import profiles_router
from routes.groups import groups_router
from routes.teams import teams_router
from routes.progress_sharing_router import progress_router
from routes.posts import posts_router
from routes.skills import skills_router
from routes.projects import projects_router
from routes.employment import employment_router
from routes.certifications import certifications_router
from routes.education import education_router
from routes.jobs import jobs_router
from routes.coverLetter import coverletter_router
from routes.user_data import user_router
from routes.resumes import resumes_router
from routes.resumes_pdf import pdf_router
from routes.templates import templates_router
from routes.AI import ai_router
from routes.question_bank import question_bank_router
from routes.mock_interview import mock_interview_router
from routes.interview_router import (interview_router)
from routes.interview_analytics_routes import analytics_router, prediction_router
from routes.coaching import coaching_router
from routes.advisors import advisors_router
from routes import matching
from routes.offers import offers_router
from routes.technical_prep import technical_prep_router
from routes.application_workflow_router import workflow_router
from routes.networks import networks_router
from routes.referrals import referrals_router
from routes.network_events import network_events_router
from routes.informational_interviews import informational_interviews_router
from routes.mentorship import mentorship_router
from routes.network_campaigns import network_campaigns_router
from routes.professional_references import professional_references_router
from routes.network_analytics import network_analytics_router
from routes.organizations import org_router
from routes.Salary import salary_router
from routes.insights import insights_router
from routes.referral_message_routes import referral_message_router
from routes.goals import goals_router
from routes.time_tracking import time_tracking_router
from services.referral_reminder_scheduler import start_referral_reminder_scheduler, stop_referral_reminder_scheduler
from services.referral_followup_scheduler import start_referral_followup_scheduler, stop_referral_followup_scheduler
from services.event_reminder_scheduler import start_event_reminder_scheduler, stop_event_reminder_scheduler
from services.interview_reminder_scheduler import start_interview_reminder_scheduler, stop_interview_reminder_scheduler
from services.application_workflow_scheduler import (
    start_workflow_scheduler,
    stop_workflow_scheduler
)
from routes.salary_research_routes import salary_research_router
from routes.api_metrics import router as api_metrics_router

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[
        FastApiIntegration(),
        StarletteIntegration(),
    ],
    traces_sample_rate=1.0,  # Capture 100% of transactions
)


app = FastAPI()

api_prefix = "/api"

origins = [ # domains to provide access to
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://metamorphosis-lmnlwz5wp-antwas257s-projects.vercel.app",
    "https://metamorphosis-38kknkfpb-antwas257s-projects.vercel.app",
    "https://metamorphosis1.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,
    allow_methods=["*"],         
    allow_headers=["*"],         
)

app.include_router(auth_router, prefix = api_prefix)
app.include_router(profiles_router, prefix = api_prefix)
app.include_router(groups_router, prefix = api_prefix)
app.include_router(teams_router,prefix=api_prefix)
app.include_router(org_router,prefix=api_prefix)
app.include_router(progress_router,prefix = api_prefix)
app.include_router(posts_router,prefix = api_prefix)
app.include_router(skills_router, prefix = api_prefix)
app.include_router(projects_router, prefix = api_prefix)
app.include_router(education_router, prefix = api_prefix)
app.include_router(employment_router, prefix = api_prefix)
app.include_router(certifications_router, prefix = api_prefix)
app.include_router(jobs_router, prefix = api_prefix)
app.include_router(coverletter_router,prefix=api_prefix)
app.include_router(user_router,prefix=api_prefix)
app.include_router(resumes_router, prefix = api_prefix)
app.include_router(pdf_router, prefix = api_prefix)
app.include_router(templates_router, prefix = api_prefix)
app.include_router(question_bank_router, prefix = api_prefix)
app.include_router(mock_interview_router, prefix = api_prefix)
app.include_router(interview_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(prediction_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(salary_router)
app.include_router(insights_router)
app.include_router(referral_message_router, prefix=api_prefix)
app.include_router(salary_research_router, prefix=api_prefix)
app.include_router(analytics_router)



app.include_router(coaching_router, prefix = api_prefix)
app.include_router(advisors_router,prefix=api_prefix)
app.include_router(matching.router)
app.include_router(offers_router, prefix = api_prefix)
app.include_router(technical_prep_router, prefix = api_prefix)
app.include_router(goals_router, prefix = api_prefix)
app.include_router(time_tracking_router, prefix = api_prefix)
app.include_router(salary_router, prefix = api_prefix)

app.include_router(ai_router, prefix=api_prefix)

app.include_router(workflow_router, prefix=api_prefix)
app.include_router(networks_router, prefix = api_prefix)
app.include_router(referrals_router, prefix = api_prefix)
app.include_router(network_events_router, prefix = api_prefix)
app.include_router(informational_interviews_router, prefix = api_prefix)
app.include_router(mentorship_router, prefix = api_prefix)
app.include_router(network_campaigns_router, prefix = api_prefix)
app.include_router(professional_references_router, prefix = api_prefix)
app.include_router(network_analytics_router, prefix = api_prefix)
app.include_router(api_metrics_router, prefix = f"{api_prefix}/metrics")


@app.on_event("startup")
async def startup_event():
    """Backend startup initialization"""
    print("[Startup] Backend ready!")
    # Start referral reminder scheduler
    try:
        start_referral_reminder_scheduler()
    except Exception as e:
        print(f"[Startup] Warning: Could not start referral reminder scheduler: {e}")
    # Start referral follow-up scheduler
    try:
        start_referral_followup_scheduler()
    except Exception as e:
        print(f"[Startup] Warning: Could not start referral follow-up scheduler: {e}")
    # Start event reminder scheduler
    try:
        start_event_reminder_scheduler()
    except Exception as e:
        print(f"[Startup] Warning: Could not start event reminder scheduler: {e}")
    # Start interview reminder scheduler
    try:
        start_interview_reminder_scheduler()
    except Exception as e:
        print(f"[Startup] Warning: Could not start interview reminder scheduler: {e}")
    # Start workflow automation scheduler
    try:
        start_workflow_scheduler()
    except Exception as e:
        print(f"[Startup] Warning: Could not start workflow automation scheduler: {e}")



@app.on_event("shutdown")
async def shutdown_event():
    """Backend shutdown cleanup"""
    print("[Shutdown] Cleaning up...")
    # Stop referral reminder scheduler
    try:
        stop_referral_reminder_scheduler()
    except Exception as e:
        print(f"[Shutdown] Warning: Could not stop referral reminder scheduler: {e}")
    # Stop referral follow-up scheduler
    try:
        stop_referral_followup_scheduler()
    except Exception as e:
        print(f"[Shutdown] Warning: Could not stop referral follow-up scheduler: {e}")
    # Stop event reminder scheduler
    try:
        stop_event_reminder_scheduler()
    except Exception as e:
        print(f"[Shutdown] Warning: Could not stop event reminder scheduler: {e}")
    # Stop interview reminder scheduler
    try:
        stop_interview_reminder_scheduler()
    except Exception as e:
        print(f"[Shutdown] Warning: Could not stop interview reminder scheduler: {e}")
    # Stop workflow automation scheduler
    try:
        stop_workflow_scheduler()
    except Exception as e:
        print(f"[Shutdown] Warning: Could not stop workflow automation scheduler: {e}")




# TODO: add user deletion services (deletes all data, requires password authentication)
# Where to put it though?

# TODO: resumes?
