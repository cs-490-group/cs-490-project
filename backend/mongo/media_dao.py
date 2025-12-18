from gridfs import AsyncGridFSBucket
from gridfs.errors import NoFile
from bson import ObjectId
from datetime import datetime, timezone

from mongo.dao_setup import db_client

class MediaDAO:
    def __init__(self):
        self.grid = AsyncGridFSBucket(db_client)

    async def add_media(self, parent_id: str, filename: str, contents: bytes, content_type: str = "application/octet-stream") -> str | None:
        try:
            time = datetime.now(timezone.utc)
            metadata = {
                "content_type": content_type,
                "parent_id": parent_id, # store id of whatever piece of content this media is attached to
                "date_created": time,
                "date_updated": time,
            }
            file_id = await self.grid.upload_from_stream(filename, contents, metadata = metadata)
        except NoFile:
            return None
        return str(file_id)

    async def get_media(self, media_id: str) -> dict | None:
        try:
            media = await self.grid.open_download_stream(ObjectId(media_id))
            contents = await media.read()
        except NoFile: # FIXME: redundant, but here for specific error checking when possible
            return None
        except:
            return None
        
        return {
            "filename": media.filename,
            "contents": contents,
            "content_type": media.metadata.get("content_type"),
            "size": media.length
        }

    async def get_all_associated_media_ids(self, parent_id: str) -> list[str]:
        try:
            cursor = self.grid.find({"metadata.parent_id": parent_id})
        except:
            return []
        
        results = []
        async for media in cursor:
            results.append(str(media._id))                

        return results

    async def update_media(self, media_id: str, filename: str, contents: bytes, parent_id: str = None, content_type: str = None) -> bool:
        obj_id = ObjectId(media_id)
        try:
            media = await self.grid.open_download_stream(obj_id)
            
            time = datetime.now(timezone.utc)
            metadata = {
                "content_type": content_type if content_type else media.metadata.get("content_type"),
                "parent_id": parent_id if parent_id else media.metadata.get("parent_id"),
                "date_created": media.metadata.get("date_created"),
                "date_updated": time
            }

            await self.grid.delete(obj_id)
            await self.grid.upload_from_stream_with_id(obj_id, filename, contents, metadata = metadata)
        except NoFile:
            return False
        return True

    async def delete_media(self, media_id: str) -> bool:
        try:
            await self.grid.delete(ObjectId(media_id))
        except NoFile:
            return False
        return True
    
media_dao = MediaDAO()