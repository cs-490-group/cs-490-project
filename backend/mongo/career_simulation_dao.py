from bson.objectid import ObjectId
from pymongo import ASCENDING
from datetime import datetime
import uuid
from mongo.dao_setup import db_client, CAREER_SIMULATIONS
from schema.CareerSimulation import CareerSimulation, CareerSimulationRequest, CareerSimulationResponse

class CareerSimulationDAO:
    """Data Access Object for managing career path simulations"""

    def __init__(self):
        self.collection = db_client.get_collection(CAREER_SIMULATIONS)

    async def create_simulation(self, simulation_data: dict, user_uuid: str) -> str:
        """Create a new career simulation and return the simulation ID"""
        simulation_doc = {
            **simulation_data,
            "user_uuid": user_uuid,
            "simulation_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "pending"
        }

        result = await self.collection.insert_one(simulation_doc)
        return str(result.inserted_id)

    async def get_simulation(self, simulation_id: str) -> dict:
        """Get a specific career simulation by ID"""
        try:
            simulation = await self.collection.find_one({"_id": ObjectId(simulation_id)})
            if simulation:
                simulation["simulation_id"] = str(simulation.pop("_id"))
            return simulation
        except Exception:
            return None

    async def get_user_simulations(self, user_uuid: str) -> list:
        """Get all simulations for a user"""
        simulations = await self.collection.find({"user_uuid": user_uuid}).to_list(None)
        for simulation in simulations:
            simulation["simulation_id"] = str(simulation.pop("_id"))
        return simulations

    async def get_simulations_for_offer(self, offer_id: str) -> list:
        """Get all simulations for a specific offer"""
        simulations = await self.collection.find({"request.offer_id": offer_id}).to_list(None)
        for simulation in simulations:
            simulation["simulation_id"] = str(simulation.pop("_id"))
        return simulations

    async def update_simulation(self, simulation_id: str, update_data: dict) -> dict:
        """Update a simulation"""
        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(simulation_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            result["simulation_id"] = str(result.pop("_id"))
        return result

    async def update_simulation_status(self, simulation_id: str, status: str, error_message: str = None) -> dict:
        """Update simulation status"""
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if error_message:
            update_data["error_message"] = error_message

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(simulation_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            result["simulation_id"] = str(result.pop("_id"))
        return result

    async def save_simulation_response(self, simulation_id: str, response_data: dict, computation_time: float = None) -> dict:
        """Save the complete simulation response"""
        update_data = {
            "response": response_data,
            "status": "completed",
            "updated_at": datetime.utcnow().isoformat(),
        }

        if computation_time:
            update_data["computation_time_seconds"] = computation_time

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(simulation_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            result["simulation_id"] = str(result.pop("_id"))
        return result

    async def delete_simulation(self, simulation_id: str) -> bool:
        """Delete a simulation"""
        result = await self.collection.delete_one({"_id": ObjectId(simulation_id)})
        return result.deleted_count > 0

    async def create_indexes(self):
        """Create indexes for efficient querying"""
        await self.collection.create_index([("user_uuid", ASCENDING)])
        await self.collection.create_index([("request.offer_id", ASCENDING)])
        await self.collection.create_index([("status", ASCENDING)])
        await self.collection.create_index([("created_at", ASCENDING)])

    async def get_simulation_statistics(self, user_uuid: str) -> dict:
        """Get statistics about user's simulations"""
        pipeline = [
            {"$match": {"user_uuid": user_uuid}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "avg_computation_time": {"$avg": "$computation_time_seconds"}
                }
            }
        ]
        
        stats = await self.collection.aggregate(pipeline).to_list(None)
        
        total_simulations = await self.collection.count_documents({"user_uuid": user_uuid})
        
        return {
            "total_simulations": total_simulations,
            "status_breakdown": stats,
            "most_recent": await self.collection.find(
                {"user_uuid": user_uuid}
            ).sort("created_at", -1).limit(1).to_list(None)
        }

    async def get_simulations_by_timeframe(self, user_uuid: str, days: int = 30) -> list:
        """Get simulations within a specific timeframe"""
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        simulations = await self.collection.find({
            "user_uuid": user_uuid,
            "created_at": {"$gte": cutoff_date.isoformat()}
        }).sort("created_at", -1).to_list(None)
        
        return simulations

    async def get_offer_simulation_comparison(self, offer_ids: list) -> list:
        """Get simulations for multiple offers for comparison"""
        simulations = await self.collection.find({
            "request.offer_id": {"$in": offer_ids},
            "status": "completed"
        }).sort("created_at", -1).to_list(None)
        
        return simulations

    async def archive_old_simulations(self, user_uuid: str, keep_count: int = 10) -> int:
        """Archive old simulations, keeping only the most recent ones"""
        # Get all simulations sorted by creation date
        all_simulations = await self.collection.find({
            "user_uuid": user_uuid
        }).sort("created_at", -1).to_list(None)
        
        if len(all_simulations) <= keep_count:
            return 0  # Nothing to archive
        
        # Archive simulations beyond the keep_count
        to_archive = all_simulations[keep_count:]
        archived_ids = [sim["_id"] for sim in to_archive]
        
        if archived_ids:
            result = await self.collection.update_many(
                {"_id": {"$in": archived_ids}},
                {
                    "$set": {
                        "status": "archived",
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            return result.modified_count
        
        return 0


# Singleton instance for use throughout the application
career_simulation_dao = CareerSimulationDAO()
