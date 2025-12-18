"""
GitHub Integration API Router
Complete endpoints for GitHub OAuth and repository integration
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import httpx

from sessions.session_authorizer import authorize
from mongo.github_tokens_dao import github_tokens_dao
from mongo.github_repos_dao import github_repos_dao

github_router = APIRouter(prefix="/github")


# ============================================================================
# Pydantic Models
# ============================================================================

class GitHubRepository(BaseModel):
    """GitHub repository data"""
    repo_id: int
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    homepage: Optional[str] = None
    language: Optional[str] = None
    languages: Optional[Dict[str, int]] = {}
    stargazers_count: int = 0
    forks_count: int = 0
    watchers_count: int = 0
    open_issues_count: int = 0
    size: int = 0
    created_at: str
    updated_at: str
    pushed_at: Optional[str] = None
    topics: List[str] = []
    is_private: bool = False
    is_fork: bool = False
    is_archived: bool = False


class FeaturedRepoRequest(BaseModel):
    """Request to mark repository as featured"""
    repo_id: int
    is_featured: bool


class LinkRepoToSkillRequest(BaseModel):
    """Request to link repository to a skill"""
    repo_id: int
    skill_ids: List[str]


class UpdateRepoNotesRequest(BaseModel):
    """Request to update repository notes"""
    repo_id: int
    notes: str


# ============================================================================
# Helper Functions
# ============================================================================

async def get_github_headers(uuid: str) -> Dict[str, str]:
    """Get authenticated headers for GitHub API requests"""
    tokens = await github_tokens_dao.get_tokens(uuid)
    
    if not tokens or not tokens.get("access_token"):
        raise HTTPException(401, "GitHub not connected")
    
    return {
        "Authorization": f"Bearer {tokens['access_token']}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }


async def fetch_github_data(url: str, headers: Dict[str, str]) -> Any:
    """Fetch data from GitHub API"""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=30.0)
        
        if response.status_code == 401:
            raise HTTPException(401, "GitHub token expired or invalid")
        elif response.status_code == 403:
            raise HTTPException(403, "GitHub API rate limit exceeded")
        elif response.status_code != 200:
            raise HTTPException(response.status_code, f"GitHub API error: {response.text}")
        
        return response.json()


async def get_repository_languages(repo_full_name: str, headers: Dict[str, str]) -> Dict[str, int]:
    """Fetch languages used in a repository"""
    url = f"https://api.github.com/repos/{repo_full_name}/languages"
    try:
        return await fetch_github_data(url, headers)
    except:
        return {}


async def get_commit_activity(repo_full_name: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Fetch commit activity for a repository"""
    url = f"https://api.github.com/repos/{repo_full_name}/stats/commit_activity"
    try:
        data = await fetch_github_data(url, headers)
        if not data:
            return {"total_commits": 0, "recent_commits": 0}
        
        # Calculate total and recent (last 4 weeks) commits
        total = sum(week.get("total", 0) for week in data)
        recent = sum(week.get("total", 0) for week in data[-4:]) if len(data) >= 4 else total
        
        return {
            "total_commits": total,
            "recent_commits": recent,
            "weekly_data": data
        }
    except:
        return {"total_commits": 0, "recent_commits": 0}


# ============================================================================
# OAuth / Authentication Endpoints
# ============================================================================

@github_router.get("/auth/status", tags=["github"])
async def check_github_auth_status(uuid: str = Depends(authorize)):
    """
    Check if user has authenticated with GitHub
    Returns authentication status and username if connected
    """
    print("AUTH/STATUS")
    try:
        tokens = await github_tokens_dao.get_tokens(uuid)
        
        if tokens and tokens.get("access_token"):
            return {
                "authenticated": True,
                "username": tokens.get("username", ""),
                "avatar_url": tokens.get("avatar_url", ""),
                "profile_url": tokens.get("profile_url", "")
            }
        else:
            return {"authenticated": False}
            
    except Exception as e:
        print(f"Error checking GitHub auth status: {e}")
        return {"authenticated": False}


