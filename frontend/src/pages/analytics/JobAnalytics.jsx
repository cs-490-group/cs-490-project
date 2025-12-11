import React, { useState, useEffect, useMemo } from "react";
import jobsAPI from "../../api/jobs";
import MetricCard from "./MetricCard";
import FunnelChart from "./FunnelChart";
import { useMetricsCalculator } from "./useMetricsCalculator";

const JobAnalytics = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsAPI.getAll();
      setJobs(response.data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.response?.data?.detail || 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(j => !j.archived);
    
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(dateRange) {
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case "6months":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(j => {
        let statusHistory = j.statusHistory || j.status_history;
        if (!statusHistory || statusHistory.length === 0) {
          return j.createdAt && new Date(j.createdAt) >= cutoffDate;
        }
        
        if (Array.isArray(statusHistory[0])) {
          statusHistory = statusHistory.map(([status, timestamp]) => ({ status, timestamp }));
        }
        
        return statusHistory.some(entry => new Date(entry.timestamp) >= cutoffDate);
      });
    }
    
    return filtered;
  }, [jobs, dateRange]);

  const metrics = useMetricsCalculator(filteredJobs);

  if (loading) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Job Application Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading your job application data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Job Application Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc3545' }}>
          <p>Error: {error}</p>
          <button onClick={loadJobs} style={{ 
            marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer',
            background: '#007bff', color: 'white', border: 'none', borderRadius: '4px'
          }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Job Application Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No job applications found. Start tracking your job search to see analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analyticsDashboard-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ margin: 0 }}>Job Application Analytics</h2>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{
          padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", cursor: "pointer"
        }}>
          <option value="all">All Time</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="6months">Last 6 Months</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <MetricCard title="Applications Sent" value={metrics.totalApplications} subtitle={`${metrics.totalActive} total tracked`} color="#2196f3" icon="📤" />
        <MetricCard title="Response Rate" value={`${metrics.responseRate}%`} subtitle="Got a response" color="#ff9800" icon="📧" benchmark={metrics.benchmarks.responseRate} />
        <MetricCard title="Interview Rate" value={`${metrics.interviewRate}%`} subtitle="Reached interviews" color="#ff5722" icon="💼" benchmark={metrics.benchmarks.interviewRate} />
        <MetricCard title="Offers Received" value={metrics.offer} subtitle={`${metrics.offerRate}% offer rate`} color="#4caf50" icon="🎉" benchmark={metrics.benchmarks.offerRate} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <FunnelChart metrics={metrics} />
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>⏱️ Time Metrics</h3>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Avg. Time to Response</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>{metrics.avgResponseTime}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>days (Benchmark: {metrics.benchmarks.avgResponseTime})</div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Avg. Time to Interview</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff5722" }}>{metrics.avgInterviewScheduleTime}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>days (Benchmark: {metrics.benchmarks.avgInterviewTime})</div>
          </div>
        </div>
      </div>

      {metrics.topIndustries.length > 0 && (
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎯 Success Patterns</h3>
          {metrics.topIndustries.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Top Industries</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {metrics.topIndustries.map(([industry, count]) => (
                  <div key={industry} style={{ padding: "8px 12px", background: "#e3f2fd", borderRadius: "6px", fontSize: "14px", fontWeight: "500" }}>
                    {industry}: {count} successes
                  </div>
                ))}
              </div>
            </div>
          )}
          {metrics.topLocations.length > 0 && (
            <div>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Top Locations</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {metrics.topLocations.map(([location, count]) => (
                  <div key={location} style={{ padding: "8px 12px", background: "#fff3e0", borderRadius: "6px", fontSize: "14px", fontWeight: "500" }}>
                    📍 {location}: {count} successes
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>💡 Recommendations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {metrics.recommendations.map((rec, idx) => (
              <div key={idx} style={{
                padding: "12px 16px",
                background: rec.confidence === 'high' ? "#e8f5e9" : "#fff3e0",
                borderLeft: `4px solid ${rec.confidence === 'high' ? '#4caf50' : '#ff9800'}`,
                borderRadius: "4px"
              }}>
                <div style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>{rec.message}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Confidence: {rec.confidence}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAnalytics;