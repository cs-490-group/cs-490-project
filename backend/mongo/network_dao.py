from mongo.dao_setup import db_client, NETWORKS
from mongo.education_dao import education_dao
from bson import ObjectId
from datetime import datetime, timezone

class NetworkDAO:
    def __init__(self):
        self.collection = db_client.get_collection(NETWORKS)
    
    async def add_contact(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_contacts(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_contact(self, contact_id: str) -> dict | None:
        result =  await self.collection.find_one({"_id": ObjectId(contact_id)})
        result["_id"] = str(result["_id"])
        return result

    async def update_contact(self, contact_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(contact_id)}, {"$set": data})
        return updated.matched_count

    async def delete_contact(self, contact_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(contact_id)})
        return result.deleted_count
    
    async def get_all_discovery_contacts(self, current_user_uuid: str) -> list[dict]:
        # Get current user's contacts for 1st degree connections
        user_contacts_cursor = self.collection.find({"uuid": current_user_uuid})
        user_contacts = []
        async for doc in user_contacts_cursor:
            user_contacts.append(doc)
        
        # Get current user's email to exclude self
        # This would require access to user data - for now, we'll use a simplified approach
        # by excluding contacts that match any of the user's own contact emails
        
        # Extract email domains from user's contacts (1st degree)
        first_degree_domains = set()
        user_contact_emails = set()  # Track user's own contact emails to exclude
        for contact in user_contacts:
            if contact.get("email"):
                user_contact_emails.add(contact["email"].lower())
                if "@" in contact["email"]:
                    domain = contact["email"].split("@")[1].lower()
                    first_degree_domains.add(domain)
        
        # Get all contacts from all users except the current user
        cursor = self.collection.find({"uuid": {"$ne": current_user_uuid}})
        results = []
        
        # Get current user's education for alumni matching
        user_education = await education_dao.get_all_education(current_user_uuid)
        user_institutions = set()
        for edu in user_education:
            if edu.get("institution_name"):
                user_institutions.add(edu["institution_name"].lower().strip())
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            # Remove the owner's uuid for privacy
            doc.pop("uuid", None)
            
            # Exclude if email matches any of the user's own contact emails
            if doc.get("email") and doc["email"].lower() in user_contact_emails:
                continue
            
            # Check for alumni connection
            is_alumni = False
            if doc.get("education") and doc["education"].get("institution_name"):
                contact_institution = doc["education"]["institution_name"].lower().strip()
                if contact_institution in user_institutions:
                    is_alumni = True
            
            # Determine connection degree and find mutual connection
            connection_degree = 0
            mutual_connection = None
            if doc.get("email") and "@" in doc["email"]:
                contact_domain = doc["email"].split("@")[1].lower()
                if contact_domain in first_degree_domains:
                    connection_degree = 2  # 2nd degree connection (shares domain with 1st degree)
                    # Find the specific mutual connection
                    for user_contact in user_contacts:
                        if user_contact.get("email") and "@" in user_contact["email"]:
                            user_domain = user_contact["email"].split("@")[1].lower()
                            if user_domain == contact_domain:
                                mutual_connection = {
                                    "name": user_contact.get("name", "Unknown"),
                                    "email": user_contact.get("email", "")
                                }
                                break
                else:
                    # For 3rd degree, we'd need to check connections of 2nd degree contacts
                    # Simplified approach: if not 2nd degree, mark as "new" for now
                    connection_degree = 0  # New connection
            
            # Add connection info
            doc["is_alumni"] = is_alumni
            doc["connection_degree"] = connection_degree
            doc["mutual_connection"] = mutual_connection
            
            results.append(doc)
        return results
        
networks_dao = NetworkDAO()