import api from "./base";

const BASE_URL = "/networks"

class NetworksAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(contactId) {
        return api.get(`${BASE_URL}?contact_id=${contactId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }
    update(contactId, data) {
        return api.put(`${BASE_URL}?contact_id=${contactId}`);
    }

    delete(contactId) {
        return api.delete(`${BASE_URL}?contact_id=${contactId}`);
    }

    uploadAvatar(contactId, image) {
        const formData = new FormData();
        formData.append("media", image);
        return api.post(`${BASE_URL}/avatar?contact_id=${contactId}`, formData);
    }

    getAvatar(contactId) {
        return api.get(`${BASE_URL}/avatar`, {params: {contact_id: contactId}, responseType: "blob"});
    }

    updateAvatar(contactId, file) {
        const formData = new FormData();
        formData.append("media", file);
        return api.put(`${BASE_URL}/avatar?contact_id=${contactId}`, formData);
    }

    deleteAvatar(contactId) {
        return api.delete(`${BASE_URL}/avatar?contact_id=${contactId}`);
    }
}

export default new NetworksAPI();