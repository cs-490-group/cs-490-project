import React from "react";
import { useNavigate } from "react-router-dom";

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
  showJobMatching,
  setShowJobMatching,
  showSkillsGap,
  setShowSkillsGap,
  selectedJobId,
  showFloatingWidget,
  toggleFloatingWidget
}) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      marginBottom: "20px",
    }}>
      {/* Title Row */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
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
      </div>
      
      {/* Buttons Row */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        flexWrap: "nowrap",
        justifyContent: "center",
        overflowX: "auto",
        padding: "5px 0"
      }}>
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
                setShowJobMatching(false);
                setShowSkillsGap(false);
              }}
              style={{
                padding: "10px 18px",
                background: view === "dashboard" ? "#4caf50" : "#9c27b0",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
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
                setShowJobMatching(false);
                setShowSkillsGap(false);
              }}
              style={{
                padding: "10px 18px",
                background: view === "pipeline" && !showStatistics && !showCalendar && !showArchived && !showMaterials ? "#4caf50" : "#e91e63",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
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
                setShowJobMatching(false);
                setShowSkillsGap(false);
              }}
              style={{
                padding: "10px 18px",
                background: showStatistics ? "#4caf50" : "#213df3ff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
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
                setShowJobMatching(false);
                setShowSkillsGap(false);
              }}
              style={{
                padding: "10px 18px",
                background: showMaterials ? "#4caf50" : "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
              }}
            >
              📄 Materials
            </button>
            
            <button
              onClick={() => {
                setView("pipeline");
                setShowJobMatching(true);
                setShowSkillsGap(false);
                setShowStatistics(false);
                setShowCalendar(false);
                setShowArchived(false);
                setShowMaterials(false);     
              }}
              style={{
                padding: "10px 18px",
                background: showJobMatching ? "#4caf50" : "#03a9f4",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
              }}
            >
              🔍 Matching
            </button>

            <button
              onClick={() => {
                if (!selectedJobId) {
                  alert("Select a job from Job Matching first!");
                  return;
                }

                setView("pipeline");
                setShowSkillsGap(true);
                setShowJobMatching(false);
                setShowStatistics(false);
                setShowCalendar(false);
                setShowArchived(false);
                setShowMaterials(false);

                navigate(`/jobs/${selectedJobId}/skills-gap`);
              }}
              style={{
                padding: "10px 18px",
                background: showSkillsGap ? "#4caf50" : "#ff5722",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
              }}
            >
              🧠 Skills Gap
            </button>

            <button
              onClick={() => {
                setView("pipeline");
                setShowCalendar(true);
                setShowStatistics(false);
                setShowArchived(false);
                setShowMaterials(false);
                setShowJobMatching(false);
                setShowSkillsGap(false);
              }}
              style={{
                padding: "10px 18px",
                background: showCalendar ? "#4caf50" : "#03a9f4",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
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
                setShowJobMatching(false);
                setShowSkillsGap(false);
              }}
              style={{
                padding: "10px 18px",
                background: showArchived ? "#4caf50" : "#607d8b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
              }}
            >
              🗄️ Archive
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "10px 18px",
                background: "#795548",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
                minWidth: "fit-content"
              }}
            >
              ⚙️ Settings
            </button>
          </>
        )}
        
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
            padding: "10px 18px",
            background: (view === "pipeline" || view === "dashboard") ? "#4f8ef7" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
            whiteSpace: "nowrap",
            minWidth: "fit-content"
          }}
        >
          {(view === "pipeline" || view === "dashboard") ? "+ Add New Job" : "← Back"}
        </button>
      </div>
    </div>
  );
}