# salary_dao.py
from mongo.dao_setup import db_client, SALARY, MARKET_DATA
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional


class SalaryDAO:
    def __init__(self):
        self.collection = db_client.get_collection(SALARY)
        self.market_collection = db_client.get_collection(MARKET_DATA)

    async def add_salary_record(self, data: dict) -> str:
        """Add a new salary record"""
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_salary_records(self, uuid: str) -> list[dict]:
        """Get all salary records for a user, sorted by year"""
        cursor = self.collection.find({"uuid": uuid}).sort("year", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_salary_record(self, salary_id: str) -> Optional[dict]:
        """Get a specific salary record by ID"""
        record = await self.collection.find_one({"_id": ObjectId(salary_id)})
        if record:
            record["_id"] = str(record["_id"])
        return record

    async def update_salary_record(self, salary_id: str, data: dict) -> int:
        """Update a salary record"""
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one(
            {"_id": ObjectId(salary_id)}, 
            {"$set": data}
        )
        return updated.matched_count

    async def delete_salary_record(self, salary_id: str) -> int:
        """Delete a salary record"""
        result = await self.collection.delete_one({"_id": ObjectId(salary_id)})
        return result.deleted_count

    async def get_salary_history(self, uuid: str) -> list[dict]:
        """Get salary history formatted for analytics"""
        records = await self.get_all_salary_records(uuid)
        
        history = []
        for record in records:
            # Get market data for comparison
            market_avg = await self.get_market_average(
                record.get("year"),
                record.get("job_role"),
                record.get("location")
            )
            
            history.append({
                "year": str(record.get("year")),
                "salary": record.get("salary_amount"),
                "market": market_avg
            })
        
        return history

    async def calculate_stats(self, uuid: str) -> dict:
        """Calculate salary statistics for a user"""
        records = await self.get_all_salary_records(uuid)
        
        if not records:
            return {
                "currentSalary": 0,
                "marketAverage": 0,
                "percentileRank": 0,
                "totalGrowth": 0,
                "yearOverYearGrowth": 0
            }
        
        # Sort by year
        records.sort(key=lambda x: x.get("year", 0))
        
        current_record = records[-1]
        current_salary = current_record.get("salary_amount", 0)
        
        # Get market average for current position
        market_avg = await self.get_market_average(
            current_record.get("year"),
            current_record.get("job_role"),
            current_record.get("location")
        )
        
        # Calculate total growth
        if len(records) > 1:
            initial_salary = records[0].get("salary_amount", 0)
            if initial_salary > 0:
                total_growth = ((current_salary - initial_salary) / initial_salary) * 100
            else:
                total_growth = 0
            
            # Calculate YoY growth
            previous_salary = records[-2].get("salary_amount", 0)
            if previous_salary > 0:
                yoy_growth = ((current_salary - previous_salary) / previous_salary) * 100
            else:
                yoy_growth = 0
        else:
            total_growth = 0
            yoy_growth = 0
        
        # Calculate percentile rank (simplified - compare to market average)
        if market_avg > 0:
            percentile = min(99, max(1, int((current_salary / market_avg) * 65)))
        else:
            percentile = 50
        
        return {
            "currentSalary": current_salary,
            "marketAverage": market_avg,
            "percentileRank": percentile,
            "totalGrowth": round(total_growth, 1),
            "yearOverYearGrowth": round(yoy_growth, 1)
        }

    async def get_market_average(self, year: int, job_role: str = None, location: str = None) -> float:
        """Get market average salary for given parameters"""
        query = {"year": year}
        if job_role:
            query["job_role"] = job_role
        if location:
            query["location"] = location
        
        market_data = await self.market_collection.find_one(query)
        
        if market_data:
            return market_data.get("market_average", 0)
        else:
            # Return a default based on year if no specific data
            # This is a fallback - in production, you'd want comprehensive market data
            base_salary = 70000
            year_adjustment = (year - 2020) * 3000  # $3k increase per year
            return base_salary + year_adjustment

    async def get_market_position(self, uuid: str) -> str:
        """Determine user's market position"""
        stats = await self.calculate_stats(uuid)
        
        current = stats["currentSalary"]
        market = stats["marketAverage"]
        
        if market == 0:
            return "Unknown"
        
        ratio = current / market
        
        if ratio >= 1.1:
            return "Above Market Average"
        elif ratio >= 0.9:
            return "At Market Average"
        else:
            return "Below Market Average"

    # Market data management (for admin/system use)
    async def add_market_data(self, data: dict) -> str:
        """Add market benchmark data"""
        result = await self.market_collection.insert_one(data)
        return str(result.inserted_id)

    async def get_market_data(self, filters: dict) -> list[dict]:
        """Get market data with filters"""
        cursor = self.market_collection.find(filters)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

salary_dao = SalaryDAO()