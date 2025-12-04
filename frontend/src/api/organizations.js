import api from "./base";

const BASE_URL = "/organizations";

class OrganizationsAPI {
  // Register a new institution (usually done via sales/admin, but good to have)
  register(data) {
    return api.post(`${BASE_URL}/register`, data);
  }

  // The Main CIO/Dean View
  getDashboard() {
    return api.get(`${BASE_URL}/dashboard`);
  }

  join(orgId) {
    return api.post(`${BASE_URL}/join`, { org_id: orgId });
  }

  // UC-114: Bulk Onboarding
  bulkImportUsers(formData) {
    return api.post(`${BASE_URL}/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // UC-114: White-Label Branding
  updateBranding(orgId, brandingConfig) {
    return api.put(`${BASE_URL}/${orgId}/branding`, brandingConfig);
  }
  
  // Get list of all cohorts (teams) managed by this org
  getCohorts() {
      return api.get(`${BASE_URL}/cohorts`);
  }

  getInsights() {
    return api.get(`${BASE_URL}/insights`);
  }

  exportROI() {
    return api.get(`${BASE_URL}/export/roi`, { 
        responseType: 'blob' 
    });
  }
}

export default new OrganizationsAPI();