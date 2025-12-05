import React, { useState, useEffect } from "react";
import teamsAPI from "../../api/teams";

export default function GoalSettingsModal({ show, memberUuid, teamId, onClose, onSave }) {
  const [goals, setGoals] = useState({
    weeklyApplications: 0,
    monthlyApplications: 0,
    monthlyInterviews: 0,
    targetResponseRate: 0,
    targetInterviewRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug props on mount
  React.useEffect(() => {
    console.log(" GoalSettingsModal Props:");
    console.log("   show:", show);
    console.log("   memberUuid:", memberUuid);
    console.log("   teamId:", teamId);
    console.log("   Is in team?", !!(memberUuid && teamId));
  }, [show, memberUuid, teamId]);

  useEffect(() => {
    if (show) {
      loadGoals();
    }
  }, [show, memberUuid, teamId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      
      // First, try to load from localStorage
      const storedGoals = localStorage.getItem('userGoals');
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }
      
      // If user is in a team, also fetch from backend (backend is source of truth)
      if (memberUuid && teamId) {
        const memberGoals = await teamsAPI.getMemberGoals(teamId, memberUuid);
        
        // Find the goals_config object
        const goalsConfig = memberGoals?.find(g => g.id === 'goals_config');
        
        if (goalsConfig?.data) {
          console.log(" Found goals_config in backend:", goalsConfig.data);
          setGoals(goalsConfig.data);
          // Sync to localStorage
          localStorage.setItem('userGoals', JSON.stringify(goalsConfig.data));
        }
      }
    } catch (err) {
      console.error(" Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);


      // Always save to localStorage first (for non-team users and immediate access)
      localStorage.setItem('userGoals', JSON.stringify(goals));
      console.log(" Saved to localStorage");

      // If user is in a team, also save to backend
      if (memberUuid && teamId) {
        console.log(" User is in a team, syncing to backend...");
        try {
          // Create or update the goals configuration object
          const goalsConfig = {
            id: 'goals_config',
            title: 'Goals Configuration',
            description: 'User goal settings',
            completed: false,
            createdAt: new Date().toISOString(),
            data: goals
          };

          console.log("Fetching existing goals...");
          // Fetch existing goals and update the config
          const existingGoals = await teamsAPI.getMemberGoals(teamId, memberUuid);
          console.log("   Existing goals:", existingGoals);
          
          const otherGoals = existingGoals?.filter(g => g.id !== 'goals_config') || [];
          const updatedGoals = [...otherGoals, goalsConfig];

          console.log(" Updating goals in backend...", updatedGoals);
          await teamsAPI.updateMemberGoals(teamId, memberUuid, updatedGoals);
          console.log(" Goals saved to team backend");
        } catch (backendError) {
          console.error(" Failed to save to team backend:", backendError);
          console.error("   Error details:", backendError.response?.data || backendError.message);
          // Don't throw - localStorage save was successful
          setError("Goals saved locally, but failed to sync with team. You can try again later.");
        }
      } else {
        console.log("User not in a team, skipping backend sync");
      }
      
      if (onSave) {
        onSave(goals);
      }
      
      if (!error) {
        onClose();
      }
    } catch (err) {
      console.error("Failed to save goals:", err);
      setError("Failed to save goals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto"
        }}
      >
        <h3 style={{ marginTop: 0 }}>🎯 Set Your Goals</h3>
        
        {error && (
          <div style={{
            padding: "12px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            Weekly Applications Goal
          </label>
          <input
            type="number"
            value={goals.weeklyApplications}
            onChange={(e) => setGoals({...goals, weeklyApplications: parseInt(e.target.value) || 0})}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd",
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
            Monthly Applications Goal
          </label>
          <input
            type="number"
            value={goals.monthlyApplications}
            onChange={(e) => setGoals({...goals, monthlyApplications: parseInt(e.target.value) || 0})}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd",
              opacity: loading ? 0.6 : 1
            }}
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
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd",
              opacity: loading ? 0.6 : 1
            }}
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
            disabled={loading}
            min="0"
            max="100"
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd",
              opacity: loading ? 0.6 : 1
            }}
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
            disabled={loading}
            min="0"
            max="100"
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd",
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>
        
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Saving..." : "Save Goals"}
          </button>
        </div>
      </div>
    </div>
  );
}