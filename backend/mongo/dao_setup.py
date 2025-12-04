import os, certifi
from pathlib import Path

from dotenv import load_dotenv
from pymongo import AsyncMongoClient

# Load .env from the same directory as this file (mongo/)
env_path = Path(__file__).parent / ".env"
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
MARKET_DATA = os.getenv("MARKET_DATA_COLLECTION")
COVER_LETTERS = os.getenv("COVER_LETTERS_COLLECTION")
RESUMES = os.getenv("RESUMES_COLLECTION")
RESUME_TEMPLATES = os.getenv("RESUME_TEMPLATES_COLLECTION")
RESET_LINKS = os.getenv("RESET_LINKS_COLLECTION")
GOOGLE_OAUTH = os.getenv("GOOGLE_OAUTH_CREDENTIALS")
COHERE_API = os.getenv("COHERE_API_KEY")


mongo_client = AsyncMongoClient(MONGO_CONNECTION_STRING, tls = True, tlsCAFile=certifi.where())
db_client = mongo_client.get_database(DATABASE_NAME)