@github_router.get("/auth/connect", tags=["github"])
async def initiate_github_connection(uuid: str = Depends(authorize)):
    """
    Initiate GitHub OAuth flow
    Returns authorization URL for user to visit
    """
    try:
        GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
        
        if not GITHUB_CLIENT_ID:
            raise HTTPException(500, "GitHub Client ID not configured")
        
        # Redirect URI - update for production
        REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/github/auth/callback")
        
        # Scopes for public repo access
        SCOPES = "read:user user:email public_repo"
        
        # Construct OAuth URL
        auth_url = (
            "https://github.com/login/oauth/authorize?"
            f"client_id={GITHUB_CLIENT_ID}&"
            f"redirect_uri={REDIRECT_URI}&"
            f"scope={SCOPES}&"
            f"state={uuid}"  # Pass uuid to link back to user
        )
        
        return {"auth_url": auth_url}
        
    except Exception as e:
        print(f"Error initiating GitHub connection: {e}")
        raise HTTPException(500, "Failed to initiate GitHub connection")


@github_router.get("/auth/callback", tags=["github"])
async def github_oauth_callback(code: str, state: str):
    """
    Handle GitHub OAuth callback
    Redirects to frontend after successful authentication
    """
    try:
        uuid = state  # State contains user uuid
        
        GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
        GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
        REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/github/auth/callback")
        
        if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
            raise HTTPException(500, "GitHub credentials not configured")
        
        # Exchange authorization code for access token
        token_url = "https://github.com/login/oauth/access_token"
        token_data = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI
        }
        
        async with httpx.AsyncClient() as client:
            # Get access token
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                print(f"Token exchange failed: {token_response.text}")
                frontend_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github?github_error=true"
                return RedirectResponse(url=frontend_url)
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            if not access_token:
                frontend_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github?github_error=true"
                return RedirectResponse(url=frontend_url)
            
            # Get user's GitHub profile
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if user_response.status_code != 200:
                frontend_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github?github_error=true"
                return RedirectResponse(url=frontend_url)
            
            user_data = user_response.json()
            
            # Store tokens in database
            await github_tokens_dao.store_tokens(uuid, {
                "access_token": access_token,
                "token_type": tokens.get("token_type", "bearer"),
                "scope": tokens.get("scope", ""),
                "username": user_data.get("login"),
                "user_id": user_data.get("id"),
                "avatar_url": user_data.get("avatar_url"),
                "profile_url": user_data.get("html_url"),
                "name": user_data.get("name"),
                "bio": user_data.get("bio"),
                "public_repos": user_data.get("public_repos", 0),
                "followers": user_data.get("followers", 0),
                "following": user_data.get("following", 0)
            })
            
            # Redirect to frontend with success
            frontend_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github?github_connected=true"
            return RedirectResponse(url=frontend_url)
            
    except Exception as e:
        print(f"Error in GitHub OAuth callback: {e}")
        frontend_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/github?github_error=true"
        return RedirectResponse(url=frontend_url)


@github_router.post("/auth/disconnect", tags=["github"])
async def disconnect_github(uuid: str = Depends(authorize)):
    """
    Revoke GitHub access and delete stored credentials
    """
    try:
        success = await github_tokens_dao.delete_tokens(uuid)
        
        if success:
            # Also delete all stored repository data
            await github_repos_dao.delete_user_repos(uuid)
            return {"detail": "GitHub access revoked successfully"}
        else:
            return {"detail": "No GitHub connection found"}
            
    except Exception as e:
        print(f"Error disconnecting GitHub: {e}")
        raise HTTPException(500, "Failed to disconnect GitHub")


# ============================================================================
# Repository Fetch Endpoints
# ============================================================================

