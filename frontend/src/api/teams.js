import api from "./base";

const BASE_URL = "/teams";

class TeamsAPI {
  // ============ TEAM ACCOUNT ============
  
  createTeam = async (data) => {
    const response = await api.post(`${BASE_URL}/create`, data);
    return response.data || response;
  };

  getTeam = async (teamId) => {
    const response = await api.get(`${BASE_URL}/${teamId}`);
    return response.data || response;
  };

  getUserTeams = async (uuid) => {
    const response = await api.get(`${BASE_URL}/user/${uuid}`);
    return response.data || response;
  };

  updateTeamSettings = async (teamId, data) => {
    const response = await api.put(`${BASE_URL}/${teamId}`, data);
    return response.data || response;
  };

  deleteTeam = async (teamId) => {
    const response = await api.delete(`${BASE_URL}/${teamId}`);
    return response.data || response;
  };

  // ============ TEAM MEMBERS ============
  
  addTeamMember = async (teamId, data) => {
    const response = await api.post(`${BASE_URL}/${teamId}/members`, data);
    return response.data || response;
  };

  updateTeamMember = async (teamId, memberUuid, data) => {
    const response = await api.put(`${BASE_URL}/${teamId}/members/${memberUuid}`, data);
    return response.data || response;
  };

  inviteMember = async (teamId, data) => {
    const response = await api.post(`${BASE_URL}/${teamId}/invite`, data);
    return response.data || response;
  };

  removeTeamMember = async (teamId, memberUuid) => {
    const response = await api.delete(`${BASE_URL}/${teamId}/members/${memberUuid}`);
    return response.data || response;
  };

  getTeamMembers = async (teamId) => {
    const response = await api.get(`${BASE_URL}/${teamId}/members`);
    return response.data || response;
  };

  // ============ ENGAGEMENT & ACTIVITY TRACKING ============
  
  logMemberLogin = async (teamId, memberUuid) => {
    try {
      const url = `${BASE_URL}/${teamId}/members/${memberUuid}/log-login`;
      console.log(`Posting to: ${url}`);
      const response = await api.post(url);
      console.log(`Login logged successfully:`, response.data || response);
      return response.data || response;
    } catch (error) {
      console.error("Failed to log login activity");
      console.error("   Error message:", error.message);
      console.error("   Response status:", error.response?.status);
      console.error("   Response data:", error.response?.data);
      // Don't throw - engagement tracking shouldn't break the login flow
      return null;
    }
  };

  logMemberActivity = async (teamId, memberUuid, activityType) => {
    try {
      const url = `${BASE_URL}/${teamId}/members/${memberUuid}/log-activity?activity_type=${activityType}`;
      console.log(`Posting activity to: ${url}`);
      const response = await api.post(url);
      console.log(`${activityType} logged successfully:`, response.data || response);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to log ${activityType} activity`);
      console.error("   Error message:", error.message);
      console.error("   Response status:", error.response?.status);
      console.error("   Response data:", error.response?.data);
      return null;
    }
  };

  logGoalCompleted = async (teamId, memberUuid) => {
    return this.logMemberActivity(teamId, memberUuid, "goal_completed");
  };

  logApplicationSent = async (teamId, memberUuid) => {
    return this.logMemberActivity(teamId, memberUuid, "application_sent");
  };

  logFeedbackReceived = async (teamId, memberUuid) => {
    return this.logMemberActivity(teamId, memberUuid, "feedback_received");
  };

  getActivitySummary = async (teamId, memberUuid) => {
    try {
      const response = await api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/activity-summary`);
      return response.data || response;
    } catch (error) {
      console.error("Failed to fetch activity summary:", error);
      return null;
    }
  };

  // ============ GOALS ============
  
  updateMemberGoals = async (teamId, memberUuid, goals) => {
    try {
      const response = await api.put(
        `${BASE_URL}/${teamId}/members/${memberUuid}/goals`,
        { goals }
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to update goals:", error);
      throw error;
    }
  };

  getMemberWork = async (teamId, memberUuid) => {
    try {
      const response = await api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/work`);
      return response.data || response;
    } catch (error) {
      console.error("Failed to fetch member work:", error);
      // Return empty structures to prevent UI crash
      return { resumes: [], jobs: [], coverLetters: [] };
    }
  };

  getMemberGoals = async (teamId, memberUuid) => {
    try {
      const response = await api.get(
        `${BASE_URL}/${teamId}/members/${memberUuid}/goals`
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      return null;
    }
  };

  addGoal = async (teamId, memberUuid, goalData) => {
    try {
      const response = await api.post(
        `${BASE_URL}/${teamId}/members/${memberUuid}/goals`,
        goalData
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to add goal:", error);
      throw error;
    }
  };

  deleteGoal = async (teamId, memberUuid, goalId) => {
    try {
      const response = await api.delete(
        `${BASE_URL}/${teamId}/members/${memberUuid}/goals/${goalId}`
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to delete goal:", error);
      throw error;
    }
  };

  completeGoal = async (teamId, memberUuid, goalId) => {
    try {
      const response = await api.put(
        `${BASE_URL}/${teamId}/members/${memberUuid}/goals/${goalId}/complete`
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to complete goal:", error);
      throw error;
    }
  };

  // ============ APPLICATIONS ============
  
  updateMemberApplications = async (teamId, memberUuid, applications) => {
    try {
      const response = await api.put(
        `${BASE_URL}/${teamId}/members/${memberUuid}/applications`,
        { applications }
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to update applications:", error);
      return null;
    }
  };

  // ============ MENTOR FEEDBACK ============
  
  sendFeedback = async (teamId, memberUuid, data) => {
    const response = await api.post(`${BASE_URL}/${teamId}/members/${memberUuid}/feedback`, data);
    return response.data || response;
  };

  // ============ PROGRESS TRACKING ============
  
  getTeamProgress = async (teamId) => {
    const response = await api.get(`${BASE_URL}/${teamId}/progress`);
    return response.data || response;
  };

  // ============ BILLING & SUBSCRIPTION ============
  
  getBilling = async (teamId) => {
    const response = await api.get(`${BASE_URL}/${teamId}/billing`);
    return response.data || response;
  };

  updateBilling = async (teamId, data) => {
    const response = await api.put(`${BASE_URL}/${teamId}/billing`, data);
    return response.data || response;
  };

  cancelSubscription = async (teamId) => {
    const response = await api.post(`${BASE_URL}/${teamId}/billing/cancel`);
    return response.data || response;
  };

  // ============ REPORTS ============
  
  getTeamReports = async (teamId) => {
    const response = await api.get(`${BASE_URL}/${teamId}/reports`);
    return response.data || response;
  };

  getMemberReport = async (teamId, memberUuid) => {
    const response = await api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/report`);
    return response.data || response;
  };

  getReviewImpact = async (teamId) => {
    const response = await api.get(`${BASE_URL}/${teamId}/resume-impact`);
    return response.data || response;
  };

  acceptInvitation = async (teamId, data) => {
    const response = await api.post(`${BASE_URL}/${teamId}/accept-invite`, data);
    return response.data || response;
  };

  getReviewToken = async (teamId, memberUuid, type, docId) => {
    const response = await api.post(`${BASE_URL}/${teamId}/members/${memberUuid}/get-review-token`, {
      type,
      id: docId
    });
    return response.data || response;
  };
}

export default new TeamsAPI();