import api from "./base";

const BASE_URL = "/employment";

class EmploymentAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(employmentId) {
        return api.get(`${BASE_URL}?employment_id=${employmentId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(employmentId, data) {
        return api.put(`${BASE_URL}?employment_id=${employmentId}`, data);
    }

    delete(employmentId) {
        return api.delete(`${BASE_URL}?employment_id=${employmentId}`);
    }
}

export default new EmploymentAPI();