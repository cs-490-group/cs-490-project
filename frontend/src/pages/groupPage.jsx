import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Mail, Edit2, Trash2, TrendingUp, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import teamsAPI from "../api/teams";

const ChartPlaceholder = ({ title }) => (
  <div style={{ border: "1px solid #e5e7eb", padding: "20px", marginBottom: "16px", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
    <strong className="text-gray-700">{title}</strong>
    <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", marginTop: "12px" }}>
      [Chart visualization]
    </div>
  </div>
);

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

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const teamId = localStorage.getItem("teamId") || "TEAM_ID";
      const teamData = await teamsAPI.getTeam(teamId);
      setTeam(teamData);
      setMembers(teamData.members || []);
      setSelectedPlan(teamData.billing?.plan || "basic");
      
      // Fetch reports if user is mentor or admin
      if (teamData.currentUserRole === "mentor" || teamData.currentUserRole === "admin") {
        const reportsData = await teamsAPI.getTeamReports(teamId);
        setReports(reportsData);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch team data", err);
      setError("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const roleMatch = filterRole === "all" || m.role === filterRole;
    const textMatch = m.name?.toLowerCase().includes(search.toLowerCase()) || 
                      m.email?.toLowerCase().includes(search.toLowerCase());
    return roleMatch && textMatch;
  });

  const isAdmin = () => team?.currentUserRole === "admin";
  const isMentor = () => team?.currentUserRole === "mentor";

  const getEngagementStatus = (engagement) => {
    if (engagement >= 90) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (engagement >= 70) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
    return { label: "Needs Attention", color: "text-orange-600", bg: "bg-orange-50" };
  };

  // ============ OVERVIEW TAB ============
  const renderOverview = () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{team?.name || "Team"} Dashboard</h1>
      
      {team && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Total Members</div>
              <div className="text-2xl font-bold">{team.memberCount || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Admins</div>
              <div className="text-2xl font-bold">{team.admins || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Mentors</div>
              <div className="text-2xl font-bold">{team.mentors || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Candidates</div>
              <div className="text-2xl font-bold">{team.candidates || 0}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h2 className="text-xl font-bold mb-4">Aggregate KPIs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-gray-600 text-sm mb-1">Progress</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xl font-bold">{team.progress || 0}%</span>
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">Goals Completed</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xl font-bold">{team.goalsCompleted || 0}</span>
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">Applications Sent</div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span className="text-xl font-bold">{team.applicationsSent || 0}</span>
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-sm mb-1">Avg Engagement</div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xl font-bold">{team.avgEngagement || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <ChartPlaceholder title="Goals Completion Over Time" />
          <ChartPlaceholder title="Applications Submitted Over Time" />
          <ChartPlaceholder title="Team Engagement Score" />
        </>
      )}
    </div>
  );

  // ============ BILLING TAB ============
  const renderBilling = () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>
      
      {!team?.billing ? (
        <p className="text-gray-600">No billing data found.</p>
      ) : (
        <>
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-bold mb-4">Current Plan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 text-sm">Plan</div>
                <div className="text-lg font-semibold capitalize">{team.billing.plan}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Status</div>
                <div className="text-lg font-semibold capitalize text-green-600">{team.billing.status}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Price</div>
                <div className="text-lg font-semibold">${team.billing.price}/month</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Renews On</div>
                <div className="text-lg font-semibold">{team.billing.renewalDate}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-bold mb-4">Payment Method</h3>
            <div className="space-y-2">
              <div className="text-sm"><span className="text-gray-600">Card:</span> {team.billing.cardBrand} •••• {team.billing.last4}</div>
              <div className="text-sm"><span className="text-gray-600">Expires:</span> {team.billing.expMonth}/{team.billing.expYear}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-bold mb-4">Invoices</h3>
            {team.billing.invoices?.length > 0 ? (
              <ul className="space-y-2">
                {team.billing.invoices.map((inv) => (
                  <li key={inv.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <strong>${inv.amount}</strong> — {inv.date}
                    </div>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded capitalize">{inv.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No invoices found.</p>
            )}
          </div>

          {isAdmin() && (
            <div className="flex gap-3">
              <button 
                onClick={() => setPlanModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Update Plan
              </button>
              <button 
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to cancel the subscription?")) return;
                  try {
                    await teamsAPI.cancelSubscription(team.id);
                    alert("Subscription cancelled!");
                    fetchTeamData();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to cancel subscription");
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Cancel Subscription
              </button>
            </div>
          )}

          {planModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Update Plan</h3>
                <select 
                  value={selectedPlan} 
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
                <div className="flex gap-3">
                  <button 
                    onClick={async () => {
                      if (selectedPlan === team.billing.plan) {
                        alert("Selected plan is the same as current.");
                        return;
                      }
                      try {
                        await teamsAPI.updateBilling(team.id, { plan: selectedPlan });
                        alert(`Plan updated to ${selectedPlan}`);
                        setPlanModalOpen(false);
                        fetchTeamData();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to update plan");
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => setPlanModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ============ MEMBERS TAB ============
  const renderMembers = () => (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">
        {/* LEFT: Member List */}
        <div className="col-span-1 border border-gray-200 rounded-lg p-4 bg-white overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Team Members</h2>
          
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="mentor">Mentors</option>
              <option value="candidate">Candidates</option>
            </select>
          </div>

          {isAdmin() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-bold text-sm mb-2">Invite Member</h4>
              <input
                type="email"
                placeholder="Email"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
              />
              <select
                value={newInvite.role}
                onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
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
                className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
              >
                Send Invite
              </button>
            </div>
          )}

          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.uuid}
                onClick={() => setSelectedMember(member)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedMember?.uuid === member.uuid 
                    ? "bg-blue-100 border border-blue-300" 
                    : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="font-semibold text-sm">{member.name}</div>
                <div className="text-xs text-gray-600">{member.role}</div>
                <div className="text-xs text-gray-600 mt-1">Progress: {member.progress?.overall || 0}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Member Detail */}
        <div className="col-span-2 border border-gray-200 rounded-lg p-4 bg-white overflow-y-auto">
          {!selectedMember ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a team member to view details
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{selectedMember.name}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Email: {selectedMember.email}</div>
                  <div>Role: <span className="font-semibold capitalize">{selectedMember.role}</span></div>
                </div>
              </div>

              {/* KPIs */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Key Performance Indicators</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-600 text-sm">Completed Goals</div>
                    <div className="text-2xl font-bold">{selectedMember.kpis?.completedGoals || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-600 text-sm">Pending Goals</div>
                    <div className="text-2xl font-bold">{selectedMember.kpis?.pendingGoals || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-600 text-sm">Engagement</div>
                    <div className="text-2xl font-bold">{selectedMember.kpis?.engagement || 0}%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-600 text-sm">Applications Sent</div>
                    <div className="text-2xl font-bold">{selectedMember.kpis?.applications || 0}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Last Login: {selectedMember.kpis?.lastLogin || "Never"}
                </div>
              </div>

              {/* Goals */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Goals & Milestones</h3>
                {selectedMember.goals?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedMember.goals.map((goal) => (
                      <li key={goal.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className={goal.completed ? "text-green-600" : "text-orange-600"}>
                          {goal.completed ? "✅" : "⏳"}
                        </span>
                        <span className={goal.completed ? "line-through text-gray-500" : ""}>
                          {goal.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm">No goals yet.</p>
                )}
              </div>

              {/* Applications */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Job Applications</h3>
                {selectedMember.applications?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMember.applications.map((app) => (
                      <div key={app.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                        <div className="font-semibold">{app.position}</div>
                        <div className="text-sm text-gray-600">@ {app.company}</div>
                        <div className="text-sm mt-1">
                          Status: <span className="font-semibold capitalize">{app.status}</span>
                        </div>
                        {app.materials?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {app.materials.map((m, idx) => (
                              <a 
                                key={idx} 
                                href={m.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline block"
                              >
                                📎 {m.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No applications yet.</p>
                )}
              </div>

              {/* Mentor Feedback */}
              {isMentor() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Provide Feedback
                  </h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter coaching feedback, recommendations, or encouragement..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2 h-24"
                  />
                  <button 
                    onClick={async () => {
                      if (!feedback.trim()) {
                        alert("Please enter feedback");
                        return;
                      }
                      try {
                        await teamsAPI.sendFeedback(team.id, selectedMember.uuid, {
                          feedback: feedback,
                          mentorId: team.members[0]?.uuid
                        });
                        alert("Feedback sent successfully!");
                        setFeedback("");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to send feedback");
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Send Feedback
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ============ REPORTS TAB ============
  const renderReports = () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Team Reports & Coaching Insights</h1>
      
      {reports ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Overall Progress</div>
              <div className="text-2xl font-bold">{reports.overallProgress || 0}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Goals Completed</div>
              <div className="text-2xl font-bold">{reports.totalGoalsCompleted || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Applications Sent</div>
              <div className="text-2xl font-bold">{reports.totalApplicationsSent || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm">Avg Engagement</div>
              <div className="text-2xl font-bold">{reports.averageEngagement || 0}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <ChartPlaceholder title="Team Progress Chart" />
            <ChartPlaceholder title="Engagement by Role" />
          </div>
          
          <ChartPlaceholder title="Applications vs Goals Achievement" />
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Top Performers</h3>
              <div className="space-y-3">
                {reports.topPerformers?.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-xs text-gray-600 capitalize">{member.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{member.engagement}%</div>
                      <div className="text-xs text-gray-600">engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Needs Attention</h3>
              <div className="space-y-3">
                {reports.needsAttention?.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded border border-orange-200">
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-xs text-gray-600 capitalize">{member.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{member.engagement}%</div>
                      <div className="text-xs text-gray-600">engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Coaching Insights & Recommendations</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="font-semibold text-blue-900">Engagement by Role</div>
                <div className="text-gray-700 text-sm space-y-1 mt-2">
                  {Object.entries(reports.engagementByRole || {}).map(([role, engagement]) => (
                    <div key={role}><span className="capitalize font-medium">{role}:</span> {Math.round(engagement)}%</div>
                  ))}
                </div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <div className="font-semibold text-green-900">High Performers</div>
                <p className="text-gray-700 text-sm">Consider recognizing and providing peer-mentoring opportunities for top performers.</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="font-semibold text-orange-900">Goal Completion Rate</div>
                <p className="text-gray-700 text-sm">Focus mentoring efforts on candidates falling behind on milestone targets.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">
          {isMentor() || isAdmin() ? "Loading reports..." : "Reports not available for your role."}
        </div>
      )}
    </div>
  );

  // ============ RENDER ============
  if (loading) {
    return <div className="p-6 text-center">Loading team data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex gap-4 px-6">
          {["overview", "members", "reports", "billing"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-semibold transition ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
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