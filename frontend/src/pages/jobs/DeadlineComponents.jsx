import React, { useState, useEffect } from "react";
import JobsAPI from "../../api/jobs";
import ProfilesAPI from "../../api/profiles";
import { formatLocalDate, formatLocalDateTime, toLocalDate, isToday, getLocalDay, getLocalMonth, getLocalYear } from "../../utils/dateUtils";

export function DeadlineWidget({ jobs, onJobClick }) {
  const jobsWithDeadlines = jobs
    .filter(job => job.deadline)
    .map(job => {
      const deadlineDate = toLocalDate(job.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
      return { ...job, daysUntil, deadlineDate };
    })
    .sort((a, b) => a.deadlineDate - b.deadlineDate)
    .slice(0, 5);

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil < 0) return "#f44336";
    if (daysUntil <= 3) return "#ff5722";
    if (daysUntil <= 7) return "#ff9800";
    if (daysUntil <= 14) return "#ffc107";
    return "#4caf50";
  };

  const getUrgencyLabel = (daysUntil) => {
    if (daysUntil < 0) return "OVERDUE";
    if (daysUntil === 0) return "TODAY";
    if (daysUntil === 1) return "TOMORROW";
    if (daysUntil <= 7) return "THIS WEEK";
    return `${daysUntil} DAYS`;
  };

  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "20px"
    }}>
      <h3 style={{ margin: "0 0 16px 0", color: "#333", display: "flex", alignItems: "center", gap: "8px" }}>
        ⏰ Upcoming Deadlines
      </h3>

      {jobsWithDeadlines.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
          No upcoming deadlines
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {jobsWithDeadlines.map(job => (
            <div
              key={job.id}
              onClick={() => onJobClick && onJobClick(job)}
              style={{
                padding: "12px",
                background: "#f9f9f9",
                borderRadius: "6px",
                border: `2px solid ${getUrgencyColor(job.daysUntil)}`,
                cursor: onJobClick ? "pointer" : "default",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333", marginBottom: "4px" }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                    {job.company}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    📅 {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{
                  background: getUrgencyColor(job.daysUntil),
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  minWidth: "80px"
                }}>
                  {getUrgencyLabel(job.daysUntil)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Calendar view
export function DeadlineCalendar({ jobs }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const jobsWithDeadlines = jobs.filter(job => job.deadline);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getJobsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return jobsWithDeadlines.filter(job => job.deadline === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isPast = (day) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      "Interested": "#9e9e9e",
      "Applied": "#2196f3",
      "Screening": "#ff9800",
      "Interview": "#ff5722",
      "Offer": "#4caf50",
      "Rejected": "#f44336"
    };
    return statusColors[status] || "#666";
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} style={{ padding: "8px" }}></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const jobsOnDay = getJobsForDate(day);
    const hasDeadlines = jobsOnDay.length > 0;
    const isOverdue = isPast(day) && hasDeadlines;

    calendarDays.push(
      <div
        key={day}
        style={{
          padding: "8px",
          border: isToday(day) ? "2px solid #4f8ef7" : "1px solid #ddd",
          borderRadius: "4px",
          minHeight: "80px",
          background: isOverdue ? "#ffebee" : hasDeadlines ? "#fff3cd" : "white",
        }}
      >
        <div style={{ fontWeight: isToday(day) ? "bold" : "normal", fontSize: "14px", marginBottom: "4px", color: isPast(day) ? "#999" : "#333" }}>
          {day}
        </div>
        {hasDeadlines && (
          <div style={{ fontSize: "11px" }}>
            {jobsOnDay.map(job => (
              <div
                key={job.id}
                style={{
                  background: getStatusColor(job.status),
                  color: "white",
                  padding: "3px 5px",
                  borderRadius: "3px",
                  marginBottom: "3px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "10px",
                  fontWeight: "600"
                }}
                title={`${job.title} - ${job.company} (${job.status})`}
              >
                <div style={{ marginBottom: "1px" }}>{job.company}</div>
                <div style={{ fontSize: "9px", opacity: 0.9 }}>{job.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          style={{ padding: "8px 16px", background: "#4f8ef7", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          ← Previous
        </button>
        <h2 style={{ margin: 0, color: "#333" }}>{monthNames[month]} {year}</h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          style={{ padding: "8px 16px", background: "#4f8ef7", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          Next →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {dayNames.map(day => (
          <div key={day} style={{ padding: "8px", fontWeight: "bold", textAlign: "center", background: "#f0f0f0", borderRadius: "4px", fontSize: "14px" }}>
            {day}
          </div>
        ))}
        {calendarDays}
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <div style={{ marginBottom: "12px", fontWeight: "600" }}>Status Colors:</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", background: "#9e9e9e", borderRadius: "2px" }}></div>
            <span>Interested</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", background: "#2196f3", borderRadius: "2px" }}></div>
            <span>Applied</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", background: "#ff9800", borderRadius: "2px" }}></div>
            <span>Screening</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", background: "#ff5722", borderRadius: "2px" }}></div>
            <span>Interview</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", background: "#4caf50", borderRadius: "2px" }}></div>
            <span>Offer</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", background: "#f44336", borderRadius: "2px" }}></div>
            <span>Rejected</span>
          </div>
        </div>
        
        <div style={{ marginTop: "16px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", background: "#fff3cd", border: "1px solid #ddd", borderRadius: "2px" }}></div>
            <span>Upcoming Deadline</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", background: "#ffebee", border: "1px solid #ddd", borderRadius: "2px" }}></div>
            <span>Overdue</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", border: "2px solid #4f8ef7", borderRadius: "2px" }}></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reminder modal
export function DeadlineReminderModal({ job, onClose, onSave }) {
  const [reminderDays, setReminderDays] = useState(job?.reminderDays || 3);
  const [emailReminder, setEmailReminder] = useState(job?.emailReminder !== false);
  const [isSending, setIsSending] = useState(false);
  const [manualEmail, setManualEmail] = useState(job?.reminderEmail || "");
  const [useManualEmail, setUseManualEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);

  // Fetch user email when modal opens
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        console.log("🔍 Fetching user profile for email...");
        const response = await ProfilesAPI.get();
        
        console.log("📦 Profile response:", response?.data);
        
        if (response && response.data && response.data.email) {
          setUserEmail(response.data.email);
          if (!manualEmail) {
            setManualEmail(response.data.email);
          }
          console.log("✅ User email loaded:", response.data.email);
        } else {
          console.warn("⚠️ No email found in user profile");
          setUseManualEmail(true); // Force manual entry if no profile email
        }
      } catch (error) {
        console.error("❌ Failed to fetch user email:", error);
        setUseManualEmail(true); // Force manual entry on error
      } finally {
        setLoadingEmail(false);
      }
    };
    
    fetchUserEmail();
  }, []);

  const handleSave = () => {
    const emailToUse = useManualEmail ? manualEmail : userEmail;
    
    if (emailReminder && !emailToUse) {
      alert("Please enter an email address for reminders");
      return;
    }
    
    const updatedJob = { 
      ...job, 
      reminderDays, 
      emailReminder, 
      reminderEmail: emailToUse
    };
    onSave(updatedJob);
    onClose();
  };

  const handleSendTestReminder = async () => {
    const emailToUse = useManualEmail ? manualEmail : userEmail;
    
    if (!emailToUse || !emailToUse.trim()) {
      alert("Please enter an email address to send test reminder");
      return;
    }

    setIsSending(true);
    try {
      // Calculate days until deadline
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(job.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

      const response = await JobsAPI.sendDeadlineReminder({
        email: emailToUse,
        jobTitle: job.title,
        company: job.company,
        deadline: job.deadline,
        daysUntil: daysUntil
      });

      if (response && response.status === 200) {
        alert("✅ Test reminder sent! Check your email.");
      } else {
        alert("❌ Failed to send reminder. Please try again.");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert(`❌ Error sending reminder: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "100%",
          padding: "24px"
        }}
      >
        <h2 style={{ marginTop: 0, color: "#333" }}>⏰ Deadline Reminder Settings</h2>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Job: {job.title} at {job.company}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Deadline: {new Date(job.deadline).toLocaleDateString()}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
            Remind me (days before deadline)
          </label>
          <select value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))} style={inputStyle}>
            <option value={1}>1 day before</option>
            <option value={2}>2 days before</option>
            <option value={3}>3 days before</option>
            <option value={5}>5 days before</option>
            <option value={7}>1 week before</option>
            <option value={14}>2 weeks before</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={emailReminder} onChange={(e) => setEmailReminder(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Enable email reminders</span>
          </label>
        </div>

        {emailReminder && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
              Email Address
            </label>
            
            {userEmail && !useManualEmail ? (
              <>
                <div style={{
                  ...inputStyle,
                  background: "#f5f5f5",
                  color: "#666",
                  cursor: "not-allowed"
                }}>
                  {userEmail}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  Using email from your profile.{" "}
                  <button
                    onClick={() => setUseManualEmail(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f8ef7",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "12px"
                    }}
                  >
                    Use different email
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  style={inputStyle}
                />
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  {userEmail ? (
                    <>
                      <button
                        onClick={() => {
                          setUseManualEmail(false);
                          setManualEmail(userEmail);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#4f8ef7",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "12px"
                        }}
                      >
                        Use profile email ({userEmail})
                      </button>
                    </>
                  ) : (
                    "Enter the email where you want to receive reminders"
                  )}
                </div>
              </>
            )}
            
            <button
              onClick={handleSendTestReminder}
              disabled={isSending || (!userEmail && !manualEmail.trim())}
              style={{
                marginTop: "8px",
                padding: "8px 16px",
                background: isSending || (!userEmail && !manualEmail.trim()) ? "#ccc" : "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSending || (!userEmail && !manualEmail.trim()) ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              {isSending ? "Sending..." : "📧 Send Test Reminder"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "#999", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: "10px 20px", background: "#4f8ef7", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}