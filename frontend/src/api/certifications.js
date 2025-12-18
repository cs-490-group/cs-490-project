import api from "./base";

const BASE_URL = "/certifications";

class CertificationsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(certificationId) {
        return api.get(`${BASE_URL}?certification_id=${certificationId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(certificationId, data) {
        return api.put(`${BASE_URL}?certification_id=${certificationId}`, data);
    }

    delete(certificationId) {
        return api.delete(`${BASE_URL}?certification_id=${certificationId}`);
    }

    uploadMedia(certificationId, file) {
        const formData = new FormData();
        formData.append("media", file);
        return api.post(`${BASE_URL}/media?certification_id=${certificationId}`, formData);
    }

    getMedia(mediaId) { 
        // "download" determines whether to immediately download the file or send it as a blob
        return api.get(`${BASE_URL}/media`, {params: {media_id: mediaId}, responseType: "blob"});
    }

    getMediaIds(certificationId) {
        return api.get(`${BASE_URL}/media/ids?certification_id=${certificationId}`);
    }

    updateMedia(mediaId, file) {
        const formData = new FormData();
        formData.append("media", file);
        return api.put(`${BASE_URL}/media?media_id=${mediaId}`, file);
    }

    deleteMedia(mediaId) {
        return api.delete(`${BASE_URL}/media?media_id=${mediaId}`);
    }
}

export default new CertificationsAPI();