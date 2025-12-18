import api from "./base";

const BASE_URL = "/projects";

class ProjectsAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(projectId) {
        return api.get(`${BASE_URL}?project_id=${projectId}`);
    }
    
    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(projectId, data) {
        return api.put(`${BASE_URL}?project_id=${projectId}`, data);
    }

    delete(projectId) {
        return api.delete(`${BASE_URL}?project_id=${projectId}`);
    }

    uploadMedia(projectId, file) {
        const formData = new FormData();
        formData.append("media", file);
        return api.post(`${BASE_URL}/media?project_id=${projectId}`, formData);
    }

    getMedia(mediaId) { 
        // "download" determines whether to immediately download the file or send it as a blob
        return api.get(`${BASE_URL}/media`, {params: {media_id: mediaId}, responseType: "blob"});
    }

    getMediaIds(mediaId) {
        return api.get(`${BASE_URL}/media/ids?project_id=${mediaId}`);
    }

    updateMedia(mediaId, file) {
        const formData = new FormData();
        formData.append("media", file);
        return api.put(`${BASE_URL}/media?media_id=${mediaId}`, formData);
    }

    deleteMedia(mediaId) {
        return api.delete(`${BASE_URL}/media?media_id=${mediaId}`);
    }
}

export default new ProjectsAPI();