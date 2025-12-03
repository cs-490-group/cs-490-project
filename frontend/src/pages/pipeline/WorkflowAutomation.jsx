import React, { useState, useEffect } from 'react';
import ApplicationWorkflowAPI from '../../api/applicationWorkflow';
import ResumesAPI from '../../api/resumes';
import CoverLetterAPI from '../../api/coverLetters';

export default function WorkflowAutomation() {
  const [packages, setPackages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // For package creation - need resume/cover letter lists
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);

  useEffect(() => {
    loadData();
    loadMaterials();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packagesRes, schedulesRes, templatesRes, rulesRes] = await Promise.all([
        ApplicationWorkflowAPI.getPackages(),
        ApplicationWorkflowAPI.getScheduledApplications(),
        ApplicationWorkflowAPI.getTemplates(),
        ApplicationWorkflowAPI.getAutomationRules()
      ]);
      setPackages(packagesRes.data || []);
      setSchedules(schedulesRes.data || []);
      setTemplates(templatesRes.data || []);
      setRules(rulesRes.data || []);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const [resumesRes, coverLettersRes] = await Promise.all([
        ResumesAPI.getAll(),
        CoverLetterAPI.getAll()
      ]);
      setResumes(resumesRes.data || []);
      setCoverLetters(coverLettersRes.data || []);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f0f0f0',
          borderTop: '4px solid #4f8ef7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>Loading workflow data...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'packages', label: 'Packages', icon: '📦', data: packages },
    { id: 'schedules', label: 'Schedules', icon: '📅', data: schedules },
    { id: 'templates', label: 'Templates', icon: '📝', data: templates },
    { id: 'rules', label: 'Automation Rules', icon: '⚙️', data: rules }
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#333', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          🔄 Workflow Automation
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            background: '#4f8ef7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          + Create New
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        marginBottom: '24px',
        borderBottom: '2px solid #eee',
        display: 'flex',
        gap: '0',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #4f8ef7' : '3px solid transparent',
              color: activeTab === tab.id ? '#4f8ef7' : '#666',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={{
              marginLeft: '4px',
              padding: '2px 8px',
              background: activeTab === tab.id ? '#4f8ef7' : '#e0e0e0',
              color: activeTab === tab.id ? 'white' : '#666',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {tab.data.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'packages' && <PackagesTab packages={packages} />}
        {activeTab === 'schedules' && <SchedulesTab schedules={schedules} />}
        {activeTab === 'templates' && <TemplatesTab templates={templates} />}
        {activeTab === 'rules' && <RulesTab rules={rules} />}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateModal
          activeTab={activeTab}
          onClose={() => setShowCreateModal(false)}
          onSave={(data) => {
            console.log('Creating new item:', data);
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Packages Tab
const PackagesTab = ({ packages }) => (
  <div>
    <div style={{
      background: '#f8f9fa',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e0e0e0'
    }}>
      <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
        📦 <strong>Application packages</strong> bundle your resume, cover letter, and portfolio items for quick, consistent submissions across multiple applications.
      </p>
    </div>

    {packages.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#999'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No application packages yet</p>
        <p style={{ fontSize: '14px' }}>Create a package to bundle your materials for quick submissions</p>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {packages.map(pkg => (
          <PackageCard key={pkg._id} package={pkg} />
        ))}
      </div>
    )}
  </div>
);

const PackageCard = ({ package: pkg }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    e.currentTarget.style.transform = 'translateY(0)';
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '12px'
    }}>
      <h4 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
        {pkg.name || 'Untitled Package'}
      </h4>
      <span style={{
        padding: '4px 10px',
        background: pkg.status === 'ready' ? '#d4edda' : pkg.status === 'sent' ? '#cce5ff' : '#fff3cd',
        color: pkg.status === 'ready' ? '#155724' : pkg.status === 'sent' ? '#004085' : '#856404',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {pkg.status}
      </span>
    </div>

    <p style={{
      color: '#666',
      fontSize: '14px',
      marginBottom: '16px',
      lineHeight: '1.5'
    }}>
      {pkg.description || 'No description provided'}
    </p>

    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '16px',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    }}>
      {pkg.resume_id && (
        <div style={{ fontSize: '13px', color: '#4f8ef7', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📄</span> Resume attached
        </div>
      )}
      {pkg.cover_letter_id && (
        <div style={{ fontSize: '13px', color: '#4f8ef7', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✉️</span> Cover letter attached
        </div>
      )}
      {pkg.portfolio_ids?.length > 0 && (
        <div style={{ fontSize: '13px', color: '#4f8ef7', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🎨</span> {pkg.portfolio_ids.length} portfolio item{pkg.portfolio_ids.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>

    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    }}>
      <span style={{ fontSize: '12px', color: '#999' }}>
        Used {pkg.usage_count || 0} time{pkg.usage_count !== 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{
          padding: '6px 12px',
          background: '#4f8ef7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: '600'
        }}>
          Edit
        </button>
        <button style={{
          padding: '6px 12px',
          background: '#f0f0f0',
          color: '#666',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: '600'
        }}>
          Use
        </button>
      </div>
    </div>
  </div>
);

// Schedules Tab
const SchedulesTab = ({ schedules }) => (
  <div>
    <div style={{
      background: '#fff3cd',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #ffc107'
    }}>
      <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
        📅 <strong>Schedule applications</strong> to be submitted at optimal times and set up automatic follow-up reminders.
      </p>
    </div>

    {schedules.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#999'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No scheduled applications</p>
        <p style={{ fontSize: '14px' }}>Schedule applications to automate your submission process</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schedules.map(schedule => (
          <ScheduleCard key={schedule._id} schedule={schedule} />
        ))}
      </div>
    )}
  </div>
);

const ScheduleCard = ({ schedule }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <div style={{ flex: 1 }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>
        📅 {new Date(schedule.scheduled_time).toLocaleString()}
      </h4>
      <p style={{ color: '#666', fontSize: '14px', margin: '0 0 4px 0' }}>
        Method: <strong>{schedule.submission_method}</strong>
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <span style={{
          padding: '4px 10px',
          background: schedule.status === 'scheduled' ? '#e3f2fd' : schedule.status === 'sent' ? '#d4edda' : '#f8d7da',
          color: schedule.status === 'scheduled' ? '#1976d2' : schedule.status === 'sent' ? '#155724' : '#721c24',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {schedule.status}
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button style={{
        padding: '8px 16px',
        background: '#f0f0f0',
        color: '#666',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px'
      }}>
        Edit
      </button>
      <button style={{
        padding: '8px 16px',
        background: '#ff3b30',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px'
      }}>
        Cancel
      </button>
    </div>
  </div>
);

// Templates Tab
const TemplatesTab = ({ templates }) => (
  <div>
    <div style={{
      background: '#e3f2fd',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #2196f3'
    }}>
      <p style={{ color: '#1976d2', margin: 0, fontSize: '14px' }}>
        📝 <strong>Response templates</strong> save you time by storing pre-written answers to common application questions and screening queries.
      </p>
    </div>

    {templates.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#999'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No templates yet</p>
        <p style={{ fontSize: '14px' }}>Create templates for screening questions to speed up applications</p>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {templates.map(template => (
          <TemplateCard key={template._id} template={template} />
        ))}
      </div>
    )}
  </div>
);

const TemplateCard = ({ template }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '12px'
    }}>
      <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>{template.name}</h4>
      {template.is_default && (
        <span style={{
          padding: '4px 10px',
          background: '#e3f2fd',
          color: '#1976d2',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          DEFAULT
        </span>
      )}
    </div>
    <p style={{ color: '#999', fontSize: '12px', marginBottom: '12px' }}>
      Category: <strong>{template.category}</strong>
    </p>
    <p style={{
      color: '#666',
      fontSize: '14px',
      marginBottom: '12px',
      lineHeight: '1.5',
      maxHeight: '60px',
      overflow: 'hidden'
    }}>
      {template.content.substring(0, 120)}...
    </p>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    }}>
      <span style={{ fontSize: '12px', color: '#999' }}>
        Used {template.usage_count || 0} times
      </span>
      <button style={{
        padding: '6px 12px',
        background: '#4f8ef7',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        fontWeight: '600'
      }}>
        Use Template
      </button>
    </div>
  </div>
);

// Rules Tab
const RulesTab = ({ rules }) => (
  <div>
    <div style={{
      background: '#f3e5f5',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #9c27b0'
    }}>
      <p style={{ color: '#7b1fa2', margin: 0, fontSize: '14px' }}>
        ⚙️ <strong>Automation rules</strong> trigger actions automatically based on status changes, deadlines, or custom conditions.
      </p>
    </div>

    {rules.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#999'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No automation rules</p>
        <p style={{ fontSize: '14px' }}>Create rules to automate your workflow processes</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rules.map(rule => (
          <RuleCard key={rule._id} rule={rule} />
        ))}
      </div>
    )}
  </div>
);

const RuleCard = ({ rule }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <div style={{ flex: 1 }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>{rule.name}</h4>
      <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>
        {rule.description || 'No description'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: '#999' }}>
          Trigger: <strong>{rule.trigger_type}</strong>
        </span>
        <span style={{ fontSize: '12px', color: '#999' }}>
          Priority: <strong>{rule.priority}</strong>
        </span>
        <span style={{ fontSize: '12px', color: '#999' }}>
          Executed: <strong>{rule.execution_count || 0}</strong> times
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <span style={{
        padding: '6px 12px',
        background: rule.enabled ? '#d4edda' : '#f8d7da',
        color: rule.enabled ? '#155724' : '#721c24',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {rule.enabled ? '✓ Enabled' : '✗ Disabled'}
      </span>
      <button style={{
        padding: '8px 16px',
        background: '#4f8ef7',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px'
      }}>
        Edit
      </button>
    </div>
  </div>
);

// Create Modal Component
const CreateModal = ({ activeTab, onClose, onSave }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}
  onClick={onClose}>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
    }}
    onClick={(e) => e.stopPropagation()}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
        Create New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
      </h3>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Form fields for creating a new {activeTab.slice(0, -1)} would go here.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#f0f0f0',
            color: '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({})}
          style={{
            padding: '10px 20px',
            background: '#4f8ef7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Create
        </button>
      </div>
    </div>
  </div>
);