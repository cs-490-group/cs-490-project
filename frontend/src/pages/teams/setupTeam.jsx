import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFlash } from "../../context/flashContext";
import teamsAPI from "../../api/teams";
import { Plus, UserPlus, Users, ArrowRight } from "lucide-react";

function SetupTeam() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  const [mode, setMode] = useState(null); // null, "create", "join"
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState([]);

  useEffect(() => {
    const checkUserAndFetchTeams = async () => {
      const sessionToken = localStorage.getItem("session");
      const uuid = localStorage.getItem("uuid");


      // Fetch Teams 
      try {
        setLoading(true);
        const response = await teamsAPI.getUserTeams(uuid);
        
        // Handle response formats (array vs object)
        const teamsList = Array.isArray(response) ? response : (response.data || []);
        setUserTeams(teamsList);
      } catch (error) {
        console.error("Failed to fetch user teams:", error);
        // Don't show flash error here, just show empty list if it fails
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchTeams();
  }, [navigate]);

  const handleSelectTeam = (teamId) => {
    // Set the active context
    localStorage.setItem("teamId", teamId);
    showFlash("Entering team workspace...", "success");
    navigate("/teams");
  };

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
        email: null, 
        name: teamName,
        description: teamDescription,
      });

      if (response && response.id) {
        handleSelectTeam(response.id);
      }
    } catch (error) {
      console.error("Create team error:", error);
      showFlash("Failed to create team", "error");
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
      
      await teamsAPI.acceptInvitation(teamId, {
        email: localStorage.getItem("email"),
        uuid: uuid
      });

      handleSelectTeam(teamId);
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to join team";
      showFlash(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mode) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #eff6ff, #e0e7ff)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ maxWidth: "56rem", width: "100%" }}>
        
        {/* Header */}
        {!mode && (
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
              Welcome to Teams
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#6b7280" }}>
              Collaborate, track goals, and succeed together.
            </p>
          </div>
        )}

        {/* --- SECTION 1: YOUR TEAMS --- */}
        {!mode && userTeams.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
              <Users size={20} className="text-primary me-2" />
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#374151", margin: 0 }}>Your Teams</h2>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {userTeams.map((team) => (
                <div 
                  key={team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  style={{
                    background: "white",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: "1px solid transparent"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#111827", marginBottom: "0.25rem" }}>
                        {team.name}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {team.description || "No description"}
                      </p>
                    </div>
                    <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "50%" }}>
                      <ArrowRight size={16} className="text-primary" />
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {team.role || "Member"}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      {team.memberCount || 0} Members
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ margin: "2rem 0", height: "1px", background: "#e5e7eb", position: "relative" }}>
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#eff6ff", padding: "0 1rem", color: "#9ca3af", fontSize: "0.875rem" }}>
                OR
              </span>
            </div>
          </div>
        )}

        {/* --- SECTION 2: ACTIONS (Create / Join) --- */}
        {!mode && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {/* Create Team Card */}
            <button
              onClick={() => setMode("create")}
              style={{
                background: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "2rem",
                textAlign: "left",
                border: "1px dashed #cbd5e1",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: "#dbeafe", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                <Plus style={{ width: "1.5rem", height: "1.5rem", color: "#2563eb" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
                Create New Team
              </h2>
              <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>
                Start fresh with a new team. You'll be the admin.
              </p>
            </button>

            {/* Join Team Card */}
            <button
              onClick={() => setMode("join")}
              style={{
                background: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "2rem",
                textAlign: "left",
                border: "1px dashed #cbd5e1",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.borderColor = "#16a34a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", background: "#dcfce7", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                <UserPlus style={{ width: "1.5rem", height: "1.5rem", color: "#16a34a" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
                Join Existing Team
              </h2>
              <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>
                Have an invite code? Enter it to join a team.
              </p>
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
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>Team Name *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Tech Talent 2025"
                  className="form-control"
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>Description</label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Goals and details..."
                  className="form-control"
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", minHeight: "100px" }}
                />
              </div>
              <button
                onClick={handleCreateTeam}
                disabled={loading}
                style={{ width: "100%", background: "#2563eb", color: "white", padding: "0.75rem", borderRadius: "0.5rem", border: "none", fontWeight: "600", cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? "Creating..." : "Create Team"}
              </button>
            </div>
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
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>Invite Code *</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste invite code"
                  className="form-control"
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontFamily: "monospace" }}
                />
              </div>
              <button
                onClick={handleJoinTeam}
                disabled={loading}
                style={{ width: "100%", background: "#16a34a", color: "white", padding: "0.75rem", borderRadius: "0.5rem", border: "none", fontWeight: "600", cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? "Joining..." : "Join Team"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SetupTeam;