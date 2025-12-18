import api from './base';

class BadgesAPI {
    // Get all badges for the authenticated user
    async getBadges(platform = null) {
        const params = platform ? `?platform=${platform}` : '';
        const response = await api.get(`/badges/${params}`);
        return response.data;
    }

    // Get badges for a specific platform
    async getPlatformBadges(platform) {
        const response = await api.get(`/badges/platform/${platform}`);
        return response.data;
    }

    // Get badges for a specific platform and category
    async getPlatformCategoryBadges(platform, category) {
        const response = await api.get(`/badges/platform/${platform}/category/${category}`);
        return response.data;
    }

    // Get a specific badge by ID
    async getBadge(badgeId) {
        const response = await api.get(`/badges/${badgeId}`);
        return response.data;
    }

    // Create a new badge
    async createBadge(badgeData) {
        const response = await api.post('/badges/', badgeData);
        return response.data;
    }

    // Update an existing badge
    async updateBadge(badgeId, badgeData) {
        const response = await api.put(`/badges/${badgeId}`, badgeData);
        return response.data;
    }

    // Delete a badge
    async deleteBadge(badgeId) {
        const response = await api.delete(`/badges/${badgeId}`);
        return response.data;
    }

    // Delete all badges for a specific platform
    async deletePlatformBadges(platform) {
        const response = await api.delete(`/badges/platform/${platform}`);
        return response.data;
    }

    // Helper method to format badge data for API
    formatBadgeData(badge) {
        return {
            name: badge.name,
            description: badge.description,
            earned_date: badge.earnedDate ? new Date(badge.earnedDate).toISOString() : null,
            icon: badge.icon || null,
            category: badge.category || null,
            platform: badge.platform
        };
    }

    // Helper method to format badge data from API response
    formatBadgeFromAPI(badge) {
        return {
            id: badge._id,
            name: badge.name,
            description: badge.description,
            earnedDate: badge.earned_date,
            icon: badge.icon,
            category: badge.category,
            platform: badge.platform
        };
    }
}

const badgesAPI = new BadgesAPI();
export default badgesAPI;
