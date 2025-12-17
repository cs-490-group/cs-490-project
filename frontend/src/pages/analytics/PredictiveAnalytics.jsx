import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from "recharts";

const PredictiveAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("current");

  useEffect(() => {
    // Simulate loading predictions
    setTimeout(() => {
      setPredictions(generateMockPredictions());
      setLoading(false);
    }, 800);
  }, []);

  const generateMockPredictions = () => {
    // Mock AI predictions - will be replaced with real AI API later
    return {
      interviewSuccess: {
        probability: 68,
        confidence: 85,
        factors: [
          { name: "Technical Skills", score: 75, impact: "high" },
          { name: "Communication", score: 82, impact: "high" },
          { name: "Experience Match", score: 65, impact: "medium" },
          { name: "Interview Prep", score: 58, impact: "medium" },
          { name: "Company Fit", score: 70, impact: "low" }
        ],
        recommendations: [
          "Focus on technical interview preparation to boost success rate by 15%",
          "Practice STAR method for behavioral questions",
          "Research company culture and values before interviews"
        ]
      },
      timeline: {
        predictedDays: 47,
        confidence: 78,
        range: { min: 35, max: 62 },
        milestones: [
          { week: 1, applications: 12, interviews: 1, probability: 15 },
          { week: 2, applications: 25, interviews: 3, probability: 35 },
          { week: 3, applications: 38, interviews: 5, probability: 58 },
          { week: 4, applications: 50, interviews: 7, probability: 72 },
          { week: 5, applications: 60, interviews: 9, probability: 85 },
          { week: 6, applications: 68, interviews: 11, probability: 92 }
        ],
        factors: [
          "Current application rate: 8/week",
          "Market response rate: 25%",
          "Your interview conversion: 18%"
        ]
      },
      salary: {
        predictedOffer: 125000,
        confidence: 72,
        range: { min: 115000, max: 138000 },
        negotiationSuccess: 65,
        factors: [
          { factor: "Market Rate", value: "$118K - $142K", impact: "+8%" },
          { factor: "Your Experience", value: "5 years", impact: "+12%" },
          { factor: "Negotiation Skills", value: "Moderate", impact: "+3%" },
          { factor: "Company Budget", value: "Healthy", impact: "+5%" }
        ],
        recommendations: [
          "Research 3 comparable offers to strengthen negotiation position",
          "Highlight your unique skills in data analysis and team leadership",
          "Consider total compensation package, not just base salary"
        ]
      },
      timing: {
        optimalPeriod: "Next 2-4 weeks",
        confidence: 81,
        reasons: [
          "Market activity is 23% above average for your industry",
          "Company hiring cycles peak in current quarter",
          "Your skill set matches 145 active job postings"
        ],
        forecast: [
          { month: "This Month", opportunities: 145, competition: "Medium", success: 68 },
          { month: "Next Month", opportunities: 162, competition: "Medium", success: 72 },
          { month: "2 Months", opportunities: 138, competition: "High", success: 58 },
          { month: "3 Months", opportunities: 121, competition: "High", success: 52 }
        ]
      },
      scenarios: {
        current: {
          name: "Current Pace",
          applications: 8,
          expectedOffers: 1.2,
          timeline: 47,
          probability: 68
        },
        aggressive: {
          name: "Aggressive (15 apps/week)",
          applications: 15,
          expectedOffers: 2.1,
          timeline: 28,
          probability: 82
        },
        selective: {
          name: "Selective (4 apps/week)",
          applications: 4,
          expectedOffers: 0.8,
          timeline: 68,
          probability: 52
        },
        optimized: {
          name: "AI-Optimized",
          applications: 10,
          expectedOffers: 2.4,
          timeline: 35,
          probability: 89,
          changes: [
            "Focus on companies with 80%+ culture match",
            "Apply Tuesday-Thursday (32% higher response)",
            "Customize applications with AI assistance"
          ]
        }
      },
      accuracy: {
        historical: [
          { metric: "Interview Predictions", accuracy: 76, samples: 145 },
          { metric: "Timeline Forecasts", accuracy: 82, samples: 98 },
          { metric: "Salary Estimates", accuracy: 71, samples: 67 },
          { metric: "Success Probability", accuracy: 79, samples: 203 }
        ],
        improving: true,
        trend: "+8% over last 30 days"
      }
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="analyticsDashboard-content">
        <h2>🔮 Predictive Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Analyzing your data and generating predictions...</p>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="analyticsDashboard-content">
        <h2>🔮 Predictive Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Need more data to generate accurate predictions. Keep tracking your job search!</p>
        </div>
      </div>
    );
  }

  const scenario = predictions.scenarios[selectedScenario];

  return (
    <div className="analyticsDashboard-content">
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: 0, marginBottom: "8px" }}>🔮 Predictive Analytics</h2>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          AI-powered predictions to optimize your job search strategy
        </p>
      </div>

      {/* Key Predictions Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Interview Success */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #9c27b0"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            💼 Interview Success Rate
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#9c27b0", marginBottom: "4px" }}>
            {predictions.interviewSuccess.probability}%
          </div>
          <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
            {predictions.interviewSuccess.confidence}% confidence
          </div>
          <div style={{
            width: "100%",
            height: "8px",
            background: "#f0f0f0",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${predictions.interviewSuccess.probability}%`,
              height: "100%",
              background: "#9c27b0",
              transition: "width 0.3s"
            }} />
          </div>
        </div>

        {/* Timeline Forecast */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #2196f3"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            ⏱️ Expected Timeline
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#2196f3", marginBottom: "4px" }}>
            {predictions.timeline.predictedDays}
          </div>
          <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
            days to offer ({predictions.timeline.confidence}% confidence)
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Range: {predictions.timeline.range.min}-{predictions.timeline.range.max} days
          </div>
        </div>

        {/* Salary Prediction */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #4caf50"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            💰 Predicted Offer
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#4caf50", marginBottom: "4px" }}>
            {formatCurrency(predictions.salary.predictedOffer)}
          </div>
          <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
            {predictions.salary.confidence}% confidence
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Range: {formatCurrency(predictions.salary.range.min)}-{formatCurrency(predictions.salary.range.max)}
          </div>
        </div>

        {/* Optimal Timing */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #ff9800"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            📅 Optimal Timing
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff9800", marginBottom: "8px" }}>
            {predictions.timing.optimalPeriod}
          </div>
          <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
            {predictions.timing.confidence}% confidence
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {predictions.timing.forecast[0].opportunities} active opportunities
          </div>
        </div>
      </div>

      {/* Timeline Forecast Chart */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📈 Job Search Timeline Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={predictions.timeline.milestones}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
            <YAxis yAxisId="left" label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Count', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="probability" stroke="#9c27b0" strokeWidth={3} name="Success Probability" />
            <Line yAxisId="right" type="monotone" dataKey="interviews" stroke="#2196f3" strokeWidth={2} name="Expected Interviews" />
            <Line yAxisId="right" type="monotone" dataKey="applications" stroke="#ff9800" strokeWidth={2} strokeDasharray="5 5" name="Total Applications" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "16px", padding: "12px", background: "#f5f5f5", borderRadius: "6px" }}>
          <strong>Key Factors:</strong>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            {predictions.timeline.factors.map((factor, idx) => (
              <li key={idx} style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>{factor}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interview Success Factors Radar */}
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎯 Interview Success Factors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={predictions.interviewSuccess.factors}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Your Score" dataKey="score" stroke="#9c27b0" fill="#9c27b0" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: "12px" }}>
            {predictions.interviewSuccess.factors.map((factor, idx) => (
              <div key={idx} style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: "8px",
                background: idx % 2 === 0 ? "#f9f9f9" : "white",
                borderRadius: "4px",
                marginBottom: "4px"
              }}>
                <span style={{ fontSize: "14px" }}>{factor.name}</span>
                <span style={{ 
                  fontSize: "14px",
                  fontWeight: "600",
                  color: factor.impact === "high" ? "#4caf50" : factor.impact === "medium" ? "#ff9800" : "#999"
                }}>
                  {factor.score}% ({factor.impact} impact)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Negotiation Factors */}
        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>💰 Salary Negotiation Analysis</h3>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
              Negotiation Success Probability
            </div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4caf50", marginBottom: "8px" }}>
              {predictions.salary.negotiationSuccess}%
            </div>
            <div style={{
              width: "100%",
              height: "12px",
              background: "#f0f0f0",
              borderRadius: "6px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${predictions.salary.negotiationSuccess}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4caf50, #66bb6a)",
                transition: "width 0.3s"
              }} />
            </div>
          </div>
          
          <div style={{ marginTop: "20px" }}>
            <strong style={{ fontSize: "15px" }}>Contributing Factors:</strong>
            {predictions.salary.factors.map((item, idx) => (
              <div key={idx} style={{ 
                marginTop: "12px",
                padding: "10px",
                background: "#f9f9f9",
                borderRadius: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{item.factor}</span>
                  <span style={{ fontSize: "14px", color: "#4caf50", fontWeight: "600" }}>{item.impact}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Planning */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎲 Scenario Planning</h3>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {Object.keys(predictions.scenarios).map(key => (
            <button
              key={key}
              onClick={() => setSelectedScenario(key)}
              style={{
                padding: "10px 20px",
                background: selectedScenario === key ? "#9c27b0" : "white",
                color: selectedScenario === key ? "white" : "#333",
                border: selectedScenario === key ? "none" : "2px solid #e0e0e0",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
            >
              {predictions.scenarios[key].name}
            </button>
          ))}
        </div>

        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px"
        }}>
          <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Applications/Week</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2196f3" }}>{scenario.applications}</div>
          </div>
          <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Expected Offers</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4caf50" }}>{scenario.expectedOffers}</div>
          </div>
          <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Timeline (days)</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9800" }}>{scenario.timeline}</div>
          </div>
          <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Success Rate</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#9c27b0" }}>{scenario.probability}%</div>
          </div>
        </div>

        {scenario.changes && (
          <div style={{ 
            padding: "16px",
            background: "#e8f5e9",
            borderLeft: "4px solid #4caf50",
            borderRadius: "6px"
          }}>
            <strong style={{ color: "#2e7d32" }}>✨ AI-Recommended Changes:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {scenario.changes.map((change, idx) => (
                <li key={idx} style={{ fontSize: "14px", color: "#333", marginBottom: "6px" }}>{change}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>💡 AI Recommendations</h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {[
            ...predictions.interviewSuccess.recommendations,
            ...predictions.salary.recommendations
          ].map((rec, idx) => (
            <div key={idx} style={{
              padding: "16px",
              background: "#f9f9f9",
              borderLeft: "4px solid #9c27b0",
              borderRadius: "6px",
              display: "flex",
              gap: "12px"
            }}>
              <div style={{ fontSize: "20px" }}>💡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>{rec}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Timing Forecast */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📅 Market Timing Forecast</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={predictions.timing.forecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="opportunities" fill="#2196f3" name="Job Opportunities" />
            <Bar yAxisId="right" dataKey="success" fill="#4caf50" name="Success Probability %" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "16px", padding: "12px", background: "#fff3e0", borderLeft: "4px solid #ff9800", borderRadius: "6px" }}>
          <strong>Why {predictions.timing.optimalPeriod}?</strong>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            {predictions.timing.reasons.map((reason, idx) => (
              <li key={idx} style={{ fontSize: "14px", color: "#333", marginBottom: "4px" }}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Prediction Accuracy Tracking */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📊 Prediction Accuracy & Model Performance</h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {predictions.accuracy.historical.map((item, idx) => (
            <div key={idx} style={{
              padding: "16px",
              background: "#f9f9f9",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#333" }}>{item.metric}</div>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                  Based on {item.samples} predictions
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: item.accuracy >= 80 ? "#4caf50" : item.accuracy >= 70 ? "#ff9800" : "#f44336" }}>
                  {item.accuracy}%
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>accuracy</div>
              </div>
            </div>
          ))}
        </div>
        
        {predictions.accuracy.improving && (
          <div style={{ 
            marginTop: "16px",
            padding: "16px",
            background: "#e8f5e9",
            borderLeft: "4px solid #4caf50",
            borderRadius: "6px"
          }}>
            <strong style={{ color: "#2e7d32" }}>📈 Model Improving:</strong>{" "}
            <span style={{ color: "#333" }}>
              Prediction accuracy has increased {predictions.accuracy.trend} as we learn from your outcomes
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;