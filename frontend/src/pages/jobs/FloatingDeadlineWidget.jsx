import React, { useState } from "react";

export default function FloatingDeadlineWidget({ jobs, onJobClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobsWithDeadlines = jobs
    .filter(job => job.deadline && !job.archived)
    .map(job => {
      const deadlineDate = new Date(job.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
      return { ...job, daysUntil, deadlineDate };
    })
    .sort((a, b) => a.deadlineDate - b.deadlineDate);

  // Count urgent deadlines (overdue or within 7 days)
  const urgentCount = jobsWithDeadlines.filter(job => job.daysUntil <= 7).length;
  const overdueCount = jobsWithDeadlines.filter(job => job.daysUntil < 0).length;

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
    if (daysUntil <= 7) return `${daysUntil}d`;
    return `${daysUntil}d`;
  };

  const getStatusColor = (status) => {
    const colors = {
      "Interested": "#9e9e9e",
      "Applied": "#2196f3",
      "Screening": "#ff9800",
      "Interview": "#ff5722",
      "Offer": "#4caf50",
      "Rejected": "#f44336"
    };
    return colors[status] || "#666";
  };

  if (isMinimized) return null;

  // Collapsed state - just the button
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "64px",
          height: "64px",
          background: urgentCount > 0 ? "linear-gradient(135deg, #ff5722 0%, #f44336 100%)" : "linear-gradient(135deg, #4f8ef7 0%, #2196f3 100%)",
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "transform 0.2s, box-shadow 0.2s",
          animation: urgentCount > 0 ? "pulse 2s infinite" : "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        }}
      >
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}
        </style>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", lineHeight: "1" }}>📅</div>
          {urgentCount > 0 && (
            <div style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#fff",
              color: "#f44336",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              border: "2px solid #f44336"
            }}>
              {urgentCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded state - full widget
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "380px",
        maxHeight: "600px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        overflow: "hidden",
        animation: "slideIn 0.3s ease-out"
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        background: urgentCount > 0 ? "linear-gradient(135deg, #ff5722 0%, #f44336 100%)" : "linear-gradient(135deg, #4f8ef7 0%, #2196f3 100%)",
        color: "white",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>📅</span>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>Deadlines</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              {jobsWithDeadlines.length} total
              {urgentCount > 0 && ` • ${urgentCount} urgent`}
              {overdueCount > 0 && ` • ${overdueCount} overdue`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "4px",
              color: "white",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            title="Minimize"
          >
            ▼
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "4px",
              color: "white",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px"
      }}>
        {jobsWithDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>No deadlines</div>
            <div style={{ fontSize: "14px" }}>You're all caught up!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {jobsWithDeadlines.slice(0, 10).map(job => (
              <div
                key={job.id}
                style={{
                  padding: "12px",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  border: `2px solid ${getUrgencyColor(job.daysUntil)}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => {
                  // Call the onJobClick callback if provided
                  if (onJobClick) {
                    onJobClick(job);
                    setIsExpanded(false); // Close widget after clicking
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333", marginBottom: "2px" }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {job.company}
                    </div>
                  </div>
                  <div style={{
                    background: getUrgencyColor(job.daysUntil),
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: "60px"
                  }}>
                    {getUrgencyLabel(job.daysUntil)}
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <div style={{
                    background: getStatusColor(job.status),
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontWeight: "600"
                  }}>
                    {job.status}
                  </div>
                  <div style={{ color: "#999" }}>
                    📅 {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
            
            {jobsWithDeadlines.length > 10 && (
              <div style={{
                textAlign: "center",
                padding: "12px",
                color: "#666",
                fontSize: "13px",
                fontStyle: "italic"
              }}>
                + {jobsWithDeadlines.length - 10} more deadlines
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Quick Actions */}
      <div style={{
        borderTop: "1px solid #e0e0e0",
        padding: "12px 16px",
        display: "flex",
        gap: "8px"
      }}>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            flex: 1,
            padding: "10px",
            background: "#9e9e9e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#757575"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#9e9e9e"}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}