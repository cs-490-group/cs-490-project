import React from "react";

export default function FunnelChart({ metrics }) {
  const stages = [
    { label: "Interested", count: metrics.interested, color: "#9e9e9e" },
    { label: "Applied", count: metrics.applied, color: "#2196f3" },
    { label: "Screening", count: metrics.screening, color: "#ff9800" },
    { label: "Interview", count: metrics.interview, color: "#ff5722" },
    { label: "Offer", count: metrics.offer, color: "#4caf50" }
  ];
  
  const maxCount = Math.max(...stages.map(s => s.count));
  
  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎯 Job Search Funnel</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
        {stages.map((stage, idx) => {
          const width = maxCount > 0 ? (stage.count / maxCount * 100) : 0;
          const conversionFromPrev = idx > 0 && stages[idx - 1].count > 0
            ? ((stage.count / stages[idx - 1].count) * 100).toFixed(1)
            : 100;
          
          return (
            <div key={stage.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                  {stage.label}
                </span>
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {stage.count} {idx > 0 && `(${conversionFromPrev}%)`}
                </span>
              </div>
              <div style={{
                width: "100%",
                height: "32px",
                background: "#f5f5f5",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${width}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "14px",
                  minWidth: stage.count > 0 ? "40px" : "0"
                }}>
                  {stage.count > 0 && stage.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}