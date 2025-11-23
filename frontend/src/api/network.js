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

    uploadAvatar(image) {
        const formData = new FormData();
        formData.append("media", image);
        return api.post(`${BASE_URL}/avatar`, formData);
    }

    getAvatar(mediaId) {
        return api.get(`${BASE_URL}/avatar`, {params: {media_id: mediaId}, responseType: "blob"});
    }

    updateAvatar(mediaId, file) {
        const formData = new FormData();
        formData.append("media", file);
        return api.put(`${BASE_URL}/avatar?${mediaId}`, formData);
    }

    deleteAvatar(mediaId) {
        return api.delete(`${BASE_URL}/avatar?media_id=${mediaId}`);
    }
}

export default new NetworksAPI();