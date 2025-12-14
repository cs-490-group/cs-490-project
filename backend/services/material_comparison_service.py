"""
UC-120: Application Material Comparison Dashboard Service

Provides analytics comparing performance of different resume and cover letter versions
"""

from typing import Dict, List, Optional
from datetime import datetime, timezone
from mongo.resumes_dao import resumes_dao
from mongo.cover_letters_dao import cover_letters_dao
from mongo.jobs_dao import jobs_dao


class MaterialComparisonService:
    """Service for comparing performance of different application material versions"""

    def __init__(self):
        self.resumes_dao = resumes_dao
        self.cover_letters_dao = cover_letters_dao
        self.jobs_dao = jobs_dao

    async def get_resume_version_comparison(self, user_uuid: str) -> List[Dict]:
        """
        Compare performance of different resume versions

        Returns list of resume versions with metrics:
        - applications_count
        - response_rate
        - interview_rate
        - offer_rate
        - avg_response_time_days
        """
        # Get all resumes for user
        resumes = await self.resumes_dao.get_all_resumes(user_uuid)
        if resumes is None:
            resumes = []

        # Get all jobs for user
        jobs = await self.jobs_dao.get_all_jobs(user_uuid)
        if jobs is None:
            jobs = []

        comparison_data = []

        for resume in resumes:
            resume_id = str(resume.get("_id"))
            resume_name = resume.get("name") or resume.get("title") or "Unnamed Resume"

            # Get all versions for this resume
            versions = await self.resumes_dao.get_resume_versions(resume_id)
            if versions is None:
                versions = []

            # Also include the main resume as "Current Version"
            all_versions = [
                {
                    "version_id": resume_id,
                    "version_name": "Current Version",
                    "is_current": True,
                    "resume_id": resume_id,
                    "resume_name": resume_name
                }
            ]

            # Add named versions
            for version in versions:
                all_versions.append({
                    "version_id": str(version.get("_id")),
                    "version_name": version.get("name", "Unnamed Version"),
                    "is_current": False,
                    "resume_id": resume_id,
                    "resume_name": resume_name,
                    "job_linked": version.get("job_linked"),
                    "date_created": version.get("date_created")
                })

            # Calculate metrics for each version
            for version_info in all_versions:
                version_id = version_info["version_id"]

                # Find jobs that used this resume version
                jobs_with_resume = [
                    job for job in jobs
                    if job and job.get("materials") and job.get("materials", {}).get("resume_id") == version_id
                ]

                metrics = self._calculate_version_metrics(jobs_with_resume)

                comparison_data.append({
                    **version_info,
                    **metrics
                })

        # Sort by applications count (most used first)
        comparison_data.sort(key=lambda x: x["applications_count"], reverse=True)

        return comparison_data

    async def get_cover_letter_version_comparison(self, user_uuid: str) -> List[Dict]:
        """
        Compare performance of different cover letter versions

        Returns list of cover letters with metrics
        """
        # Get all cover letters for user
        cover_letters = await self.cover_letters_dao.get_all_cover_letters(user_uuid)
        if cover_letters is None:
            cover_letters = []

        # Get all jobs for user
        jobs = await self.jobs_dao.get_all_jobs(user_uuid)
        if jobs is None:
            jobs = []

        comparison_data = []

        for letter in cover_letters:
            letter_id = str(letter.get("_id"))
            letter_name = letter.get("title") or letter.get("name") or "Unnamed Cover Letter"

            # Find jobs that used this cover letter
            jobs_with_letter = [
                job for job in jobs
                if job and job.get("materials") and job.get("materials", {}).get("cover_letter_id") == letter_id
            ]

            metrics = self._calculate_version_metrics(jobs_with_letter)

            comparison_data.append({
                "letter_id": letter_id,
                "letter_name": letter_name,
                "template_type": letter.get("template_type", "Unknown"),
                "usage_count": letter.get("usage_count", 0),
                "is_default": letter.get("default_cover_letter", False),
                "date_created": letter.get("date_created"),
                **metrics
            })

        # Sort by applications count
        comparison_data.sort(key=lambda x: x["applications_count"], reverse=True)

        return comparison_data

    def _calculate_version_metrics(self, jobs: List[Dict]) -> Dict:
        """
        Calculate performance metrics for a list of jobs using a specific material version

        Returns:
        - applications_count: Total applications
        - responses_count: Jobs with any response
        - interviews_count: Jobs that reached interview stage
        - offers_count: Jobs that resulted in offers
        - rejections_count: Explicit rejections
        - no_response_count: No response received
        - response_rate: % that got a response
        - interview_rate: % that reached interview
        - offer_rate: % that resulted in offers
        - avg_response_time_days: Average days to first response
        """
        applications_count = len(jobs)

        if applications_count == 0:
            return {
                "applications_count": 0,
                "responses_count": 0,
                "interviews_count": 0,
                "offers_count": 0,
                "rejections_count": 0,
                "no_response_count": 0,
                "response_rate": 0,
                "interview_rate": 0,
                "offer_rate": 0,
                "avg_response_time_days": None
            }

        responses_count = 0
        interviews_count = 0
        offers_count = 0
        rejections_count = 0
        no_response_count = 0
        response_times = []

        for job in jobs:
            if not job:
                continue

            status = (job.get("status") or "").lower()

            # Count responses (anything beyond "applied")
            if status not in ["applied", "saved", "watching"]:
                responses_count += 1
            else:
                no_response_count += 1

            # Count interviews
            if "interview" in status or status in ["phone_screen", "technical", "onsite"]:
                interviews_count += 1

            # Count offers
            if status == "offer" or len(job.get("offers") or []) > 0:
                offers_count += 1

            # Count rejections
            if status == "rejected":
                rejections_count += 1

            # Calculate response time
            response_tracking = job.get("response_tracking") or {}
            if response_tracking:
                submitted_at = response_tracking.get("submitted_at")
                responded_at = response_tracking.get("responded_at")

                if submitted_at and responded_at:
                    try:
                        submit_dt = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
                        respond_dt = datetime.fromisoformat(responded_at.replace('Z', '+00:00'))
                        days_diff = (respond_dt - submit_dt).days
                        if days_diff >= 0:
                            response_times.append(days_diff)
                    except:
                        pass

        # Calculate rates
        response_rate = round((responses_count / applications_count) * 100, 1) if applications_count > 0 else 0
        interview_rate = round((interviews_count / applications_count) * 100, 1) if applications_count > 0 else 0
        offer_rate = round((offers_count / applications_count) * 100, 1) if applications_count > 0 else 0

        # Calculate average response time
        avg_response_time = round(sum(response_times) / len(response_times), 1) if response_times else None

        return {
            "applications_count": applications_count,
            "responses_count": responses_count,
            "interviews_count": interviews_count,
            "offers_count": offers_count,
            "rejections_count": rejections_count,
            "no_response_count": no_response_count,
            "response_rate": response_rate,
            "interview_rate": interview_rate,
            "offer_rate": offer_rate,
            "avg_response_time_days": avg_response_time
        }

    async def get_combined_comparison(self, user_uuid: str) -> Dict:
        """
        Get both resume and cover letter comparisons in one call
        """
        resume_comparison = await self.get_resume_version_comparison(user_uuid)
        cover_letter_comparison = await self.get_cover_letter_version_comparison(user_uuid)

        return {
            "resumes": resume_comparison,
            "cover_letters": cover_letter_comparison,
            "summary": {
                "total_resume_versions": len(resume_comparison),
                "total_cover_letter_versions": len(cover_letter_comparison),
                "note": "Meaningful comparisons require 10+ applications per version"
            }
        }

    async def archive_resume_version(self, resume_id: str, version_id: str) -> bool:
        """
        Archive a resume version (soft delete by marking as archived)
        """
        # Get the version
        versions = await self.resumes_dao.get_resume_versions(resume_id)
        version = next((v for v in versions if str(v.get("_id")) == version_id), None)

        if not version:
            return False

        # Update version to mark as archived
        # Note: This would require adding an 'archived' field to the schema
        # For now, we can add it to the description
        current_desc = version.get("description", "")
        new_desc = f"[ARCHIVED] {current_desc}" if not current_desc.startswith("[ARCHIVED]") else current_desc

        await self.resumes_dao.rename_resume_version(
            resume_id,
            version_id,
            version.get("name"),
            new_desc,
            version.get("job_linked")
        )

        return True

    async def archive_cover_letter(self, letter_id: str, user_uuid: str) -> bool:
        """
        Archive a cover letter (mark as archived)
        """
        # Similar approach - would ideally add an 'archived' field to schema
        # For now, we could update the title to include [ARCHIVED]
        letter = await self.cover_letters_dao.get_cover_letter(letter_id, user_uuid)

        if not letter:
            return False

        current_title = letter.get("title", "")
        new_title = f"[ARCHIVED] {current_title}" if not current_title.startswith("[ARCHIVED]") else current_title

        await self.cover_letters_dao.update_cover_letter(letter_id, user_uuid, {"title": new_title})

        return True


# Singleton instance
material_comparison_service = MaterialComparisonService()
