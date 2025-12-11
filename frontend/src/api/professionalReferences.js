import api from "./base";

const BASE_URL = "/references"

class ProfessionalReferencesAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    get(referenceId) {
        return api.get(`${BASE_URL}/${referenceId}`);
    }

    update(referenceId, data) {
        return api.put(`${BASE_URL}/${referenceId}`, data);
    }

    delete(referenceId) {
        return api.delete(`${BASE_URL}/${referenceId}`);
    }

    getAvailable() {
        return api.get(`${BASE_URL}/available`);
    }

    getByCompany(company) {
        return api.get(`${BASE_URL}/company/${company}`);
    }

    requestReference(referenceId, requestData) {
        return api.post(`${BASE_URL}/${referenceId}/request`, requestData);
    }

    addPreparation(referenceId, preparationData) {
        return api.post(`${BASE_URL}/${referenceId}/preparation`, preparationData);
    }

    updateFeedback(referenceId, feedbackData) {
        return api.put(`${BASE_URL}/${referenceId}/feedback`, feedbackData);
    }

    markThankYouSent(referenceId, thankYouData) {
        return api.post(`${BASE_URL}/${referenceId}/thank-you`, thankYouData);
    }
}

export default new ProfessionalReferencesAPI();
