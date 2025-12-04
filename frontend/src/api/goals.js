// goals.js
import api from "./base";

const BASE_URL = "/goals";

class GoalsAPI {
    // Goal CRUD operations
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(goalId) {
        return api.get(`${BASE_URL}?goal_id=${goalId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(goalId, data) {
        return api.put(`${BASE_URL}?goal_id=${goalId}`, data);
    }

    delete(goalId) {
        return api.delete(`${BASE_URL}?goal_id=${goalId}`);
    }

    // Milestone operations
    addMilestone(goalId, milestoneData) {
        return api.post(`${BASE_URL}/milestones?goal_id=${goalId}`, milestoneData);
    }

    updateMilestone(goalId, milestoneId, data) {
        return api.put(`${BASE_URL}/milestones?goal_id=${goalId}&milestone_id=${milestoneId}`, data);
    }

    deleteMilestone(goalId, milestoneId) {
        return api.delete(`${BASE_URL}/milestones?goal_id=${goalId}&milestone_id=${milestoneId}`);
    }

    toggleMilestone(goalId, milestoneId, completed) {
        return api.patch(`${BASE_URL}/milestones/toggle?goal_id=${goalId}&milestone_id=${milestoneId}&completed=${completed}`);
    }

    // Statistics and insights
    getStats() {
        return api.get(`${BASE_URL}/stats`);
    }

    getInsights() {
        return api.get(`${BASE_URL}/insights`);
    }

    // Get complete analytics (goals + stats + insights)
    getAnalytics() {
        return api.get(`${BASE_URL}/analytics`);
    }
}

export default new GoalsAPI();