@github_router.get("/repositories", tags=["github"])
async def get_user_repositories(
    include_forks: bool = Query(False),
    include_archived: bool = Query(False),
    refresh: bool = Query(False),
    uuid: str = Depends(authorize)
):
    """
    Get user's GitHub repositories
    Can fetch from cache or refresh from GitHub API
    """
    try:
        # Check if we should use cached data
        if not refresh:
            cached_repos = await github_repos_dao.get_user_repos(uuid)
            if cached_repos:
                # Filter based on parameters
                filtered = [
                    r for r in cached_repos
                    if (include_forks or not r.get("is_fork", False))
                    and (include_archived or not r.get("is_archived", False))
                ]
                return {
                    "repositories": filtered,
                    "count": len(filtered),
                    "cached": True
                }
        
        # Fetch fresh data from GitHub
        headers = await get_github_headers(uuid)
        
        # Get user's repositories
        repos_url = "https://api.github.com/user/repos?per_page=100&sort=updated"
        repos_data = await fetch_github_data(repos_url, headers)
        
        # Process repositories
        repositories = []
        for repo in repos_data:
            # Skip private repos (only public for free tier)
            if repo.get("private", False):
                continue
            
            # Get languages for each repo
            languages = await get_repository_languages(repo["full_name"], headers)
            
            repo_data = {
                "repo_id": repo["id"],
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo.get("description"),
                "html_url": repo["html_url"],
                "homepage": repo.get("homepage"),
                "language": repo.get("language"),
                "languages": languages,
                "stargazers_count": repo.get("stargazers_count", 0),
                "forks_count": repo.get("forks_count", 0),
                "watchers_count": repo.get("watchers_count", 0),
                "open_issues_count": repo.get("open_issues_count", 0),
                "size": repo.get("size", 0),
                "created_at": repo.get("created_at", ""),
                "updated_at": repo.get("updated_at", ""),
                "pushed_at": repo.get("pushed_at"),
                "topics": repo.get("topics", []),
                "is_private": repo.get("private", False),
                "is_fork": repo.get("fork", False),
                "is_archived": repo.get("archived", False),
                "is_featured": False,
                "linked_skills": [],
                "notes": "",
                "last_synced": datetime.utcnow().isoformat()
            }
            
            repositories.append(repo_data)
        
        # Store in database
        print("SHOULD BE STORING")
        await github_repos_dao.store_repos(uuid, repositories)
        
        # Filter based on parameters
        filtered = [
            r for r in repositories
            if (include_forks or not r.get("is_fork", False))
            and (include_archived or not r.get("is_archived", False))
        ]
        
        return {
            "repositories": filtered,
            "count": len(filtered),
            "cached": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching repositories: {e}")
        raise HTTPException(500, f"Failed to fetch repositories: {str(e)}")

@github_router.get("/repository/featured", tags=["github"])
async def get_featured_repositories(uuid: str = Depends(authorize)):
    """
    Get all repositories marked as featured
    """
    try:
        featured_repos = await github_repos_dao.get_featured_repos(uuid)
        
        return {
            "repositories": featured_repos,
            "count": len(featured_repos)
        }
        
    except Exception as e:
        print(f"Error fetching featured repositories: {e}")
        raise HTTPException(500, f"Failed to fetch featured repositories: {str(e)}")
    
    
    
@github_router.get("/repository/{repo_id}", tags=["github"])
async def get_repository_details(
    repo_id: int,
    include_commits: bool = Query(True),
    uuid: str = Depends(authorize)
):
    """
    Get detailed information about a specific repository
    """
    try:
        # Get from database first
        repo = await github_repos_dao.get_repo(uuid, repo_id)
        
        if not repo:
            raise HTTPException(404, "Repository not found")
        
        # Optionally fetch commit activity
        if include_commits:
            headers = await get_github_headers(uuid)
            commit_activity = await get_commit_activity(repo["full_name"], headers)
            repo["commit_activity"] = commit_activity
        
        return repo
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching repository details: {e}")
        raise HTTPException(500, f"Failed to fetch repository details: {str(e)}")


@github_router.get("/contribution-activity", tags=["github"])
async def get_contribution_activity(
    uuid: str = Depends(authorize)
):
    """
    Get user's overall GitHub contribution activity
    """
    try:
        headers = await get_github_headers(uuid)
        tokens = await github_tokens_dao.get_tokens(uuid)
        username = tokens.get("username")
        
        if not username:
            raise HTTPException(400, "GitHub username not found")
        
        # Get user events (contributions)
        events_url = f"https://api.github.com/users/{username}/events/public?per_page=100"
        events = await fetch_github_data(events_url, headers)
        
        # Process contribution stats
        contribution_stats = {
            "total_events": len(events),
            "push_events": 0,
            "pull_request_events": 0,
            "issue_events": 0,
            "recent_activity": []
        }
        
        for event in events[:20]:  # Last 20 events
            event_type = event.get("type", "")
            created_at = event.get("created_at", "")
            repo_name = event.get("repo", {}).get("name", "")
            
            if event_type == "PushEvent":
                contribution_stats["push_events"] += 1
                commits = event.get("payload", {}).get("commits", [])
                contribution_stats["recent_activity"].append({
                    "type": "push",
                    "repo": repo_name,
                    "commits": len(commits),
                    "date": created_at
                })
            elif event_type == "PullRequestEvent":
                contribution_stats["pull_request_events"] += 1
                action = event.get("payload", {}).get("action", "")
                contribution_stats["recent_activity"].append({
                    "type": "pull_request",
                    "repo": repo_name,
                    "action": action,
                    "date": created_at
                })
            elif "IssuesEvent" in event_type or "IssueCommentEvent" in event_type:
                contribution_stats["issue_events"] += 1
        
        return contribution_stats
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching contribution activity: {e}")
        raise HTTPException(500, f"Failed to fetch contribution activity: {str(e)}")


# ============================================================================
# Repository Management Endpoints
# ============================================================================

@github_router.post("/repository/featured", tags=["github"])
async def toggle_featured_repository(
    request: FeaturedRepoRequest,
    uuid: str = Depends(authorize)
):
    """
    Mark or unmark a repository as featured for profile display
    """
    try:
        success = await github_repos_dao.set_featured(
            uuid,
            request.repo_id,
            request.is_featured
        )
        
        if success:
            action = "featured" if request.is_featured else "unfeatured"
            return {"detail": f"Repository {action} successfully"}
        else:
            raise HTTPException(404, "Repository not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling featured status: {e}")
        raise HTTPException(500, f"Failed to update featured status: {str(e)}")





@github_router.post("/repository/link-skills", tags=["github"])
async def link_repository_to_skills(
    request: LinkRepoToSkillRequest,
    uuid: str = Depends(authorize)
):
    """
    Link a repository to skills in user's profile
    """
    try:
        success = await github_repos_dao.link_skills(
            uuid,
            request.repo_id,
            request.skill_ids
        )
        
        if success:
            return {"detail": "Repository linked to skills successfully"}
        else:
            raise HTTPException(404, "Repository not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error linking repository to skills: {e}")
        raise HTTPException(500, f"Failed to link repository to skills: {str(e)}")


@github_router.post("/repository/notes", tags=["github"])
async def update_repository_notes(
    request: UpdateRepoNotesRequest,
    uuid: str = Depends(authorize)
):
    """
    Update notes for a repository
    """
    try:
        success = await github_repos_dao.update_notes(
            uuid,
            request.repo_id,
            request.notes
        )
        
        if success:
            return {"detail": "Repository notes updated successfully"}
        else:
            raise HTTPException(404, "Repository not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating repository notes: {e}")
        raise HTTPException(500, f"Failed to update repository notes: {str(e)}")


@github_router.post("/sync", tags=["github"])
async def sync_repositories(uuid: str = Depends(authorize)):
    """
    Manually trigger a sync of repository data from GitHub
    """
    try:
        # This just calls get_repositories with refresh=True
        return await get_user_repositories(
            include_forks=True,
            include_archived=True,
            refresh=True,
            uuid=uuid
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error syncing repositories: {e}")
        raise HTTPException(500, f"Failed to sync repositories: {str(e)}")


# ============================================================================
# Statistics Endpoints
# ============================================================================

@github_router.get("/stats", tags=["github"])
async def get_github_stats(uuid: str = Depends(authorize)):
    """
    Get GitHub integration statistics
    """
    try:
        repos = await github_repos_dao.get_user_repos(uuid)
        
        if not repos:
            return {
                "total_repos": 0,
                "featured_repos": 0,
                "total_stars": 0,
                "total_forks": 0,
                "languages": {}
            }
        
        # Calculate stats
        featured_count = sum(1 for r in repos if r.get("is_featured", False))
        total_stars = sum(r.get("stargazers_count", 0) for r in repos)
        total_forks = sum(r.get("forks_count", 0) for r in repos)
        
        # Language breakdown
        languages = {}
        for repo in repos:
            lang = repo.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
        
        return {
            "total_repos": len(repos),
            "featured_repos": featured_count,
            "total_stars": total_stars,
            "total_forks": total_forks,
            "languages": languages,
            "last_synced": repos[0].get("last_synced") if repos else None
        }
        
    except Exception as e:
        print(f"Error getting GitHub stats: {e}")
        raise HTTPException(500, f"Failed to get GitHub stats: {str(e)}")