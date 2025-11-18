import api from "./base";

const BASE_URL = "/resumes";

class ResumesAPI {
    // CORE RESUME OPERATIONS
    add(data) {
        return api.post(BASE_URL, data);
    }

    get(resumeId) {
        return api.get(`${BASE_URL}?resume_id=${resumeId}`);
    }

    getAll() {
        return api.get(`${BASE_URL}/me`);
    }

    update(resumeId, data) {
        return api.put(`${BASE_URL}?resume_id=${resumeId}`, data);
    }

    delete(resumeId) {
        return api.delete(`${BASE_URL}?resume_id=${resumeId}`);
    }

    setDefault(resumeId) {
        return api.put(`${BASE_URL}/${resumeId}/set-default`);
    }

    // RESUME VERSIONS
    createVersion(resumeId, data) {
        return api.post(`${BASE_URL}/${resumeId}/versions`, data);
    }

    getVersions(resumeId) {
        return api.get(`${BASE_URL}/${resumeId}/versions`);
    }

    restoreVersion(resumeId, versionId) {
        return api.post(`${BASE_URL}/${resumeId}/versions/${versionId}/restore`);
    }

    deleteVersion(resumeId, versionId) {
        return api.delete(`${BASE_URL}/${resumeId}/versions/${versionId}`);
    }

    renameVersion(resumeId, versionId, name, description = null, jobLinked = null) {
        const params = new URLSearchParams({ name });
        if (description) {
            params.append('description', description);
        }
        if (jobLinked) {
            params.append('job_linked', jobLinked);
        }
        return api.put(`${BASE_URL}/${resumeId}/versions/${versionId}/rename?${params.toString()}`);
    }

    // RESUME FEEDBACK
    addFeedback(resumeId, data) {
        return api.post(`${BASE_URL}/${resumeId}/feedback`, data);
    }

    getFeedback(resumeId) {
        return api.get(`${BASE_URL}/${resumeId}/feedback`);
    }

    updateFeedback(resumeId, feedbackId, data) {
        return api.put(`${BASE_URL}/${resumeId}/feedback/${feedbackId}`, data);
    }

    deleteFeedback(resumeId, feedbackId) {
        return api.delete(`${BASE_URL}/${resumeId}/feedback/${feedbackId}`);
    }

    // RESUME SHARING
    createShareLink(resumeId, data) {
        return api.post(`${BASE_URL}/${resumeId}/share`, data);
    }

    getShareLink(resumeId) {
        return api.get(`${BASE_URL}/${resumeId}/share`);
    }

    revokeShareLink(resumeId) {
        return api.delete(`${BASE_URL}/${resumeId}/share`);
    }

    // PUBLIC: Get shared resume (no auth required)
    getSharedResume(token) {
        return api.get(`${BASE_URL}/public/${token}`);
    }

    validateResume(resumeId) {
        return api.post(`${BASE_URL}/${resumeId}/validate`);
    }

    generateContent(resumeId, jobPosting) {
        return api.post(`${BASE_URL}/${resumeId}/generate-content`, { job_posting: jobPosting });
    }

    optimizeSkills(resumeId, jobPosting) {
        return api.post(`${BASE_URL}/${resumeId}/optimize-skills`, { job_posting: jobPosting });
    }

    tailorExperience(resumeId, jobPosting) {
        return api.post(`${BASE_URL}/${resumeId}/tailor-experience`, { job_posting: jobPosting });
    }

    // PDF/EXPORT
    generatePDF(resumeId, html) {
        return api.post(`${BASE_URL}/${resumeId}/generate-pdf`, { html });
    }

    previewPDF(resumeId, html) {
        return api.post(`${BASE_URL}/${resumeId}/preview-pdf`, { html });
    }

    exportPDF(resumeId) {
        return api.post(`${BASE_URL}/${resumeId}/export-pdf`, {}, {
            responseType: 'blob'
        });
    }

    exportHTML(resumeId) {
        return api.post(`${BASE_URL}/${resumeId}/export-html`, {}, {
            responseType: 'blob'
        });
    }

    generateDOCX(resumeId) {
        return api.post(`${BASE_URL}/${resumeId}/generate-docx`, {}, {
            responseType: 'blob'
        });
    }
}

const resumesAPI = new ResumesAPI();
export default resumesAPI;