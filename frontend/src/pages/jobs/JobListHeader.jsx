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
  setShowStatistics,
  showMaterials,
  setShowMaterials,
  showFloatingWidget,
  toggleFloatingWidget
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
        {/* Main view buttons */}
        {(view === "pipeline" || view === "dashboard") && (
          <>
            <button
              onClick={() => {
                setView("dashboard");
                setShowStatistics(false);
                setShowCalendar(false);
                setShowArchived(false);
                setShowMaterials(false);
              }}
              style={{
                padding: "12px 24px",
                background: view === "dashboard" ? "#4caf50" : "#9c27b0",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              📈 Dashboard
            </button>
            
            <button
              onClick={() => {
                setView("pipeline");
                setShowStatistics(false);
                setShowCalendar(false);
                setShowArchived(false);
                setShowMaterials(false);
              }}
              style={{
                padding: "12px 24px",
                background: view === "pipeline" && !showStatistics && !showCalendar && !showArchived && !showMaterials ? "#4caf50" : "#e91e63",
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
                setView("pipeline");
                setShowStatistics(true);
                setShowCalendar(false);
                setShowArchived(false);
                setShowMaterials(false);
              }}
              style={{
                padding: "12px 24px",
                background: showStatistics ? "#4caf50" : "#213df3ff",
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
                setView("pipeline");
                setShowMaterials(true);
                setShowStatistics(false);
                setShowCalendar(false);
                setShowArchived(false);
              }}
              style={{
                padding: "12px 24px",
                background: showMaterials ? "#4caf50" : "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              📄 Materials
            </button>
            
            <button
              onClick={() => {
                setView("pipeline");
                setShowCalendar(true);
                setShowStatistics(false);
                setShowArchived(false);
                setShowMaterials(false);
              }}
              style={{
                padding: "12px 24px",
                background: showCalendar ? "#4caf50" : "#03a9f4",
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
                setView("pipeline");
                setShowArchived(true);
                setShowStatistics(false);
                setShowCalendar(false);
                setShowMaterials(false);
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
            if (view === "pipeline" || view === "dashboard") {
              setView("form");
              setEditingJob(null);
            } else {
              setView("dashboard");
              setEditingJob(null);
            }
          }}
          style={{
            padding: "12px 24px",
            background: (view === "pipeline" || view === "dashboard") ? "#4f8ef7" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {(view === "pipeline" || view === "dashboard") ? "+ Add New Job" : "← Back to Dashboard"}
        </button>
      </div>
    </div>
  );
}