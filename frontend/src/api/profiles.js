import api from "./base";

const BASE_URL = "/users";

class ProfilesAPI {
    // Current user endpoints
    get() {
        return api.get(`${BASE_URL}/me`);
    }

    update(data) {
        return api.put(`${BASE_URL}/me`, data);
    }

    deleteAllData(passBody) {
        console.log("PASSBODY ", passBody)
        return api.post(`${BASE_URL}/me`, passBody);
    }

    uploadAvatar(image) {
        const formData = new FormData();
        formData.append("image", image);
        return api.post(`${BASE_URL}/me/avatar`, formData);
    }

    getAvatar() {
        return api.get(`${BASE_URL}/me/avatar`, {responseType: "blob"});
    }

    updateAvatar(avatarId, image) {
        const formData = new FormData();
        formData.append("image", image);
        return api.put(`${BASE_URL}/me/avatar?media_id=${avatarId}`, formData);
    }

    deleteAvatar(avatarId) {
        return api.delete(`${BASE_URL}/me/avatar?media_id=${avatarId}`);
    }

    // Other user endpoints (for viewing profiles)
    getById(userId) {
        return api.get(`${BASE_URL}/${userId}`);
    }

    getAvatarById(userId) {
        return api.get(`${BASE_URL}/${userId}/avatar`, {responseType: "blob"});
    }
}

export default new ProfilesAPI();