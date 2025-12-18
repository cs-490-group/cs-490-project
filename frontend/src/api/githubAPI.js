import api from "./base";

const BASE_URL = "/github";

class GitHubAPI {
    // ============================================================================
    // Authentication
    // ============================================================================
    
    checkAuthStatus() {
        console.log("api status")
        return api.get(`${BASE_URL}/auth/status`);
    }

    getConnectUrl() {
        return api.get(`${BASE_URL}/auth/connect`);
    }

    disconnect() {
        return api.post(`${BASE_URL}/auth/disconnect`);
    }

    // ============================================================================
    // Repositories
    // ============================================================================
    
    getRepositories(params = {}) {
        const { includeForks = false, includeArchived = false, refresh = false } = params;
        return api.get(`${BASE_URL}/repositories`, {
            params: {
                include_forks: includeForks,
                include_archived: includeArchived,
                refresh: refresh
            }
        });
    }

    getRepository(repoId, includeCommits = true) {
        return api.get(`${BASE_URL}/repository/${repoId}`, {
            params: {
                include_commits: includeCommits
            }
        });
    }

    getFeaturedRepositories() {
        return api.get(`${BASE_URL}/repository/featured`);
    }

    // ============================================================================
    // Repository Management
    // ============================================================================
    
    toggleFeatured(repoId, isFeatured) {
        return api.post(`${BASE_URL}/repository/featured`, {
            repo_id: repoId,
            is_featured: isFeatured
        });
    }

    updateNotes(repoId, notes) {
        return api.post(`${BASE_URL}/repository/notes`, {
            repo_id: repoId,
            notes: notes
        });
    }

    linkToSkills(repoId, skillIds) {
        return api.post(`${BASE_URL}/repository/link-skills`, {
            repo_id: repoId,
            skill_ids: skillIds
        });
    }

    // ============================================================================
    // Statistics & Activity
    // ============================================================================
    
    getStats() {
        return api.get(`${BASE_URL}/stats`);
    }

    getContributionActivity() {
        return api.get(`${BASE_URL}/contribution-activity`);
    }

    // ============================================================================
    // Sync
    // ============================================================================
    
    sync() {
        return api.post(`${BASE_URL}/sync`);
    }

    // ============================================================================
    // Search (if needed in future)
    // ============================================================================
    
    searchByCompany(companyName, daysBack = 90) {
        return api.get(`${BASE_URL}/search/company/${companyName}`, {
            params: {
                days_back: daysBack
            }
        });
    }
}

export default new GitHubAPI();