// PipelineManagement.jsx
import React, { useState } from "react";
import WorkflowAutomation from "./WorkflowAutomation";
import StatusMonitoring from "./StatusMonitoring";
import InterviewScheduling from "./InterviewScheduling";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default function PipelineManagement() {
  const [activeView, setActiveView] = useState("workflow");

  const views = [
    { id: "workflow", icon: "🔄", label: "Workflow Automation", component: WorkflowAutomation },
    { id: "status", icon: "📍", label: "Status Monitoring", component: StatusMonitoring },
    { id: "interview", icon: "📅", label: "Interview Scheduling", component: InterviewScheduling },
    { id: "analytics", icon: "📊", label: "Analytics Dashboard", component: AnalyticsDashboard }
  ];

  const ActiveComponent = views.find(v => v.id === activeView)?.component || WorkflowAutomation;

  return (
    <div style={{
      minHeight: "100vh",
      padding: "20px",
    }}>
      {/* Header */}
      <div style={{ display: "inline-block", textAlign: "center", marginBottom: "32px", width: "100%" }}>
        <h1 style={{
          margin: 0,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "2.5rem",
          fontFamily: '"Playfair Display", serif',
          WebkitTextFillColor: "#ffffff",
        }}>
          Application Pipeline Management
        </h1>
        <div style={{
          width: "160px",
          height: "4px",
          margin: "6px auto 0",
          borderRadius: "2px",
          background: "linear-gradient(90deg, #00c28a, #005e9e)"
        }} />
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '8px',
        width: "100%"
      }}>
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            style={{
              padding: '16px 24px',
              background: activeView === view.id
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'transparent',
              color: activeView === view.id ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: "100%"
            }}
            onMouseEnter={(e) => {
              if (activeView !== view.id) e.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              if (activeView !== view.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '20px' }}>{view.icon}</span>
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minHeight: '600px',
        overflow: 'hidden',
        width: "100%",
        padding: "20px"
      }}>
        <ActiveComponent />
      </div>
    </div>
  );
}