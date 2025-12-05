class SalaryService:

    async def research(self, job_title: str, location: str | None = None):

        return {
            "low": 85000,
            "high": 140000,
            "median": 112000,
            "companyFactor": "Medium-sized companies pay 5–10% more",
            "experienceFactor": "Senior roles earn +20–30% more",

            "history": {
                "years": ["2019", "2020", "2021", "2022", "2023"],
                "values": [90000, 95000, 100000, 105000, 112000]
            },

            "recommendations": [
                f"Based on {job_title} roles in {location or 'the region'}, aim for 10% above median.",
                "Mention specialized skills to get better comp.",
                "Consider negotiation if you have competing offers."
            ]
        }

salary_service = SalaryService()

