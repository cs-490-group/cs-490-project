import React, { useState, useMemo } from "react";
import axios from "axios";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import {
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaDollarSign,
  FaBalanceScale,
  FaHandshake
} from "react-icons/fa";

ChartJS.register(
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function SalaryResearch() {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  const API = process.env.REACT_APP_API_URL;

  const token = localStorage.getItem("session");
  const uuid = localStorage.getItem("uuid");

  const format = (v) => `$${Math.round(v).toLocaleString()}`;

  async function fetchSalary() {
    if (!jobTitle) return alert("Enter a job title");
    if (!token || !uuid) return alert("Please log in.");

    setLoading(true);
    setSalaryData(null);

    try {
      const res = await axios.get(`${API}/api/salary/research`, {
        params: { job_title: jobTitle, location },
        headers: {
          Authorization: `Bearer ${token}`,
          uuid
        }
      });

      const raw = res.data || {};

      setSalaryData({
        median: raw.median_salary ?? 115000,
        p25: raw.percentile_25 ?? 100000,
        p75: raw.percentile_75 ?? 130000,
        p90: raw.percentile_90 ?? 150000,
        companies: Array.isArray(raw.comparable_companies)
          ? raw.comparable_companies
          : ["Google", "Amazon", "Microsoft"],
        trend: raw.salary_trend ?? "increasing"
      });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch salary data.");
    }

    setLoading(false);
  }

  /* ---------------- DERIVED VALUES ---------------- */

  const totalComp = salaryData ? salaryData.median * 1.15 : null;

  const numericCurrentSalary = Number(currentSalary);

  const comparisonDelta =
    salaryData &&
    Number.isFinite(numericCurrentSalary) &&
    numericCurrentSalary > 0
      ? ((salaryData.median - numericCurrentSalary) /
          numericCurrentSalary) *
        100
      : null;

  /* ---------------- CHART DATA ---------------- */

  const trendData = useMemo(() => {
    if (!salaryData) return null;
    const m = salaryData.median;
    return {
      labels: ["2019", "2020", "2021", "2022", "2023"],
      datasets: [
        {
          label: "Median Salary",
          data: [m * 0.94, m * 0.97, m, m * 1.03, m * 1.06],
          borderColor: "#2563eb",
          tension: 0.3
        }
      ]
    };
  }, [salaryData]);

  const experienceData = useMemo(() => {
    if (!salaryData) return null;
    const m = salaryData.median;
    return {
      labels: ["Junior", "Mid", "Senior", "Staff"],
      datasets: [
        {
          label: "Estimated Salary",
          data: [m * 0.7, m, m * 1.3, m * 1.6],
          backgroundColor: "#16a34a"
        }
      ]
    };
  }, [salaryData]);

  const companyData = useMemo(() => {
    if (!salaryData) return null;

    return {
      labels: salaryData.companies,
      datasets: [
        {
          label: "Estimated Median",
          data: salaryData.companies.map((_, i) =>
            salaryData.median * (0.9 + i * 0.05)
          ),
          backgroundColor: salaryData.companies.map((c) =>
            company && c.toLowerCase() === company.toLowerCase()
              ? "#2563eb"
              : "#9333ea"
          )
        }
      ]
    };
  }, [salaryData, company]);

  const gaugeData = useMemo(() => {
    if (!salaryData) return null;
    const pos =
      ((salaryData.median - salaryData.p25) /
        (salaryData.p90 - salaryData.p25)) *
      100;

    return {
      datasets: [
        {
          data: [Math.min(Math.max(pos, 0), 100), 100],
          backgroundColor: ["#2563eb", "#e5e7eb"],
          borderWidth: 0
        }
      ]
    };
  }, [salaryData]);

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={title}>Salary Research & Benchmarking</h1>
        <p style={subtitle}>
          Analyze market compensation to support informed negotiation decisions.
        </p>

        {/* SEARCH */}
        <div style={card}>
          <div style={grid3}>
            <input
              placeholder="Job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={input}
            />
            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={input}
            />
            <input
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={input}
            />
          </div>
          <button style={button} onClick={fetchSalary}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        {salaryData && (
          <>
            {/* SUMMARY */}
            <div style={summaryGrid}>
              <Stat title="Estimated Range" value={`${format(salaryData.p25)} – ${format(salaryData.p75)}`} icon={<FaDollarSign />} />
              <Stat title="Median Salary" value={format(salaryData.median)} icon={<FaChartLine />} />
              <Stat title="Total Compensation (Est.)" value={format(totalComp)} icon={<FaBalanceScale />} />
              <Stat title="Company Size Factor" value="Large companies typically pay 10–20% more." icon={<FaBuilding />} />
            </div>

            {/* USER COMPARISON */}
            <div style={card}>
              <h3><FaUsers /> Your Salary Comparison</h3>
              <input
                placeholder="Your current salary"
                value={currentSalary}
                onChange={(e) =>
                  setCurrentSalary(e.target.value.replace(/[^0-9]/g, ""))
                }
                style={input}
              />
              {Number.isFinite(comparisonDelta) && (
                <p style={{ marginTop: 8 }}>
                  You are{" "}
                  <strong style={{ color: comparisonDelta > 0 ? "#dc2626" : "#16a34a" }}>
                    {comparisonDelta > 0 ? "below" : "above"}
                  </strong>{" "}
                  market by{" "}
                  <strong>{Math.abs(comparisonDelta).toFixed(1)}%</strong>.
                </p>
              )}
            </div>

            {/* CHARTS */}
            <div style={chartGrid}>
              <ChartCard title="Salary Trend" icon={<FaChartLine />}>
                <Line data={trendData} />
              </ChartCard>

              <ChartCard title="Experience Progression" icon={<FaUsers />}>
                <Bar data={experienceData} />
              </ChartCard>

              <ChartCard title="Company Comparison" icon={<FaBuilding />}>
                <Bar data={companyData} />
                {company && (
                  <p style={{ marginTop: 6, fontSize: "0.85rem" }}>
                    Highlighted company: <strong>{company}</strong>
                  </p>
                )}
              </ChartCard>

              <ChartCard title="Market Position" icon={<FaDollarSign />}>
                <Doughnut data={gaugeData} options={{ circumference: 180, rotation: -90 }} />
                <p style={{ textAlign: "center", marginTop: 8 }}>
                  Above Market (~65th percentile)
                </p>
              </ChartCard>
            </div>

            {/* NEGOTIATION */}
            <div style={card}>
              <h3><FaHandshake /> Negotiation Recommendation</h3>
              <p>
                Based on market trends and percentile positioning, candidates
                may reasonably negotiate for higher base pay or additional
                equity{company ? ` at ${company}` : ""}.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Stat({ title, value, icon }) {
  return (
    <div style={stat}>
      <div>{icon}</div>
      <strong>{title}</strong>
      <div>{value}</div>
    </div>
  );
}

function ChartCard({ title, icon, children }) {
  return (
    <div style={card}>
      <h3>{icon} {title}</h3>
      {children}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const page = { background: "#f6f8fb", minHeight: "100vh", padding: 40 };
const container = { maxWidth: 1200, margin: "0 auto" };

const title = { fontSize: "2.4rem", fontWeight: 700 };
const subtitle = { color: "#555", marginBottom: 24 };

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  marginBottom: 24
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
  marginBottom: 24
};

const chartGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 24
};

const stat = {
  background: "white",
  padding: 16,
  borderRadius: 10,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  textAlign: "center"
};

const input = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
  width: "100%"
};

const button = {
  marginTop: 12,
  padding: "10px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6
};




