import React, { useState, useEffect } from 'react';
import ApplicationWorkflowAPI from '../../api/applicationWorkflow';
import ResumesAPI from '../../api/resumes';
import CoverLetterAPI from '../../api/coverLetters';
import api from '../../api/base'; // used for raw file uploads

export default function WorkflowAutomation() {
  const [packages, setPackages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);

  // modal state: create vs edit, and which item
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null); // object with _id, etc.

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

  // ----------------- Handlers for CRUD -----------------

  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setShowCreateModal(true);
  };

  const handleEdit = (tab, item) => {
    setActiveTab(tab);
    setModalMode('edit');
    setEditingItem(item);
    setShowCreateModal(true);
  };

  const handleDelete = async (tab, id) => {
    try {
      if (tab === 'packages') {
        await ApplicationWorkflowAPI.deletePackage(id);
      } else if (tab === 'schedules') {
        // "Delete" = cancel schedule
        await ApplicationWorkflowAPI.cancelSchedule(id, 'Cancelled from UI');
      } else if (tab === 'templates') {
        await ApplicationWorkflowAPI.deleteTemplate(id);
      } else if (tab === 'rules') {
        await ApplicationWorkflowAPI.deleteAutomationRule(id);
      }
      await loadData();
    } catch (err) {
      console.error(`Failed to delete ${tab.slice(0, -1)}:`, err);
    }
  };

  const handlePackageUse = async (id) => {
  try {
    await ApplicationWorkflowAPI.actions.usePackage(id);
    await loadData();
  } catch (err) {
    console.error("Failed to use package:", err);
  }
};

  const handleTemplateUse = async (id) => {
  try {
    await ApplicationWorkflowAPI.actions.useTemplate(id);
    await loadData();
  } catch (err) {
    console.error("Failed to use template:", err);
  }
};


  const handleToggleRuleEnabled = async (rule) => {
    try {
      await ApplicationWorkflowAPI.toggleAutomationRule(rule._id, !rule.enabled);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleModalSaved = async () => {
    setShowCreateModal(false);
    setEditingItem(null);
    setModalMode('create');
    await loadData();
    await loadMaterials();
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
          onClick={openCreateModal}
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
        {activeTab === 'packages' && (
          <PackagesTab
            packages={packages}
            onEdit={(item) => handleEdit('packages', item)}
            onDelete={(id) => handleDelete('packages', id)}
            onUse={handlePackageUse}
          />
        )}
        {activeTab === 'schedules' && (
          <SchedulesTab
            schedules={schedules}
            onEdit={(item) => handleEdit('schedules', item)}
            onDelete={(id) => handleDelete('schedules', id)}
          />
        )}
        {activeTab === 'templates' && (
          <TemplatesTab
            templates={templates}
            onEdit={(item) => handleEdit('templates', item)}
            onDelete={(id) => handleDelete('templates', id)}
            onUse={handleTemplateUse}
          />
        )}
        {activeTab === 'rules' && (
          <RulesTab
            rules={rules}
            onEdit={(item) => handleEdit('rules', item)}
            onDelete={(id) => handleDelete('rules', id)}
            onToggleEnabled={handleToggleRuleEnabled}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <CreateModal
          activeTab={activeTab}
          mode={modalMode}
          editingItem={editingItem}
          resumes={resumes}
          coverLetters={coverLetters}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
            setModalMode('create');
          }}
          onSaved={handleModalSaved}
          reloadMaterials={loadMaterials}
        />
      )}
    </div>
  );
}

/* -----------------------------------------------------------
   PACKAGES TAB
----------------------------------------------------------- */

const PackagesTab = ({ packages, onEdit, onDelete, onUse }) => (
  <div>
    <div style={{
      background: '#f8f9fa',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e0e0e0'
    }}>
      <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
        📦 <strong>Application packages</strong> bundle your resume, cover letter,
        and portfolio items for quick, consistent submissions across applications.
      </p>
    </div>

    {packages.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No application packages yet</p>
        <p style={{ fontSize: '14px' }}>Create a package to bundle your materials</p>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {packages.map(pkg => (
          <PackageCard
            key={pkg._id}
            pkg={pkg}
            onEdit={onEdit}
            onDelete={onDelete}
            onUse={onUse}
          />
        ))}
      </div>
    )}
  </div>
);

