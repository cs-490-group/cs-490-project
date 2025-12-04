// salary.js
import api from "./base";

const BASE_URL = "/salary";

class SalaryAPI {
    // Salary record CRUD operations
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(salaryId) {
        return api.get(`${BASE_URL}?salary_id=${salaryId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(salaryId, data) {
        return api.put(`${BASE_URL}?salary_id=${salaryId}`, data);
    }

    delete(salaryId) {
        return api.delete(`${BASE_URL}?salary_id=${salaryId}`);
    }

    // Analytics endpoints
    getHistory() {
        return api.get(`${BASE_URL}/history`);
    }

    getStats() {
        return api.get(`${BASE_URL}/stats`);
    }

    // Get complete salary analytics (history + stats + market data)
    getAnalytics() {
        return api.get(`${BASE_URL}/analytics`);
    }

    // Market data comparison
    getMarketData(params) {
        // params: { role, location, experience_years }
        return api.get(`${BASE_URL}/market`, { params });
    }
}

export default new SalaryAPI();