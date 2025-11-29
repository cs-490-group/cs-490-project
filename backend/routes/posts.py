from fastapi import APIRouter, HTTPException, status, Depends,Query
from datetime import datetime
from bson import ObjectId
from mongo.posts_dao import posts_dao
from mongo.groups_dao import groups_dao
from schema.groups import *

posts_router = APIRouter(prefix="/posts")


@posts_router.post("/{group_id}/create")
async def create_post(group_id: str, request: CreatePostRequest):
    try:
        post_data = {
            "_id": ObjectId(),
            "uuid": request.uuid,
            "username": request.username,  # Store username with post
            "title": request.title,
            "content": request.content,
            "postType": request.postType,
            "isAnonymous": request.isAnonymous,
            "likes": [],
            "comments": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await posts_dao.add_post(group_id, post_data)
        
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create post")
        
        return {
            "id": str(post_data["_id"]),
            "title": request.title,
            "message": "Post created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@posts_router.get("/{group_id}")
async def get_group_posts(group_id: str):
    try:
        posts = await posts_dao.get_group_posts(group_id)
        
        result = []
        for post in posts:
            # Convert comments to proper format with string IDs
            comments = []
            for comment in post.get("comments", []):
                comments.append({
                    "id": str(comment.get("_id", "")),
                    "uuid": comment.get("uuid"),
                    "username": comment.get("username"),
                    "text": comment.get("text"),
                    "created_at": comment.get("created_at")
                })
            
            result.append({
                "id": str(post["_id"]),
                "uuid": post.get("uuid") if not post.get("isAnonymous") else "Anonymous",
                "username": post.get("username") if not post.get("isAnonymous") else "Anonymous",
                "title": post.get("title"),
                "content": post.get("content"),
                "postType": post.get("postType"),
                "isAnonymous": post.get("isAnonymous"),
                "likes": post.get("likes", []),
                "comments": comments,
                "created_at": post.get("created_at")
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@posts_router.post("/{group_id}/{post_id}/like")
async def like_post(group_id: str, post_id: str, request: LikePostRequest):
    try:
        result = await posts_dao.like_post(group_id, post_id, request.uuid)
        
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to like post")
        
        return {"message": "Post liked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@posts_router.post("/{group_id}/{post_id}/unlike")
async def unlike_post(group_id: str, post_id: str, request: LikePostRequest):
    try:
        result = await posts_dao.unlike_post(group_id, post_id, request.uuid)
        
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to unlike post")
        
        return {"message": "Post unliked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@posts_router.post("/{group_id}/{post_id}/comment")
async def add_comment(group_id: str, post_id: str, request: AddCommentRequest):
    try:
        comment_data = {
            "_id": ObjectId(),
            "uuid": request.uuid,
            "username": request.username if hasattr(request, 'username') and request.username else "Anonymous",
            "text": request.text,
            "created_at": datetime.utcnow()
        }
        
        result = await posts_dao.add_comment(group_id, post_id, comment_data)
        
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to add comment")
        
        return {"message": "Comment added"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@posts_router.delete("/{group_id}/{post_id}")
async def delete_post(group_id: str, post_id: str, uuid: str):
    try:
        post = await posts_dao.get_post(group_id, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Admins can delete any post, authors can delete their own
        if post["uuid"] != uuid:
            group = await groups_dao.get_group(group_id)
            is_admin = any(m["uuid"] == uuid and m["role"] == "admin" for m in group.get("members", []))
            if not is_admin:
                raise HTTPException(status_code=403, detail="Not authorized")
        
        result = await posts_dao.delete_post(group_id, post_id)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to delete post")
        
        return {"message": "Post deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@posts_router.put("/{group_id}/{post_id}")
async def update_post(group_id: str, post_id: str, request: UpdatePostRequest):
    try:
        update_data = {}
        if request.title:
            update_data["title"] = request.title
        if request.content:
            update_data["content"] = request.content
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await posts_dao.update_post(group_id, post_id, update_data)
        
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
        return {"message": "Post updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@posts_router.delete("/{group_id}/{post_id}/comment/{comment_id}")
async def delete_comment(group_id: str, post_id: str, comment_id: str, uuid: str = Query(...),user_role: str = "member"):
    """
    Delete a comment. Users can delete their own comments.
    Admins can delete any comment.
    """
    try:
        group = await groups_dao.get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Find the comment
        posts = await posts_dao.get_group_posts(group_id)
        post = next((p for p in posts if str(p["_id"]) == post_id), None)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        comment = next((c for c in post.get("comments", []) if str(c["_id"]) == comment_id), None)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        # Check permissions
        is_owner = comment["uuid"] == uuid
        is_admin = any(m["uuid"] == uuid and m["role"] == "admin" for m in group.get("members", []))
        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

        # Delete comment
        result = await posts_dao.delete_comment(group_id, post_id, comment_id)
        print("group_id:", group_id)
        print("post_id:", post_id)
        print("comment_id:", comment_id)

        if not result:
            raise HTTPException(status_code=400, detail="Failed to delete comment")

        return {"message": "Comment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))