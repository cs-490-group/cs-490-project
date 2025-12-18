import os, certifi
from pathlib import Path

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

# Load .env from the same directory as this file (mongo/)
env_path = Path(__file__).parent.parent / ".env"
print(env_path)
load_dotenv(env_path)

MONGO_CONNECTION_STRING = os.getenv("MONGO_CONNECTION_STRING")
DATABASE_NAME = os.getenv("MONGO_APPLICATION_DATABASE")
AUTH = os.getenv("AUTH_COLLECTION")
PROFILES = os.getenv("PROFILES_COLLECTION")
GROUPS = os.getenv("GROUPS_COLLECTION")
TEAMS = os.getenv("TEAMS_COLLECTION")
SKILLS = os.getenv("SKILLS_COLLECTION")
EMPLOYMENT = os.getenv("EMPLOYMENT_COLLECTION")
EDUCATION = os.getenv("EDUCATION_COLLECTION")
CERTIFICATION = os.getenv("CERTIFICATION_COLLECTION")
PROJECTS = os.getenv("PROJECTS_COLLECTION")
JOBS = os.getenv("JOBS_COLLECTION")
GOALS = os.getenv("GOALS_COLLECTION")
SALARY = os.getenv("SALARY_COLLECTION")
TIME = os.getenv("TIME_COLLECTION")
MARKET_DATA = os.getenv("MARKET_DATA_COLLECTION")
COVER_LETTERS = os.getenv("COVER_LETTERS_COLLECTION")
RESUMES = os.getenv("RESUMES_COLLECTION")
RESUME_TEMPLATES = os.getenv("RESUME_TEMPLATES_COLLECTION")
NETWORKS = os.getenv("NETWORKS_COLLECTION")
REFERRALS = os.getenv("REFERRALS_COLLECTION")
NETWORK_EVENTS = os.getenv("NETWORK_EVENTS_COLLECTION")
INFORMATIONAL_INTERVIEWS = os.getenv("INFORMATIONAL_INTERVIEWS_COLLECTION")
MENTORSHIP_RELATIONSHIPS = os.getenv("MENTORSHIP_RELATIONSHIPS_COLLECTION")
NETWORK_CAMPAIGNS = os.getenv("NETWORK_CAMPAIGNS_COLLECTION")
PROFESSIONAL_REFERENCES = os.getenv("PROFESSIONAL_REFERENCES_COLLECTION")
NETWORK_ANALYTICS = os.getenv("NETWORK_ANALYTICS_COLLECTION")
ORGANIZATIONS = os.getenv("ORGANIZATIONS_COLLECTION")

RESET_LINKS = os.getenv("RESET_LINKS_COLLECTION")
GOOGLE_OAUTH = os.getenv("GOOGLE_OAUTH_CREDENTIALS")
COHERE_API = os.getenv("COHERE_API_KEY")
JOB_REQUIREMENTS = os.getenv("JOB_REQUIREMENTS_COLLECTION", "job_requirements")
MATCH_HISTORY = os.getenv("MATCH_HISTORY_COLLECTION", "match_history")
OFFERS = "offers"  # UC-083: Salary negotiation collection
TECHNICAL_CHALLENGES = os.getenv("TECHNICAL_CHALLENGES_COLLECTION", "technical_challenges")  # UC-078: Technical Interview Prep
CHALLENGE_ATTEMPTS = os.getenv("CHALLENGE_ATTEMPTS_COLLECTION", "challenge_attempts")  # UC-078: Challenge performance tracking

# UC-117: API Rate Limiting and Error Handling Dashboard collections
API_CALL_LOGS = "api_call_logs"
API_USAGE_QUOTAS = "api_usage_quotas"
API_FALLBACK_EVENTS = "api_fallback_events"

mongo_client = AsyncMongoClient(
    MONGO_CONNECTION_STRING,
    tls=True,
    tlsCAFile=certifi.where(),
    maxPoolSize=10,
    minPoolSize=2,
    serverSelectionTimeoutMS=5000
)
db_client = mongo_client.get_database(DATABASE_NAME)
