import React from "react";

export default function GoalSettingsModal({ show, goals, setGoals, onClose, onSave }) {
  if (!show) return null;

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
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "100%"
        }}
      >
        <h3 style={{ marginTop: 0 }}>🎯 Set Your Goals</h3>
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            Weekly Applications Goal
          </label>
          <input
            type="number"
            value={goals.weeklyApplications}
            onChange={(e) => setGoals({...goals, weeklyApplications: parseInt(e.target.value) || 0})}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            Monthly Interviews Goal
          </label>
          <input
            type="number"
            value={goals.monthlyInterviews}
            onChange={(e) => setGoals({...goals, monthlyInterviews: parseInt(e.target.value) || 0})}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            Target Response Rate (%)
          </label>
          <input
            type="number"
            value={goals.targetResponseRate}
            onChange={(e) => setGoals({...goals, targetResponseRate: parseInt(e.target.value) || 0})}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            Target Interview Rate (%)
          </label>
          <input
            type="number"
            value={goals.targetInterviewRate}
            onChange={(e) => setGoals({...goals, targetInterviewRate: parseInt(e.target.value) || 0})}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
        
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "8px 16px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
}