import api from "./base";

const BASE_URL = "/campaigns"

class NetworkCampaignsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    get(campaignId) {
        return api.get(`${BASE_URL}/${campaignId}`);
    }

    update(campaignId, data) {
        return api.put(`${BASE_URL}/${campaignId}`, data);
    }

    delete(campaignId) {
        return api.delete(`${BASE_URL}/${campaignId}`);
    }

    getActive() {
        return api.get(`${BASE_URL}/active`);
    }

    getCompleted() {
        return api.get(`${BASE_URL}/completed`);
    }

    addOutreach(campaignId, outreachData) {
        return api.post(`${BASE_URL}/${campaignId}/outreach`, outreachData);
    }

    addAnalytics(campaignId, analyticsData) {
        return api.post(`${BASE_URL}/${campaignId}/analytics`, analyticsData);
    }

    updateStatus(campaignId, statusData) {
        return api.put(`${BASE_URL}/${campaignId}/status`, statusData);
    }
}

export default new NetworkCampaignsAPI();
