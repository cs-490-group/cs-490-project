import api from "./base";

class ApplicationWorkflowAPI {
  /* ============================================ */
  /* PACKAGES (UC-069) */
  /* ============================================ */
  
  getPackages() {
    return api.get("/application-workflow/packages");
  }
  
  getPackage(id) {
    return api.get(`/application-workflow/packages/${id}`);
  }
  
  createPackage(data) {
    return api.post("/application-workflow/packages", data);
  }
  
  updatePackage(id, data) {
    return api.put(`/application-workflow/packages/${id}`, data);
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

  /* ============================================ */
  /* TEMPLATES (UC-069) */
  /* ============================================ */
  
  getTemplates(category = null) {
    const params = category ? { category } : {};
    return api.get("/application-workflow/templates", { params });
  }
  
  createTemplate(data) {
    return api.post("/application-workflow/templates", data);
  }
  
  updateTemplate(id, data) {
    return api.put(`/application-workflow/templates/${id}`, data);
  }
  
  deleteTemplate(id) {
    return api.delete(`/application-workflow/templates/${id}`);
  }
  
  useTemplate(id) {
    return api.post(`/application-workflow/templates/${id}/use`);
  }

  /* ============================================ */
  /* SCHEDULES (UC-069, UC-124) */
  /* ============================================ */
  
  getSchedules() {
    return api.get("/application-workflow/schedules");
  }
  
  createSchedule(data) {
    return api.post("/application-workflow/schedules", data);
  }
  
  updateSchedule(id, data) {
    return api.put(`/application-workflow/schedules/${id}`, data);
  }
  
  cancelSchedule(id, reason = null) {
    return api.post(`/application-workflow/schedules/${id}/cancel`, { reason });
  }
  
  markScheduleComplete(id, notes = null) {
    return api.post(`/application-workflow/schedules/${id}/mark-complete`, { notes });
  }
  
  getUpcomingSchedules(hours = 24) {
    return api.get("/application-workflow/schedules/upcoming", {
      params: { hours }
    });
  }
  
  /* UC-124: Scheduling Email Notifications */
  sendScheduleReminder(scheduleId, recipientEmail) {
    return api.post(`/application-workflow/schedules/${scheduleId}/send-reminder`, {
      recipient_email: recipientEmail
    });
  }
  
  sendDeadlineReminder(jobId, recipientEmail) {
    return api.post("/application-workflow/schedules/send-deadline-reminder", {
      job_id: jobId,
      recipient_email: recipientEmail
    });
  }
  
  notifyScheduledSubmission(scheduleId, recipientEmail) {
    return api.post(`/application-workflow/schedules/${scheduleId}/notify-submission`, {
      recipient_email: recipientEmail
    });
  }

  /* ============================================ */
  /* AUTOMATION RULES (UC-069) */
  /* ============================================ */
  
  getAutomationRules(enabledOnly = false) {
    return api.get("/application-workflow/automation-rules", {
      params: { enabled_only: enabledOnly }
    });
  }
  
  createAutomationRule(data) {
    return api.post("/application-workflow/automation-rules", data);
  }
  
  updateAutomationRule(id, data) {
    return api.put(`/application-workflow/automation-rules/${id}`, data);
  }
  
  deleteAutomationRule(id) {
    return api.delete(`/application-workflow/automation-rules/${id}`);
  }
  
  toggleAutomationRule(id, enabled) {
    return api.post(`/application-workflow/automation-rules/${id}/toggle`, enabled, {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* ============================================ */
  /* ANALYTICS (UC-072, UC-119, UC-120, UC-121) */
  /* ============================================ */
  
  getApplicationFunnel() {
    return api.get("/application-workflow/analytics/funnel");
  }
  
  getResponseTimes() {
    return api.get("/application-workflow/analytics/response-times");
  }
  
  getSuccessRates() {
    return api.get("/application-workflow/analytics/success-rates");
  }
  
  getApplicationTrends(days = 90) {
    return api.get("/application-workflow/analytics/trends", {
      params: { days }
    });
  }
  
  getPerformanceBenchmarks() {
    return api.get("/application-workflow/analytics/benchmarks");
  }
  
  getOptimizationRecommendations() {
    return api.get("/application-workflow/analytics/recommendations");
  }
  
  /* UC-121: Personal Response Time Tracking */
  getPersonalResponseMetrics() {
    return api.get("/application-workflow/analytics/response-metrics");
  }
  
  getPendingApplications() {
    return api.get("/application-workflow/analytics/pending-applications");
  }
  
  getResponseTrends(days = 90) {
    return api.get("/application-workflow/analytics/response-trends", {
      params: { days }
    });
  }
  
  setManualResponseDate(jobId, responseDate) {
    return api.put(`/application-workflow/jobs/${jobId}/response-date`, {
      response_date: responseDate
    });
  }
  
  /* UC-124: Submission Timing Analytics */
  getSubmissionTimingAnalytics() {
    return api.get("/application-workflow/analytics/submission-timing");
  }
  
  getCalendarView(startDate, endDate) {
    return api.get("/application-workflow/calendar-view", {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
  }

  /* ============================================ */
  /* GOALS (UC-069) */
  /* ============================================ */
  
  getGoals() {
    return api.get("/application-workflow/goals");
  }

  /* ============================================ */
  /* QUALITY SCORING (UC-122) */
  /* ============================================ */
  
  analyzePackageQuality(packageId, jobId) {
    return api.post("/application-workflow/analyze-quality", {
      package_id: packageId,
      job_id: jobId
    });
  }

  /* ============================================ */
  /* SCHEDULER HEALTH (UC-124) */
  /* ============================================ */
  
  getSchedulerHealth() {
    return api.get("/application-workflow/scheduler/health");
  }
}

export default new ApplicationWorkflowAPI();