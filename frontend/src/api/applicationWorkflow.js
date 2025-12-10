import api from "./base";

class ApplicationWorkflowAPI {

  /* PACKAGES */
  getPackages() {
    return api.get("/application-workflow/packages");
  }

  createPackage(data) {
    return api.post("/application-workflow/packages", data);
  }

  deletePackage(id) {
    return api.delete(`/application-workflow/packages/${id}`);
  }

  markPackageUsed(packageId) {
  return api.post(`/application-workflow/packages/${packageId}/use`);
}
    bulkApply(data) {
    return api.post("/application-workflow/bulk-apply", data);
}

  /* TEMPLATES */
    getTemplates() {
        return api.get("/application-workflow/templates");
  }

    createTemplate(data) {
        return api.post("/application-workflow/templates", data);
}

    deleteTemplate(id) {
        return api.delete(`/application-workflow/templates/${id}`);
}


  /* SCHEDULES */
  getSchedules() {
    return api.get("/application-workflow/schedules");
  }

  createSchedule(data) {
    return api.post("/application-workflow/schedules", data);
  }

  cancelSchedule(id) {
    return api.post(`/application-workflow/schedules/${id}/cancel`);
  }

  /* AUTOMATION RULES */
  getAutomationRules() {
    return api.get("/application-workflow/automation-rules");
  }

  createAutomationRule(data) {
    return api.post("/application-workflow/automation-rules", data);
  }

  deleteAutomationRule(id) {
    return api.delete(`/application-workflow/automation-rules/${id}`);
  }

  /** 
   * FIXED: Backend expects a *raw boolean*, not { enabled: true }
   */
  toggleAutomationRule(id, enabled) {
  return api.post(
    `/application-workflow/automation-rules/${id}/toggle`,
    JSON.stringify(enabled),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
}

export default new ApplicationWorkflowAPI();













