import React from "react";

export default function SuccessAnalysisSection({ metrics }) {
  const { materialData, topPerformingMaterials } = metrics;

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{
        background: "linear-gradient(135deg, #00897b 0%, #00695c 100%)",
        padding: "20px",
        borderRadius: "8px 8px 0 0",
        color: "white"
      }}>
        <h2 style={{ margin: 0, fontSize: "24px" }}>📊 Application Success Optimization Dashboard</h2>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
          Comprehensive analysis powered by A/B testing and data-driven insights (UC-119)
        </p>
      </div>

      {/* Material Version Performance - UC-119 */}
      <div style={{ background: "white", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
          📄 Resume & Cover Letter Performance
        </h3>
        {materialData && (materialData.resumes.length > 0 || materialData.cover_letters.length > 0) ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Top Resume */}
            <div style={{ padding: "20px", background: "#e8f5e9", borderRadius: "8px", border: "2px solid #4caf50" }}>
              <div style={{ fontSize: "14px", color: "#2e7d32", marginBottom: "12px", fontWeight: "600" }}>
                🏆 Best Performing Resume
              </div>
              {topPerformingMaterials?.resume ? (
                <>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                    {topPerformingMaterials.resume.version_name}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                    <div>
                      <div style={{ color: "#666" }}>Response Rate</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4caf50" }}>
                        {topPerformingMaterials.resume.response_rate}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#666" }}>Applications</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                        {topPerformingMaterials.resume.applications_count}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", padding: "8px", background: "white", borderRadius: "4px", fontSize: "12px", color: "#666" }}>
                    Interview Rate: <strong>{topPerformingMaterials.resume.interview_rate}%</strong> |
                    Offer Rate: <strong>{topPerformingMaterials.resume.offer_rate}%</strong>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                  Need 5+ applications per version
                </div>
              )}
            </div>

            {/* Top Cover Letter */}
            <div style={{ padding: "20px", background: "#fff3e0", borderRadius: "8px", border: "2px solid #ff9800" }}>
              <div style={{ fontSize: "14px", color: "#e65100", marginBottom: "12px", fontWeight: "600" }}>
                🏆 Best Performing Cover Letter
              </div>
              {topPerformingMaterials?.coverLetter ? (
                <>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                    {topPerformingMaterials.coverLetter.letter_name}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                    <div>
                      <div style={{ color: "#666" }}>Response Rate</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff9800" }}>
                        {topPerformingMaterials.coverLetter.response_rate}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#666" }}>Applications</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                        {topPerformingMaterials.coverLetter.applications_count}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", padding: "8px", background: "white", borderRadius: "4px", fontSize: "12px", color: "#666" }}>
                    Interview Rate: <strong>{topPerformingMaterials.coverLetter.interview_rate}%</strong> |
                    Offer Rate: <strong>{topPerformingMaterials.coverLetter.offer_rate}%</strong>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                  Need 5+ applications per version
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
            Link resumes and cover letters to jobs to see performance analysis
          </div>
        )}
        {materialData && (materialData.resumes.length > 1 || materialData.cover_letters.length > 1) && (
          <div style={{ marginTop: "16px", padding: "12px", background: "#e3f2fd", borderRadius: "6px", fontSize: "13px" }}>
            💡 <strong>Tip:</strong> View detailed A/B test results and version comparison in the{" "}
            <a href="/materials/comparison" style={{ color: "#1976d2", textDecoration: "none", fontWeight: "600" }}>
              Materials Comparison Dashboard
            </a>
          </div>
        )}
      </div>

      {/* Success by Application Source/Method */}
      <div style={{ background: "white", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
          🎯 Success Rate by Application Source
        </h3>
        {metrics.sourceSuccessRates.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {metrics.sourceSuccessRates.map((source, idx) => (
              <div key={source.source} style={{ 
                padding: "16px", 
                background: "#f9f9f9", 
                borderRadius: "8px",
                borderLeft: `4px solid ${idx === 0 ? '#4caf50' : '#2196f3'}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                      {idx === 0 ? '🏆 ' : ''}{source.source}
                    </span>
                    <span style={{ fontSize: "13px", color: "#666", marginLeft: "8px" }}>
                      ({source.successful}/{source.total} applications)
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: "20px", 
                    fontWeight: "bold", 
                    color: idx === 0 ? '#4caf50' : '#2196f3' 
                  }}>
                    {source.successRate}%
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${source.successRate}%`,
                    height: "100%",
                    background: idx === 0 ? '#4caf50' : '#2196f3',
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
            Add source information to jobs to see success rate analysis
          </div>
        )}
      </div>

      {/* Customization Impact */}
      <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
          ✍️ Impact of Application Customization
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ padding: "20px", background: "#e8f5e9", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#2e7d32", marginBottom: "8px" }}>
              Customized Applications
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#4caf50" }}>
              {metrics.customizationSuccessRate}%
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              {metrics.customizationImpact.customized.successful}/{metrics.customizationImpact.customized.total} successful
            </div>
          </div>
          <div style={{ padding: "20px", background: "#fff3e0", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#e65100", marginBottom: "8px" }}>
              Standard Applications
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#ff9800" }}>
              {metrics.nonCustomizationSuccessRate}%
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              {metrics.customizationImpact.notCustomized.successful}/{metrics.customizationImpact.notCustomized.total} successful
            </div>
          </div>
        </div>
        {metrics.customizationImpact.customized.total >= 5 && (
          <div style={{ 
            marginTop: "16px", 
            padding: "12px", 
            background: parseFloat(metrics.customizationSuccessRate) > parseFloat(metrics.nonCustomizationSuccessRate) ? "#e8f5e9" : "#fff3e0",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#333"
          }}>
            <strong>Analysis:</strong> Customized applications are{' '}
            {parseFloat(metrics.customizationSuccessRate) > parseFloat(metrics.nonCustomizationSuccessRate) 
              ? `${(parseFloat(metrics.customizationSuccessRate) - parseFloat(metrics.nonCustomizationSuccessRate)).toFixed(1)}% more successful. Continue investing time in personalization!`
              : `performing ${(parseFloat(metrics.nonCustomizationSuccessRate) - parseFloat(metrics.customizationSuccessRate)).toFixed(1)}% worse. Consider quality over quantity.`
            }
          </div>
        )}
      </div>

      {/* Company Size Analysis */}
      <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
          🏢 Success Rate by Company Size
        </h3>
        {metrics.companySizeSuccessRates.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {metrics.companySizeSuccessRates.map((company, idx) => (
              <div key={company.size} style={{ 
                padding: "16px", 
                background: "#f9f9f9", 
                borderRadius: "8px",
                borderLeft: `4px solid ${idx === 0 ? '#ff5722' : '#ff7043'}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                      {idx === 0 ? '🏆 ' : ''}{company.size}
                    </span>
                    <span style={{ fontSize: "13px", color: "#666", marginLeft: "8px" }}>
                      ({company.successful}/{company.total} applications)
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: "20px", 
                    fontWeight: "bold", 
                    color: idx === 0 ? '#ff5722' : '#ff7043' 
                  }}>
                    {company.successRate}%
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${company.successRate}%`,
                    height: "100%",
                    background: idx === 0 ? '#ff5722' : '#ff7043',
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
            Add company size information to jobs to see this analysis
          </div>
        )}
      </div>

      {/* Optimal Application Timing */}
      <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
          ⏰ Optimal Application Timing
        </h3>
        {metrics.bestApplicationDays.length > 0 ? (
          <>
            <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
              {metrics.bestApplicationDays.slice(0, 3).map((day, idx) => (
                <div key={day.day} style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "12px",
                  background: idx === 0 ? "#e8f5e9" : "#f5f5f5",
                  borderRadius: "6px",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: "15px", fontWeight: "600" }}>
                    {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : '🥉 '}{day.day}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: idx === 0 ? "#4caf50" : "#666" }}>
                      {day.successRate}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {day.total} applications
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px", background: "#e3f2fd", borderRadius: "6px", fontSize: "13px" }}>
              💡 <strong>Recommendation:</strong> Based on your data, {metrics.bestApplicationDays[0].day} is your most successful application day.
              {metrics.bestApplicationDays[0].total < 10 && " (Limited data - continue tracking for better insights)"}
            </div>
          </>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
            Need at least 3 applications per day for timing analysis
          </div>
        )}
      </div>

      {/* Success by Role Type */}
      <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
          💼 Success Rate by Role Level
        </h3>
        {metrics.roleTypeSuccessRates.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {metrics.roleTypeSuccessRates.map((role, idx) => (
              <div key={role.role} style={{ 
                padding: "16px", 
                background: "#f9f9f9", 
                borderRadius: "8px",
                borderLeft: `4px solid ${idx === 0 ? '#9c27b0' : '#673ab7'}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                      {role.role}
                    </span>
                    <span style={{ fontSize: "13px", color: "#666", marginLeft: "8px" }}>
                      ({role.successful}/{role.total} applications)
                    </span>
                  </div>
                  <span style={{ fontSize: "20px", fontWeight: "bold", color: "#9c27b0" }}>
                    {role.successRate}%
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${role.successRate}%`,
                    height: "100%",
                    background: idx === 0 ? '#9c27b0' : '#673ab7',
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
            Add more applications to analyze role-level success patterns
          </div>
        )}
      </div>

      {/* A/B Test Results - UC-119 */}
      {materialData && materialData.ab_tests && (materialData.ab_tests.resume_tests?.length > 0 || materialData.ab_tests.cover_letter_tests?.length > 0) && (
        <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
            🧪 A/B Test Results
          </h3>
          {materialData.ab_tests.resume_tests?.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "15px", color: "#666", marginBottom: "12px" }}>Resume Versions</h4>
              {materialData.ab_tests.resume_tests.map((test, idx) => (
                <div key={idx} style={{
                  padding: "16px",
                  background: test.is_significant ? "#e8f5e9" : "#f5f5f5",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  borderLeft: test.is_significant ? "4px solid #4caf50" : "4px solid #9e9e9e"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                        {test.variant_a} vs {test.variant_b}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        Sample sizes: {test.sample_sizes.variant_a} vs {test.sample_sizes.variant_b} applications
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: test.is_significant ? "#4caf50" : "#9e9e9e",
                      color: "white"
                    }}>
                      {test.is_significant ? `${test.confidence.toUpperCase()} CONFIDENCE` : "NOT SIGNIFICANT"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
                    <div style={{ textAlign: "center", padding: "8px", background: "white", borderRadius: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#666" }}>Winner</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: test.is_significant ? "#4caf50" : "#666" }}>
                        {test.winner}
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "white", borderRadius: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#666" }}>Difference</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: test.difference > 0 ? "#4caf50" : "#ff5722" }}>
                        {test.difference > 0 ? "+" : ""}{test.difference}%
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "white", borderRadius: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#666" }}>Z-Score</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                        {test.z_score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {materialData.ab_tests.cover_letter_tests?.length > 0 && (
            <div>
              <h4 style={{ fontSize: "15px", color: "#666", marginBottom: "12px" }}>Cover Letter Versions</h4>
              {materialData.ab_tests.cover_letter_tests.map((test, idx) => (
                <div key={idx} style={{
                  padding: "16px",
                  background: test.is_significant ? "#fff3e0" : "#f5f5f5",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  borderLeft: test.is_significant ? "4px solid #ff9800" : "4px solid #9e9e9e"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                        {test.variant_a} vs {test.variant_b}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        Sample sizes: {test.sample_sizes.variant_a} vs {test.sample_sizes.variant_b} applications
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: test.is_significant ? "#ff9800" : "#9e9e9e",
                      color: "white"
                    }}>
                      {test.is_significant ? `${test.confidence.toUpperCase()} CONFIDENCE` : "NOT SIGNIFICANT"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
                    <div style={{ textAlign: "center", padding: "8px", background: "white", borderRadius: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#666" }}>Winner</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: test.is_significant ? "#ff9800" : "#666" }}>
                        {test.winner}
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "white", borderRadius: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#666" }}>Difference</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: test.difference > 0 ? "#ff9800" : "#ff5722" }}>
                        {test.difference > 0 ? "+" : ""}{test.difference}%
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px", background: "white", borderRadius: "4px" }}>
                      <div style={{ fontSize: "11px", color: "#666" }}>Z-Score</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                        {test.z_score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: "16px", padding: "12px", background: "#e3f2fd", borderRadius: "6px", fontSize: "12px" }}>
            📊 <strong>About A/B Testing:</strong> Results with "HIGH" or "MEDIUM" confidence indicate statistically significant differences.
            Z-scores above 1.96 indicate 95% confidence that the difference is real, not random.
          </div>
        </div>
      )}

      {/* Trend Visualization - UC-119 */}
      {metrics.trendsData && metrics.trendsData.trends?.length > 0 && (
        <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
            📈 Success Rate Trends Over Time
          </h3>
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              padding: "8px 16px",
              borderRadius: "20px",
              background: metrics.trendsData.trend_direction === "improving" ? "#e8f5e9" :
                          metrics.trendsData.trend_direction === "declining" ? "#ffebee" : "#f5f5f5",
              color: metrics.trendsData.trend_direction === "improving" ? "#2e7d32" :
                     metrics.trendsData.trend_direction === "declining" ? "#c62828" : "#666",
              fontSize: "13px",
              fontWeight: "600"
            }}>
              {metrics.trendsData.trend_direction === "improving" ? "📈 Improving" :
               metrics.trendsData.trend_direction === "declining" ? "📉 Declining" :
               metrics.trendsData.trend_direction === "stable" ? "➡️ Stable" : "⏳ Insufficient Data"}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {metrics.trendsData.total_applications} applications over {metrics.trendsData.weeks_analyzed} weeks
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "8px", minWidth: "600px", paddingBottom: "8px" }}>
              {metrics.trendsData.trends.map((week, idx) => (
                <div key={idx} style={{ flex: 1, minWidth: "80px" }}>
                  <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", textAlign: "center" }}>
                    {week.week}
                  </div>
                  <div style={{ position: "relative", height: "120px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      width: "100%",
                      height: `${week.response_rate}%`,
                      background: "linear-gradient(to top, #4caf50, #81c784)",
                      transition: "height 0.3s ease"
                    }} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#4caf50", marginTop: "4px", textAlign: "center" }}>
                    {week.response_rate}%
                  </div>
                  <div style={{ fontSize: "10px", color: "#999", textAlign: "center" }}>
                    {week.applications} apps
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Avg Response Rate</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4caf50" }}>
                {(metrics.trendsData.trends.reduce((sum, t) => sum + t.response_rate, 0) / metrics.trendsData.trends.length).toFixed(1)}%
              </div>
            </div>
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Avg Interview Rate</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2196f3" }}>
                {(metrics.trendsData.trends.reduce((sum, t) => sum + t.interview_rate, 0) / metrics.trendsData.trends.length).toFixed(1)}%
              </div>
            </div>
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Avg Offer Rate</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#9c27b0" }}>
                {(metrics.trendsData.trends.reduce((sum, t) => sum + t.offer_rate, 0) / metrics.trendsData.trends.length).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Recommendations - UC-119 */}
      {metrics.combinedRecommendations && metrics.combinedRecommendations.length > 0 && (
        <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
            💡 Actionable Recommendations
          </h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {metrics.combinedRecommendations.slice(0, 5).map((rec, idx) => (
              <div key={idx} style={{
                padding: "16px",
                background: rec.priority === "high" ? "#e8f5e9" :
                           rec.priority === "medium" ? "#fff3e0" : "#f5f5f5",
                borderRadius: "8px",
                borderLeft: `4px solid ${rec.priority === "high" ? "#4caf50" :
                                          rec.priority === "medium" ? "#ff9800" : "#9e9e9e"}`
              }}>
                <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <div style={{
                    minWidth: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: rec.priority === "high" ? "#4caf50" :
                               rec.priority === "medium" ? "#ff9800" : "#9e9e9e",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                      {rec.message}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", display: "flex", gap: "8px", marginTop: "8px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: "white",
                        fontSize: "10px",
                        fontWeight: "600"
                      }}>
                        {rec.type}
                      </span>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: rec.confidence === "high" ? "#4caf50" :
                                   rec.confidence === "medium" ? "#ff9800" : "#9e9e9e",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "600"
                      }}>
                        {rec.confidence} confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistical Significance Notice */}
      <div style={{
        background: "white",
        padding: "20px",
        marginTop: "1px",
        borderRadius: "0 0 8px 8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          padding: "16px", 
          background: "#fff8e1", 
          borderRadius: "8px",
          borderLeft: "4px solid #ffc107"
        }}>
          <h4 style={{ marginTop: 0, fontSize: "15px", color: "#f57c00", marginBottom: "8px" }}>
            📊 About Statistical Significance
          </h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
            Insights shown above only include patterns with sufficient data (typically 3+ data points per category).
            As you add more applications, these analyses become more accurate and reliable.
            Recommendations marked "High Confidence" are based on 10+ data points with strong statistical patterns.
          </p>
        </div>
      </div>
    </div>
  );
}