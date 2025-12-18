import api from "./base";

const BASE_URL = "/education";

class EducationAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(educationId) {
        return api.get(`${BASE_URL}?education_id=${educationId}`);
    }
    
    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(educationId, data) {
        return api.put(`${BASE_URL}?education_id=${educationId}`, data);
    }

    delete(educationId) {
        return api.delete(`${BASE_URL}?education_id=${educationId}`);
    }
}

export default new EducationAPI();