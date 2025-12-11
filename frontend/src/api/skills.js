import api from "./base";

const BASE_URL = "/skills";

class SkillsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(skillId) {
        return api.get(`${BASE_URL}?skill_id=${skillId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(skillId, data) {
        return api.put(`${BASE_URL}?skill_id=${skillId}`, data);
    }

    delete(skillId) {
        return api.delete(`${BASE_URL}?skill_id=${skillId}`);
    }
}

export default new SkillsAPI();