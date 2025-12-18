import api from "./base";

const BASE_URL = "/emails";

class EmailsAPI {
    // Authentication
    async checkAuthStatus() {
        return api.get(`${BASE_URL}/auth/status`);
    }

    async initiateConnection() {
        return api.get(`${BASE_URL}/auth/connect`);
    }

    async disconnect() {
        return api.post(`${BASE_URL}/auth/disconnect`);
    }

    // Search
    async searchByCompany(companyName, daysBack = 90) {
        return api.get(`${BASE_URL}/search/company/${encodeURIComponent(companyName)}?days_back=${daysBack}`);
    }

    async searchByKeywords(keywords, daysBack = 90) {
        return api.post(`${BASE_URL}/search/keywords?days_back=${daysBack}`, keywords);
    }

    async searchCustom(query, maxResults = 20) {
        return api.post(`${BASE_URL}/search`, { query, max_results: maxResults });
    }

    // Linking
    async linkEmail(emailData) {
        return api.post(`${BASE_URL}/link`, emailData);
    }

    async unlinkEmail(linkedEmailId) {
        return api.post(`${BASE_URL}/unlink`, { linked_email_id: linkedEmailId });
    }

    async getJobEmails(jobId) {
        return api.get(`${BASE_URL}/job/${jobId}`);
    }

    // Email details
    async getEmailBody(emailId) {
        return api.get(`${BASE_URL}/email/${emailId}/body`);
    }

    async updateEmailNotes(linkedEmailId, notes) {
        return api.post(`${BASE_URL}/notes`, {
            linked_email_id: linkedEmailId,
            notes
        });
    }

    // Stats
    async getStats() {
        return api.get(`${BASE_URL}/stats`);
    }
}

export default new EmailsAPI();