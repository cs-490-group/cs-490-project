import React, { useState, useEffect } from "react";
import teamsAPI from "../../api/teams";

function GoalTracker({ teamId, member, currentUserRole, onGoalsUpdate }) {
  const [goals, setGoals] = useState({
    weeklyApplications: 0,
    monthlyApplications: 0,
    monthlyInterviews: 0,
    targetResponseRate: 0,
    targetInterviewRate: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canEditGoals = currentUserRole === "mentor" || currentUserRole === "admin";

  const goalDefinitions = [
    { key: 'weeklyApplications', label: 'Weekly Applications Goal', unit: 'applications/week' },
    { key: 'monthlyApplications', label: 'Monthly Applications Goal', unit: 'applications/month' },
    { key: 'monthlyInterviews', label: 'Monthly Interviews Goal', unit: 'interviews/month' },
    { key: 'targetResponseRate', label: 'Target Response Rate', unit: '%' },
    { key: 'targetInterviewRate', label: 'Target Interview Rate', unit: '%' }
  ];

  useEffect(() => {
    fetchGoals();
  }, [member?.uuid, teamId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      console.log(" Fetching goals for member:", member.uuid);
      
      const memberGoals = await teamsAPI.getMemberGoals(teamId, member.uuid);
      console.log(" Raw member goals from backend:", memberGoals);
      
      // Find the goals_config object
      const goalsConfig = memberGoals?.find(g => g.id === 'goals_config');
      console.log("Found goals_config:", goalsConfig);
      
      if (goalsConfig?.data) {
        console.log("Setting goals from goals_config.data:", goalsConfig.data);
        // Ensure all values are numbers, not undefined
        const goalsData = goalsConfig.data;
        setGoals({
          weeklyApplications: goalsData.weeklyApplications || 0,
          monthlyApplications: goalsData.monthlyApplications || 0,
          monthlyInterviews: goalsData.monthlyInterviews || 0,
          targetResponseRate: goalsData.targetResponseRate || 0,
          targetInterviewRate: goalsData.targetInterviewRate || 0
        });
      } else {
        console.log("No goals_config found, using defaults");
        // Set defaults if no goals exist
        setGoals({
          weeklyApplications: 0,
          monthlyApplications: 0,
          monthlyInterviews: 0,
          targetResponseRate: 0,
          targetInterviewRate: 0
        });
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load goals:", err);
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log(" Saving goals:", goals);
      
      // Create the goals_config object
      const goalsConfig = {
        id: 'goals_config',
        title: 'Goals Configuration',
        description: 'User goal settings',
        completed: false,
        createdAt: new Date().toISOString(),
        data: goals
      };

      console.log("Goals config object:", goalsConfig);

      // Fetch existing goals to preserve other goal objects
      const existingGoals = await teamsAPI.getMemberGoals(teamId, member.uuid);
      console.log(" Existing goals:", existingGoals);
      
      // Remove old goals_config and add new one
      const otherGoals = existingGoals?.filter(g => g.id !== 'goals_config') || [];
      const updatedGoals = [...otherGoals, goalsConfig];

      console.log("Updating with goals array:", updatedGoals);

      await teamsAPI.updateMemberGoals(teamId, member.uuid, updatedGoals);
      console.log(" Goals saved successfully");
      
      setIsEditing(false);
      if (onGoalsUpdate) {
        onGoalsUpdate(updatedGoals);
      }
      setError(null);
    } catch (err) {
      console.error(" Failed to save goals:", err);
      setError("Failed to save goals");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !goals) {
    return <div style={{ padding: "16px", color: "#666" }}>Loading goals...</div>;
  }

  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#1a1a1a" }}>
          🎯 All 5 Goals
        </h3>
        {canEditGoals && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
          >
            Edit Goals
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: "12px",
          background: "#ffebee",
          color: "#c62828",
          borderRadius: "4px",
          marginBottom: "16px",
          fontSize: "13px"
        }}>
          {error}
        </div>
      )}

      {isEditing ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "20px" }}>
            {goalDefinitions.map((goal) => (
              <div key={goal.key}>
                <label style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1a1a1a"
                }}>
                  {goal.label}
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={goals[goal.key]}
                    onChange={(e) => setGoals({
                      ...goals,
                      [goal.key]: parseInt(e.target.value) || 0
                    })}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#666", minWidth: "120px", textAlign: "right" }}>
                    {goal.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setIsEditing(false);
                fetchGoals(); // Reload original values
              }}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "#999",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Saving..." : "Save Goals"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {goalDefinitions.map((goal) => {
            const value = goals[goal.key];
            const displayValue = value !== undefined && value !== null ? value : 0;
            
            return (
              <div
                key={goal.key}
                style={{
                  background: "#f9f9f9",
                  padding: "16px",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0"
                }}
              >
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                  {goal.label}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2196f3", marginBottom: "4px" }}>
                  {displayValue}
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  {goal.unit}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GoalTracker;