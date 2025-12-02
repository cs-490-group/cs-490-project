from mongo.dao_setup import db_client, GROUPS
from bson import ObjectId
from datetime import datetime


class postsDAO:
    def __init__(self):
        self.collection = db_client.get_collection(GROUPS)
    
    async def add_post(self, group_id, post_data):
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$push": {"posts": post_data}}
        )
        return result.modified_count
    
    async def get_post(self, group_id, post_id):
        group = await self.collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            return None
        for post in group.get("posts", []):
            if str(post["_id"]) == str(post_id):
                return post
        return None

    async def get_group_posts(self, group_id):
        result = await self.collection.find_one({"_id": ObjectId(group_id)})
        posts = result.get("posts", []) if result else []

        # Ensure created_at is a datetime object
        for post in posts:
            if isinstance(post.get("created_at"), str):
                try:
                    post["created_at"] = datetime.fromisoformat(post["created_at"])
                except ValueError:
                    post["created_at"] = datetime.min  # fallback for malformed dates

        # Sort posts by created_at descending (newest first)
        posts.sort(key=lambda p: p.get("created_at", datetime.min), reverse=True)
        
        return posts


    async def delete_post(self, group_id, post_id):
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$pull": {"posts": {"_id": ObjectId(post_id)}}}
        )
        return result.modified_count

    async def add_comment(self, group_id, post_id, comment_data):
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id), "posts._id": ObjectId(post_id)},
            {"$push": {"posts.$.comments": comment_data}}
        )
        return result.modified_count

    async def like_post(self, group_id, post_id, user_uuid):
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id), "posts._id": ObjectId(post_id)},
            {"$addToSet": {"posts.$.likes": user_uuid}}
        )
        return result.modified_count

    async def unlike_post(self, group_id, post_id, user_uuid):
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id), "posts._id": ObjectId(post_id)},
            {"$pull": {"posts.$.likes": user_uuid}}
        )
        return result.modified_count
    
    async def delete_comment(self, group_id, post_id, comment_id):
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id), "posts._id": ObjectId(post_id)},
            {"$pull": {"posts.$.comments": {"_id": ObjectId(comment_id)}}}
    )
        return result.modified_count



posts_dao = postsDAO()