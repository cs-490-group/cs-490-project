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

        # Calculate A/B test statistics
        ab_tests = self._calculate_ab_test_statistics(resume_comparison, cover_letter_comparison)

        # Generate recommendations based on performance
        recommendations = self._generate_optimization_recommendations(resume_comparison, cover_letter_comparison)

        return {
            "resumes": resume_comparison,
            "cover_letters": cover_letter_comparison,
            "ab_tests": ab_tests,
            "recommendations": recommendations,
            "summary": {
                "total_resume_versions": len(resume_comparison),
                "total_cover_letter_versions": len(cover_letter_comparison),
                "note": "Meaningful comparisons require 10+ applications per version"
            }
        }

    def _calculate_ab_test_statistics(self, resumes: List[Dict], cover_letters: List[Dict]) -> Dict:
        """
        Calculate A/B test statistics for material versions
        Returns statistical significance tests comparing versions
        """
        import math

        ab_tests = {
            "resume_tests": [],
            "cover_letter_tests": []
        }

        # Resume version A/B tests
        if len(resumes) >= 2:
            sorted_resumes = sorted(resumes, key=lambda x: x["applications_count"], reverse=True)

            for i in range(min(3, len(sorted_resumes))):
                for j in range(i + 1, min(3, len(sorted_resumes))):
                    variant_a = sorted_resumes[i]
                    variant_b = sorted_resumes[j]

                    if variant_a["applications_count"] >= 5 and variant_b["applications_count"] >= 5:
                        p_a = variant_a["response_rate"] / 100.0
                        p_b = variant_b["response_rate"] / 100.0
                        n_a = variant_a["applications_count"]
                        n_b = variant_b["applications_count"]

                        p_pool = (p_a * n_a + p_b * n_b) / (n_a + n_b)
                        se = math.sqrt(p_pool * (1 - p_pool) * (1/n_a + 1/n_b)) if p_pool > 0 and p_pool < 1 else 0
                        z_score = (p_a - p_b) / se if se > 0 else 0
                        is_significant = abs(z_score) > 1.96
                        confidence = "high" if abs(z_score) > 2.58 else "medium" if abs(z_score) > 1.96 else "low"

                        ab_tests["resume_tests"].append({
                            "variant_a": variant_a["version_name"],
                            "variant_b": variant_b["version_name"],
                            "variant_a_rate": variant_a["response_rate"],
                            "variant_b_rate": variant_b["response_rate"],
                            "difference": round(variant_a["response_rate"] - variant_b["response_rate"], 1),
                            "is_significant": is_significant,
                            "confidence": confidence,
                            "z_score": round(z_score, 2),
                            "winner": variant_a["version_name"] if p_a > p_b else variant_b["version_name"],
                            "sample_sizes": {"variant_a": n_a, "variant_b": n_b}
                        })

        # Cover letter A/B tests
        if len(cover_letters) >= 2:
            sorted_letters = sorted(cover_letters, key=lambda x: x["applications_count"], reverse=True)

            for i in range(min(3, len(sorted_letters))):
                for j in range(i + 1, min(3, len(sorted_letters))):
                    variant_a = sorted_letters[i]
                    variant_b = sorted_letters[j]

                    if variant_a["applications_count"] >= 5 and variant_b["applications_count"] >= 5:
                        p_a = variant_a["response_rate"] / 100.0
                        p_b = variant_b["response_rate"] / 100.0
                        n_a = variant_a["applications_count"]
                        n_b = variant_b["applications_count"]

                        p_pool = (p_a * n_a + p_b * n_b) / (n_a + n_b)
                        se = math.sqrt(p_pool * (1 - p_pool) * (1/n_a + 1/n_b)) if p_pool > 0 and p_pool < 1 else 0
                        z_score = (p_a - p_b) / se if se > 0 else 0
                        is_significant = abs(z_score) > 1.96
                        confidence = "high" if abs(z_score) > 2.58 else "medium" if abs(z_score) > 1.96 else "low"

                        ab_tests["cover_letter_tests"].append({
                            "variant_a": variant_a["letter_name"],
                            "variant_b": variant_b["letter_name"],
                            "variant_a_rate": variant_a["response_rate"],
                            "variant_b_rate": variant_b["response_rate"],
                            "difference": round(variant_a["response_rate"] - variant_b["response_rate"], 1),
                            "is_significant": is_significant,
                            "confidence": confidence,
                            "z_score": round(z_score, 2),
                            "winner": variant_a["letter_name"] if p_a > p_b else variant_b["letter_name"],
                            "sample_sizes": {"variant_a": n_a, "variant_b": n_b}
                        })

        return ab_tests

    def _generate_optimization_recommendations(self, resumes: List[Dict], cover_letters: List[Dict]) -> List[Dict]:
        """Generate actionable recommendations based on material performance"""
        recommendations = []

        if resumes:
            best_resume = max(resumes, key=lambda x: (x["response_rate"], x["applications_count"]))
            if best_resume["applications_count"] >= 10 and best_resume["response_rate"] >= 20:
                recommendations.append({
                    "priority": "high",
                    "category": "resume",
                    "title": f"Use '{best_resume['version_name']}' resume version",
                    "description": f"This version has a {best_resume['response_rate']}% response rate across {best_resume['applications_count']} applications.",
                    "action": f"Continue using this resume version for new applications",
                    "impact": "high",
                    "confidence": "high" if best_resume["applications_count"] >= 20 else "medium"
                })

        if cover_letters:
            best_letter = max(cover_letters, key=lambda x: (x["response_rate"], x["applications_count"]))
            if best_letter["applications_count"] >= 10 and best_letter["response_rate"] >= 20:
                recommendations.append({
                    "priority": "high",
                    "category": "cover_letter",
                    "title": f"Use '{best_letter['letter_name']}' cover letter",
                    "description": f"This cover letter has a {best_letter['response_rate']}% response rate.",
                    "action": f"Use this as your primary cover letter template",
                    "impact": "high",
                    "confidence": "high" if best_letter["applications_count"] >= 20 else "medium"
                })

        total_applications = sum(r["applications_count"] for r in resumes)
        if total_applications < 20:
            recommendations.append({
                "priority": "low",
                "category": "data",
                "title": "Increase sample size for better insights",
                "description": f"You have {total_applications} total applications tracked.",
                "action": "Continue applying and tracking your applications",
                "impact": "low",
                "confidence": "high"
            })

        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))
        return recommendations

    async def get_success_trends(self, user_uuid: str, weeks: int = 12) -> Dict:
        """
        Get success rate trends over time

        Returns weekly aggregated success metrics
        """
        from datetime import datetime, timedelta, timezone

        # Get all jobs
        jobs = await self.jobs_dao.get_all_jobs(user_uuid)
        if not jobs:
            jobs = []

        # Calculate start date
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(weeks=weeks)

        # Group jobs by week
        weekly_data = {}

        for job in jobs:
            if not job:
                continue

            # Get job creation date
            date_applied = job.get("date_applied") or job.get("date_created")
            if not date_applied:
                continue

            try:
                if isinstance(date_applied, str):
                    job_date = datetime.fromisoformat(date_applied.replace('Z', '+00:00'))
                else:
                    job_date = date_applied

                if job_date < start_date:
                    continue

                # Calculate week number
                week_diff = (job_date - start_date).days // 7
                week_key = f"Week {week_diff + 1}"

                if week_key not in weekly_data:
                    weekly_data[week_key] = {
                        "week": week_key,
                        "applications": 0,
                        "responses": 0,
                        "interviews": 0,
                        "offers": 0,
                        "response_rate": 0,
                        "interview_rate": 0,
                        "offer_rate": 0
                    }

                weekly_data[week_key]["applications"] += 1

                status = (job.get("status") or "").lower()

                # Count responses
                if status not in ["applied", "saved", "watching"]:
                    weekly_data[week_key]["responses"] += 1

                # Count interviews
                if "interview" in status or status in ["phone_screen", "technical", "onsite"]:
                    weekly_data[week_key]["interviews"] += 1

                # Count offers
                if status == "offer" or len(job.get("offers") or []) > 0:
                    weekly_data[week_key]["offers"] += 1

            except Exception as e:
                continue

        # Calculate rates for each week
        for week_data in weekly_data.values():
            if week_data["applications"] > 0:
                week_data["response_rate"] = round((week_data["responses"] / week_data["applications"]) * 100, 1)
                week_data["interview_rate"] = round((week_data["interviews"] / week_data["applications"]) * 100, 1)
                week_data["offer_rate"] = round((week_data["offers"] / week_data["applications"]) * 100, 1)

        # Sort by week
        trends = sorted(weekly_data.values(), key=lambda x: x["week"])

        # Calculate overall trend direction
        if len(trends) >= 2:
            first_half_avg = sum(t["response_rate"] for t in trends[:len(trends)//2]) / (len(trends)//2) if len(trends) >= 2 else 0
            second_half_avg = sum(t["response_rate"] for t in trends[len(trends)//2:]) / (len(trends) - len(trends)//2) if len(trends) >= 2 else 0
            trend_direction = "improving" if second_half_avg > first_half_avg else "declining" if second_half_avg < first_half_avg else "stable"
        else:
            trend_direction = "insufficient_data"

        return {
            "trends": trends,
            "trend_direction": trend_direction,
            "weeks_analyzed": weeks,
            "total_applications": sum(t["applications"] for t in trends)
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