const PackageCard = ({ pkg, onEdit, onDelete, onUse }) => (
  <div
    style={{
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
    }}
  >
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
        background: pkg.status === 'ready'
          ? '#d4edda'
          : pkg.status === 'sent'
          ? '#cce5ff'
          : '#fff3cd',
        color: pkg.status === 'ready'
          ? '#155724'
          : pkg.status === 'sent'
          ? '#004085'
          : '#856404',
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
        <button
          style={{
            padding: '6px 12px',
            background: '#4f8ef7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => onEdit(pkg)}
        >
          Edit
        </button>
        <button
          style={{
            padding: '6px 12px',
            background: '#f0f0f0',
            color: '#666',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => onUse(pkg._id)}
        >
          Use
        </button>
        <button
          style={{
            padding: '6px 12px',
            background: '#ffe5e5',
            color: '#b00020',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => onDelete(pkg._id)}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* -----------------------------------------------------------
   SCHEDULES TAB
----------------------------------------------------------- */

const SchedulesTab = ({ schedules, onEdit, onDelete }) => (
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
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No scheduled applications</p>
        <p style={{ fontSize: '14px' }}>Schedule applications to automate your submission process</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schedules.map(schedule => (
          <ScheduleCard
            key={schedule._id}
            schedule={schedule}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )}
  </div>
);

const ScheduleCard = ({ schedule, onEdit, onDelete }) => (
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
          background: schedule.status === 'scheduled'
            ? '#e3f2fd'
            : schedule.status === 'sent'
            ? '#d4edda'
            : '#f8d7da',
          color: schedule.status === 'scheduled'
            ? '#1976d2'
            : schedule.status === 'sent'
            ? '#155724'
            : '#721c24',
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
      <button
        style={{
          padding: '8px 16px',
          background: '#f0f0f0',
          color: '#666',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px'
        }}
        onClick={() => onEdit(schedule)}
      >
        Edit
      </button>
      <button
        style={{
          padding: '8px 16px',
          background: '#ff3b30',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px'
        }}
        onClick={() => onDelete(schedule._id)}
      >
        Cancel
      </button>
    </div>
  </div>
);

/* -----------------------------------------------------------
   TEMPLATES TAB
----------------------------------------------------------- */

const TemplatesTab = ({ templates, onEdit, onDelete, onUse }) => (
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
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
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
          <TemplateCard
            key={template._id}
            template={template}
            onEdit={onEdit}
            onDelete={onDelete}
            onUse={onUse}
          />
        ))}
      </div>
    )}
  </div>
);

