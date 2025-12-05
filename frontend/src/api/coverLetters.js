import api from "./base";

const BASE_URL = "/cover-letters";

class CoverLetterAPI {
  // GET all cover letters for the current user
  getAll() {
    // Backend gets uuid from header, not URL parameter
    return api.get(`${BASE_URL}/me`);
  }

  // GET a specific cover letter by ID
  get(coverLetterId) {
    return api.get(`${BASE_URL}/${coverLetterId}`);
  }

  // POST create a new cover letter
  add(data) {
    return api.post(BASE_URL, data);
  }

  // POST upload a cover letter file
  upload(data) {
    return api.post(`${BASE_URL}/upload`, data);
  }

  // PUT update an existing cover letter
  update(coverLetterId, data) {
    return api.put(`${BASE_URL}/${coverLetterId}`, data);
  }

  // DELETE a cover letter
  delete(coverLetterId) {
    return api.delete(`${BASE_URL}/${coverLetterId}`);
  }

  // GET usage stats aggregated by template type
  getUsageByType() {
    return api.get(`${BASE_URL}/usage/by-type`);
  }

  
  setDefault(coverLetterId) {
    return api.put(`${BASE_URL}/${coverLetterId}/default`);
  }

 addToJob(coverLetterId, jobId) {
    return api.put(`${BASE_URL}/${coverLetterId}`, {
        job_id: jobId
    });
}

// Share Management
  createShareLink(id, settings) {
    return api.post(`${BASE_URL}/${id}/share`, settings);
  }

  getShareLink(id) {
    return api.get(`${BASE_URL}/${id}/share`);
  }

  revokeShareLink(id) {
    return api.delete(`${BASE_URL}/${id}/share`);
  }

  // Public Access
  getSharedCoverLetter(token) {
    return api.get(`${BASE_URL}/public/${token}`);
  }

  addPublicFeedback(token, data) {
    return api.post(`${BASE_URL}/public/${token}/feedback`, data);
  }

  updatePublicStatus(token, status) {
        return api.post(`${BASE_URL}/public/${token}/status`, { status });
    }

  // Feedback Management (Internal)
  getFeedback(id) {
    return api.get(`${BASE_URL}/${id}/feedback`);
  }

  addFeedback(id, data) {
    return api.post(`${BASE_URL}/${id}/feedback`, data);
  }

  updateFeedback(id, feedbackId, data) {
    return api.put(`${BASE_URL}/${id}/feedback/${feedbackId}`, data);
  }

  deleteFeedback(id, feedbackId) {
    return api.delete(`${BASE_URL}/${id}/feedback/${feedbackId}`);
  }

  createVersion(id, data) {
    return api.post(`${BASE_URL}/${id}/versions`, data);
  }

  getVersions(id) {
    return api.get(`${BASE_URL}/${id}/versions`);
  }

  restoreVersion(id, versionId) {
    return api.post(`${BASE_URL}/${id}/versions/${versionId}/restore`);
  }

  deleteVersion(id, versionId) {
    return api.delete(`${BASE_URL}/${id}/versions/${versionId}`);
  }

  getPerformanceStats() {
    return api.get(`${BASE_URL}/analytics/performance`);
  }

  downloadDOCX(coverLetterId) {
    return api.get(`${BASE_URL}/${coverLetterId}/download/docx`, {
      responseType: 'blob', 
    });
  }
}

export default new CoverLetterAPI();