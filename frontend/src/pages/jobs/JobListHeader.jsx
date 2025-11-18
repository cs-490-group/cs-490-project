import React from "react";

export default function JobListHeader({ 
  view, 
  setView, 
  setEditingJob, 
  showCalendar, 
  setShowCalendar, 
  showArchived, 
  setShowArchived, 
  setShowSettings,
  showStatistics,
  setShowStatistics
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
        {/* Main view buttons - always visible in pipeline view */}
        {view === "pipeline" && (
          <>
            <button
              onClick={() => {
                setShowStatistics(false);
                setShowCalendar(false);
                setShowArchived(false);
              }}
              style={{
                padding: "12px 24px",
                background: !showStatistics && !showCalendar && !showArchived ? "#4caf50" : "#9c27b0",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              📋 Pipeline
            </button>
            
            <button
              onClick={() => {
                setShowStatistics(true);
                setShowCalendar(false);
                setShowArchived(false);
              }}
              style={{
                padding: "12px 24px",
                background: showStatistics ? "#4caf50" : "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              📊 Statistics
            </button>
            
            <button
              onClick={() => {
                setShowCalendar(true);
                setShowStatistics(false);
                setShowArchived(false);
              }}
              style={{
                padding: "12px 24px",
                background: showCalendar ? "#4caf50" : "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              📅 Calendar
            </button>
            
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setShowStatistics(false);
                setShowCalendar(false);
              }}
              style={{
                padding: "12px 24px",
                background: showArchived ? "#4caf50" : "#607d8b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              🗄️ Archive
            </button>
            
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
        
        {/* Add/Back button */}
        <button
          onClick={() => {
            if (view === "pipeline") {
              setView("form");
              setEditingJob(null);
            } else {
              setView("pipeline");
              setEditingJob(null);
            }
          }}
          style={{
            padding: "12px 24px",
            background: view === "pipeline" ? "#4f8ef7" : "#f44336",
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