import api from "./base";

const BASE_URL = "/application-workflow";

class ApplicationWorkflowAPI {
    // ============================================
    // APPLICATION PACKAGES (UC-069)
    // ============================================
    
    createPackage(data) {
        return api.post(`${BASE_URL}/packages`, data);
    }

    getPackages() {
        return api.get(`${BASE_URL}/packages`);
    }

    getPackage(packageId) {
        return api.get(`${BASE_URL}/packages/${packageId}`);
    }

    updatePackage(packageId, data) {
        return api.put(`${BASE_URL}/packages/${packageId}`, data);
    }

    deletePackage(packageId) {
        return api.delete(`${BASE_URL}/packages/${packageId}`);
    }

    usePackage(packageId) {
        return api.post(`${BASE_URL}/packages/${packageId}/use`);
    }

    // ============================================
    // APPLICATION SCHEDULING (UC-069)
    // ============================================
    
    scheduleApplication(data) {
        return api.post(`${BASE_URL}/schedules`, data);
    }

    getScheduledApplications() {
        return api.get(`${BASE_URL}/schedules`);
    }

    updateSchedule(scheduleId, data) {
        return api.put(`${BASE_URL}/schedules/${scheduleId}`, data);
    }

    cancelSchedule(scheduleId, reason = null) {
        return api.post(`${BASE_URL}/schedules/${scheduleId}/cancel`, { reason });
    }

    // ============================================
    // RESPONSE TEMPLATES (UC-069)
    // ============================================
    
    createTemplate(data) {
        return api.post(`${BASE_URL}/templates`, data);
    }

    getTemplates(category = null) {
        const params = category ? `?category=${category}` : '';
        return api.get(`${BASE_URL}/templates${params}`);
    }

    updateTemplate(templateId, data) {
        return api.put(`${BASE_URL}/templates/${templateId}`, data);
    }

    deleteTemplate(templateId) {
        return api.delete(`${BASE_URL}/templates/${templateId}`);
    }

    useTemplate(templateId) {
        return api.post(`${BASE_URL}/templates/${templateId}/use`);
    }

    // ============================================
    // AUTOMATION RULES (UC-069)
    // ============================================
    
    createAutomationRule(data) {
        return api.post(`${BASE_URL}/automation-rules`, data);
    }

    getAutomationRules(enabledOnly = false) {
        const params = enabledOnly ? '?enabled_only=true' : '';
        return api.get(`${BASE_URL}/automation-rules${params}`);
    }

    updateAutomationRule(ruleId, data) {
        return api.put(`${BASE_URL}/automation-rules/${ruleId}`, data);
    }

    toggleAutomationRule(ruleId, enabled) {
        return api.post(`${BASE_URL}/automation-rules/${ruleId}/toggle`, { enabled });
    }

    deleteAutomationRule(ruleId) {
        return api.delete(`${BASE_URL}/automation-rules/${ruleId}`);
    }

    // ============================================
    // BULK OPERATIONS (UC-069)
    // ============================================
    
    bulkCreatePackages(packages) {
        return api.post(`${BASE_URL}/packages/bulk`, { packages });
    }

    bulkScheduleApplications(schedules) {
        return api.post(`${BASE_URL}/schedules/bulk`, { schedules });
    }

    bulkCancelSchedules(scheduleIds, reason = null) {
        return api.post(`${BASE_URL}/schedules/bulk-cancel`, {
            schedule_ids: scheduleIds,
            reason
        });
    }

    // ============================================
    // APPLICATION ANALYTICS (UC-072)
    // ============================================
    
    getApplicationFunnel(startDate = null, endDate = null) {
        let params = '';
        if (startDate && endDate) {
            params = `?start_date=${startDate}&end_date=${endDate}`;
        }
        return api.get(`${BASE_URL}/analytics/funnel${params}`);
    }

    getResponseTimes(groupBy = null) {
        const params = groupBy ? `?group_by=${groupBy}` : '';
        return api.get(`${BASE_URL}/analytics/response-times${params}`);
    }

    getSuccessRates(groupBy = null) {
        const params = groupBy ? `?group_by=${groupBy}` : '';
        return api.get(`${BASE_URL}/analytics/success-rates${params}`);
    }

    getApplicationTrends(days = 90) {
        return api.get(`${BASE_URL}/analytics/trends?days=${days}`);
    }

    getPerformanceBenchmarks() {
        return api.get(`${BASE_URL}/analytics/benchmarks`);
    }

    getOptimizationRecommendations() {
        return api.get(`${BASE_URL}/analytics/recommendations`);
    }

    // ============================================
    // GOAL TRACKING (UC-072)
    // ============================================
    
    createGoal(data) {
        return api.post(`${BASE_URL}/goals`, data);
    }

    getGoals() {
        return api.get(`${BASE_URL}/goals`);
    }

    updateGoalProgress(goalId, progress) {
        return api.put(`${BASE_URL}/goals/${goalId}`, { progress });
    }
 
    deleteGoal(goalId) {
        return api.delete(`${BASE_URL}/goals/${goalId}`);
    }

    updateGoal(goalId, data) {
        return api.put(`${BASE_URL}/goals/${goalId}`, data);
    }
}

export default new ApplicationWorkflowAPI();