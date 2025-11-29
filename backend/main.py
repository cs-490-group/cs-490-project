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

app = FastAPI()

api_prefix = "/api"

origins = [ # domains to provide access to
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,
    allow_methods=["*"],         
    allow_headers=["*"],         
)

# @app.middleware("http")
# async def add_global_headers(request: Request, call_next):
#     response: Response = await call_next(request)
#     # Add headers to every response
#     response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
#     response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
#     return response

app.include_router(auth_router, prefix = api_prefix)
app.include_router(profiles_router, prefix = api_prefix)
app.include_router(groups_router, prefix = api_prefix)
app.include_router(teams_router,prefix=api_prefix)
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

@app.on_event("startup")
async def startup_event():
    """Backend startup initialization"""
    print("[Startup] Backend ready!")
app.include_router(ai_router,prefix=api_prefix)

# TODO: add user deletion services (deletes all data, requires password authentication)
# Where to put it though?

# TODO: resumes?