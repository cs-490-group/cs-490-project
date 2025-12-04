import api from "./base";

const BASE_URL = "/referrals"

class ReferralsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    get(referralId) {
        return api.get(`${BASE_URL}/${referralId}`);
    }

    update(referralId, data) {
        return api.put(`${BASE_URL}/${referralId}`, data);
    }

    delete(referralId) {
        return api.delete(`${BASE_URL}/${referralId}`);
    }

    getByStatus(status) {
        return api.get(`${BASE_URL}/status/${status}`);
    }

    getByContact(contactId) {
        return api.get(`${BASE_URL}/contact/${contactId}`);
    }

    recordOutcome(referralId, outcomeData) {
        return api.post(`${BASE_URL}/${referralId}/outcome`, outcomeData);
    }
}

export default new ReferralsAPI();
