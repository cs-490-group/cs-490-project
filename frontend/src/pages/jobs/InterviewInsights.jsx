import React, { useState } from "react";
import axios from "axios";
import {
  FaBrain,
  FaBuilding,
  FaListAlt,
  FaQuestionCircle,
  FaClock,
  FaCheckCircle,
  FaLightbulb
} from "react-icons/fa";

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
    setInsights(null);

    try {
      const res = await axios.get(`${API}/api/insights/company`, {
        params: { company, role }
      });

      setInsights(res.data || {});
    } catch (err) {
      console.error(err);
      setError("Failed to fetch interview insights.");
    }

    setLoading(false);
  }

  return (
    <div style={page}>
      <div style={container}>
        {/* HEADER */}
        <h1 style={title}>
          <FaBrain /> Interview Insights & Preparation
        </h1>
        <p style={subtitle}>
          Learn interview stages, timelines, common questions, and preparation
          strategies.
        </p>

        {/* SEARCH */}
        <div style={card}>
          <div style={grid2}>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={input}
              placeholder="Company (e.g. Google)"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={input}
              placeholder="Role (optional)"
            />
          </div>

          <button onClick={fetchInsights} style={button}>
            {loading ? "Loading…" : "Get Insights"}
          </button>

          {error && <p style={errorText}>{error}</p>}
        </div>

        {/* RESULTS */}
        {insights && (
          <>
            <InsightCard
              title="Company Overview"
              icon={<FaBuilding />}
              color={sectionColors.overview}
            >
              <p>{insights.overview || "No overview available."}</p>
            </InsightCard>

            <InsightCard
              title="Interview Stages"
              icon={<FaListAlt />}
              color={sectionColors.stages}
            >
              <List items={insights.stages} />
            </InsightCard>

            <InsightCard
              title="Common Interview Questions"
              icon={<FaQuestionCircle />}
              color={sectionColors.questions}
            >
              <List items={insights.common_questions} />
            </InsightCard>

            <InsightCard
              title="Company-Specific Interview Format"
              icon={<FaBuilding />}
              color={sectionColors.format}
            >
              <List items={insights.company_specific_format} />
            </InsightCard>

            <InsightCard
              title="Timeline Expectations"
              icon={<FaClock />}
              color={sectionColors.timeline}
            >
              <p>
                {insights.timeline_expectations ||
                  "Timeline information is not available."}
              </p>
            </InsightCard>

            <InsightCard
              title="Candidate Tips & Recommendations"
              icon={<FaLightbulb />}
              color={sectionColors.tips}
            >
              <List items={insights.candidate_tips || insights.recommendations} />
            </InsightCard>

            <InsightCard
              title="Preparation Checklist"
              icon={<FaCheckCircle />}
              color={sectionColors.checklist}
            >
              <List items={insights.checklist} />
            </InsightCard>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */

function InsightCard({ title, icon, color, children }) {
  return (
    <div
      style={{
        ...card,
        borderLeft: `6px solid ${color}`,
        background: "linear-gradient(180deg, #ffffff, #fafafa)"
      }}
    >
      <h2 style={{ ...sectionTitle, color }}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function List({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p style={{ color: "#666" }}>No data available.</p>;
  }

  return (
    <ul style={list}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- COLORS ---------------- */

const sectionColors = {
  overview: "#2563eb",   // blue
  stages: "#16a34a",     // green
  questions: "#9333ea",  // purple
  format: "#0ea5e9",     // cyan
  timeline: "#f59e0b",   // amber
  tips: "#ec4899",       // pink
  checklist: "#22c55e"   // emerald
};

/* ---------------- STYLES (MATCH Salary Research) ---------------- */

const page = {
  background: "#f6f8fb",
  minHeight: "100vh",
  padding: 40
};

const container = {
  maxWidth: 1000,
  margin: "0 auto"
};

const title = {
  fontSize: "2.4rem",
  fontWeight: 700,
  marginBottom: 6
};

const subtitle = {
  color: "#555",
  marginBottom: 24
};

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: 24,
  border: "1px solid #eee"
};

const sectionTitle = {
  fontSize: "1.35rem",
  fontWeight: 700,
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  gap: 8
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: "0.95rem"
};

const button = {
  width: "100%",
  padding: 12,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 12,
  fontWeight: 600
};

const errorText = {
  color: "#dc2626",
  marginTop: 10,
  fontWeight: 500
};

const list = {
  marginLeft: 20,
  lineHeight: 1.7,
  color: "#222",
  listStyleType: "disc"
};



