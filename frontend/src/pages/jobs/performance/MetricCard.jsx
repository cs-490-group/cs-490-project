import React from "react";

export default function MetricCard({ title, value, subtitle, trend, color = "#4f8ef7", icon, benchmark }) {
  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${color}`,
      position: "relative"
    }}>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: "36px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
          {subtitle}
        </div>
      )}
      {trend && (
        <div style={{ 
          fontSize: "12px", 
          color: trend > 0 ? "#4caf50" : trend < 0 ? "#f44336" : "#666",
          fontWeight: "600"
        }}>
          {trend > 0 ? "↗" : trend < 0 ? "↘" : "→"} {Math.abs(trend)}% vs last period
        </div>
      )}
      {benchmark !== undefined && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "11px",
          padding: "4px 8px",
          borderRadius: "4px",
          background: parseFloat(value) >= benchmark ? "#e8f5e9" : "#fff3e0",
          color: parseFloat(value) >= benchmark ? "#2e7d32" : "#e65100"
        }}>
          Benchmark: {benchmark}%
        </div>
      )}
    </div>
  );
}