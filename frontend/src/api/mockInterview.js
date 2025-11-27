import api from "./base";

const BASE_URL = "/mock-interview";

class MockInterviewAPI {
  // ============================================================================
  // MOCK INTERVIEW SESSION CREATION
  // ============================================================================

  /**
   * Start a new mock interview session
   * @param {object} data - Interview configuration
   *   - role_uuid: Target role UUID
   *   - industry_uuid: Target industry UUID
   *   - difficulty_level: entry, mid, or senior
   *   - include_behavioral: boolean
   *   - include_technical: boolean
   *   - include_situational: boolean
   * @returns {Promise} Session data with first question
   */
  startMockInterview(data) {
    return api.post(`${BASE_URL}/start`, data);
  }

  // ============================================================================
  // INTERVIEW QUESTION SUBMISSION
  // ============================================================================

  /**
   * Submit user's response to current interview question
   * @param {string} sessionId - Mock interview session UUID
   * @param {object} responseData - { response_text, response_duration_seconds }
   * @returns {Promise} Next question or completion confirmation
   */
  submitInterviewResponse(sessionId, responseData) {
    return api.post(`${BASE_URL}/sessions/${sessionId}/submit-response`, responseData);
  }

  // ============================================================================
  // INTERVIEW SESSION COMPLETION
  // ============================================================================

  /**
   * Mark interview session as completed
   * @param {string} sessionId - Mock interview session UUID
   * @returns {Promise} Interview completion summary
   */
  completeInterview(sessionId) {
    return api.post(`${BASE_URL}/sessions/${sessionId}/complete`);
  }

  // ============================================================================
  // INTERVIEW SESSION RETRIEVAL
  // ============================================================================

  /**
   * Get details of a specific mock interview session
   * @param {string} sessionId - Mock interview session UUID
   * @returns {Promise} Session data with progress information
   */
  getInterviewSession(sessionId) {
    return api.get(`${BASE_URL}/sessions/${sessionId}`);
  }

  /**
   * Get all mock interview sessions for current user
   * @returns {Promise} Array of user's interview sessions
   */
  getUserInterviewSessions() {
    return api.get(`${BASE_URL}/sessions`);
  }

  /**
   * Get all mock interview sessions for a specific role
   * @param {string} roleId - Role UUID
   * @returns {Promise} Array of interview sessions for that role
   */
  getUserSessionsByRole(roleId) {
    return api.get(`${BASE_URL}/sessions/role/${roleId}`);
  }

  // ============================================================================
  // INTERVIEW SESSION MANAGEMENT
  // ============================================================================

  /**
   * Abandon an in-progress interview session
   * @param {string} sessionId - Mock interview session UUID
   * @returns {Promise} Confirmation
   */
  abandonInterview(sessionId) {
    return api.post(`${BASE_URL}/sessions/${sessionId}/abandon`);
  }

  /**
   * Delete a mock interview session
   * @param {string} sessionId - Mock interview session UUID
   * @returns {Promise} Confirmation
   */
  deleteInterviewSession(sessionId) {
    return api.delete(`${BASE_URL}/sessions/${sessionId}`);
  }
}

export default new MockInterviewAPI();
