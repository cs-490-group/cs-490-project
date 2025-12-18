import React, { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle, Zap, Target, RefreshCw } from "lucide-react";
import teamsAPI from "../../api/teams";

function TeamReports() {
  const [reports, setReports] = useState(null);
  const [selectedMemberReport, setSelectedMemberReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teamId = localStorage.getItem("teamId");
      
      if (!teamId) {
        throw new Error("No team ID found");
      }
      
      console.log(`Fetching reports for team: ${teamId}`);
      
      const reportsData = await teamsAPI.getTeamReports(teamId);
      console.log("Reports fetched:", reportsData);
      
      setReports(reportsData);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setError(err.message || "Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = async (memberUuid) => {
    try {
      setLoading(true);
      const teamId = localStorage.getItem("teamId");
      
      const memberReport = await teamsAPI.getMemberReport(teamId, memberUuid);
      
      setSelectedMemberReport(memberReport);
      setView("member-detail");
    } catch (err) {
      console.error("Failed to fetch member report", err);
      setError(err.message || "Failed to load member report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "24px", textAlign: "center", color: "#666" }}>Loading reports...</div>;
  }

  if (error) {
    return <div style={{ padding: "24px", textAlign: "center", color: "#d32f2f" }}>{error}</div>;
  }

  if (!reports) {
    return <div style={{ padding: "24px", textAlign: "center", color: "#666" }}>No data available</div>;
  }

  const renderOverview = () => (
    <div style={{ padding: "24px", background: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#1a1a1a" }}>
          Candidate Performance Reports
        </h1>
        <button
          onClick={fetchReports}
          className="btn btn-primary"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <MetricCard 
          icon={<TrendingUp size={24} />}
          label="Overall Progress"
          value={`${reports.overallProgress || 0}%`}
          color="#2196f3"
        />
        <MetricCard 
          icon={<CheckCircle size={24} />}
          label="Goals Completed"
          value={reports.totalGoalsCompleted || 0}
          color="#4caf50"
        />
        <MetricCard 
          icon={<Target size={24} />}
          label="Applications Sent"
          value={reports.totalApplicationsSent || 0}
          color="#9c27b0"
        />
        <MetricCard 
          icon={<Zap size={24} />}
          label="Avg Engagement"
          value={`${reports.averageEngagement || 0}%`}
          color="#ff9800"
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {/* Application Status Breakdown */}
        <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
            Application Status Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={reports.applicationStatusBreakdown || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#2196f3" />
                <Cell fill="#ff9800" />
                <Cell fill="#4caf50" />
                <Cell fill="#9c27b0" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
            Total Applications: <strong>{reports.applicationMetrics?.totalSent || 0}</strong>
          </div>
        </div>

        {/* Engagement Distribution */}
        <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
            Engagement Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={reports.engagementDistribution || []}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
            Total Candidates: <strong>{reports.memberBreakdown?.total || 0}</strong>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div style={{ background: "#f5f5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
          🌟 Top Performers
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {reports.topPerformers && reports.topPerformers.length > 0 ? (
            reports.topPerformers.map((member, idx) => (
              <div
                key={member.uuid}
                onClick={() => handleMemberClick(member.uuid)}
                style={{
                  background: "white",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderLeft: `4px solid ${["#ffd700", "#c0c0c0", "#cd7f32"][idx] || "#2196f3"}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{"🥇🥈🥉".split("")[idx]}</span>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1a1a1a" }}>{member.name}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>{member.engagement}% engagement</div>
                  </div>
                </div>
                <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                  {member.insight}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#999" }}>No top performers yet</div>
          )}
        </div>
      </div>

      {/* Needs Attention */}
      <div style={{ background: "#fff3e0", padding: "24px", borderRadius: "8px", border: "1px solid #ffe0b2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <AlertCircle size={24} color="#f57c00" />
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#e65100" }}>
            Needs Attention
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {reports.needsAttention && reports.needsAttention.length > 0 ? (
            reports.needsAttention.map((member) => (
              <div
                key={member.uuid}
                onClick={() => handleMemberClick(member.uuid)}
                style={{
                  background: "white",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #ffe0b2",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#1a1a1a" }}>{member.name}</div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                  {member.engagement}% engagement
                </div>
                <div style={{ fontSize: "13px", color: "#f57c00", marginTop: "8px" }}>
                  {member.insight}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#999" }}>No members need attention</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMemberDetail = () => {
    if (!selectedMemberReport) return null;

    return (
      <div style={{ padding: "24px", background: "white" }}>
        <button
          onClick={() => setView("overview")}
          style={{
            marginBottom: "24px",
            background: "none",
            border: "none",
            color: "#2196f3",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          ← Back to Overview
        </button>

        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>
          {selectedMemberReport.memberName}
        </h1>

        {/* Member Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <MetricCard label="Progress Score" value={`${selectedMemberReport.progressScore}%`} color="#2196f3" />
          <MetricCard label="Completed Goals" value={selectedMemberReport.completedGoals} color="#4caf50" />
          <MetricCard label="Pending Goals" value={selectedMemberReport.pendingGoals} color="#ff9800" />
          <MetricCard label="Applications" value={selectedMemberReport.applications} color="#9c27b0" />
          <MetricCard label="Engagement" value={`${selectedMemberReport.engagement}%`} color="#2196f3" />
        </div>

        {/* Goal Details */}
        {selectedMemberReport.goalDetails && selectedMemberReport.goalDetails.length > 0 && (
          <div style={{ background: "#f3e5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e1bee7", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 16px 0", color: "#6a1b9a" }}>
              📋 Goal Details
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {selectedMemberReport.goalDetails.map((goal, idx) => (
                <div key={idx} style={{ background: "white", padding: "12px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#6a1b9a" }}>{goal.title}</div>
                    <div style={{ fontSize: "12px", color: "#999" }}>Target: {goal.target}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: goal.completed ? "#4caf50" : "#ff9800" }}>
                      {goal.actual !== undefined ? goal.actual : "N/A"}
                    </div>
                    <div style={{ fontSize: "12px", color: goal.completed ? "#4caf50" : "#ff9800" }}>
                      {goal.completed ? "✓ Completed" : "Pending"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaching Insights */}
        {selectedMemberReport.coachingInsights && selectedMemberReport.coachingInsights.length > 0 && (
          <div style={{ background: "#e3f2fd", padding: "24px", borderRadius: "8px", border: "1px solid #bbdefb", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 16px 0", color: "#1565c0" }}>
              💡 Coaching Insights
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {selectedMemberReport.coachingInsights.map((insight, idx) => (
                <li key={idx} style={{ color: "#1565c0", marginBottom: "8px", fontSize: "14px" }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {selectedMemberReport.recommendations && selectedMemberReport.recommendations.length > 0 && (
          <div style={{ background: "#f3e5f5", padding: "24px", borderRadius: "8px", border: "1px solid #e1bee7" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 16px 0", color: "#6a1b9a" }}>
              📋 Recommendations
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {selectedMemberReport.recommendations.map((rec, idx) => (
                <li key={idx} style={{ color: "#6a1b9a", marginBottom: "8px", fontSize: "14px" }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      {view === "overview" && renderOverview()}
      {view === "member-detail" && renderMemberDetail()}
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
      {icon && <div style={{ marginBottom: "12px", color }}>{icon}</div>}
      <div style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: color || "#1a1a1a" }}>{value}</div>
    </div>
  );
}

export default TeamReports;