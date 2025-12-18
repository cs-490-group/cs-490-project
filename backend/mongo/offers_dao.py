from bson.objectid import ObjectId
from pymongo import ASCENDING
from datetime import datetime
import uuid
from mongo.dao_setup import db_client, OFFERS

class OffersDAO:
    """Data Access Object for managing job offers and salary negotiation"""

    def __init__(self):
        self.offers_collection = db_client.get_collection(OFFERS)

    async def create_offer(self, offer_data: dict, user_uuid: str) -> str:
        """Create a new offer and return the offer ID"""
        offer_doc = {
            **offer_data,
            "uuid": str(uuid.uuid4()),
            "user_uuid": user_uuid,
            "date_created": datetime.utcnow().isoformat(),
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.insert_one(offer_doc)
        return str(result.inserted_id)

    async def get_offer(self, offer_id: str) -> dict:
        """Get a specific offer by ID"""
        try:
            offer = await self.offers_collection.find_one({"_id": ObjectId(offer_id)})
            return offer
        except Exception:
            return None

    async def get_user_offers(self, user_uuid: str) -> list:
        """Get all offers for a user"""
        offers = await self.offers_collection.find({"user_uuid": user_uuid}).to_list(None)
        return offers

    async def get_offers_for_job(self, job_id: str) -> list:
        """Get all offers for a specific job"""
        offers = await self.offers_collection.find({"job_id": job_id}).to_list(None)
        return offers

    async def update_offer(self, offer_id: str, update_data: dict) -> dict:
        """Update an offer"""
        update_data["date_updated"] = datetime.utcnow().isoformat()

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_offer_status(self, offer_id: str, status: str) -> dict:
        """Update offer status and timestamp"""
        update_data = {
            "offer_status": status,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def add_negotiation_history(self, offer_id: str, history_entry: dict) -> dict:
        """Add a negotiation history entry"""
        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {
                "$push": {"negotiation_history": history_entry},
                "$set": {"date_updated": datetime.utcnow().isoformat()}
            },
            return_document=True
        )
        return result

    async def update_negotiation_outcome(self, offer_id: str, outcome_data: dict) -> dict:
        """Update the negotiation outcome"""
        update_data = {
            "negotiation_outcome": outcome_data,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def set_negotiation_prep(self, offer_id: str, prep_data: dict) -> dict:
        """Set the generated negotiation preparation materials"""
        update_data = {
            "negotiation_prep": prep_data,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def delete_offer(self, offer_id: str) -> bool:
        """Delete an offer"""
        result = await self.offers_collection.delete_one({"_id": ObjectId(offer_id)})
        return result.deleted_count > 0

    async def create_indexes(self):
        """Create indexes for efficient querying"""
        await self.offers_collection.create_index([("user_uuid", ASCENDING)])
        await self.offers_collection.create_index([("job_id", ASCENDING)])
        await self.offers_collection.create_index([("offer_status", ASCENDING)])
        await self.offers_collection.create_index([("date_created", ASCENDING)])

    # ============================================
    # UC-127: Offer Evaluation & Comparison
    # ============================================

    async def update_compensation_calculation(self, offer_id: str, total_comp: dict) -> dict:
        """Update total compensation calculation for an offer"""
        update_data = {
            "offered_salary_details.total_compensation": total_comp,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_equity_details(self, offer_id: str, equity_details: dict) -> dict:
        """Update equity valuation details"""
        update_data = {
            "offered_salary_details.equity_details": equity_details,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_benefits_valuation(self, offer_id: str, benefits_val: dict) -> dict:
        """Update benefits monetary valuation"""
        update_data = {
            "offered_salary_details.benefits_valuation": benefits_val,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_cost_of_living(self, offer_id: str, col_data: dict) -> dict:
        """Update cost of living adjustment data"""
        update_data = {
            "offered_salary_details.cost_of_living": col_data,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_non_financial_factors(self, offer_id: str, factors: dict) -> dict:
        """Update non-financial scoring factors"""
        update_data = {
            "non_financial_factors": factors,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_offer_score(self, offer_id: str, score: dict) -> dict:
        """Update comprehensive offer scoring"""
        update_data = {
            "offer_score": score,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def update_comparison_weights(self, offer_id: str, weights: dict) -> dict:
        """Update user-defined comparison weights"""
        update_data = {
            "comparison_weights": weights,
            "date_updated": datetime.utcnow().isoformat(),
        }

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def archive_offer(self, offer_id: str, decline_reason: str = None) -> dict:
        """Archive a declined offer"""
        update_data = {
            "archived": True,
            "archived_date": datetime.utcnow().isoformat(),
            "offer_status": "archived",
            "date_updated": datetime.utcnow().isoformat(),
        }

        if decline_reason:
            update_data["decline_reason"] = decline_reason

        result = await self.offers_collection.find_one_and_update(
            {"_id": ObjectId(offer_id)},
            {"$set": update_data},
            return_document=True
        )
        return result

    async def get_active_offers(self, user_uuid: str) -> list:
        """Get all non-archived offers for a user"""
        offers = await self.offers_collection.find({
            "user_uuid": user_uuid,
            "$or": [
                {"archived": {"$exists": False}},
                {"archived": False}
            ]
        }).to_list(None)
        return offers

    async def get_archived_offers(self, user_uuid: str) -> list:
        """Get all archived offers for a user"""
        offers = await self.offers_collection.find({
            "user_uuid": user_uuid,
            "archived": True
        }).to_list(None)
        return offers

    async def get_offers_for_comparison(self, offer_ids: list) -> list:
        """Get multiple offers for side-by-side comparison"""
        object_ids = [ObjectId(oid) for oid in offer_ids if ObjectId.is_valid(oid)]
        offers = await self.offers_collection.find({
            "_id": {"$in": object_ids}
        }).to_list(None)
        return offers


# Singleton instance for use throughout the application
offers_dao = OffersDAO()
