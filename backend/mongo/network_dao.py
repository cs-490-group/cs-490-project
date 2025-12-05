from mongo.dao_setup import db_client, NETWORKS
from mongo.education_dao import education_dao
from bson import ObjectId
from datetime import datetime, timezone

class NetworkDAO:
    def __init__(self):
        if not NETWORKS:
            raise ValueError("NETWORKS_COLLECTION environment variable not set")
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
        """Get all contacts associated with a user (excluding their own profile)"""
        # Exclude user's own contact (relationship_to_owner="self")
        cursor = self.collection.find({
            "associated_users.uuid": uuid,
            "associated_users.relationship_to_owner": {"$ne": "self"}
        })
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            # Enrich with user-specific notes
            user_assoc = next((a for a in doc.get("associated_users", []) if a["uuid"] == uuid), None)
            if user_assoc:
                doc["user_relationship"] = user_assoc["relationship_to_owner"]
                doc["user_personal_notes"] = user_assoc.get("personal_notes")
                doc["is_creator"] = doc.get("owned_by") == uuid  # Flag if current user is creator
            results.append(doc)
        return results
    
    async def get_contact(self, contact_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(contact_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_contact(self, contact_id: str, data: dict, uuid: str = None) -> int:
        """
        Update contact. Only the creator can update global contact fields.
        Any user can update their own personal_notes.
        """
        time = datetime.now(timezone.utc)
        
        # Extract user-specific data
        personal_notes = data.pop("personal_notes", None)
        
        # Check if contact exists
        contact = await self.collection.find_one({"_id": ObjectId(contact_id)})
        if not contact:
            return 0  # Contact not found
        
        # Check if user is the creator for global field updates
        is_creator = contact.get("owned_by") == uuid
        
        # Update global contact fields (only if creator)
        if data and is_creator:
            data["date_updated"] = time
            result = await self.collection.update_one(
                {"_id": ObjectId(contact_id)}, 
                {"$set": data}
            )
        elif not is_creator and data:
            # Non-creator trying to update global fields - not allowed
            raise Exception("Only the contact creator can update this contact's information")
        else:
            # Just update timestamp
            result = await self.collection.update_one(
                {"_id": ObjectId(contact_id)}, 
                {"$set": {"date_updated": time}}
            )
        
        # Update user-specific personal notes (any associated user can do this)
        if personal_notes and uuid:
            await self.collection.update_one(
                {"_id": ObjectId(contact_id), "associated_users.uuid": uuid},
                {"$set": {"associated_users.$.personal_notes": personal_notes}}
            )
        
        return result.matched_count

    async def delete_contact(self, contact_id: str, uuid: str = None) -> int:
        """
        Delete user association with contact, or delete contact entirely if creator.
        Only the creator (owned_by) can delete the contact from the database.
        Non-creators simply remove their association.
        """
        if not uuid:
            # No user provided - cannot delete
            raise Exception("User identification required for deletion")
        
        # Find the contact
        contact = await self.collection.find_one({"_id": ObjectId(contact_id)})
        if not contact:
            return 0  # Contact not found
        
        is_creator = contact.get("owned_by") == uuid
        
        if is_creator:
            # Creator can delete entire contact from database
            result = await self.collection.delete_one({"_id": ObjectId(contact_id)})
            return result.deleted_count
        else:
            # Non-creator: just remove their association
            result = await self.collection.update_one(
                {"_id": ObjectId(contact_id)},
                {"$pull": {"associated_users": {"uuid": uuid}}}
            )
            
            # If no users left after removal, delete the orphaned contact
            contact = await self.collection.find_one({"_id": ObjectId(contact_id)})
            if contact and len(contact.get("associated_users", [])) == 0:
                await self.collection.delete_one({"_id": ObjectId(contact_id)})
            
            return result.modified_count
    
    async def get_all_discovery_contacts(self, current_user_uuid: str) -> list[dict]:
        """
        Get contacts for discovery - shows all contacts NOT yet associated with current user
        Identifies connection degree and mutual connections
        """
        try:
            # Get current user's associated contacts (1st degree)
            user_contacts_cursor = self.collection.find({"associated_users.uuid": current_user_uuid})
            user_contacts = []
            user_contact_emails = set()
            user_contact_domains = set()
            user_contact_ids = set()
            
            async for doc in user_contacts_cursor:
                user_contacts.append(doc)
                user_contact_ids.add(str(doc.get("_id")))  # Store string ID
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
                
                # Ensure associated_users is a list
                if not isinstance(doc.get("associated_users"), list):
                    doc["associated_users"] = []
                
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
                if connection_degree == 0 and user_contact_ids:
                    doc_mutual_connections = doc.get("mutual_connections", [])
                    if doc_mutual_connections:
                        # Convert all to strings for comparison
                        doc_mutual_connections_str = [str(conn_id) if not isinstance(conn_id, str) else conn_id for conn_id in doc_mutual_connections]
                        if any(conn_id in user_contact_ids for conn_id in doc_mutual_connections_str):
                            connection_degree = 3
                
                # Add metadata
                doc["is_alumni"] = is_alumni
                doc["connection_degree"] = connection_degree
                doc["mutual_connection"] = mutual_connection
                doc["num_users_with_contact"] = len(doc.get("associated_users", []))
                
                results.append(doc)
            
            return results
        except Exception as e:
            print(f"Error in get_all_discovery_contacts: {str(e)}")
            raise Exception(f"Failed to retrieve discovery contacts: {str(e)}")
        
networks_dao = NetworkDAO()
network_dao = networks_dao