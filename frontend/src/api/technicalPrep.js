import api from "./base";

const technicalPrepAPI = {
  // ============ CHALLENGE ENDPOINTS ============

  // Get all challenges with filters
  getChallenges: async (skip = 0, limit = 10, challengeType = null, difficulty = null, search = null) => {
    const params = {
      skip,
      limit,
      ...(challengeType && { challenge_type: challengeType }),
      ...(difficulty && { difficulty }),
      ...(search && { search })
    };

    return api.get("/technical-prep/challenges", { params });
  },

  // Get recommended challenges for user
  getRecommendedChallenges: async (uuid, jobRole = null, skills = null, difficulty = null, limit = 10) => {
    const params = {
      ...(jobRole && { job_role: jobRole }),
      ...(difficulty && { difficulty }),
      limit
    };

    if (skills && skills.length > 0) {
      skills.forEach(skill => params[`skills`] = skill);
    }

    return api.get(`/technical-prep/challenges/recommended/${uuid}`, { params });
  },

  // Get specific challenge
  getChallenge: async (challengeId) => {
    return api.get(`/technical-prep/challenges/${challengeId}`);
  },

  // Generate coding challenge
  generateCodingChallenge: async (uuid, difficulty = "medium", skills = null, jobRole = null) => {
    const params = {
      uuid,
      difficulty,
      ...(jobRole && { job_role: jobRole })
    };

    if (skills && skills.length > 0) {
      skills.forEach(skill => params[`skills`] = skill);
    }

    return api.post("/technical-prep/challenges/coding/generate", null, { params });
  },

  // Generate system design challenge
  generateSystemDesignChallenge: async (uuid, seniority = "senior", focusAreas = null) => {
    const params = {
      uuid,
      seniority
    };

    if (focusAreas && focusAreas.length > 0) {
      focusAreas.forEach(area => params[`focus_areas`] = area);
    }

    return api.post("/technical-prep/challenges/system-design/generate", null, { params });
  },

  // Generate case study
  generateCaseStudy: async (uuid, industry = null) => {
    const params = {
      uuid,
      ...(industry && { industry })
    };

    return api.post("/technical-prep/challenges/case-study/generate", null, { params });
  },

  // ============ ATTEMPT ENDPOINTS ============

  // Start a challenge attempt
  startAttempt: async (uuid, challengeId) => {
    return api.post(`/technical-prep/attempts/${uuid}/${challengeId}`);
  },

  // Submit code
  submitCode: async (attemptId, code, language) => {
    return api.post(`/technical-prep/attempts/${attemptId}/submit`, null, {
      params: { code, language }
    });
  },

  // Complete attempt
  completeAttempt: async (attemptId, score, passedTests, totalTests, code = null) => {
    const params = {
      score,
      passed_tests: passedTests,
      total_tests: totalTests,
      ...(code && { code })
    };

    return api.post(`/technical-prep/attempts/${attemptId}/complete`, null, { params });
  },

  // Get attempt details
  getAttempt: async (attemptId) => {
    return api.get(`/technical-prep/attempts/${attemptId}`);
  },

  // Get user's attempts
  getUserAttempts: async (uuid, limit = 50) => {
    return api.get(`/technical-prep/user/${uuid}/attempts`, {
      params: { limit }
    });
  },

  // Get challenge attempts
  getChallengeAttempts: async (challengeId) => {
    return api.get(`/technical-prep/challenge/${challengeId}/attempts`);
  },

  // ============ STATISTICS & ANALYTICS ============

  // Get user statistics
  getUserStatistics: async (uuid) => {
    return api.get(`/technical-prep/user/${uuid}/statistics`);
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (challengeId, limit = 10) => {
    return api.get(`/technical-prep/challenge/${challengeId}/leaderboard`, {
      params: { limit }
    });
  },

  // Get AI-generated solution
  generateSolution: async (challengeId, language = "python") => {
    return api.get(`/technical-prep/challenge/${challengeId}/solution`, {
      params: { language }
    });
  }
};

export default technicalPrepAPI;
