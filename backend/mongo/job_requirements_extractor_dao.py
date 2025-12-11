# backend/mongo/job_requirements_extractor_dao.py

"""
DAO for storing and retrieving automatically extracted job requirements.

The extraction includes:
- requiredSkills: [{ name, level, weight }]
- minYearsExperience
- educationLevel
- extractedAt: timestamp
"""

from datetime import datetime
from bson import ObjectId
from mongo.dao_setup import db_client

COLLECTION_NAME = "job_requirements"   # You can rename in .env if needed
requirements_collection = db_client.get_collection(COLLECTION_NAME)


class JobRequirementsExtractorDAO:

    # ---------------------------------------------------------
    # Save or update extracted requirements for a job
    # ---------------------------------------------------------
    async def save_extraction(self, job_id: str | ObjectId, extracted: dict) -> None:
        if isinstance(job_id, str):
            job_id = ObjectId(job_id)

        extracted_record = {
            "jobId": job_id,
            "requiredSkills": extracted.get("requiredSkills", []),
            "minYearsExperience": extracted.get("minYearsExperience"),
            "educationLevel": extracted.get("educationLevel"),
            "extractedAt": datetime.utcnow()
        }

        # UPSERT — update if exists, otherwise insert new document
        await requirements_collection.update_one(
            {"jobId": job_id},
            {"$set": extracted_record},
            upsert=True
        )

    # ---------------------------------------------------------
    # Get extracted requirements for a job
    # ---------------------------------------------------------
    async def get_extraction(self, job_id: str | ObjectId) -> dict | None:
        if isinstance(job_id, str):
            job_id = ObjectId(job_id)

        record = await requirements_collection.find_one({"jobId": job_id})
        if not record:
            return None

        # Convert ObjectId for frontend safety
        record["jobId"] = str(record["jobId"])
        record["_id"] = str(record["_id"])

        return record

    # ---------------------------------------------------------
    # Delete requirements when job is deleted
    # ---------------------------------------------------------
    async def delete_extraction(self, job_id: str | ObjectId) -> int:
        if isinstance(job_id, str):
            job_id = ObjectId(job_id)

        result = await requirements_collection.delete_one({"jobId": job_id})
        return result.deleted_count


# Export singleton instance
job_requirements_extractor_dao = JobRequirementsExtractorDAO()

