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

  acceptInvitation = async (teamId, data) => {
  const response = await api.post(`${BASE_URL}/${teamId}/accept-invite`, data);
  return response.data || response;
};

}

export default new TeamsAPI();