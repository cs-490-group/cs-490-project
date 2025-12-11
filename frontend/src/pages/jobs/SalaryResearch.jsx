// frontend/src/pages/jobs/SalaryResearch.jsx
import React, { useState, useRef, useMemo } from "react";
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
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.REACT_APP_API_URL;

  // Refs for exporting charts
  const trendChartRef = useRef(null);
  const experienceChartRef = useRef(null);
  const companyChartRef = useRef(null);
  const gaugeChartRef = useRef(null);

  const session = localStorage.getItem("session");
  const uuid = localStorage.getItem("uuid");

  const isLoggedIn = Boolean(session && uuid);

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "—";
    return `$${value.toLocaleString()}`;
  };

  async function fetchSalary() {
    if (!jobTitle) {
      alert("Please enter a job title");
      return;
    }

    if (!isLoggedIn) {
      setError("You must be logged in to use salary research.");
      return;
    }

    setLoading(true);
    setError("");
    setSalaryData(null);

    try {
      const token = localStorage.getItem("session");
      const uuid = localStorage.getItem("uuid");

      const response = await axios.get(`${API}/api/salary/research`, {
        params: { job_title: jobTitle, location },
        headers: {
          uuid: uuid,
          Authorization: `Bearer ${token}`
        }
      });

      // Raw API data (from research_market_salary)
      const raw = response.data || {};

      // Map + derive fields for the UI
      const mapped = {
        median: raw.median_salary,
        low: raw.percentile_25,
        high: raw.percentile_75,
        p25: raw.percentile_25,
        p75: raw.percentile_75,
        p90: raw.percentile_90,
        industryAverage: raw.industry_average,
        salaryTrend: raw.salary_trend,
        comparableCompanies: raw.comparable_companies || [],
        companySizeFactor: raw.company_size_factor || "",
        raw
      };

      setSalaryData(mapped);
    } catch (err) {
      console.error("Salary fetch failed:", err);
      if (err.response?.status === 401) {
        setError("Your session expired or is invalid. Please log in again.");
      } else {
        setError("Failed to fetch salary data.");
      }
    }

    setLoading(false);
  }

  // -------- Derived chart data --------

  const trendChartData = useMemo(() => {
    if (!salaryData) return null;

    // Simulate 5-year history around median based on trend
    const median = salaryData.median || 0;
    const step =
      salaryData.salaryTrend &&
      salaryData.salaryTrend.toLowerCase().includes("increas")
        ? median * 0.03
        : salaryData.salaryTrend &&
          salaryData.salaryTrend.toLowerCase().includes("decreas")
        ? -median * 0.02
        : 0;

    const years = ["2019", "2020", "2021", "2022", "2023"];
    const base = median - step * 2;
    const values = years.map((_, idx) => Math.round(base + step * idx));

    return {
      labels: years,
      datasets: [
        {
          label: "Median Salary",
          data: values,
          borderWidth: 2,
          fill: false,
          tension: 0.25
        }
      ]
    };
  }, [salaryData]);

  const experienceChartData = useMemo(() => {
    if (!salaryData) return null;

    const median = salaryData.median || 0;
    const junior = Math.round(median * 0.7);
    const mid = Math.round(median * 1.0);
    const senior = Math.round(median * 1.3);
    const staff = Math.round(median * 1.6);

    return {
      labels: ["Junior", "Mid-Level", "Senior", "Staff"],
      datasets: [
        {
          label: "Estimated Salary",
          data: [junior, mid, senior, staff],
          borderWidth: 1
        }
      ]
    };
  }, [salaryData]);

  const companyComparisonData = useMemo(() => {
    if (!salaryData || !salaryData.comparableCompanies) return null;
    const median = salaryData.median || 0;
    if (!median) return null;

    const companies = salaryData.comparableCompanies;
    if (!companies.length) return null;

    // Fake spread around median
    const values = companies.map((_, idx) =>
      Math.round(median * (0.9 + 0.05 * idx))
    );

    return {
      labels: companies,
      datasets: [
        {
          label: "Estimated Median Salary",
          data: values,
          borderWidth: 1
        }
      ]
    };
  }, [salaryData]);

  const gaugeData = useMemo(() => {
    if (!salaryData) return null;

    const median = salaryData.median || 0;
    const p25 = salaryData.p25 || median * 0.7;
    const p90 = salaryData.p90 || median * 1.5;

    const min = p25;
    const max = p90;
    const positionRaw = median - min;
    const range = max - min || 1;
    const position = Math.max(0, Math.min(positionRaw / range, 1));

    return {
      labels: ["Market Value", "Remaining"],
      datasets: [
        {
          data: [position * 100, 100 - position * 100],
          backgroundColor: [
            "#2a7dd2",       // 🔵 BLUE (visible filled value)
            "#e5e5e5"        // ⚪ Light gray for remaining arc
          ],
          borderWidth: 0,
          hoverBackgroundColor: [
            "#1f67ad",
            "#d0d0d0"
          ]
        }
      ]
    };
  }, [salaryData]);

  // -------- Export helpers --------

  const exportChartPNG = (chartRef, filename = "salary-chart.png") => {
    const chart = chartRef.current;
    if (!chart) {
      alert("Chart is not ready yet.");
      return;
    }

    const url = chart.toBase64Image();
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const exportAllChartsPNG = () => {
    if (!trendChartRef.current && !experienceChartRef.current) {
      alert("No charts available to export yet.");
      return;
    }
    exportChartPNG(trendChartRef, "salary-trend.png");
    if (experienceChartRef.current) {
      exportChartPNG(experienceChartRef, "experience-ladder.png");
    }
    if (companyChartRef.current) {
      exportChartPNG(companyChartRef, "company-comparison.png");
    }
    if (gaugeChartRef.current) {
      exportChartPNG(gaugeChartRef, "market-value-gauge.png");
    }
  };

  const exportPageToPDFHint = () => {
    alert(
      "To save as PDF quickly, use your browser's Print dialog (Ctrl+P / Cmd+P) and choose 'Save as PDF'."
    );
  };

  // -------- Render --------

  const loggedOutMessage =
    !isLoggedIn && "You must be logged in to use salary research.";

  return (
    <div style={pageContainer}>
      <h1 style={title}>💰 Salary Research & Benchmarking</h1>
      <p style={subtitle}>
        Search salary ranges, compare companies, and view historical salary
        trends.
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

        <button
          onClick={fetchSalary}
          style={{
            ...button,
            ...(loading || !isLoggedIn ? disabledButton : {})
          }}
          disabled={loading || !isLoggedIn}
        >
          {loading ? "Loading..." : "Search Salaries"}
        </button>

        {(error || loggedOutMessage) && (
          <p style={errorText}>{error || loggedOutMessage}</p>
        )}
      </div>

      {/* Salary Results */}
      {salaryData && (
        <>
          {/* Summary */}
          <h2 style={sectionTitle}>Salary Summary</h2>
          <div style={cardGrid}>
            <InfoCard
              title="Estimated Range"
              value={`${formatCurrency(salaryData.low)} - ${formatCurrency(
                salaryData.high
              )}`}
            />
            <InfoCard
              title="Median Salary"
              value={formatCurrency(salaryData.median)}
            />
            <InfoCard
              title="Industry Average"
              value={formatCurrency(salaryData.industryAverage)}
            />
            <InfoCard
              title="Percentiles"
              value={`P25: ${formatCurrency(
                salaryData.p25
              )} · P75: ${formatCurrency(salaryData.p75)}`}
            />
          </div>

          {/* Company size & experience factors */}
          <div style={cardGrid}>
            <InfoCard
              title="Company Size Factor"
              value={
                salaryData.companySizeFactor ||
                "Company size can meaningfully impact pay levels."
              }
              largeText={false}
            />
            <InfoCard
              title="Experience Factor"
              value="Junior roles typically earn ~70% of median, while Staff-level can exceed 150%."
              largeText={false}
            />
          </div>

          {/* Comparable Companies */}
          {salaryData.comparableCompanies &&
            salaryData.comparableCompanies.length > 0 && (
              <div style={card}>
                <h3 style={sectionTitle}>Comparable Companies</h3>
                <ul style={list}>
                  {salaryData.comparableCompanies.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

          {/* Charts Dashboard */}
          <div style={chartGrid}>
            {/* Historical Salary Trend */}
            {trendChartData && (
              <div style={chartCard}>
                <h3 style={chartTitle}>📈 Historical Simulated Salary Trend</h3>
                <Line
                  ref={trendChartRef}
                  data={trendChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (val) => `$${val.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Experience Ladder */}
            {experienceChartData && (
              <div style={chartCard}>
                <h3 style={chartTitle}>
                  🧭 Experience-Based Ladder (Junior → Staff)
                </h3>
                <Bar
                  ref={experienceChartRef}
                  data={experienceChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (val) => `$${val.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Company Comparison */}
            {companyComparisonData && (
              <div style={chartCard}>
                <h3 style={chartTitle}>🏢 Company Comparison</h3>
                <Bar
                  ref={companyChartRef}
                  data={companyComparisonData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (val) => `$${val.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Market Value Gauge */}
            {gaugeData && (
              <div style={chartCard}>
                <h3 style={chartTitle}>📊 Market Value Estimator</h3>
                <Doughnut
                  ref={gaugeChartRef}
                  data={gaugeData}
                  options={{
                    circumference: 180,
                    rotation: -90,
                    cutout: "70%",
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) =>
                            ctx.label === "Market Value"
                              ? `Market position: ${ctx.raw.toFixed(1)}%`
                              : undefined
                        }
                      }
                    }
                  }}
                />
                <p style={gaugeNote}>
                  Approximate position of this role&apos;s median salary between
                  typical lower and upper market bands.
                </p>
              </div>
            )}
          </div>

          {/* Salary Trend Text */}
          <div style={card}>
            <h3 style={sectionTitle}>Salary Trend</h3>
            <p style={{ margin: 0 }}>
              {salaryData.salaryTrend
                ? salaryData.salaryTrend
                : "No specific trend description available for this role; use market position and percentiles to guide negotiations."}
            </p>
          </div>

          {/* Export Actions */}
          <div style={{ ...card, textAlign: "center" }}>
            <h3 style={sectionTitle}>Export &amp; Share</h3>
            <p style={{ marginBottom: "16px" }}>
              Export key salary charts for your notes or recruiter conversations.
            </p>
            <button
              style={{ ...smallButton, marginRight: "8px" }}
              onClick={exportAllChartsPNG}
            >
              ⬇️ Export Charts as PNG
            </button>
            <button style={smallButton} onClick={exportPageToPDFHint}>
              📄 Save Page as PDF (Browser Print)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* Reusable Card */
function InfoCard({ title, value, largeText = true }) {
  return (
    <div style={infoCard}>
      <h4 style={infoTitle}>{title}</h4>
      <p style={largeText ? infoValue : infoBody}>{value}</p>
    </div>
  );
}

/* ---------------- LIGHT UI STYLES ---------------- */

const pageContainer = {
  padding: "20px",
  maxWidth: "1100px",
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

const chartTitle = {
  fontSize: "1.1rem",
  fontWeight: 600,
  marginBottom: "8px",
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
  padding: "18px",
  borderRadius: "10px",
  boxShadow: "0px 3px 12px rgba(0,0,0,0.08)",
  marginBottom: "25px",
  flex: "1 1 340px",
  minWidth: "280px"
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

const disabledButton = {
  opacity: 0.6,
  cursor: "not-allowed"
};

const smallButton = {
  padding: "10px 18px",
  background: "#2a7dd2",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: 600
};

const errorText = {
  color: "red",
  marginTop: "10px",
  fontWeight: 500
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px",
  marginBottom: "25px"
};

const chartGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: "20px",
  marginTop: "10px",
  marginBottom: "10px"
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

const infoBody = {
  fontSize: "15px",
  fontWeight: 500,
  color: "#2a7dd2",
  lineHeight: 1.4
};

const list = {
  marginLeft: "20px",
  lineHeight: "1.6"
};

const gaugeNote = {
  marginTop: "8px",
  fontSize: "0.9rem",
  color: "#555",
  textAlign: "center"
};




