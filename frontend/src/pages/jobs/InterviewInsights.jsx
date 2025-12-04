import React, { useState } from "react";
import axios from "axios";

export default function InterviewInsights() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.REACT_APP_API_URL;

  async function fetchInsights() {
    if (!company) {
      alert("Please enter a company name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API}/api/insights/company`, {
        params: { company, role }
      });

      setInsights(response.data);
    } catch (err) {
      setError("Failed to fetch interview insights.");
    }

    setLoading(false);
  }

  return (
    <div style={pageContainer}>
      <h1 style={title}>🧠 Interview Insights & Preparation</h1>
      <p style={subtitle}>
        Learn interview stages, common questions, timelines, and preparation tips.
      </p>

      {/* Input Section */}
      <div style={card}>
        <div style={inputGroup}>
          <label style={label}>Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={input}
            placeholder="e.g. Google"
          />
        </div>

        <div style={inputGroup}>
          <label style={label}>Role (optional)</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={input}
            placeholder="e.g. Software Engineer"
          />
        </div>

        <button onClick={fetchInsights} style={button}>
          {loading ? "Loading..." : "Get Insights"}
        </button>

        {error && <p style={errorText}>{error}</p>}
      </div>

      {/* RESULTS */}
      {insights && (
        <div>
          <InsightSection title="📘 Overview">
            <p>{insights.overview}</p>
          </InsightSection>

          <InsightSection title="📝 Interview Stages">
            <ul style={list}>
              {insights.stages?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </InsightSection>

          <InsightSection title="❓ Common Questions">
            <ul style={list}>
              {insights.common_questions?.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </InsightSection>

          <InsightSection title="🏢 Company-Specific Format">
            <ul style={list}>
              {insights.company_specific_format?.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </InsightSection>

          <InsightSection title="🎯 Recommendations">
            <ul style={list}>
              {insights.recommendations?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </InsightSection>

          <InsightSection title="⏳ Timeline Expectations">
            <p>{insights.timeline_expectations}</p>
          </InsightSection>

          <InsightSection title="💡 Candidate Tips">
            <ul style={list}>
              {insights.candidate_tips?.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </InsightSection>

          <InsightSection title="📋 Preparation Checklist">
            <ul style={list}>
              {insights.checklist?.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </InsightSection>
        </div>
      )}
    </div>
  );
}

/* ---------------- REUSABLE SECTION COMPONENT ---------------- */
function InsightSection({ title, children }) {
  return (
    <div style={card}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

/* ---------------- LIGHT UI STYLES ---------------- */

const pageContainer = {
  padding: "20px",
  maxWidth: "900px",
  margin: "0 auto",
  color: "#1a1a1a"
};

const title = {
  fontSize: "2.1rem",
  fontWeight: 700,
  marginBottom: "5px"
};

const subtitle = {
  fontSize: "1.1rem",
  color: "#555",
  marginBottom: "20px"
};

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0px 3px 12px rgba(0,0,0,0.08)",
  marginBottom: "25px",
  border: "1px solid #eee"
};

const sectionTitle = {
  fontSize: "1.4rem",
  fontWeight: 700,
  marginBottom: "12px",
  color: "#1a1a1a"
};

const inputGroup = { marginBottom: "15px" };

const label = {
  display: "block",
  marginBottom: "5px",
  fontWeight: 600,
  color: "#333"
};

const input = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
  color: "#1a1a1a"
};

const button = {
  width: "100%",
  padding: "12px",
  background: "#2a7dd2",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "10px",
  fontWeight: 600
};

const errorText = {
  color: "red",
  marginTop: "10px"
};

const list = {
  marginLeft: "20px",
  lineHeight: "1.6",
  color: "#222"
};

