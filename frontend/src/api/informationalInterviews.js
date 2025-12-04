import api from "./base";

const BASE_URL = "/interviews"

class InformationalInterviewsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    get(interviewId) {
        return api.get(`${BASE_URL}/${interviewId}`);
    }

    update(interviewId, data) {
        return api.put(`${BASE_URL}/${interviewId}`, data);
    }

    delete(interviewId) {
        return api.delete(`${BASE_URL}/${interviewId}`);
    }

    getByStatus(status) {
        return api.get(`${BASE_URL}/status/${status}`);
    }

    getUpcoming() {
        return api.get(`${BASE_URL}/upcoming`);
    }

    getCompleted() {
        return api.get(`${BASE_URL}/completed`);
    }

    addPreparation(interviewId, preparationData) {
        return api.post(`${BASE_URL}/${interviewId}/preparation`, preparationData);
    }

    addFollowUp(interviewId, followUpData) {
        return api.post(`${BASE_URL}/${interviewId}/followup`, followUpData);
    }

    complete(interviewId, completionData) {
        return api.put(`${BASE_URL}/${interviewId}/complete`, completionData);
    }
}

export default new InformationalInterviewsAPI();
