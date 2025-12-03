import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const technicalPrepAPI = {
  // ============ CHALLENGE ENDPOINTS ============

  // Get all challenges with filters
  getChallenges: async (skip = 0, limit = 10, challengeType = null, difficulty = null, search = null) => {
    const params = new URLSearchParams({
      skip,
      limit,
      ...(challengeType && { challenge_type: challengeType }),
      ...(difficulty && { difficulty }),
      ...(search && { search })
    });

    return axios.get(`${API_BASE_URL}/technical-prep/challenges?${params}`);
  },

  // Get recommended challenges for user
  getRecommendedChallenges: async (uuid, jobRole = null, skills = null, difficulty = null, limit = 10) => {
    const params = new URLSearchParams({
      ...(jobRole && { job_role: jobRole }),
      ...(difficulty && { difficulty }),
      limit
    });

    if (skills && skills.length > 0) {
      skills.forEach(skill => params.append("skills", skill));
    }

    return axios.get(`${API_BASE_URL}/technical-prep/challenges/recommended/${uuid}?${params}`);
  },

  // Get specific challenge
  getChallenge: async (challengeId) => {
    return axios.get(`${API_BASE_URL}/technical-prep/challenges/${challengeId}`);
  },

  // Generate coding challenge
  generateCodingChallenge: async (uuid, difficulty = "medium", skills = null, jobRole = null) => {
    const params = new URLSearchParams({
      uuid,
      difficulty,
      ...(jobRole && { job_role: jobRole })
    });

    if (skills && skills.length > 0) {
      skills.forEach(skill => params.append("skills", skill));
    }

    return axios.post(`${API_BASE_URL}/technical-prep/challenges/coding/generate?${params}`);
  },

  // Generate system design challenge
  generateSystemDesignChallenge: async (uuid, seniority = "senior", focusAreas = null) => {
    const params = new URLSearchParams({
      uuid,
      seniority
    });

    if (focusAreas && focusAreas.length > 0) {
      focusAreas.forEach(area => params.append("focus_areas", area));
    }

    return axios.post(`${API_BASE_URL}/technical-prep/challenges/system-design/generate?${params}`);
  },

  // Generate case study
  generateCaseStudy: async (uuid, industry = null) => {
    const params = new URLSearchParams({
      uuid,
      ...(industry && { industry })
    });

    return axios.post(`${API_BASE_URL}/technical-prep/challenges/case-study/generate?${params}`);
  },

  // ============ ATTEMPT ENDPOINTS ============

  // Start a challenge attempt
  startAttempt: async (uuid, challengeId) => {
    return axios.post(`${API_BASE_URL}/technical-prep/attempts/${uuid}/${challengeId}`);
  },

  // Submit code
  submitCode: async (attemptId, code, language) => {
    return axios.post(`${API_BASE_URL}/technical-prep/attempts/${attemptId}/submit`, null, {
      params: { code, language }
    });
  },

  // Complete attempt
  completeAttempt: async (attemptId, score, passedTests, totalTests, code = null) => {
    const params = new URLSearchParams({
      score,
      passed_tests: passedTests,
      total_tests: totalTests,
      ...(code && { code })
    });

    return axios.post(`${API_BASE_URL}/technical-prep/attempts/${attemptId}/complete?${params}`);
  },

  // Get attempt details
  getAttempt: async (attemptId) => {
    return axios.get(`${API_BASE_URL}/technical-prep/attempts/${attemptId}`);
  },

  // Get user's attempts
  getUserAttempts: async (uuid, limit = 50) => {
    return axios.get(`${API_BASE_URL}/technical-prep/user/${uuid}/attempts`, {
      params: { limit }
    });
  },

  // Get challenge attempts
  getChallengeAttempts: async (challengeId) => {
    return axios.get(`${API_BASE_URL}/technical-prep/challenge/${challengeId}/attempts`);
  },

  // ============ STATISTICS & ANALYTICS ============

  // Get user statistics
  getUserStatistics: async (uuid) => {
    return axios.get(`${API_BASE_URL}/technical-prep/user/${uuid}/statistics`);
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (challengeId, limit = 10) => {
    return axios.get(`${API_BASE_URL}/technical-prep/challenge/${challengeId}/leaderboard`, {
      params: { limit }
    });
  }
};

export default technicalPrepAPI;
