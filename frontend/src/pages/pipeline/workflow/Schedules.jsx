import React, { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, Mail, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import ApplicationWorkflowAPI from "../../../api/applicationWorkflow";
import JobsAPI from "../../../api/jobs";
import ProfilesAPI from "../../../api/profiles";
import CalendarView from "./CalendarView";
import { checkSchedulingWarnings } from "../../../utils/holidayGenerator";

export default function EnhancedSchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [timingAnalytics, setTimingAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  
  // Form state
  const [scheduleJobId, setScheduleJobId] = useState("");
  const [schedulePackageId, setSchedulePackageId] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleWarnings, setScheduleWarnings] = useState([]);
  
  // View state
  const [activeView, setActiveView] = useState("list");
  
  // Confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scheduleToCancel, setScheduleToCancel] = useState(null);
  
  useEffect(() => {
    loadData();
    loadUserProfile();
  }, []);
  
  // Check for warnings whenever schedule time changes
  useEffect(() => {
    if (scheduleTime) {
      const warnings = checkSchedulingWarnings(scheduleTime);
      setScheduleWarnings(warnings);
    } else {
      setScheduleWarnings([]);
    }
  }, [scheduleTime]);
  
  const loadUserProfile = async () => {
    try {
      const response = await ProfilesAPI.get();
      setUserProfile(response.data);
      setUserEmail(response.data.email || "");
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, jobsRes, packagesRes, analyticsRes] = await Promise.all([
        ApplicationWorkflowAPI.getSchedules(),
        JobsAPI.getAll(),
        ApplicationWorkflowAPI.getPackages(),
        ApplicationWorkflowAPI.getSubmissionTimingAnalytics()
      ]);
      
      setSchedules(schedulesRes.data || []);
      setJobs(jobsRes.data || []);
      setPackages(packagesRes.data || []);
      setTimingAnalytics(analyticsRes.data || null);
      
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load scheduling data. Check console for details.");
    } finally {
      setLoading(false);
    }
  };
  
  const createSchedule = async (e) => {
    e.preventDefault();
    
    if (!scheduleJobId || !schedulePackageId || !scheduleTime) {
      alert("Please fill all fields");
      return;
    }
    
    // Show warning confirmation if there are any warnings
    if (scheduleWarnings.length > 0) {
      const hasHighSeverity = scheduleWarnings.some(w => w.type === 'error');
      const confirmMessage = hasHighSeverity 
        ? `⚠️ WARNING: You're scheduling on a holiday or problematic day!\n\n${scheduleWarnings.map(w => w.message).join('\n')}\n\nAre you sure you want to continue?`
        : `Note: ${scheduleWarnings.map(w => w.message).join('\n')}\n\nContinue anyway?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    try {
      await ApplicationWorkflowAPI.createSchedule({
        job_id: scheduleJobId,
        package_id: schedulePackageId,
        scheduled_time: new Date(scheduleTime).toISOString()
      });
      
      alert("Application scheduled successfully!");
      
      setScheduleJobId("");
      setSchedulePackageId("");
      setScheduleTime("");
      setScheduleWarnings([]);
      
      await loadData();
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Failed to create schedule. Check console for details.");
    }
  };
  
  const sendReminderEmail = async (scheduleId) => {
    if (!userEmail) {
      alert("No email address found in your profile. Please update your profile with an email address.");
      return;
    }
    
    try {
      await ApplicationWorkflowAPI.sendScheduleReminder(scheduleId, userEmail);
      alert(`Reminder email sent to ${userEmail}!`);
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder email. Check console for details.");
    }
  };
  
  const sendDeadlineReminder = async (jobId) => {
    if (!userEmail) {
      alert("No email address found in your profile. Please update your profile with an email address.");
      return;
    }
    
    try {
      await ApplicationWorkflowAPI.sendDeadlineReminder(jobId, userEmail);
      alert(`Deadline reminder sent to ${userEmail}!`);
    } catch (error) {
      console.error("Error sending deadline reminder:", error);
      alert("Failed to send deadline reminder. Check console for details.");
    }
  };
  
  const handleCancelClick = (schedule) => {
    setScheduleToCancel(schedule);
    setShowCancelModal(true);
  };
  
  const confirmCancelSchedule = async () => {
    if (!scheduleToCancel) return;
    
    try {
      await ApplicationWorkflowAPI.cancelSchedule(scheduleToCancel._id);
      alert("Schedule cancelled successfully");
      setShowCancelModal(false);
      setScheduleToCancel(null);
      await loadData();
    } catch (error) {
      console.error("Error cancelling schedule:", error);
      alert("Failed to cancel schedule. Check console for details.");
    }
  };
  
  const cancelModal = () => {
    setShowCancelModal(false);
    setScheduleToCancel(null);
  };
  
  const getJobById = (jobId) => jobs.find(j => j._id === jobId);
  const getPackageById = (pkgId) => packages.find(p => p._id === pkgId);
  
  const getHoursUntil = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.floor((target - now) / (1000 * 60 * 60));
  };
  
  const getDaysUntil = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.floor((target - now) / (1000 * 60 * 60 * 24));
  };
  
  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const getUrgencyColor = (hoursUntil) => {
    if (hoursUntil <= 3) return "text-danger bg-danger bg-opacity-10";
    if (hoursUntil <= 12) return "text-warning bg-warning bg-opacity-10";
    if (hoursUntil <= 48) return "text-info bg-info bg-opacity-10";
    return "text-primary bg-primary bg-opacity-10";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Confirmation Modal */}
      {showCancelModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Scheduled Application</h5>
                <button type="button" className="btn-close" onClick={cancelModal}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this scheduled application?</p>
                <p className="text-muted small mb-0">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelModal}>
                  No, Keep It
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmCancelSchedule}>
                  Yes, Cancel Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with View Toggles */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">
          <Clock className="d-inline me-2" size={24} />
          Application Scheduling
        </h3>
        
        <div className="btn-group" role="group">
          <button
            className={`btn ${activeView === "list" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveView("list")}
          >
            List View
          </button>
          <button
            className={`btn ${activeView === "calendar" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveView("calendar")}
          >
            <Calendar size={16} className="me-1" />
            Calendar
          </button>
          <button
            className={`btn ${activeView === "analytics" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveView("analytics")}
          >
            <TrendingUp size={16} className="me-1" />
            Analytics
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {activeView === "list" && (
        <div className="row g-4">
          {/* Schedule Form */}
          <div className="col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Schedule New Application</h5>
                
                <form onSubmit={createSchedule}>
                  <div className="mb-3">
                    <label className="form-label">Select Job</label>
                    <select
                      className="form-select"
                      value={scheduleJobId}
                      onChange={(e) => setScheduleJobId(e.target.value)}
                      required
                    >
                      <option value="">Choose a job...</option>
                      {jobs.map(job => {
                        const company = typeof job.company === 'object' ? job.company.name : job.company;
                        return (
                          <option key={job._id} value={job._id}>
                            {job.title} @ {company}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Select Package</label>
                    <select
                      className="form-select"
                      value={schedulePackageId}
                      onChange={(e) => setSchedulePackageId(e.target.value)}
                      required
                    >
                      <option value="">Choose a package...</option>
                      {packages.map(pkg => (
                        <option key={pkg._id} value={pkg._id}>
                          📦 {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      required
                    />
                    <small className="text-muted">
                      💡 Best times: Tuesday-Thursday, 10-11 AM
                    </small>
                  </div>
                  
                  {/* Warning Display */}
                  {scheduleWarnings.length > 0 && (
                    <div className="mb-3">
                      {scheduleWarnings.map((warning, idx) => (
                        <div 
                          key={idx}
                          className={`alert ${
                            warning.type === 'error' ? 'alert-danger' :
                            warning.type === 'warning' ? 'alert-warning' :
                            'alert-info'
                          } mb-2`}
                        >
                          <div className="d-flex align-items-start">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>{warning.icon}</span>
                            <div className="flex-grow-1">
                              <strong className="d-block">{warning.message}</strong>
                              <small>{warning.suggestion}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button type="submit" className="btn btn-primary w-100">
                    <Clock size={16} className="me-2" />
                    Schedule Application
                  </button>
                </form>
                
                {/* Quick Tips */}
                <div className="alert alert-info mt-3 mb-0">
                  <strong>💡 Pro Tip:</strong> Applications submitted Tuesday-Wednesday morning have the highest response rates!
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Applications List */}
          <div className="col-lg-7">
            <h5 className="mb-3">Upcoming Scheduled Applications</h5>
            
            {schedules.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center text-muted py-5">
                  <Calendar size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">No scheduled applications yet.</p>
                  <small>Schedule your first application to get started!</small>
                </div>
              </div>
            ) : (
              <div className="list-group">
                {schedules.map(schedule => {
                  const job = getJobById(schedule.job_id);
                  const pkg = getPackageById(schedule.package_id);
                  const hoursUntil = getHoursUntil(schedule.scheduled_time);
                  
                  if (!job) return null;
                  
                  const company = typeof job.company === 'object' ? job.company.name : job.company;
                  
                  return (
                    <div key={schedule._id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className={`badge ${getUrgencyColor(hoursUntil)} px-3 py-2`}>
                              {hoursUntil < 24 
                                ? `${hoursUntil} hours` 
                                : `${Math.floor(hoursUntil / 24)} days`}
                            </span>
                            <h6 className="mb-0">{job.title}</h6>
                          </div>
                          
                          <p className="mb-1 text-muted">
                            <strong>{company}</strong>
                          </p>
                          
                          <div className="small text-muted">
                            <Clock size={14} className="me-1" />
                            {formatDateTime(schedule.scheduled_time)}
                          </div>
                          
                          <div className="small text-muted">
                            📦 Package: {pkg?.name || 'Unknown'}
                          </div>
                        </div>
                        
                        <div className="btn-group-vertical">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => sendReminderEmail(schedule._id)}
                            title="Send reminder email now"
                          >
                            <Mail size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelClick(schedule)}
                            title="Cancel schedule"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Upcoming Deadlines */}
            <div className="mt-4">
              <h5 className="mb-3">⏰ Upcoming Deadlines</h5>
              <div className="list-group">
                {jobs
                  .filter(j => j.deadline && !j.submitted)
                  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                  .slice(0, 5)
                  .map(job => {
                    const daysUntil = getDaysUntil(job.deadline);
                    const isUrgent = daysUntil <= 3;
                    const company = typeof job.company === 'object' ? job.company.name : job.company;
                    
                    return (
                      <div key={job._id} className={`list-group-item ${isUrgent ? 'border-danger' : ''}`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{job.title}</h6>
                            <small className="text-muted">{company}</small>
                            <div className={`small mt-1 ${isUrgent ? 'text-danger fw-bold' : 'text-muted'}`}>
                              📅 {formatDateTime(job.deadline)} ({daysUntil} days)
                            </div>
                          </div>
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => sendDeadlineReminder(job._id)}
                          >
                            <Mail size={14} className="me-1" />
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {activeView === "calendar" && (
        <CalendarView 
          schedules={schedules} 
          jobs={jobs} 
          packages={packages} 
          userEmail={userEmail}
          onReschedule={(scheduleId) => {
            setActiveView('list');
          }} 
        />
      )}

      {/* ANALYTICS VIEW */}
      {activeView === "analytics" && timingAnalytics && (
        <div className="row g-4">
          {/* Personal Patterns */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <TrendingUp size={20} className="me-2" />
                  Your Submission Patterns
                </h5>
                
                {timingAnalytics.user_patterns.total_submissions === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>No submissions yet to analyze.</p>
                    <small>Start submitting applications to see your patterns!</small>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h6>Response Rates by Day</h6>
                      {Object.entries(timingAnalytics.user_patterns.response_rate_by_day).map(([day, rate]) => (
                        <div key={day} className="mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <small>{day}</small>
                            <small className="fw-bold">{rate}%</small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar ${rate > 40 ? 'bg-success' : rate > 30 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-3">
                      <h6>Submissions by Day</h6>
                      {Object.entries(timingAnalytics.user_patterns.submissions_by_day).map(([day, count]) => (
                        <div key={day} className="d-flex justify-content-between mb-1">
                          <span>{day}</span>
                          <span className="badge bg-primary">{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Insights */}
                {timingAnalytics.insights && timingAnalytics.insights.length > 0 && (
                  <div className="mt-4">
                    <h6>📊 Insights</h6>
                    {timingAnalytics.insights.map((insight, idx) => (
                      <div key={idx} className={`alert alert-${insight.type === 'success' ? 'success' : insight.type === 'warning' ? 'warning' : 'info'} mb-2`}>
                        <small>{insight.message}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="col-lg-6">
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <CheckCircle size={20} className="me-2 text-success" />
                  Best Practices
                </h5>
                
                <h6 className="text-success">✅ Optimal Days</h6>
                {timingAnalytics.best_practices.optimal_days.map((item, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-success bg-opacity-10 rounded">
                    <strong>{item.day}</strong>
                    <p className="mb-1 small">{item.reason}</p>
                    <small className="text-muted">💡 {item.recommendation}</small>
                  </div>
                ))}
                
                <h6 className="text-primary mt-4">⏰ Optimal Times</h6>
                {timingAnalytics.best_practices.optimal_hours.map((item, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-primary bg-opacity-10 rounded">
                    <strong>{item.time}</strong>
                    <p className="mb-1 small">{item.reason}</p>
                    <small className="text-muted">💡 {item.recommendation}</small>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="text-danger">
                  <AlertCircle size={16} className="me-1" />
                  Avoid These Times
                </h6>
                <ul className="small mb-0">
                  <li>Monday mornings (overloaded inboxes)</li>
                  <li>Friday afternoons (weekend planning)</li>
                  <li>Weekends (very low engagement)</li>
                  <li>Before 6 AM or after 6 PM</li>
                  <li>Holidays and days adjacent to holidays</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}