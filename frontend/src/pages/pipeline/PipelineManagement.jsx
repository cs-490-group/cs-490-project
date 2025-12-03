import React, { useState } from 'react';

// Import sub-components (these would be separate files)
 import WorkflowAutomation from './WorkflowAutomation';
 import AnalyticsDashboard from './AnalyticsDashboard';
 import StatusMonitoring from './StatusMonitoring';
// import InterviewScheduling from './InterviewScheduling';

// Placeholder components for demonstration
//const WorkflowAutomation = () => <div style={{ padding: '20px' }}><h3>Workflow Automation Component</h3></div>;
//const AnalyticsDashboard = () => <div style={{ padding: '20px' }}><h3>Analytics Dashboard Component</h3></div>;
//const StatusMonitoring = () => <div style={{ padding: '20px' }}><h3>Status Monitoring Component</h3></div>;
const InterviewScheduling = () => <div style={{ padding: '20px' }}><h3>Interview Scheduling Component</h3></div>;

export default function PipelineManagement() {
  const [activeView, setActiveView] = useState('workflow');

  const views = [
    { id: 'workflow', icon: '🔄', label: 'Workflow Automation', component: WorkflowAutomation },
    { id: 'status', icon: '📍', label: 'Status Monitoring', component: StatusMonitoring },
    { id: 'interview', icon: '📅', label: 'Interview Scheduling', component: InterviewScheduling },
    { id: 'analytics', icon: '📊', label: 'Analytics Dashboard', component: AnalyticsDashboard }
  ];

  const ActiveComponent = views.find(v => v.id === activeView)?.component || WorkflowAutomation;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{
          color: 'white',
          textAlign: 'center',
          marginBottom: '32px',
          fontSize: '42px',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Application Pipeline Management
        </h1>

        {/* Navigation Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '8px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeView !== view.id) {
                  e.currentTarget.style.background = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== view.id) {
                  e.currentTarget.style.background = 'transparent';
                }
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
          overflow: 'hidden'
        }}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}