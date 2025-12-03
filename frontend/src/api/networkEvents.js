import api from "./base";

const BASE_URL = "/events"

class NetworkEventsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    get(eventId) {
        return api.get(`${BASE_URL}/${eventId}`);
    }

    update(eventId, data) {
        return api.put(`${BASE_URL}/${eventId}`, data);
    }

    delete(eventId) {
        return api.delete(`${BASE_URL}/${eventId}`);
    }

    getUpcoming() {
        return api.get(`${BASE_URL}/upcoming`);
    }

    getPast() {
        return api.get(`${BASE_URL}/past`);
    }

    getByDateRange(startDate, endDate) {
        return api.get(`${BASE_URL}/range`, {
            params: { start_date: startDate, end_date: endDate }
        });
    }

    addPreparation(eventId, preparationData) {
        return api.post(`${BASE_URL}/${eventId}/preparation`, preparationData);
    }

    addFollowUp(eventId, followUpData) {
        return api.post(`${BASE_URL}/${eventId}/followup`, followUpData);
    }
}

export default new NetworkEventsAPI();
