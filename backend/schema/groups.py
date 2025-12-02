from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class GroupMember(BaseModel):
    uuid: str
    role: str = "member"


class Comment(BaseModel):
    _id: str
    uuid: str
    username: str
    text: str
    isAnonymous: bool = False
    created_at: datetime

class Post(BaseModel):
    _id: str
    uuid: str
    username: str
    title: str
    content: str
    postType: str
    isAnonymous: bool = False
    likes: List[str] = []
    comments: List[Comment] = []
    created_at: datetime
    updated_at: datetime


class CreateGroupRequest(BaseModel):
    name: str
    category: str
    maxMembers: int = Field(ge=1, le=50)
    uuid: str


class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    maxMembers: Optional[int] = Field(None, ge=1, le=50)


class JoinGroupRequest(BaseModel):
    groupId: str
    uuid: str
    role: str = "member"


class UpdateUserRoleRequest(BaseModel):
    uuid: str
    newRole: str


class GroupResponse(BaseModel):
    id: str
    name: str
    category: str
    memberCount: int
    maxMembers: int


class GroupDetailResponse(BaseModel):
    id: str
    name: str
    category: str
    maxMembers: int
    members: List[GroupMember]
    posts: List[Post]
    postsVisibleToNonMembers: bool = True
    createdAt: datetime


class GroupBase(BaseModel):
    name: str
    category: str
    maxMembers: int
    creator_id: str


class GroupCreate(GroupBase):
    pass


class Group(GroupBase):
    _id: str
    members: List[GroupMember]
    posts: List[Post] = []
    postsVisibleToNonMembers: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



class CreatePostRequest(BaseModel):
    groupId: str
    uuid: str
    title: str
    content: str
    postType: str = Field(..., description="insight, strategy, success_story, challenge, or opportunity")
    isAnonymous: bool = False
    username: Optional[str] = None

class UpdatePostRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class LikePostRequest(BaseModel):
    uuid: str


class AddCommentRequest(BaseModel):
    uuid: str
    username: str
    text: str