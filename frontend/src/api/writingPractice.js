import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Get auth headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('session');
  const uuid = localStorage.getItem('uuid');

  return {
    'Authorization': `Bearer ${token}`,
    'uuid': uuid,
    'Content-Type': 'application/json'
  };
};

const WritingPracticeAPI = {
  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Start a new writing practice session
   * @param {string} questionId - Optional question ID. If not provided, random question will be selected
   * @param {string} category - Question category (behavioral, technical, situational, etc.)
   * @param {number} timeLimitSeconds - Time limit for the exercise (default: 300 seconds = 5 minutes)
   */
  startSession: (questionId = null, category = 'behavioral', timeLimitSeconds = 300) => {
    return axios.post(
      `${API_BASE_URL}/interview/writing-practice/start`,
      {
        question_id: questionId,
        category: category,
        time_limit_seconds: timeLimitSeconds
      },
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Submit a written response for AI analysis
   * @param {string} sessionId - The session ID
   * @param {string} responseText - The user's written response
   */
  submitResponse: (sessionId, responseText) => {
    return axios.post(
      `${API_BASE_URL}/interview/writing-practice/submit`,
      {
        session_id: sessionId,
        response_text: responseText
      },
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Get all writing practice sessions for the current user
   * @param {number} limit - Maximum number of sessions to return (default: 50)
   */
  getUserSessions: (limit = 50) => {
    return axios.get(
      `${API_BASE_URL}/interview/writing-practice/sessions?limit=${limit}`,
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Get details for a specific writing practice session
   * @param {string} sessionId - The session ID
   */
  getSessionDetails: (sessionId) => {
    return axios.get(
      `${API_BASE_URL}/interview/writing-practice/sessions/${sessionId}`,
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Get all sessions for a specific question (track improvement on that question)
   * @param {string} questionId - The question ID
   */
  getSessionsByQuestion: (questionId) => {
    return axios.get(
      `${API_BASE_URL}/interview/writing-practice/sessions/question/${questionId}`,
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Compare current session with previous session for the same question
   * @param {string} sessionId - The session ID to compare
   */
  compareWithPrevious: (sessionId) => {
    return axios.get(
      `${API_BASE_URL}/interview/writing-practice/compare/${sessionId}`,
      { headers: getAuthHeaders() }
    );
  },

  // ============================================================================
  // RESOURCES & TIPS
  // ============================================================================

  /**
   * Get writing tips and best practices for interview responses
   */
  getWritingTips: () => {
    return axios.get(
      `${API_BASE_URL}/interview/writing-practice/tips`,
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Get nerves management exercises to reduce anxiety before interviews
   */
  getNervesExercises: () => {
    return axios.get(
      `${API_BASE_URL}/interview/writing-practice/exercises`,
      { headers: getAuthHeaders() }
    );
  },

  /**
   * Get available writing practice questions
   * @param {string} category - Optional category filter
   */
  getQuestions: (category = null) => {
    const url = category
      ? `${API_BASE_URL}/interview/writing-practice/questions?category=${category}`
      : `${API_BASE_URL}/interview/writing-practice/questions`;

    return axios.get(
      url,
      { headers: getAuthHeaders() }
    );
  }
};

export default WritingPracticeAPI;
