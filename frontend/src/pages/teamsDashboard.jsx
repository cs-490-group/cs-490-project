import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Mail, Edit2, Trash2, TrendingUp, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import teamsAPI from "../api/teams";
import UserProfile from "./otherProfile";
import TeamReports from "./teams/TeamReports";
import GoalTracker from "./teams/GoalTracker";
import ProgressSharingHub from "./teams/ProgressSharingHub";
import MilestoneCelebration from "./teams/MilestoneCelebration";

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
  const [reports, setReports] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentUserUuid, setCurrentUserUuid] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  

  useEffect(() => {
    const userUuid = localStorage.getItem("uuid"); 
    setCurrentUserUuid(userUuid);
    fetchTeamData();
    fetchTeamProgress();
    fetchTeamReports();
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

  const extractGoalsData = (memberProgressData) => {
  // If the progress data already has goals calculated, use those
  if (memberProgressData?.goals && Array.isArray(memberProgressData.goals)) {
    const completed = memberProgressData.goals.filter(g => g.completed).length;
    const total = memberProgressData.goals.length;
    return { completed, total, pending: total - completed };
  }
  
  return {
    completed: memberProgressData?.completedGoals || 0,
    total: memberProgressData?.totalGoals || 0,
    pending: memberProgressData?.pendingGoals || 0
  };
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

  const fetchTeamReports = async () => {
  try {
    const teamId = localStorage.getItem("teamId") || "TEAM_ID";
    const reportsData = await teamsAPI.getTeamReports(teamId);
    setReports(reportsData);
  } catch (err) {
    console.error("Failed to fetch team reports", err);
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

  const getUserRole = () => {
    const currentUserUuid = localStorage.getItem("uuid");
    
    if (members && members.length > 0) {
      const member = members.find(m => m.uuid === currentUserUuid);
      console.log("Found member:", member);
      if (member && member.role) {
        return member.role;
      }
    }
    console.log("Fallback: no member found in array");
    return null;
  };

  const isAdmin = () => {
    const role = getUserRole();
    return role === "admin";
  };
  const isMentor = () => {
    return getUserRole() === "mentor";
  };
  const isCandidate = () => {
    return getUserRole() === "candidate";
  };

  // Candidates can only click on themselves
  const canViewMemberDetails = (memberUuid) => {
    if (isAdmin() || isMentor()) return true;
    if (isCandidate()) return memberUuid === currentUserUuid;
    return false;
  };

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
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Team Goals</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div>
            <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Progress</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2196f3" }}>
                {progress?.overallProgress || 0}%
            </div>
            </div>
            <div>
            <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Goals Completed</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4caf50" }}>
                {progress?.completedGoals || 0}/{progress?.totalGoals || 0}
            </div>
            </div>
            <div>
            <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Applications Sent</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#9c27b0" }}>
                {progress?.totalApplications || 0}
            </div>
            </div>
            <div>
            <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Avg Engagement</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9800" }}>
                {reports?.averageEngagement || 0}%
            </div>
            </div>
        </div>
</div>

          {progress && (
            <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Team Performance</h2>
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
    
    {!isCandidate() && (
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
    )}

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
    const canView = canViewMemberDetails(member.uuid);
    const currentRole = getUserRole();
    const canEditThisGoals = member.role === "candidate" && (getUserRole() === "mentor" || getUserRole() === "admin");
    return (
      <div
        key={member.uuid}
        style={{
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          background: "white",
          transition: "all 0.2s",
          opacity: canView ? 1 : 0.6
        }}
      >
        {/* Header with name and view button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#1a1a1a" }}>
              {member.name}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {member.role}
            </div>
          </div>
          {canView && (
            <button
              onClick={() => setViewingUserProfile(member.uuid)}
              style={{
                padding: "4px 8px",
                background: "#e3f2fd",
                color: "#1976d2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "bold",
                whiteSpace: "nowrap"
              }}
            >
              View Profile
            </button>
          )}
        </div>

        {!canView && (
          <div style={{ fontSize: "12px", color: "#ff9800", marginBottom: "8px", fontStyle: "italic" }}>
            View only your own progress
          </div>
        )}

        {memberProgress && (
          <>
            <div style={{ background: "#e0e0e0", height: "4px", borderRadius: "2px", marginBottom: "8px", overflow: "hidden" }}>
              <div style={{ background: "#2196f3", height: "100%", width: `${memberProgress.progress}%` }} />
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
              {memberProgress.completedGoals}/{memberProgress.totalGoals} goals
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginBottom: "12px" }}>
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

        {/* Edit Goals Button */}
        {canEditThisGoals && (
          <button
            onClick={() => {
              setSelectedMember(member);
              // This will show the GoalTracker component below
            }}
            style={{
              width: "100%",
              padding: "8px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              marginTop: "8px"
            }}
          >
            🎯 Edit Goals
          </button>
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

        <GoalTracker
          teamId={team.id}
          member={selectedMember}
          currentUserRole={getUserRole()}
          onGoalsUpdate={(updatedGoals) => {
            setSelectedMember({
              ...selectedMember,
              goals: updatedGoals
            });
            fetchTeamData();
          }}
        />

        {getMemberProgressData(selectedMember.uuid) && (() => {
          const progressData = getMemberProgressData(selectedMember.uuid);
          const goalsData = extractGoalsData(progressData);
          
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Completed Goals</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{goalsData.completed}</div>
              </div>
              
              <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Pending Goals</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{goalsData.pending}</div>
              </div>
              
              <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Engagement</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{progressData.engagement || 0}%</div>
              </div>
              
              <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Applications</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>{progressData.applications.total}</div>
              </div>
            </div>
          );
        })()}

        {selectedMember.feedback && selectedMember.feedback.length > 0 && (
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#1a1a1a", fontSize: "16px", fontWeight: "bold" }}>
              📝 Mentor Feedback
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {selectedMember.feedback
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((fb, idx) => (
                  <div key={idx} style={{ 
                    background: "#f9f9f9", 
                    padding: "16px", 
                    borderRadius: "8px", 
                    border: "1px solid #e0e0e0", 
                    borderLeft: "4px solid #2196f3" 
                  }}>
                    <div style={{ fontSize: "14px", color: "#333", marginBottom: "8px", lineHeight: "1.5" }}>
                      {fb.feedback}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>📅 {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : "Recently"}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
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
            <button 
              onClick={async () => {
                if (!feedback.trim()) {
                  alert("Please enter feedback before sending.");
                  return;
                }
                try {
                  const teamId = localStorage.getItem("teamId");
                  const mentorId = localStorage.getItem("uuid");
                  
                  await teamsAPI.sendFeedback(teamId, selectedMember.uuid, {
                    mentorId: mentorId,
                    feedback: feedback
                  });
                  
                  alert("Feedback sent successfully!");
                  setFeedback("");
                  fetchTeamData();
                } catch (err) {
                  console.error("Failed to send feedback:", err);
                  alert("Failed to send feedback. Please try again.");
                }
              }}
              style={{ marginTop: "12px", padding: "10px 20px", background: "#2196f3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
            >
              Send Feedback
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

const renderSharing = () => {
  const teamId = localStorage.getItem("teamId");
  const userId = localStorage.getItem("uuid");
  const userName = members.find(m => m.uuid === userId)?.name || "User";

  return (
    <ProgressSharingHub 
      teamId={teamId}
      memberId={userId}
      memberName={userName}
      baseAPI={{
        post: (url, data) => fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(data)
        }).then(r => r.json()),
        get: (url, options) => fetch(url + (options?.params ? '?' + new URLSearchParams(options.params) : ''), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
        delete: (url) => fetch(url, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json())
      }}
    />
  );
};

  const renderBilling = () => {
    const plans = [
      {
        id: "basic",
        name: "Basic",
        price: 99,
        description: "Perfect for small teams",
        features: [
          "Up to 50 team members",
          "Basic reporting",
          "Email support",
          "Goal tracking",
          "Application tracking"
        ]
      },
      {
        id: "standard",
        name: "Standard",
        price: 199,
        description: "For growing teams",
        features: [
          "Up to 150 team members",
          "Advanced analytics",
          "Priority email support",
          "Custom goal templates",
          "Interview coaching",
          "Performance insights"
        ]
      },
      {
        id: "premium",
        name: "Premium",
        price: 299,
        description: "Full-featured solution",
        features: [
          "Unlimited team members",
          "Advanced analytics & exports",
          "24/7 phone & email support",
          "Custom integrations",
          "Dedicated account manager",
          "AI-powered insights",
          "White-label options"
        ]
      }
    ];

    const handlePlanChange = async (newPlan) => {
      if (newPlan === team.billing?.plan) {
        alert("You're already on this plan");
        return;
      }
      
      try {
        await teamsAPI.updateBilling(team.id, { plan: newPlan });
        alert(`Plan updated to ${newPlan}`);
        fetchTeamData();
      } catch (err) {
        console.error(err);
        alert("Failed to update plan");
      }
    };

    const handleCancelSubscription = async () => {
      if (!window.confirm("Are you sure you want to cancel your subscription? This action cannot be undone.")) {
        return;
      }
      
      try {
        await teamsAPI.cancelSubscription(team.id);
        alert("Subscription cancelled successfully");
        fetchTeamData();
      } catch (err) {
        console.error(err);
        alert("Failed to cancel subscription");
      }
    };

    return (
      <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px", color: "#1a1a1a" }}>
          Billing & Subscription
        </h1>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px" }}>
          Manage your team plan and billing information
        </p>

        {team?.billing && (
          <div style={{ background: "#e3f2fd", padding: "24px", borderRadius: "8px", border: "1px solid #bbdefb", marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0", color: "#1565c0" }}>
                  Current Plan: <span style={{ textTransform: "capitalize" }}>{team.billing.plan}</span>
                </h2>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
                  Status: <span style={{ fontWeight: "bold", color: "#2e7d32" }}>Active</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1565c0", marginBottom: "4px" }}>
                  ${team.billing.price}<span style={{ fontSize: "16px", color: "#666" }}>/month</span>
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Renewal Date: {team.billing.renewalDate ? new Date(team.billing.renewalDate).toLocaleDateString() : "N/A"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>💳</div>
                {team.billing.cardBrand && (
                  <>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      {team.billing.cardBrand} ending in {team.billing.last4}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Expires {team.billing.expMonth}/{team.billing.expYear}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Team Usage</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Members</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>
                {team?.memberCount || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                of {team?.billing?.plan === "premium" ? "∞" : team?.billing?.plan === "standard" ? "150" : "50"}
              </div>
            </div>
            <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Candidates</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>
                {team?.candidates || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>Active candidates</div>
            </div>
            <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
              <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Storage</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>
                2.4 GB
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>of unlimited</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Choose Your Plan</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: team?.billing?.plan === plan.id ? "#f0f8ff" : "white",
                  border: team?.billing?.plan === plan.id ? "2px solid #2196f3" : "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "24px",
                  position: "relative"
                }}
              >
                {team?.billing?.plan === plan.id && (
                  <div style={{
                    position: "absolute",
                    top: "-12px",
                    right: "16px",
                    background: "#2196f3",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }}>
                    CURRENT PLAN
                  </div>
                )}
                
                <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0", color: "#1a1a1a" }}>
                  {plan.name}
                </h3>
                <p style={{ color: "#666", fontSize: "13px", margin: "0 0 16px 0" }}>
                  {plan.description}
                </p>
                
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2196f3", marginBottom: "4px" }}>
                  ${plan.price}
                  <span style={{ fontSize: "14px", color: "#666" }}>/month</span>
                </div>
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
                  Billed annually • Cancel anytime
                </p>

                <button
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={team?.billing?.plan === plan.id}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "16px",
                    background: team?.billing?.plan === plan.id ? "#e0e0e0" : "#2196f3",
                    color: team?.billing?.plan === plan.id ? "#666" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: team?.billing?.plan === plan.id ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  {team?.billing?.plan === plan.id ? "Current Plan" : "Choose Plan"}
                </button>

                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{ marginBottom: "8px", color: "#333" }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Billing History</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "12px 0", color: "#666", fontWeight: "bold" }}>Date</th>
                <th style={{ textAlign: "left", padding: "12px 0", color: "#666", fontWeight: "bold" }}>Description</th>
                <th style={{ textAlign: "left", padding: "12px 0", color: "#666", fontWeight: "bold" }}>Amount</th>
                <th style={{ textAlign: "left", padding: "12px 0", color: "#666", fontWeight: "bold" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {team?.billing?.invoices && team.billing.invoices.length > 0 ? (
                team.billing.invoices.map((invoice, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 0", color: "#333" }}>
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 0", color: "#333" }}>
                      {invoice.description}
                    </td>
                    <td style={{ padding: "12px 0", color: "#333", fontWeight: "bold" }}>
                      ${invoice.amount}
                    </td>
                    <td style={{ padding: "12px 0" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: invoice.status === "paid" ? "#e8f5e9" : "#fff3e0",
                        color: invoice.status === "paid" ? "#2e7d32" : "#e65100"
                      }}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "24px 0", textAlign: "center", color: "#666" }}>
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: "#fff3e0", padding: "24px", borderRadius: "8px", border: "1px solid #ffe0b2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#e65100" }}>Danger Zone</h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
            Cancelling your subscription will remove access to all team features.
          </p>
          <button
            onClick={handleCancelSubscription}
            style={{
              padding: "10px 20px",
              background: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    );
  };

  const renderReports = () => <TeamReports />;

  if (loading) return <div style={{ padding: "24px", textAlign: "center", background: "white", color: "#1a1a1a" }}>Loading...</div>;
  if (error) return <div style={{ padding: "24px", textAlign: "center", background: "white", color: "#d32f2f" }}>{error}</div>;

  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", gap: "24px", padding: "0 24px", maxWidth: "100%" }}>
          {["overview", "members", "reports"].map((tabId) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              style={{
                padding: "16px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === tabId ? "3px solid #2196f3" : "3px solid transparent",
                color: activeTab === tabId ? "#2196f3" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tabId ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {tabId.charAt(0).toUpperCase() + tabId.slice(1)}
            </button>
          ))}
                  {isCandidate() && (
          <button
            onClick={() => setActiveTab("sharing")}
            style={{
              padding: "16px 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === "sharing" ? "3px solid #2196f3" : "3px solid transparent",
              color: activeTab === "sharing" ? "#2196f3" : "#666",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "sharing" ? "bold" : "normal",
              transition: "all 0.2s"
            }}
          >
            📤 Progress Sharing
          </button>
        )}
          {isAdmin() && (
            <button
              onClick={() => setActiveTab("billing")}
              style={{
                padding: "16px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === "billing" ? "3px solid #2196f3" : "3px solid transparent",
                color: activeTab === "billing" ? "#2196f3" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === "billing" ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              Billing
            </button>
          )}
        </div>
      </div>

      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "members" && renderMembers()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "sharing" && renderSharing()}
        {activeTab === "billing" && renderBilling()}
      </div>

      

      {viewingUserProfile && (
            <UserProfile 
            userId={viewingUserProfile}
            onClose={() => setViewingUserProfile(null)} 
            />
        )}
    </div>
  );
}

export default TeamsDashboard;