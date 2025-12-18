import api from "./base";

const BASE_URL = "/question-bank";

class QuestionBankAPI {
  // ============================================================================
  // INDUSTRY ENDPOINTS
  // ============================================================================

  /**
   * Get all industries
   * @returns {Promise} Array of industries
   */
  getAllIndustries() {
    return api.get(`${BASE_URL}/industries`);
  }

  /**
   * Get a specific industry by ID
   * @param {string} industryId - The industry UUID
   * @returns {Promise} Industry object
   */
  getIndustry(industryId) {
    return api.get(`${BASE_URL}/industries/${industryId}`);
  }

  /**
   * Create a new industry (admin only)
   * @param {object} data - Industry data
   * @returns {Promise} Created industry with UUID
   */
  createIndustry(data) {
    return api.post(`${BASE_URL}/industries`, data);
  }

  // ============================================================================
  // ROLE ENDPOINTS
  // ============================================================================

  /**
   * Get all roles for a specific industry
   * @param {string} industryId - The industry UUID
   * @returns {Promise} Array of roles
   */
  getRolesByIndustry(industryId) {
    return api.get(`${BASE_URL}/industries/${industryId}/roles`);
  }

  /**
   * Get a specific role by ID
   * @param {string} roleId - The role UUID
   * @returns {Promise} Role object
   */
  getRole(roleId) {
    return api.get(`${BASE_URL}/roles/${roleId}`);
  }

  /**
   * Create a new role (admin only)
   * @param {object} data - Role data with industry_uuid
   * @returns {Promise} Created role with UUID
   */
  createRole(data) {
    return api.post(`${BASE_URL}/roles`, data);
  }

  // ============================================================================
  // QUESTION ENDPOINTS
  // ============================================================================

  /**
   * Get all questions for a specific role
   * @param {string} roleId - The role UUID
   * @returns {Promise} Array of questions
   */
  getQuestionsByRole(roleId) {
    return api.get(`${BASE_URL}/roles/${roleId}/questions`);
  }

  /**
   * Get a specific question by ID
   * @param {string} questionId - The question UUID
   * @returns {Promise} Question object with STAR framework, sample answers, etc.
   */
  getQuestion(questionId) {
    return api.get(`${BASE_URL}/questions/${questionId}`);
  }

  /**
   * Get questions by role and category
   * @param {string} roleId - The role UUID
   * @param {string} category - Category: behavioral, technical, situational, company
   * @returns {Promise} Array of questions
   */
  getQuestionsByCategory(roleId, category) {
    return api.get(
      `${BASE_URL}/roles/${roleId}/questions/category/${category}`
    );
  }

  /**
   * Get questions by role and difficulty
   * @param {string} roleId - The role UUID
   * @param {string} difficulty - Difficulty: entry, mid, senior
   * @returns {Promise} Array of questions
   */
  getQuestionsByDifficulty(roleId, difficulty) {
    return api.get(
      `${BASE_URL}/roles/${roleId}/questions/difficulty/${difficulty}`
    );
  }

  /**
   * Create a new question (admin only)
   * @param {object} data - Question data
   * @returns {Promise} Created question with UUID
   */
  createQuestion(data) {
    return api.post(`${BASE_URL}/questions`, data);
  }

  // ============================================================================
  // USER PRACTICE ENDPOINTS
  // ============================================================================

  /**
   * Save or update user's response to a question
   * @param {string} questionId - The question UUID
   * @param {object} responseData - { response_html, is_marked_practiced }
   * @returns {Promise} Confirmation with response_id
   */
  saveQuestionResponse(questionId, responseData) {
    return api.post(
      `${BASE_URL}/questions/${questionId}/save-response`,
      responseData
    );
  }

  /**
   * Get user's response to a specific question
   * @param {string} questionId - The question UUID
   * @returns {Promise} User's response object
   */
  getQuestionResponse(questionId) {
    return api.get(`${BASE_URL}/questions/${questionId}/response`);
  }

  /**
   * Get all questions user has practiced
   * @returns {Promise} Array of practiced question responses
   */
  getPracticedQuestions() {
    return api.get(`${BASE_URL}/questions/practiced`);
  }

  /**
   * Get all practiced questions for a user in a specific role
   * @param {string} roleId - The role UUID
   * @returns {Promise} Array of practiced questions in that role
   */
  getPracticedQuestionsByRole(roleId) {
    return api.get(`${BASE_URL}/roles/${roleId}/questions/practiced`);
  }

  /**
   * Mark a question as practiced
   * @param {string} questionId - The question UUID
   * @returns {Promise} Confirmation
   */
  markQuestionPracticed(questionId) {
    return api.put(`${BASE_URL}/questions/${questionId}/mark-practiced`);
  }

  /**
   * Delete user's response to a question
   * @param {string} questionId - The question UUID
   * @returns {Promise} Confirmation
   */
  deleteQuestionResponse(questionId) {
    return api.delete(`${BASE_URL}/questions/${questionId}/response`);
  }
}

export default new QuestionBankAPI();
