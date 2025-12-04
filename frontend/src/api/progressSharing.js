import api from "./base";

const BASE_URL = "/progress-sharing";

class ProgressSharingAPI {
  // Share progress with someone
  shareProgress(teamId, memberUuid, data) {
    return api.post(`${BASE_URL}/${teamId}/members/${memberUuid}/share`, data);
  }

  // Get list of who you're sharing with
  getSharedWithList(teamId, memberUuid) {
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/shared-with`);
  }

  // Revoke someone's access
  revokeShare(teamId, memberUuid, accessorEmail) {
    return api.delete(`${BASE_URL}/${teamId}/members/${memberUuid}/share/${accessorEmail}`);
  }

  // Get progress report (authenticated user viewing their own/team progress)
  getProgressReport(teamId, memberUuid, viewerEmail = null) {
    const params = viewerEmail ? { viewer_email: viewerEmail } : {};
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/progress-report`, { params });
  }

  getPublicProgressReport(teamId, memberUuid, accessorEmail) {
    // This maps to the public endpoint that takes the email in the path
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/progress-report-public/${accessorEmail}`);
  }

  // Log a milestone
  logMilestone(teamId, memberUuid, milestone) {
    return api.post(`${BASE_URL}/${teamId}/members/${memberUuid}/milestones`, milestone);
  }

  logWellbeing(teamId, memberUuid, data) {
    return api.post(`${BASE_URL}/${teamId}/members/${memberUuid}/wellbeing`, data);
  }

  // Get milestones
  getMilestones(teamId, memberUuid, days = 30) {
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/milestones`, { params: { days } });
  }

  getPublicProgressReport(teamId, memberUuid, accessorEmail) {
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/progress-report-public/${accessorEmail}`);
  }

  // Add celebration
  addCelebration(teamId, memberUuid, celebration) {
    return api.post(`${BASE_URL}/${teamId}/members/${memberUuid}/celebrate`, celebration);
  }

  getCelebrations(teamId, memberUuid) {
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/celebrations`);
  }

  // Get accountability impact
  getAccountabilityImpact(teamId, memberUuid) {
    return api.get(`${BASE_URL}/${teamId}/members/${memberUuid}/accountability-impact`);
  }
  
  //Update the user's privacy settings
  updatePrivacySettings(teamId, memberUuid, settings) {
    return api.put(`${BASE_URL}/${teamId}/members/${memberUuid}/privacy`, settings);
  }
}

export default new ProgressSharingAPI();