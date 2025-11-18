import React from "react";

export default function JobListHeader({ 
  view, 
  setView, 
  setEditingJob, 
  showCalendar, 
  setShowCalendar, 
  showArchived, 
  setShowArchived, 
  setShowSettings 
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "10px",
    }}>
      <div style={{ display: "inline-block", textAlign: "center" }}>
        <h1 style={{
          margin: 0,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "2.5rem",
          fontFamily: '"Playfair Display", serif',
          WebkitTextFillColor: "#ffffff",
        }}>
          Job Opportunities Tracker
        </h1>
        <div style={{
          width: "90px",
          height: "4px",
          margin: "6px auto 0",
          borderRadius: "2px",
          background: "linear-gradient(90deg, #00c28a, #005e9e)",
        }} />
      </div>
      
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {view === "pipeline" && !showArchived && (
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            style={{
              padding: "12px 24px",
              background: showCalendar ? "#ff9800" : "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            {showCalendar ? "📋 Hide Calendar" : "📅 Show Calendar"}
          </button>
        )}
        
        {view === "pipeline" && (
          <>
            {!showCalendar && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                style={{
                  padding: "12px 24px",
                  background: showArchived ? "#ff5722" : "#607d8b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "14px"
                }}
              >
                {showArchived ? "📂 Show Active" : "🗄️ Show Archived"}
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "12px 24px",
                background: "#795548",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              ⚙️ Settings
            </button>
          </>
        )}
        
        <button
          onClick={() => {
            setView(view === "pipeline" ? "form" : "pipeline");
            setEditingJob(null);
          }}
          style={{
            padding: "12px 24px",
            background: "#4f8ef7",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {view === "pipeline" ? "+ Add New Job" : "← Back to Pipeline"}
        </button>
      </div>
    </div>
  );
}