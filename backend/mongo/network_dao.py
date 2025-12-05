from mongo.dao_setup import db_client, NETWORKS
from mongo.education_dao import education_dao
from bson import ObjectId
from datetime import datetime, timezone

class NetworkDAO:
    def __init__(self):
        self.collection = db_client.get_collection(NETWORKS)
        # Create unique index on email (case-insensitive, sparse to allow null values)
        # This is created asynchronously and won't block
        self._setup_indexes()
    
    def _setup_indexes(self):
        """Create indexes for contact collection"""
        try:
            # Create unique index on email (case-insensitive)
            self.collection.create_index("email", unique=True, sparse=True)
        except Exception as e:
            print(f"Note: Could not create email index (may already exist): {e}")
    
    async def add_contact(self, data: dict) -> str:
        """
        Add or associate a contact. If email exists, associate current user with existing contact.
        Otherwise, create new global contact.
        
        Args:
            data: Contact data with optional 'uuid' (current user) and 'relationship_to_owner'
            
        Returns:
            Contact ID (either new or existing)
        """
        time = datetime.now(timezone.utc)
        uuid = data.pop("uuid", None)  # Extract user UUID
        relationship_to_owner = data.pop("relationship_to_owner", "direct")  # How user found this contact
        
        # Check if contact with this email already exists
        if data.get("email"):
            email = data["email"].lower().strip()
            existing_contact = await self.collection.find_one({"email": email})
            
            if existing_contact:
                # Contact exists - add user association if not already associated
                contact_id = str(existing_contact["_id"])
                
                if uuid:
                    # Check if user is already associated
                    associated_users = existing_contact.get("associated_users", [])
                    user_already_associated = any(assoc["uuid"] == uuid for assoc in associated_users)
                    
                    if not user_already_associated:
                        # Add new user association
                        new_association = {
                            "uuid": uuid,
                            "added_date": time,
                            "relationship_to_owner": relationship_to_owner,
                            "personal_notes": data.get("personal_notes")
                        }
                        await self.collection.update_one(
                            {"_id": existing_contact["_id"]},
                            {
                                "$push": {"associated_users": new_association},
                                "$set": {"date_updated": time}
                            }
                        )
                    else:
                        # User already associated - update their personal notes if provided
                        if data.get("personal_notes"):
                            await self.collection.update_one(
                                {"_id": existing_contact["_id"], "associated_users.uuid": uuid},
                                {
                                    "$set": {
                                        "associated_users.$.personal_notes": data.get("personal_notes"),
                                        "date_updated": time
                                    }
                                }
                            )
                
                return contact_id
        
        # New contact - create with owner
        data["date_created"] = time
        data["date_updated"] = time
        if data.get("email"):
            data["email"] = data["email"].lower().strip()
        
        # Initialize owner and associated users
        if uuid:
            data["owned_by"] = uuid
            data["associated_users"] = [
                {
                    "uuid": uuid,
                    "added_date": time,
                    "relationship_to_owner": relationship_to_owner,
                    "personal_notes": data.get("personal_notes")
                }
            ]
        else:
            data["associated_users"] = []
        
        # Remove personal_notes from root level as it's now in associated_users
        data.pop("personal_notes", None)
        
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_contacts(self, uuid: str) -> list[dict]:
        """Get all contacts associated with a user"""
        cursor = self.collection.find({"associated_users.uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            # Enrich with user-specific notes
            user_assoc = next((a for a in doc.get("associated_users", []) if a["uuid"] == uuid), None)
            if user_assoc:
                doc["user_relationship"] = user_assoc["relationship_to_owner"]
                doc["user_personal_notes"] = user_assoc.get("personal_notes")
            results.append(doc)
        return results
    
    async def get_contact(self, contact_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(contact_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_contact(self, contact_id: str, data: dict, uuid: str = None) -> int:
        """
        Update contact. If uuid provided and updating personal_notes, update user association.
        Otherwise, update global contact fields.
        """
        time = datetime.now(timezone.utc)
        data["date_updated"] = time
        
        # Extract user-specific data
        personal_notes = data.pop("personal_notes", None)
        
        # Update global contact fields
        if data:
            result = await self.collection.update_one(
                {"_id": ObjectId(contact_id)}, 
                {"$set": data}
            )
        else:
            result = await self.collection.update_one(
                {"_id": ObjectId(contact_id)}, 
                {"$set": {"date_updated": time}}
            )
        
        # Update user-specific personal notes
        if personal_notes and uuid:
            await self.collection.update_one(
                {"_id": ObjectId(contact_id), "associated_users.uuid": uuid},
                {"$set": {"associated_users.$.personal_notes": personal_notes}}
            )
        
        return result.matched_count

    async def delete_contact(self, contact_id: str, uuid: str = None) -> int:
        """
        Remove user association with contact, or delete contact entirely if no users left.
        """
        if uuid:
            # Remove only this user's association
            result = await self.collection.update_one(
                {"_id": ObjectId(contact_id)},
                {"$pull": {"associated_users": {"uuid": uuid}}}
            )
            
            # If no users left, delete the contact entirely
            contact = await self.collection.find_one({"_id": ObjectId(contact_id)})
            if contact and len(contact.get("associated_users", [])) == 0:
                await self.collection.delete_one({"_id": ObjectId(contact_id)})
                return 1
            
            return result.modified_count
        else:
            # Delete entire contact (if no uuid provided)
            result = await self.collection.delete_one({"_id": ObjectId(contact_id)})
            return result.deleted_count
    
    async def get_all_discovery_contacts(self, current_user_uuid: str) -> list[dict]:
        """
        Get contacts for discovery - shows all contacts NOT yet associated with current user
        Identifies connection degree and mutual connections
        """
        # Get current user's associated contacts (1st degree)
        user_contacts_cursor = self.collection.find({"associated_users.uuid": current_user_uuid})
        user_contacts = []
        user_contact_emails = set()
        user_contact_domains = set()
        
        async for doc in user_contacts_cursor:
            user_contacts.append(doc)
            if doc.get("email"):
                user_contact_emails.add(doc["email"].lower())
                domain = doc["email"].split("@")[1].lower() if "@" in doc["email"] else None
                if domain:
                    user_contact_domains.add(domain)
        
        # Get current user's profile for education matching
        from mongo.profiles_dao import profiles_dao
        user_profile = await profiles_dao.get_profile(current_user_uuid)
        user_institutions = set()
        if user_profile and user_profile.get("education"):
            for edu in user_profile.get("education", []):
                if edu.get("institution_name"):
                    user_institutions.add(edu["institution_name"].lower().strip())
        
        # Get all contacts NOT associated with current user
        cursor = self.collection.find({"associated_users.uuid": {"$ne": current_user_uuid}})
        results = []
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            
            # Skip if already associated
            if any(assoc["uuid"] == current_user_uuid for assoc in doc.get("associated_users", [])):
                continue
            
            # Determine connection degree
            connection_degree = 0
            mutual_connection = None
            is_alumni = False
            
            # Check alumni connection
            if doc.get("education") and doc["education"].get("institution_name"):
                contact_institution = doc["education"]["institution_name"].lower().strip()
                if contact_institution in user_institutions:
                    is_alumni = True
                    connection_degree = 2
            
            # Check 2nd degree (shared company domain)
            if doc.get("email") and "@" in doc["email"] and connection_degree == 0:
                contact_domain = doc["email"].split("@")[1].lower()
                if contact_domain in user_contact_domains:
                    connection_degree = 2
                    # Find mutual connection
                    for user_contact in user_contacts:
                        if user_contact.get("email") and "@" in user_contact["email"]:
                            user_domain = user_contact["email"].split("@")[1].lower()
                            if user_domain == contact_domain:
                                mutual_connection = {
                                    "name": user_contact.get("name", "Unknown"),
                                    "email": user_contact.get("email", "")
                                }
                                break
            
            # Check 3rd degree (mutual connections exist)
            if connection_degree == 0:
                doc_mutual_connections = doc.get("mutual_connections", [])
                user_contact_ids = [c["_id"] for c in user_contacts if "_id" in c]
                if any(conn_id in user_contact_ids for conn_id in doc_mutual_connections):
                    connection_degree = 3
            
            # Add metadata
            doc["is_alumni"] = is_alumni
            doc["connection_degree"] = connection_degree
            doc["mutual_connection"] = mutual_connection
            doc["num_users_with_contact"] = len(doc.get("associated_users", []))
            
            results.append(doc)
        
        return results
        
networks_dao = NetworkDAO()
network_dao = networks_dao