import api from "./base";

class ApplicationWorkflowAPI {

  /* PACKAGES */
  getPackages() {
    return api.get("/application-workflow/packages");
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

  /**
   * NEW: Mark a schedule as completed manually
   * @param {string} scheduleId - ID of the schedule to mark complete
   * @param {string} notes - Optional notes about the completion
   */
  markScheduleComplete(scheduleId, notes = null) {
    return api.post(
      `/application-workflow/schedules/${scheduleId}/mark-complete`,
      { notes }
    );
  }

  /**
   * NEW: Get upcoming schedules within X hours
   * @param {number} hours - Number of hours to look ahead (default 24)
   */
  getUpcomingSchedules(hours = 24) {
    return api.get('/application-workflow/schedules/upcoming', {
      params: { hours }
    });
  }

  /**
   * NEW: Check scheduler health status
   */
  getSchedulerHealth() {
    return api.get('/application-workflow/scheduler/health');
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

  toggleAutomationRule(id, enabled) {
    return api.post(
      `/application-workflow/automation-rules/${id}/toggle`,
      enabled,
      { headers: { "Content-Type": "application/json" } }
    );
  }

  /* ANALYTICS */
  getApplicationFunnel() {
    return api.get("/application-workflow/analytics/funnel");
  }

  getResponseTimes() {
    return api.get("/application-workflow/analytics/response-times");
  }

  getSuccessRates() {
    return api.get("/application-workflow/analytics/success-rates");
  }

  getApplicationTrends(days) {
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

  /* GOALS */
  getGoals() {
    return api.get("/application-workflow/goals");
  }

  /* QUALITY SCORING (UC-122) */
  analyzePackageQuality(packageId, jobId) {
    return api.post("/application-workflow/analyze-quality", {
      package_id: packageId,
      job_id: jobId
    });
  }
}

  /* UC-121: PERSONAL RESPONSE TIME TRACKING */
  getResponseMetrics() {
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











  // ===================================
  // SCHEDULING & REMINDERS (UC-124)
  // ===================================
  
  /**
   * Send reminder email for scheduled application
   */
  sendScheduleReminder(scheduleId, recipientEmail) {
    return api.post(
      `/application-workflow/schedules/${scheduleId}/send-reminder`,
      { recipient_email: recipientEmail }
    );
  }
  
  /**
   * Send deadline reminder email for a job
   */
  sendDeadlineReminder(jobId, recipientEmail) {
    return api.post(
      '/application-workflow/schedules/send-deadline-reminder',
      {
        job_id: jobId,
        recipient_email: recipientEmail
      }
    );
  }
  
  /**
   * Send submission success notification
   */
  sendSubmissionNotification(scheduleId, recipientEmail) {
    return api.post(
      `/application-workflow/schedules/${scheduleId}/notify-submission`,
      { recipient_email: recipientEmail }
    );
  }
  
  /**
   * Get submission timing analytics
   * Returns user's patterns and best practices
   */
  getSubmissionTimingAnalytics() {
    return api.get('/application-workflow/analytics/submission-timing');
  }
  
  /**
   * Get calendar view data
   * @param {string} startDate - ISO format date string
   * @param {string} endDate - ISO format date string
   */
  getCalendarView(startDate, endDate) {
    return api.get('/application-workflow/calendar-view', {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
  }

  getUpcomingSchedules(hours = 24) {
    return api.get('/application-workflow/schedules/upcoming', {
      params: { hours }
    });
  }

  getSchedulerHealth() {
    return api.get('/application-workflow/scheduler/health');
  }
}

export default new ApplicationWorkflowAPI();
