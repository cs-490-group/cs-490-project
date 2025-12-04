import api from "./base";

const BASE_URL = "/advisors";

class AdvisorsAPI {
  // User Methods
  inviteAdvisor(data) {
    return api.post(`${BASE_URL}/invite`, data);
  }

  getMyAdvisors() {
    return api.get(`${BASE_URL}/me`);
  }

  updateTaskStatus(engId, taskId, status) {
    return api.put(`${BASE_URL}/${engId}/tasks/${taskId}?status=${status}`);
  }

  // Advisor Methods (Public Portal)
  getPortal(engId) {
    return api.get(`${BASE_URL}/portal/${engId}`);
  }

  addSession(engId, data) {
    return api.post(`${BASE_URL}/portal/${engId}/sessions`, data);
  }

  addTask(engId, data) {
    return api.post(`${BASE_URL}/portal/${engId}/tasks`, data);
  }

  deleteAdvisor(engId) {
    return api.delete(`${BASE_URL}/${engId}`);
  }

  rateSession(engId, sessionId, rating, feedback) {
    return api.post(`${BASE_URL}/${engId}/sessions/${sessionId}/rate`, { rating, feedback });
  }
}

export default new AdvisorsAPI();