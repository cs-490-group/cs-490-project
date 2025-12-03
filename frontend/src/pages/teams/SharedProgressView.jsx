import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import progressSharingAPI from "../../api/progressSharing";

export default function SharedProgressView() {
  const { teamId, memberId, email } = useParams();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressReport();
  }, [teamId, memberId, email]);

  const fetchProgressReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;

      if (email) {
        //(Email is in URL)
        // Decode the email (turns %40 back into @)
        const accessorEmail = decodeURIComponent(email);
        console.log("Fetching public report for:", accessorEmail);
        response = await progressSharingAPI.getPublicProgressReport(
          teamId, 
          memberId, 
          accessorEmail
        );
      } else {
        // (No email in URL)
        // Try to fetch using the current user's session token
        console.log("Fetching internal report (authenticated)");
        response = await progressSharingAPI.getProgressReport(teamId, memberId);
      }
      
      setReport(response.data);
      
    } catch (err) {
      console.error("Error fetching report:", err);
      
      // Customize error message based on the type of failure
      if (err.response?.status === 401 && !email) {
        setError("Please log in to view this internal progress report.");
      } else if (err.response?.status === 403) {
        setError("Access denied. The link may be invalid or access revoked.");
      } else {
        const msg = err.response?.data?.detail || err.message;
        setError("Unable to load progress report: " + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading progress report...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#d32f2f" }}>
        <Lock size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
        <p>{error}</p>

        {!email && (
           <a href="/login" style={{ color: "#2196f3", textDecoration: "underline" }}>
             Go to Login
           </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px", color: "#1a1a1a" }}>
          {report?.memberName || "Member"}'s Job Search Progress
        </h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          {report?.memberRole === "candidate" ? "Candidate" : report?.memberRole}
        </p>

        {/* Goals Section */}
        {report?.goals && (
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #e0e0e0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>📋 Goals</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              <div><strong>Weekly Apps:</strong> {report.goals.weeklyApplications}</div>
              <div><strong>Monthly Apps:</strong> {report.goals.monthlyApplications}</div>
              <div><strong>Monthly Interviews:</strong> {report.goals.monthlyInterviews}</div>
              <div><strong>Response Rate:</strong> {report.goals.targetResponseRate}%</div>
              <div><strong>Interview Rate:</strong> {report.goals.targetInterviewRate}%</div>
            </div>
          </div>
        )}

        {/* Applications Section */}
        {report?.applicationStats && (
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #e0e0e0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>📝 Applications</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
              <div style={{ background: "#e3f2fd", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1565c0" }}>
                  {report.applicationStats.total}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Total</div>
              </div>
              <div style={{ background: "#e8f5e9", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2e7d32" }}>
                  {report.applicationStats.statusBreakdown?.applied || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Applied</div>
              </div>
              <div style={{ background: "#fff3e0", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f57f17" }}>
                  {report.applicationStats.statusBreakdown?.interview || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Interviews</div>
              </div>
              <div style={{ background: "#f3e5f5", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#6a1b9a" }}>
                  {report.applicationStats.statusBreakdown?.offer || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Offers</div>
              </div>
            </div>
          </div>
        )}

        {/* Engagement */}
        {report?.engagement !== undefined && (
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>📊 Engagement</h2>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2196f3", marginBottom: "8px" }}>
              {report.engagement}%
            </div>
            <div style={{
              height: "8px",
              background: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                background: "#2196f3",
                width: `${report.engagement}%`
              }} />
            </div>
          </div>
        )}

        {report?.recentMilestones && report.recentMilestones.length > 0 && (
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginTop: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
              🏆 Recent Milestones
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {report.recentMilestones.map((m, idx) => (
                <div key={idx} style={{ 
                  background: "#fff8e1", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  borderLeft: "4px solid #fbc02d",
                  border: "1px solid #ffecb3" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", color: "#1a1a1a" }}>
                      {m.category === "offer_received" ? "🎉 " : m.category === "interview_scheduled" ? "🎯 " : "⭐ "}
                      {m.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(m.achieved_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#444" }}>{m.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}