const TemplateCard = ({ template, onEdit, onDelete, onUse }) => (
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
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          style={{
            padding: '6px 12px',
            background: '#f0f0f0',
            color: '#666',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => onEdit(template)}
        >
          Edit
        </button>
        <button
          style={{
            padding: '6px 12px',
            background: '#4f8ef7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => onUse(template._id)}
        >
          Use Template
        </button>
        <button
          style={{
            padding: '6px 12px',
            background: '#ffe5e5',
            color: '#b00020',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => onDelete(template._id)}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* -----------------------------------------------------------
   RULES TAB
----------------------------------------------------------- */

const RulesTab = ({ rules, onEdit, onDelete, onToggleEnabled }) => (
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
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No automation rules</p>
        <p style={{ fontSize: '14px' }}>Create rules to automate your workflow processes</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rules.map(rule => (
          <RuleCard
            key={rule._id}
            rule={rule}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleEnabled={onToggleEnabled}
          />
        ))}
      </div>
    )}
  </div>
);

const RuleCard = ({ rule, onEdit, onDelete, onToggleEnabled }) => (
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
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
      <span
        style={{
          padding: '6px 12px',
          background: rule.enabled ? '#d4edda' : '#f8d7da',
          color: rule.enabled ? '#155724' : '#721c24',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
        onClick={() => onToggleEnabled(rule)}
      >
        {rule.enabled ? '✓ Enabled' : '✗ Disabled'}
      </span>
      <button
        style={{
          padding: '8px 16px',
          background: '#4f8ef7',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px'
        }}
        onClick={() => onEdit(rule)}
      >
        Edit
      </button>
      <button
        style={{
          padding: '8px 16px',
          background: '#ffe5e5',
          color: '#b00020',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px'
        }}
        onClick={() => onDelete(rule._id)}
      >
        Delete
      </button>
    </div>
  </div>
);

/* -----------------------------------------------------------
   CREATE / EDIT MODAL (shared for all tabs)
----------------------------------------------------------- */

const CreateModal = ({
  activeTab,
  mode,           // 'create' | 'edit'
  editingItem,    // object or null
  resumes,
  coverLetters,
  onClose,
  onSaved,
  reloadMaterials
}) => {
  const [form, setForm] = useState({
    // common
    name: '',
    description: '',

    // packages
    resume_id: '',
    cover_letter_id: '',
    portfolio_ids_text: '',

    // schedules
    submission_method: '',
    scheduled_time_local: '',

    // templates
    template_category: 'general',
    template_content: '',

    // rules
    rule_trigger_type: 'status_change',
    rule_priority: 1,
    rule_enabled: true
  });

  // Pre-fill for EDIT mode
  useEffect(() => {
    if (mode === 'edit' && editingItem) {
      if (activeTab === 'packages') {
        setForm(prev => ({
          ...prev,
          name: editingItem.name || '',
          description: editingItem.description || '',
          resume_id: editingItem.resume_id || '',
          cover_letter_id: editingItem.cover_letter_id || '',
          portfolio_ids_text: editingItem.portfolio_ids
            ? editingItem.portfolio_ids.join(',')
            : ''
        }));
      }

      if (activeTab === 'schedules') {
        setForm(prev => ({
          ...prev,
          submission_method: editingItem.submission_method || '',
          scheduled_time_local: editingItem.scheduled_time
            ? new Date(editingItem.scheduled_time).toISOString().slice(0, 16)
            : ''
        }));
      }

      if (activeTab === 'templates') {
        setForm(prev => ({
          ...prev,
          name: editingItem.name || '',
          template_category: editingItem.category || 'general',
          template_content: editingItem.content || ''
        }));
      }

      if (activeTab === 'rules') {
        setForm(prev => ({
          ...prev,
          name: editingItem.name || '',
          description: editingItem.description || '',
          rule_trigger_type: editingItem.trigger_type || 'status_change',
          rule_priority: editingItem.priority ?? 1,
          rule_enabled: Boolean(editingItem.enabled)
        }));
      }
    } else if (mode === 'create') {
      // Reset for create mode
      setForm({
        name: '',
        description: '',
        resume_id: '',
        cover_letter_id: '',
        portfolio_ids_text: '',
        submission_method: '',
        scheduled_time_local: '',
        template_category: 'general',
        template_content: '',
        rule_trigger_type: 'status_change',
        rule_priority: 1,
        rule_enabled: true
      });
    }
  }, [mode, editingItem, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // ------------- Upload from OS (Resume / Cover Letter) -------------

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const created = res.data || {};
      const newId = created._id || created.id;

      if (newId) {
        setForm(prev => ({ ...prev, resume_id: newId }));
      }
      if (reloadMaterials) {
        await reloadMaterials();
      }
    } catch (err) {
      console.error('Resume upload failed:', err);
    }
  };

  const handleCoverLetterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/cover-letters/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const created = res.data || {};
      const newId = created._id || created.id;

      if (newId) {
        setForm(prev => ({ ...prev, cover_letter_id: newId }));
      }
      if (reloadMaterials) {
        await reloadMaterials();
      }
    } catch (err) {
      console.error('Cover letter upload failed:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      // ---------------- PACKAGES ----------------
      if (activeTab === 'packages') {
        const payload = {
          name: form.name,
          description: form.description,
          resume_id: form.resume_id || undefined,
          cover_letter_id: form.cover_letter_id || undefined,
          portfolio_ids: form.portfolio_ids_text
            ? form.portfolio_ids_text.split(',').map(s => s.trim()).filter(Boolean)
            : []
        };

        if (mode === 'create') {
          await ApplicationWorkflowAPI.createPackage(payload);
        } else if (mode === 'edit' && editingItem?._id) {
          await ApplicationWorkflowAPI.updatePackage(editingItem._id, payload);
        }
      }

      // ---------------- SCHEDULES ----------------
      if (activeTab === 'schedules') {
        const scheduledISO = form.scheduled_time_local
          ? new Date(form.scheduled_time_local).toISOString()
          : new Date().toISOString();

        const payload = {
          submission_method: form.submission_method || 'Online portal',
          scheduled_time: scheduledISO
        };

        if (mode === 'create') {
          await ApplicationWorkflowAPI.scheduleApplication(payload);
        } else if (mode === 'edit' && editingItem?._id) {
          // Simplest: cancel old + create new with updated time/method
          await ApplicationWorkflowAPI.cancelSchedule(editingItem._id, 'Rescheduled via edit');
          await ApplicationWorkflowAPI.scheduleApplication(payload);
        }
      }

      // ---------------- TEMPLATES ----------------
      if (activeTab === 'templates') {
        const payload = {
          name: form.name,
          category: form.template_category || 'general',
          content: form.template_content
        };

        if (mode === 'create') {
          await ApplicationWorkflowAPI.createTemplate(payload);
        } else if (mode === 'edit' && editingItem?._id) {
          await ApplicationWorkflowAPI.updateTemplate(editingItem._id, payload);
        }
      }

      // ---------------- RULES ----------------
      if (activeTab === 'rules') {
        const payload = {
          name: form.name,
          description: form.description,
          trigger_type: form.rule_trigger_type,
          priority: Number(form.rule_priority) || 1,
          enabled: form.rule_enabled
        };

        if (mode === 'create') {
          await ApplicationWorkflowAPI.createAutomationRule(payload);
        } else if (mode === 'edit' && editingItem?._id) {
          await ApplicationWorkflowAPI.updateAutomationRule(editingItem._id, payload);
        }
      }

      await onSaved();
    } catch (err) {
      console.error('Create / update failed:', err);
    }
  };

  const singularMap = {
    packages: 'Package',
    schedules: 'Schedule',
    templates: 'Template',
    rules: 'Rule'
  };

  const title = `${mode === 'edit' ? 'Edit' : 'Create New'} ${singularMap[activeTab] || ''}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{title}</h3>

        {/* Fields vary by tab */}
        {activeTab === 'packages' && (
          <>
            <input
              name="name"
              placeholder="Package name"
              value={form.name}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10, minHeight: 60 }}
            />

            <label style={{ fontSize: 12, color: '#555' }}>Resume</label>
            <select
              name="resume_id"
              value={form.resume_id}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 8, padding: 10 }}
            >
              <option value="">(none)</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name || r.title || 'Untitled resume'}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              style={{ width: '100%', marginBottom: 10, padding: 4, fontSize: 12 }}
            />

            <label style={{ fontSize: 12, color: '#555' }}>Cover Letter</label>
            <select
              name="cover_letter_id"
              value={form.cover_letter_id}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 8, padding: 10 }}
            >
              <option value="">(none)</option>
              {coverLetters.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name || c.title || 'Untitled cover letter'}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCoverLetterUpload}
              style={{ width: '100%', marginBottom: 10, padding: 4, fontSize: 12 }}
            />

            <label style={{ fontSize: 12, color: '#555' }}>
              Portfolio IDs (comma separated)
            </label>
            <input
              name="portfolio_ids_text"
              placeholder="id1,id2,id3"
              value={form.portfolio_ids_text}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
          </>
        )}

        {activeTab === 'schedules' && (
          <>
            <input
              name="submission_method"
              placeholder="Submission method (e.g., LinkedIn, company portal)"
              value={form.submission_method}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
            <label style={{ fontSize: 12, color: '#555' }}>Scheduled time</label>
            <input
              type="datetime-local"
              name="scheduled_time_local"
              value={form.scheduled_time_local}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
          </>
        )}

        {activeTab === 'templates' && (
          <>
            <input
              name="name"
              placeholder="Template name"
              value={form.name}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
            <label style={{ fontSize: 12, color: '#555' }}>Category</label>
            <select
              name="template_category"
              value={form.template_category}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            >
              <option value="general">General</option>
              <option value="screening">Screening</option>
              <option value="follow_up">Follow-up</option>
              <option value="other">Other</option>
            </select>
            <textarea
              name="template_content"
              placeholder="Template content"
              value={form.template_content}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10, minHeight: 80 }}
            />
          </>
        )}

        {activeTab === 'rules' && (
          <>
            <input
              name="name"
              placeholder="Rule name"
              value={form.name}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
            <textarea
              name="description"
              placeholder="Rule description"
              value={form.description}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10, minHeight: 60 }}
            />
            <label style={{ fontSize: 12, color: '#555' }}>Trigger Type</label>
            <select
              name="rule_trigger_type"
              value={form.rule_trigger_type}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            >
              <option value="status_change">Status change</option>
              <option value="deadline_approaching">Deadline approaching</option>
              <option value="no_response">No response</option>
              <option value="custom">Custom</option>
            </select>
            <label style={{ fontSize: 12, color: '#555' }}>Priority</label>
            <input
              type="number"
              name="rule_priority"
              value={form.rule_priority}
              onChange={handleChange}
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                name="rule_enabled"
                checked={form.rule_enabled}
                onChange={handleCheckboxChange}
              />
              Enabled
            </label>
          </>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
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
            onClick={handleSubmit}
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
            {mode === 'edit' ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};




