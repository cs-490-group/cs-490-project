import api from "./base";

const BASE_URL = "/analytics"

class NetworkAnalyticsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    getLatest() {
        return api.get(`${BASE_URL}/latest`);
    }

    get(analyticsId) {
        return api.get(`${BASE_URL}/${analyticsId}`);
    }

    update(analyticsId, data) {
        return api.put(`${BASE_URL}/${analyticsId}`, data);
    }

    delete(analyticsId) {
        return api.delete(`${BASE_URL}/${analyticsId}`);
    }

    getByDateRange(startDate, endDate) {
        return api.get(`${BASE_URL}/range`, {
            params: { start_date: startDate, end_date: endDate }
        });
    }

    createGoal(goalData) {
        return api.post(`${BASE_URL}/goals`, goalData);
    }

    createInsight(insightData) {
        return api.post(`${BASE_URL}/insights`, insightData);
    }

    createTrend(trendData) {
        return api.post(`${BASE_URL}/trends`, trendData);
    }

    getDashboard() {
        return api.get(`${BASE_URL}/dashboard`);
    }

    getNetworkingDashboard(periodDays = 30, industry) {
        const params = { period_days: periodDays };
        if (industry) {
            params.industry = industry;
        }
        return api.get(`${BASE_URL}/networking/dashboard`, { params });
    }

    getDashboardData(periodDays = 30) {
        return this.getNetworkingDashboard(periodDays);
    }

    trackROIOutcome(roiData) {
        return api.post(`${BASE_URL}/networking/roi-outcome`, roiData);
    }
}

const networkAnalyticsAPI = new NetworkAnalyticsAPI();

export { networkAnalyticsAPI };
export default networkAnalyticsAPI;
