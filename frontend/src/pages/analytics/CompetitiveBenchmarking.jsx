import React, { useState, useEffect } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from "recharts";

const CompetitiveBenchmarking = () => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState("all");

  useEffect(() => {
    // Simulate loading analysis
    setTimeout(() => {
      setAnalysisData(generateMockAnalysis());
      setLoading(false);
    }, 800);
  }, []);

  const generateMockAnalysis = () => {
    // Mock competitive analysis and success pattern data
    return {
      peerComparison: {
        yourRank: 23,
        totalPeers: 100,
        percentile: 77,
        metrics: [
          { metric: "Application Volume", you: 45, peer_avg: 38, top_10: 65, percentile: 72 },
          { metric: "Response Rate", you: 28, peer_avg: 25, top_10: 45, percentile: 68 },
          { metric: "Interview Rate", you: 18, peer_avg: 15, top_10: 32, percentile: 75 },
          { metric: "Offer Rate", you: 6, peer_avg: 5, top_10: 12, percentile: 71 },
          { metric: "Time to Offer", you: 47, peer_avg: 52, top_10: 35, percentile: 82 }
        ]
      },
      skillGap: {
        current: [
          { skill: "Technical Skills", your_score: 78, market_avg: 72, top_performers: 92, gap: 14 },
          { skill: "Communication", your_score: 85, market_avg: 75, top_performers: 95, gap: 10 },
          { skill: "Leadership", your_score: 65, market_avg: 68, top_performers: 88, gap: 23 },
          { skill: "Domain Expertise", your_score: 72, market_avg: 70, top_performers: 90, gap: 18 },
          { skill: "Problem Solving", your_score: 88, market_avg: 73, top_performers: 94, gap: 6 },
          { skill: "Adaptability", your_score: 70, market_avg: 71, top_performers: 87, gap: 17 }
        ],
        priorities: [
          { skill: "Leadership", impact: "high", effort: "medium", recommendation: "Take leadership role in current project" },
          { skill: "Domain Expertise", impact: "high", effort: "low", recommendation: "Earn industry certification" },
          { skill: "Adaptability", impact: "medium", effort: "low", recommendation: "Volunteer for cross-functional work" }
        ]
      },
      successPatterns: {
        identified: [
          {
            pattern: "Tuesday-Thursday Applications",
            success_rate: 34,
            avg_success: 25,
            frequency: 42,
            confidence: 85,
            description: "Applications submitted Tuesday-Thursday have 36% higher response rate"
          },
          {
            pattern: "Customized Cover Letters",
            success_rate: 41,
            avg_success: 28,
            frequency: 65,
            confidence: 92,
            description: "Applications with tailored cover letters convert 46% better"
          },
          {
            pattern: "Follow-up After 1 Week",
            success_rate: 38,
            avg_success: 25,
            frequency: 28,
            confidence: 78,
            description: "Following up after 7 days increases response by 52%"
          },
          {
            pattern: "Multiple Referrals",
            success_rate: 68,
            avg_success: 25,
            frequency: 12,
            confidence: 88,
            description: "Applications with 2+ employee referrals have 172% higher success"
          },
          {
            pattern: "Research-Heavy Applications",
            success_rate: 45,
            avg_success: 25,
            frequency: 38,
            confidence: 81,
            description: "Spending 30+ min researching company increases success by 80%"
          }
        ],
        timeline: [
          { week: "Week 1", applications: 8, success: 12, pattern_adherence: 35 },
          { week: "Week 2", applications: 12, success: 18, pattern_adherence: 52 },
          { week: "Week 3", applications: 15, success: 28, pattern_adherence: 68 },
          { week: "Week 4", applications: 18, success: 35, pattern_adherence: 75 },
          { week: "Week 5", applications: 20, success: 42, pattern_adherence: 82 },
          { week: "Week 6", applications: 22, success: 48, pattern_adherence: 88 }
        ]
      },
      strategyEffectiveness: [
        { strategy: "Direct Applications", tried: 45, successful: 8, success_rate: 18, roi: "Low" },
        { strategy: "Referral Network", tried: 12, successful: 6, success_rate: 50, roi: "High" },
        { strategy: "Recruiter Contact", tried: 28, successful: 9, success_rate: 32, roi: "Medium" },
        { strategy: "LinkedIn Apply", tried: 32, successful: 5, success_rate: 16, roi: "Low" },
        { strategy: "Company Career Page", tried: 18, successful: 7, success_rate: 39, roi: "High" },
        { strategy: "Job Boards", tried: 38, successful: 6, success_rate: 16, roi: "Low" },
        { strategy: "Networking Events", tried: 8, successful: 4, success_rate: 50, roi: "High" }
      ],
      competitiveAdvantages: [
        { 
          area: "Response Rate", 
          your_performance: "28%", 
          market: "25%",
          advantage: "+3%",
          strength: "Above Average",
          action: "Maintain current application quality"
        },
        { 
          area: "Interview Conversion", 
          your_performance: "18%", 
          market: "15%",
          advantage: "+3%",
          strength: "Above Average",
          action: "Leverage this in negotiations"
        },
        { 
          area: "Technical Skills", 
          your_performance: "78", 
          market: "72",
          advantage: "+6 pts",
          strength: "Strong",
          action: "Highlight in applications"
        },
        { 
          area: "Communication", 
          your_performance: "85", 
          market: "75",
          advantage: "+10 pts",
          strength: "Very Strong",
          action: "Emphasize in interviews"
        }
      ],
      differentiationStrategy: {
        unique_strengths: [
          "Problem-solving ability significantly above market (88 vs 73)",
          "Communication skills in top 15% of peer group",
          "Faster time-to-offer than 82% of peers"
        ],
        opportunities: [
          "Build leadership experience to match top performers",
          "Expand domain expertise through certification",
          "Increase referral network utilization (currently 12%)"
        ],
        positioning: "Technical Excellence + Strong Communication",
        value_proposition: "Skilled problem-solver who can bridge technical and business domains"
      },
      recommendations: {
        immediate: [
          {
            title: "Double Down on Referrals",
            impact: "High",
            effort: "Medium",
            rationale: "Your referral success rate (50%) is 3x your average (18%). Invest more time here.",
            action: "Reach out to 5 contacts per week for informational interviews"
          },
          {
            title: "Optimize Application Timing",
            impact: "Medium",
            effort: "Low",
            rationale: "Tuesday-Thursday applications show 36% higher response rate",
            action: "Batch applications for mid-week submission"
          },
          {
            title: "Develop Leadership Evidence",
            impact: "High",
            effort: "High",
            rationale: "23-point gap vs top performers. This is your biggest opportunity.",
            action: "Lead a project or mentor junior team members"
          }
        ],
        strategic: [
          {
            title: "Build Unique Value Proposition",
            description: "Position yourself as a 'Technical Communicator' - someone who excels at both coding and explaining complex concepts",
            timeline: "2-3 months"
          },
          {
            title: "Close Domain Expertise Gap",
            description: "Earn AWS or Azure certification to demonstrate continuous learning and close 18-point gap",
            timeline: "1-2 months"
          }
        ]
      },
      marketPositioning: {
        current: "Strong Mid-Tier Candidate",
        target: "Top-Tier Candidate",
        progress: 68,
        factors: [
          { factor: "Technical Skills", current: "Strong", target: "Excellent", gap: "Small" },
          { factor: "Leadership", current: "Developing", target: "Strong", gap: "Large" },
          { factor: "Communication", current: "Excellent", target: "Excellent", gap: "None" },
          { factor: "Network", current: "Limited", target: "Strong", gap: "Medium" }
        ]
      }
    };
  };

  if (loading) {
    return (
      <div className="analyticsDashboard-content">
        <h2>🏆 Competitive Analysis & Success Patterns</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Analyzing your performance and identifying success patterns...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="analyticsDashboard-content">
        <h2>🏆 Competitive Analysis & Success Patterns</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Need more data to generate competitive analysis. Keep tracking your job search!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analyticsDashboard-content">
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: 0, marginBottom: "8px" }}>🏆 Competitive Analysis & Success Patterns</h2>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Benchmark your performance and discover what strategies work best for you
        </p>
      </div>

      {/* Peer Ranking Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #9c27b0"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            🏅 Your Rank
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#9c27b0", marginBottom: "4px" }}>
            #{analysisData.peerComparison.yourRank}
          </div>
          <div style={{ fontSize: "13px", color: "#999" }}>
            out of {analysisData.peerComparison.totalPeers} peers
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #2196f3"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            📊 Percentile
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#2196f3", marginBottom: "4px" }}>
            {analysisData.peerComparison.percentile}th
          </div>
          <div style={{ fontSize: "13px", color: "#999" }}>
            Better than {analysisData.peerComparison.percentile}%
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #4caf50"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            ✨ Market Position
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4caf50", marginBottom: "4px" }}>
            {analysisData.marketPositioning.current}
          </div>
          <div style={{ fontSize: "13px", color: "#999" }}>
            {analysisData.marketPositioning.progress}% to target
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: "4px solid #ff9800"
        }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            🎯 Success Patterns
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#ff9800", marginBottom: "4px" }}>
            {analysisData.successPatterns.identified.length}
          </div>
          <div style={{ fontSize: "13px", color: "#999" }}>
            patterns identified
          </div>
        </div>
      </div>

      {/* Peer Performance Comparison */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📊 Performance vs Peers</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={analysisData.peerComparison.metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" angle={-20} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="you" fill="#2196f3" name="Your Performance" />
            <Bar dataKey="peer_avg" fill="#9e9e9e" name="Peer Average" />
            <Bar dataKey="top_10" fill="#4caf50" name="Top 10%" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {analysisData.peerComparison.metrics.map((metric, idx) => (
            <div key={idx} style={{
              padding: "12px",
              background: metric.percentile >= 75 ? "#e8f5e9" : metric.percentile >= 50 ? "#fff3e0" : "#ffebee",
              borderRadius: "6px",
              borderLeft: `4px solid ${metric.percentile >= 75 ? '#4caf50' : metric.percentile >= 50 ? '#ff9800' : '#f44336'}`
            }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                {metric.metric}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: metric.percentile >= 75 ? '#4caf50' : '#666' }}>
                {metric.percentile}th percentile
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Gap Analysis */}
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
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎯 Skill Gap Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={analysisData.skillGap.current}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="You" dataKey="your_score" stroke="#2196f3" fill="#2196f3" fillOpacity={0.5} />
              <Radar name="Market Avg" dataKey="market_avg" stroke="#9e9e9e" fill="#9e9e9e" fillOpacity={0.3} />
              <Radar name="Top 10%" dataKey="top_performers" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ 
          background: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>⚡ Priority Skill Gaps</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {analysisData.skillGap.priorities.map((priority, idx) => (
              <div key={idx} style={{
                padding: "16px",
                background: "#f9f9f9",
                borderLeft: `4px solid ${priority.impact === 'high' ? '#f44336' : '#ff9800'}`,
                borderRadius: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "600", color: "#333" }}>
                    {priority.skill}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      background: priority.impact === 'high' ? '#ffebee' : '#fff3e0',
                      color: priority.impact === 'high' ? '#c62828' : '#e65100',
                      borderRadius: "12px",
                      fontWeight: "600"
                    }}>
                      {priority.impact.toUpperCase()} IMPACT
                    </span>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      background: "#e3f2fd",
                      color: "#1565c0",
                      borderRadius: "12px",
                      fontWeight: "600"
                    }}>
                      {priority.effort.toUpperCase()} EFFORT
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  💡 {priority.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Patterns */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🔍 Identified Success Patterns</h3>
        <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
          {analysisData.successPatterns.identified.map((pattern, idx) => (
            <div key={idx} style={{
              padding: "16px",
              background: "#f9f9f9",
              borderLeft: `4px solid ${pattern.confidence >= 85 ? '#4caf50' : '#2196f3'}`,
              borderRadius: "6px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                    {pattern.pattern}
                  </span>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                    {pattern.description}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4caf50" }}>
                    {pattern.success_rate}%
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    vs {pattern.avg_success}% avg
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Used in {pattern.frequency}% of applications
                </div>
                <div style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  background: pattern.confidence >= 85 ? '#e8f5e9' : '#e3f2fd',
                  color: pattern.confidence >= 85 ? '#2e7d32' : '#1565c0',
                  borderRadius: "12px",
                  fontWeight: "600"
                }}>
                  {pattern.confidence}% CONFIDENCE
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4 style={{ marginTop: 0, fontSize: "16px", color: "#333", marginBottom: "12px" }}>
            📈 Pattern Adoption & Success Over Time
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analysisData.successPatterns.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="pattern_adherence" stroke="#9c27b0" strokeWidth={3} name="Pattern Adherence %" />
              <Line yAxisId="right" type="monotone" dataKey="success" stroke="#4caf50" strokeWidth={2} name="Success Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy Effectiveness */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>💼 Strategy Effectiveness Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analysisData.strategyEffectiveness.sort((a, b) => b.success_rate - a.success_rate)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="strategy" angle={-20} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="success_rate" fill="#2196f3" name="Success Rate %" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
          {analysisData.strategyEffectiveness
            .sort((a, b) => b.success_rate - a.success_rate)
            .slice(0, 4)
            .map((strategy, idx) => (
              <div key={idx} style={{
                padding: "12px",
                background: strategy.roi === "High" ? "#e8f5e9" : strategy.roi === "Medium" ? "#fff3e0" : "#ffebee",
                borderRadius: "6px",
                borderLeft: `4px solid ${strategy.roi === "High" ? '#4caf50' : strategy.roi === "Medium" ? '#ff9800' : '#f44336'}`
              }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                  {strategy.strategy}
                </div>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: strategy.roi === "High" ? '#4caf50' : '#666', marginBottom: "4px" }}>
                  {strategy.success_rate}% success
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {strategy.successful}/{strategy.tried} successful • {strategy.roi} ROI
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Competitive Advantages */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>⭐ Your Competitive Advantages</h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {analysisData.competitiveAdvantages.map((advantage, idx) => (
            <div key={idx} style={{
              padding: "16px",
              background: "#f9f9f9",
              borderLeft: "4px solid #4caf50",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                  {advantage.area}
                </div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                  Your performance: <strong>{advantage.your_performance}</strong> vs Market: {advantage.market}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  💡 {advantage.action}
                </div>
              </div>
              <div style={{ textAlign: "right", marginLeft: "16px" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4caf50" }}>
                  {advantage.advantage}
                </div>
                <div style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  borderRadius: "12px",
                  fontWeight: "600",
                  marginTop: "4px"
                }}>
                  {advantage.strength}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Differentiation Strategy */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "24px"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎯 Your Differentiation Strategy</h3>
        
        <div style={{ 
          padding: "16px", 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "8px",
          color: "white",
          marginBottom: "20px"
        }}>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Your Unique Positioning</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {analysisData.differentiationStrategy.positioning}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            {analysisData.differentiationStrategy.value_proposition}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <h4 style={{ marginTop: 0, fontSize: "15px", color: "#333", marginBottom: "12px" }}>
              ✅ Unique Strengths
            </h4>
            {analysisData.differentiationStrategy.unique_strengths.map((strength, idx) => (
              <div key={idx} style={{
                padding: "12px",
                background: "#e8f5e9",
                borderLeft: "4px solid #4caf50",
                borderRadius: "6px",
                marginBottom: "8px",
                fontSize: "13px",
                color: "#333"
              }}>
                {strength}
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ marginTop: 0, fontSize: "15px", color: "#333", marginBottom: "12px" }}>
              🎯 Growth Opportunities
            </h4>
            {analysisData.differentiationStrategy.opportunities.map((opportunity, idx) => (
              <div key={idx} style={{
                padding: "12px",
                background: "#fff3e0",
                borderLeft: "4px solid #ff9800",
                borderRadius: "6px",
                marginBottom: "8px",
                fontSize: "13px",
                color: "#333"
              }}>
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>💡 Actionable Recommendations</h3>
        
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ fontSize: "16px", color: "#333", marginBottom: "12px" }}>
            🚀 Immediate Actions (This Week)
          </h4>
          <div style={{ display: "grid", gap: "12px" }}>
            {analysisData.recommendations.immediate.map((rec, idx) => (
              <div key={idx} style={{
                padding: "16px",
                background: "#f9f9f9",
                borderLeft: `4px solid ${rec.impact === 'High' ? '#f44336' : '#ff9800'}`,
                borderRadius: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                    {rec.title}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      background: rec.impact === 'High' ? '#ffebee' : '#fff3e0',
                      color: rec.impact === 'High' ? '#c62828' : '#e65100',
                      borderRadius: "12px",
                      fontWeight: "600"
                    }}>
                      {rec.impact.toUpperCase()} IMPACT
                    </span>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      background: "#e3f2fd",
                      color: "#1565c0",
                      borderRadius: "12px",
                      fontWeight: "600"
                    }}>
                      {rec.effort.toUpperCase()} EFFORT
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                  <strong>Why:</strong> {rec.rationale}
                </div>
                <div style={{ fontSize: "13px", color: "#333", padding: "8px", background: "white", borderRadius: "4px" }}>
                  <strong>Action:</strong> {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "16px", color: "#333", marginBottom: "12px" }}>
            📈 Strategic Initiatives (1-3 Months)
          </h4>
          <div style={{ display: "grid", gap: "12px" }}>
            {analysisData.recommendations.strategic.map((rec, idx) => (
              <div key={idx} style={{
                padding: "16px",
                background: "#f9f9f9",
                borderLeft: "4px solid #2196f3",
                borderRadius: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "600", color: "#333" }}>
                    {rec.title}
                  </span>
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    background: "#e3f2fd",
                    color: "#1565c0",
                    borderRadius: "12px",
                    fontWeight: "600"
                  }}>
                    {rec.timeline}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {rec.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveBenchmarking;