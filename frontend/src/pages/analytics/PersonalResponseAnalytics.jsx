import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationWorkflowAPI from "../../api/applicationWorkflow";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PersonalResponseAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, trendsRes, pendingRes] = await Promise.all([
        ApplicationWorkflowAPI.getResponseMetrics(),
        ApplicationWorkflowAPI.getResponseTrends(90),
        ApplicationWorkflowAPI.getPendingApplications()
      ]);

      setMetrics(metricsRes.data);
      setTrends(trendsRes.data);
      setOverdue(pendingRes.data?.overdue || []);
    } catch (error) {
      console.error("Failed to load response analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div>Loading response time analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        <div>No response data available yet.</div>
        <div style={{ fontSize: "14px", marginTop: "8px" }}>
          Apply to jobs and track responses to see your personal metrics.
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const industryData = Object.entries(metrics.by_industry || {}).map(([industry, days]) => ({
    name: industry,
    days: days
  }));

  const companySizeData = Object.entries(metrics.by_company_size || {}).map(([size, days]) => ({
    name: size,
    days: days
  }));

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "24px", color: "#333" }}>Your Response Time Analytics</h2>

      {/* Summary Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "32px"
      }}>
        <StatCard
          title="Average Response"
          value={`${metrics.average_response_days} days`}
          color="#4f8ef7"
          icon="📊"
        />
        <StatCard
          title="Median Response"
          value={`${metrics.median_response_days} days`}
          color="#34c759"
          icon="📈"
        />
        <StatCard
          title="Fastest Response"
          value={metrics.fastest_response ? `${metrics.fastest_response.days} days` : "N/A"}
          subtitle={metrics.fastest_response?.company || ""}
          color="#ff9500"
          icon="🚀"
        />
        <StatCard
          title="Slowest Response"
          value={metrics.slowest_response ? `${metrics.slowest_response.days} days` : "N/A"}
          subtitle={metrics.slowest_response?.company || ""}
          color="#ff3b30"
          icon="🐌"
        />
      </div>

      {/* Application Status Summary */}
      <div style={{
        background: "#f5f5f5",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "32px",
        display: "flex",
        gap: "24px",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4f8ef7" }}>
            {metrics.total_responded}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Companies Responded</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9800" }}>
            {metrics.total_pending}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Still Pending</div>
        </div>
      </div>

      {/* Trends Chart */}
      {trends && trends.weekly_data && trends.weekly_data.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "16px", color: "#333" }}>
            Response Time Trends
            {trends.trend_direction && (
              <span style={{
                marginLeft: "12px",
                fontSize: "14px",
                color: trends.trend_direction === "improving" ? "#34c759" : trends.trend_direction === "slowing" ? "#ff3b30" : "#999"
              }}>
                {trends.trend_direction === "improving" && "↓ Improving"}
                {trends.trend_direction === "slowing" && "↑ Slowing"}
                {trends.trend_direction === "stable" && "→ Stable"}
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.weekly_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="average_days"
                stroke="#4f8ef7"
                strokeWidth={2}
                name="Avg Response Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Industry Breakdown */}
      {industryData.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "16px", color: "#333" }}>Response Time by Industry</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={industryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: "Days", position: "insideBottom", offset: -5 }} />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Bar dataKey="days" fill="#4f8ef7" name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Company Size Breakdown */}
      {companySizeData.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "16px", color: "#333" }}>Response Time by Company Size</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={companySizeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="days" fill="#34c759" name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Overdue Applications */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "16px", color: "#f57c00" }}>
            ⚠️ Overdue Applications ({overdue.length})
          </h3>
          <div style={{
            background: "#fff3cd",
            border: "1px solid #ff9800",
            borderRadius: "8px",
            overflow: "hidden"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#ffe0b2", borderBottom: "2px solid #ff9800" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Company</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Position</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Days Waiting</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Your Avg</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((app, index) => {
                  const companyName = typeof app.company === "string"
                    ? app.company
                    : app.company?.name || "Unknown";

                  return (
                    <tr
                      key={app._id}
                      style={{
                        borderBottom: index < overdue.length - 1 ? "1px solid #ffe0b2" : "none"
                      }}
                    >
                      <td style={{ padding: "12px" }}>{companyName}</td>
                      <td style={{ padding: "12px" }}>{app.title || "Unknown"}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold", color: "#f57c00" }}>
                        {app.days_since_submission} days
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {app.user_average_response_days} days
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => navigate("/jobs")}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            background: "#ff9800",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "600"
                          }}
                        >
                          Follow Up →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights Section */}
      <div style={{
        background: "#e3f2fd",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #4f8ef7"
      }}>
        <h3 style={{ marginBottom: "12px", color: "#1976d2" }}>💡 Insights</h3>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "#333" }}>
          {metrics.average_response_days > 0 && (
            <li style={{ marginBottom: "8px" }}>
              Companies typically respond to you in {metrics.average_response_days} days on average.
            </li>
          )}
          {metrics.fastest_response && (
            <li style={{ marginBottom: "8px" }}>
              Your fastest response was from {metrics.fastest_response.company} in just {metrics.fastest_response.days} days!
            </li>
          )}
          {overdue.length > 0 && (
            <li style={{ marginBottom: "8px" }}>
              You have {overdue.length} application{overdue.length !== 1 ? "s" : ""} that haven't received a response beyond your average wait time. Consider following up!
            </li>
          )}
          {metrics.total_pending > 0 && (
            <li style={{ marginBottom: "8px" }}>
              {metrics.total_pending} application{metrics.total_pending !== 1 ? "s are" : " is"} still pending. Keep an eye on them!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      border: `2px solid ${color}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px", textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: color, marginBottom: "4px" }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "12px", color: "#666" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
