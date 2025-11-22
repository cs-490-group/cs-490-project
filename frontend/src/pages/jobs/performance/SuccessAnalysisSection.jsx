import React from "react";

export default function SuccessAnalysisSection({ metrics }) {
  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ 
        background: "linear-gradient(135deg, #00897b 0%, #00695c 100%)", 
        padding: "20px", 
        borderRadius: "8px 8px 0 0",
        color: "white"
      }}>
        <h2 style={{ margin: 0, fontSize: "24px" }}>📊 Application Success Rate Analysis</h2>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
          Comprehensive analysis of what factors contribute to your application success
        </p>
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