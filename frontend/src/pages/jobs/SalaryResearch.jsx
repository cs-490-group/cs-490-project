import React, { useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function SalaryResearch() {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.REACT_APP_API_URL;

  async function fetchSalary() {
    if (!jobTitle) {
      alert("Please enter a job title");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API}/api/salary/research`, {
        params: { job_title: jobTitle, location }
      });

      setSalaryData(response.data);
    } catch (err) {
      setError("Failed to fetch salary data.");
    }

    setLoading(false);
  }

  return (
    <div style={pageContainer}>
      <h1 style={title}>💰 Salary Research & Benchmarking</h1>
      <p style={subtitle}>
        Search salary ranges, compare companies, and view historical salary trends.
      </p>

      {/* Input Section */}
      <div style={card}>
        <div style={inputGroup}>
          <label style={label}>Job Title</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={input}
            placeholder="e.g. Software Engineer"
          />
        </div>

        <div style={inputGroup}>
          <label style={label}>Location (optional)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={input}
            placeholder="e.g. New York, Remote"
          />
        </div>

        <button onClick={fetchSalary} style={button}>
          {loading ? "Loading..." : "Search Salaries"}
        </button>

        {error && <p style={errorText}>{error}</p>}
      </div>

      {/* Salary Results */}
      {salaryData && (
        <div>
          <h2 style={sectionTitle}>Salary Summary</h2>

          <div style={cardGrid}>
            <InfoCard title="Estimated Range" value={`$${salaryData.low} - $${salaryData.high}`} />
            <InfoCard title="Median Salary" value={`$${salaryData.median}`} />
            <InfoCard title="Company Size Effect" value={salaryData.companyFactor} />
            <InfoCard title="Experience Factor" value={salaryData.experienceFactor} />
          </div>

          {/* Historical Salary Chart */}
          {salaryData.history && (
            <div style={chartCard}>
              <h3 style={sectionTitle}>📈 Historical Salary Trend</h3>
              <Line
                data={{
                  labels: salaryData.history.years,
                  datasets: [
                    {
                      label: "Median Salary",
                      data: salaryData.history.values,
                      borderColor: "#2a7dd2",
                      backgroundColor: "rgba(42, 125, 210, 0.2)"
                    }
                  ]
                }}
              />
            </div>
          )}

          {/* Recommendations */}
          {salaryData.recommendations && (
            <div style={card}>
              <h3 style={sectionTitle}>🎯 Negotiation Recommendations</h3>
              <ul style={list}>
                {salaryData.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Reusable Card */
function InfoCard({ title, value }) {
  return (
    <div style={infoCard}>
      <h4 style={infoTitle}>{title}</h4>
      <p style={infoValue}>{value}</p>
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

const sectionTitle = {
  fontSize: "1.4rem",
  fontWeight: 700,
  marginBottom: "10px",
  color: "#1a1a1a"
};

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0px 3px 12px rgba(0,0,0,0.08)",
  marginBottom: "25px"
};

const chartCard = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  boxShadow: "0px 3px 12px rgba(0,0,0,0.08)",
  marginTop: "25px"
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

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "15px"
};

const infoCard = {
  background: "white",
  padding: "18px",
  borderRadius: "10px",
  border: "1px solid #e3e3e3",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
};

const infoTitle = {
  fontWeight: 600,
  color: "#555",
  marginBottom: "6px"
};

const infoValue = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#2a7dd2"
};

const list = {
  marginLeft: "20px",
  lineHeight: "1.6"
};


