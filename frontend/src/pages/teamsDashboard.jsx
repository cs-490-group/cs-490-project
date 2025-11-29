import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Mail, Edit2, Trash2, TrendingUp, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import teamsAPI from "../api/teams";

function TeamsDashboard() {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [newInvite, setNewInvite] = useState({ email: "", role: "candidate" });
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchTeamData();
    fetchTeamProgress();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const teamId = localStorage.getItem("teamId") || "TEAM_ID";
      const teamData = await teamsAPI.getTeam(teamId);
      setTeam(teamData);
      setMembers(teamData.members || []);
      setSelectedPlan(teamData.billing?.plan || "basic");
      setError(null);
    } catch (err) {
      console.error("Failed to fetch team data", err);
      setError("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamProgress = async () => {
    try {
      const teamId = localStorage.getItem("teamId") || "TEAM_ID";
      const progressData = await teamsAPI.getTeamProgress(teamId);
      setProgress(progressData);
    } catch (err) {
      console.error("Failed to fetch team progress", err);
    }
  };

  const getMemberProgressData = (memberUuid) => {
    return progress?.memberProgress?.find(m => m.uuid === memberUuid);
  };

  const filteredMembers = members.filter((m) => {
    const roleMatch = filterRole === "all" || m.role === filterRole;
    const textMatch = m.name?.toLowerCase().includes(search.toLowerCase()) || 
                      m.email?.toLowerCase().includes(search.toLowerCase());
    return roleMatch && textMatch;
  });

  const isAdmin = () => team?.currentUserRole === "admin";
  const isMentor = () => team?.currentUserRole === "mentor";

  const renderOverview = () => (
    <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>
        {team?.name || "Team"} Dashboard
      </h1>
      
      {team && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Members", value: team.memberCount || 0 },
              { label: "Admins", value: team.admins || 0 },
              { label: "Mentors", value: team.mentors || 0 },
              { label: "Candidates", value: team.candidates || 0 }
            ].map((item, idx) => (
              <div key={idx} style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>{item.label}</div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1a1a1a" }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Aggregate KPIs</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <div>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Progress</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2196f3" }}>{progress?.overallProgress || 0}%</div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Goals Completed</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4caf50" }}>{progress?.completedGoals || 0}</div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Applications Sent</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#9c27b0" }}>{progress?.totalApplications || 0}</div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Avg Engagement</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9800" }}>{team.avgEngagement || 0}%</div>
              </div>
            </div>
          </div>

          {progress && (
            <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Member Progress</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                {progress.memberProgress?.map((member) => (
                  <div key={member.uuid} style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#1a1a1a" }}>{member.name}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>{member.role}</div>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#2196f3" }}>{member.progress}%</div>
                    </div>
                    <div style={{ background: "#e0e0e0", height: "6px", borderRadius: "3px", marginBottom: "12px", overflow: "hidden" }}>
                      <div style={{ background: "#2196f3", height: "100%", width: `${member.progress}%`, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "#e8f5e9", padding: "8px", borderRadius: "4px", textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2e7d32" }}>{member.applications.successRate}%</div>
                        <div style={{ fontSize: "11px", color: "#666" }}>Success</div>
                      </div>
                      <div style={{ background: "#e3f2fd", padding: "8px", borderRadius: "4px", textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1565c0" }}>{member.applications.interviewRate}%</div>
                        <div style={{ fontSize: "11px", color: "#666" }}>Interview</div>
                      </div>
                      <div style={{ background: "#f3e5f5", padding: "8px", borderRadius: "4px", textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#6a1b9a" }}>{member.applications.responseRate}%</div>
                        <div style={{ fontSize: "11px", color: "#666" }}>Response</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderMembers = () => (
    <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>Team Members</h1>
      
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
        />
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", minWidth: "120px" }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="mentor">Mentors</option>
          <option value="candidate">Candidates</option>
        </select>
      </div>

      {isAdmin() && (
        <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #e0e0e0" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#1a1a1a", fontSize: "14px", fontWeight: "bold" }}>Invite Member</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="email"
              placeholder="Email"
              value={newInvite.email}
              onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
            <select
              value={newInvite.role}
              onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
              style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", minWidth: "100px" }}
            >
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
              <option value="candidate">Candidate</option>
            </select>
            <button 
              onClick={async () => {
                if (!newInvite.email) {
                  alert("Email is required.");
                  return;
                }
                try {
                  await teamsAPI.inviteMember(team.id, newInvite);
                  alert(`Invitation sent to ${newInvite.email}`);
                  setNewInvite({ email: "", role: "candidate" });
                  fetchTeamData();
                } catch (err) {
                  console.error(err);
                  alert("Failed to invite member");
                }
              }}
              style={{ padding: "10px 20px", background: "#2196f3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", whiteSpace: "nowrap" }}
            >
              Send Invite
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {filteredMembers.map((member) => {
          const memberProgress = getMemberProgressData(member.uuid);
          return (
            <div
              key={member.uuid}
              onClick={() => setSelectedMember(member)}
              style={{
                padding: "16px",
                borderRadius: "8px",
                border: selectedMember?.uuid === member.uuid ? "2px solid #2196f3" : "1px solid #e0e0e0",
                background: selectedMember?.uuid === member.uuid ? "#f0f8ff" : "white",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#1a1a1a" }}>{member.name}</div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>{member.role}</div>
              {memberProgress && (
                <>
                  <div style={{ background: "#e0e0e0", height: "4px", borderRadius: "2px", marginBottom: "8px", overflow: "hidden" }}>
                    <div style={{ background: "#2196f3", height: "100%", width: `${memberProgress.progress}%` }} />
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                    {memberProgress.completedGoals}/{memberProgress.totalGoals} goals
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
                    <div style={{ background: "#e8f5e9", padding: "6px", borderRadius: "4px", textAlign: "center", fontSize: "11px" }}>
                      <div style={{ fontWeight: "bold", color: "#2e7d32" }}>{memberProgress.applications.successRate}%</div>
                      <div style={{ color: "#666", fontSize: "10px" }}>Success</div>
                    </div>
                    <div style={{ background: "#e3f2fd", padding: "6px", borderRadius: "4px", textAlign: "center", fontSize: "11px" }}>
                      <div style={{ fontWeight: "bold", color: "#1565c0" }}>{memberProgress.applications.interviewRate}%</div>
                      <div style={{ color: "#666", fontSize: "10px" }}>Interview</div>
                    </div>
                    <div style={{ background: "#f3e5f5", padding: "6px", borderRadius: "4px", textAlign: "center", fontSize: "11px" }}>
                      <div style={{ fontWeight: "bold", color: "#6a1b9a" }}>{memberProgress.applications.responseRate}%</div>
                      <div style={{ color: "#666", fontSize: "10px" }}>Response</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedMember && (
        <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0", color: "#1a1a1a" }}>{selectedMember.name}</h2>
              <div style={{ fontSize: "14px", color: "#666" }}>Email: {selectedMember.email}</div>
              <div style={{ fontSize: "14px", color: "#666" }}>Role: <span style={{ fontWeight: "bold" }}>{selectedMember.role}</span></div>
            </div>
            <button 
              onClick={() => setSelectedMember(null)}
              style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}
            >
              ✕
            </button>
          </div>

          {getMemberProgressData(selectedMember.uuid) && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Completed Goals</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{getMemberProgressData(selectedMember.uuid).completedGoals}</div>
                </div>
                <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Pending Goals</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{getMemberProgressData(selectedMember.uuid).totalGoals - getMemberProgressData(selectedMember.uuid).completedGoals}</div>
                </div>
                <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Engagement</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{getMemberProgressData(selectedMember.uuid).engagement || 0}%</div>
                </div>
                <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Applications</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{getMemberProgressData(selectedMember.uuid).applications.total}</div>
                </div>
              </div>

              <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1a1a1a", fontSize: "16px", fontWeight: "bold" }}>Application Metrics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div style={{ background: "#e8f5e9", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2e7d32" }}>
                      {getMemberProgressData(selectedMember.uuid).applications.successRate}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Success Rate</div>
                  </div>
                  <div style={{ background: "#e3f2fd", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1565c0" }}>
                      {getMemberProgressData(selectedMember.uuid).applications.interviewRate}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Interview Rate</div>
                  </div>
                  <div style={{ background: "#f3e5f5", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#6a1b9a" }}>
                      {getMemberProgressData(selectedMember.uuid).applications.responseRate}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Response Rate</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isMentor() && (
            <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#1a1a1a", fontSize: "14px", fontWeight: "bold" }}>Provide Feedback</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter coaching feedback..."
                style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", minHeight: "100px", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button style={{ marginTop: "12px", padding: "10px 20px", background: "#2196f3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>
                Send Feedback
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderBilling = () => (
    <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>Billing & Subscription</h1>
      {/* Billing content here */}
    </div>
  );

  const renderReports = () => (
    <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>Reports</h1>
      {/* Reports content here */}
    </div>
  );

  if (loading) return <div style={{ padding: "24px", textAlign: "center", background: "white", color: "#1a1a1a" }}>Loading...</div>;
  if (error) return <div style={{ padding: "24px", textAlign: "center", background: "white", color: "#d32f2f" }}>{error}</div>;

  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", gap: "24px", padding: "0 24px", maxWidth: "100%" }}>
          {[
            { id: "overview", label: "Overview" },
            { id: "members", label: "Members" },
            { id: "reports", label: "Reports" },
            { id: "billing", label: "Billing" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "16px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #2196f3" : "3px solid transparent",
                color: activeTab === tab.id ? "#2196f3" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "members" && renderMembers()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "billing" && renderBilling()}
      </div>
    </div>
  );
}

export default TeamsDashboard;