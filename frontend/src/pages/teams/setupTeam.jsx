import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFlash } from "../../context/flashContext";
import teamsAPI from "../../api/teams";
import ProfilesAPI from "../../api/profiles";
import { Plus, UserPlus } from "lucide-react";

function SetupTeam() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  const [mode, setMode] = useState(null); // null, "create", "join"
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const sessionToken = localStorage.getItem("session");
    const uuid = localStorage.getItem("uuid");
    const teamId = localStorage.getItem("teamId");

    if (!sessionToken || !uuid) {
      navigate("/register");
      return;
    }

    // If user already has teamId, go to teams dashboard
    if (teamId) {
      navigate("/teams");
      return;
    }
  }, [navigate]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      showFlash("Team name is required", "error");
      return;
    }

    setLoading(true);
    try {
      const uuid = localStorage.getItem("uuid");
      
      const response = await teamsAPI.createTeam({
        uuid: uuid,
        email: null, // We don't store email in localStorage
        name: teamName,
        description: teamDescription,
      });

      if (response && response.id) {
        localStorage.setItem("teamId", response.id);
        showFlash("Team created successfully!", "success");
        navigate("/teams");
      } else {
        showFlash("Unexpected response from server", "error");
      }
    } catch (error) {
      console.error("Create team error:", error);
      
      let msg = "Failed to create team";
      
      if (error.response?.data) {
        if (Array.isArray(error.response.data)) {
          // Pydantic validation errors
          msg = error.response.data[0]?.msg || "Validation error";
        } else if (typeof error.response.data === "object") {
          msg = error.response.data.detail || error.response.data.message || msg;
        } else {
          msg = error.response.data;
        }
      } else if (error.message) {
        msg = error.message;
      }
      
      showFlash(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
  e.preventDefault();
  
  if (!inviteCode.trim()) {
    showFlash("Invite code is required", "error");
    return;
  }

  setLoading(true);
  try {
    const teamId = inviteCode;
    const uuid = localStorage.getItem("uuid");
    
    // Fetch email from user profile using proper API
    const profileResponse = await ProfilesAPI.get();
    const email = profileResponse.data.email;
    
    console.log("Join team data:", { teamId, uuid, email });
    
    // First verify team exists
    const teamResponse = await teamsAPI.getTeam(teamId);
    
    if (!teamResponse) {
      showFlash("Invalid invite code", "error");
      return;
    }

    // NOW accept the invitation to become an active member
    const acceptResponse = await teamsAPI.acceptInvitation(teamId, {
      email: email,
      uuid: uuid
    });

    localStorage.setItem("teamId", teamId);
    showFlash("Successfully joined team!", "success");
    navigate("/teams");
  } catch (error) {
    console.error("Join error:", error);
    
    let msg = "Failed to join team";
    
    if (error.response?.data) {
      const data = error.response.data;
      if (Array.isArray(data)) {
        msg = data[0]?.msg || "Validation error";
      } else if (data.detail) {
        msg = data.detail;
      } else if (data.message) {
        msg = data.message;
      } else if (typeof data === "string") {
        msg = data;
      }
    } else if (error.message) {
      msg = error.message;
    }
    
    showFlash(msg, "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #eff6ff, #e0e7ff)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ maxWidth: "56rem", width: "100%" }}>
        {/* Header */}
        {!mode && (
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#111827", marginBottom: "1rem" }}>
              Get Started with Teams
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#4b5563" }}>
              Create a new team or join an existing one to get started
            </p>
          </div>
        )}

        {/* Mode Selection */}
        {!mode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Create Team Card */}
            <button
              onClick={() => setMode("create")}
              style={{
                background: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                padding: "2rem",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.15)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: "#dbeafe", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                <Plus style={{ width: "1.5rem", height: "1.5rem", color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
                Create New Team
              </h2>
              <p style={{ color: "#4b5563", marginBottom: "1rem" }}>
                Start fresh with a new team. You'll be the admin and can invite others.
              </p>
              <div style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: "600" }}>
                Create Team →
              </div>
            </button>

            {/* Join Team Card */}
            <button
              onClick={() => setMode("join")}
              style={{
                background: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                padding: "2rem",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.15)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: "#dcfce7", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                <UserPlus style={{ width: "1.5rem", height: "1.5rem", color: "#16a34a" }} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
                Join Existing Team
              </h2>
              <p style={{ color: "#4b5563", marginBottom: "1rem" }}>
                Have an invite code? Join a team and start collaborating right away.
              </p>
              <div style={{ fontSize: "0.875rem", color: "#16a34a", fontWeight: "600" }}>
                Join Team →
              </div>
            </button>
          </div>
        )}

        {/* Create Team Form */}
        {mode === "create" && (
          <div style={{ background: "white", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
              <button
                onClick={() => setMode(null)}
                style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", marginRight: "1rem", fontSize: "1rem" }}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827" }}>
                Create Your Team
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Tech Talent 2025"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Team Description (Optional)
                </label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="What is your team about? What are your goals?"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    minHeight: "6rem",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                onClick={handleCreateTeam}
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#9ca3af" : "#2563eb",
                  color: "white",
                  fontWeight: "600",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#2563eb";
                }}
              >
                {loading ? "Creating Team..." : "Create Team"}
              </button>
            </div>

            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "1rem", textAlign: "center" }}>
              You'll become the admin of this team and can invite others.
            </p>
          </div>
        )}

        {/* Join Team Form */}
        {mode === "join" && (
          <div style={{ background: "white", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
              <button
                onClick={() => setMode(null)}
                style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", marginRight: "1rem", fontSize: "1rem" }}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827" }}>
                Join a Team
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                  Invite Code *
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste your invite code here"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#16a34a";
                    e.target.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                />
              </div>

              <button
                onClick={handleJoinTeam}
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#9ca3af" : "#16a34a",
                  color: "white",
                  fontWeight: "600",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#15803d";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#16a34a";
                }}
              >
                {loading ? "Joining Team..." : "Join Team"}
              </button>
            </div>

            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginTop: "1.5rem",
            }}>
              <p style={{ fontSize: "0.875rem", color: "#1e40af" }}>
                <strong>Don't have an invite code?</strong> Ask your team admin to send you one, or go back and create a new team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SetupTeam;