import React, { useState, useEffect } from 'react';
import JobsAPI from '../../api/jobs';

export default function StatusMonitoring() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastUpdate');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await JobsAPI.getAll();
      const jobsData = (response.data || []).map(job => ({
        id: job._id,
        title: job.title,
        company: typeof job.company === 'string' ? job.company : job.company?.name || 'Unknown Company',
        status: job.status || 'Applied',
        lastUpdate: job.date_updated || job.date_created,
        statusHistory: job.status_history || [[job.status || 'Applied', job.date_created]],
        nextAction: job.notes || '',
        daysInStage: calculateDaysInStage(job.status_history),
        responseTime: calculateResponseTime(job.status_history),
        notes: job.notes,
        location: job.location,
        url: job.url
      }));
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysInStage = (statusHistory) => {
    if (!statusHistory || statusHistory.length === 0) return 0;
    const lastStatus = statusHistory[statusHistory.length - 1];
    const lastDate = new Date(lastStatus[1]);
    const today = new Date();
    return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  };

  const calculateResponseTime = (statusHistory) => {
    if (!statusHistory || statusHistory.length < 2) return null;
    const firstDate = new Date(statusHistory[0][1]);
    const secondDate = new Date(statusHistory[1][1]);
    return Math.floor((secondDate - firstDate) / (1000 * 60 * 60 * 24));
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusUpdate = async (jobId, newStatus, notes = '') => {
  try {
    const currentJob = jobs.find(j => j.id === jobId);
    
    // Clean status string (remove any emojis or extra characters)
    const cleanStatus = newStatus;
    
    // Build new status history entry
    const newHistoryEntry = [cleanStatus, new Date().toISOString()];
    const updatedHistory = [...(currentJob?.statusHistory || []), newHistoryEntry];
    
    // Update job status via API with complete history
    await JobsAPI.update(jobId, { 
      status: cleanStatus.charAt(0).toUpperCase() + cleanStatus.slice(1),
      status_history: updatedHistory,
      notes: notes 
    });
      
      // Reload jobs to get updated data
      await loadJobs();
      setShowUpdateModal(false);
      setSelectedJob(null);
      
      // Show success notification
      showNotification(`Status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification('Failed to update status. Please try again.', 'error');
    }
  };

  const handleBulkStatusUpdate = async (newStatus, notes = '') => {
  try {
    // Clean status string (remove any emojis or extra characters)
    const cleanStatus = newStatus
    
    const updatePromises = Array.from(selectedJobs).map(jobId => {
      const currentJob = jobs.find(j => j.id === jobId);
      const newHistoryEntry = [cleanStatus, new Date().toISOString()];
      const updatedHistory = [...(currentJob?.statusHistory || []), newHistoryEntry];
      
      return JobsAPI.update(jobId, {
        status: cleanStatus.charAt(0).toUpperCase() + cleanStatus.slice(1),
        status_history: updatedHistory,
        notes: notes
      });
    });

      await Promise.all(updatePromises);
      await loadJobs();
      setSelectedJobs(new Set());
      setShowBulkUpdate(false);
      showNotification(`Updated ${selectedJobs.size} applications to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Bulk update failed:', error);
      showNotification('Failed to update applications. Please try again.', 'error');
    }
  };

  const toggleJobSelection = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const statusColors = {
    Interested: '#9e9e9e',
    Applied: '#2196f3',
    Screening: '#ff9800',
    Interview: '#9c27b0',
    Offer: '#4caf50',
    Rejected: '#f44336'
  };

  const statusIcons = {
    Interested: '👀',
    Applied: '📤',
    Screening: '📋',
    Interview: '💼',
    Offer: '🎉',
    Rejected: '❌'
  };

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter(job => job.status === filter);

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'lastUpdate') {
      return new Date(b.lastUpdate) - new Date(a.lastUpdate);
    } else if (sortBy === 'daysInStage') {
      return b.daysInStage - a.daysInStage;
    } else if (sortBy === 'company') {
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

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
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
        <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>Loading applications...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          padding: '16px 24px',
          background: notification.type === 'success' ? '#4caf50' : notification.type === 'error' ? '#f44336' : '#2196f3',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out',
          fontWeight: '600'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#333', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          📍 Application Status Monitoring
        </h2>
        <button
          onClick={() => setShowUpdateModal(true)}
          style={{
            padding: '12px 24px',
            background: '#4f8ef7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          + Update Status
        </button>
      </div>

      {/* Status Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {Object.entries(statusColors).map(([status, color]) => {
          const count = jobs.filter(j => j.status === status).length;
          return (
            <div
              key={status}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              style={{
                padding: '16px',
                background: filter === status ? color : 'white',
                color: filter === status ? 'white' : '#333',
                border: `2px solid ${color}`,
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: filter === status ? '0 4px 8px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                {statusIcons[status]}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {count}
              </div>
              <div style={{
                fontSize: '12px',
                textTransform: 'capitalize',
                fontWeight: '600'
              }}>
                {status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="lastUpdate">Last Update</option>
            <option value="daysInStage">Days in Stage</option>
            <option value="company">Company</option>
          </select>
          
          {selectedJobs.size > 0 && (
            <button
              onClick={() => setShowBulkUpdate(true)}
              style={{
                padding: '8px 16px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Bulk Update ({selectedJobs.size})
            </button>
          )}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Showing <strong>{sortedJobs.length}</strong> of <strong>{jobs.length}</strong> applications
        </div>
      </div>

      {/* Applications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedJobs.map(job => (
          <ApplicationCard
            key={job.id}
            job={job}
            statusColors={statusColors}
            statusIcons={statusIcons}
            onStatusUpdate={(newStatus) => handleStatusUpdate(job.id, newStatus)}
            onViewDetails={() => setSelectedJob(job)}
            isSelected={selectedJobs.has(job.id)}
            onToggleSelect={() => toggleJobSelection(job.id)}
          />
        ))}
      </div>

      {sortedJobs.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>
            No applications found
          </p>
          <p style={{ fontSize: '14px' }}>
            {filter !== 'all' && 'Try adjusting your filter'}
          </p>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          statusColors={statusColors}
          statusIcons={statusIcons}
        />
      )}

      {/* Status Update Modal */}
      {showUpdateModal && (
        <StatusUpdateModal
          jobs={jobs}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={handleStatusUpdate}
          statusColors={statusColors}
          statusIcons={statusIcons}
        />
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <BulkUpdateModal
          selectedCount={selectedJobs.size}
          onClose={() => setShowBulkUpdate(false)}
          onUpdate={handleBulkStatusUpdate}
          statusColors={statusColors}
          statusIcons={statusIcons}
        />
      )}
    </div>
  );
}

const ApplicationCard = ({ job, statusColors, statusIcons, onStatusUpdate, onViewDetails, isSelected, onToggleSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const daysSinceUpdate = Math.floor(
    (new Date() - new Date(job.lastUpdate)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${statusColors[job.status]}20`,
      borderLeft: `4px solid ${statusColors[job.status]}`,
      borderRadius: '8px',
      padding: '20px',
      boxShadow: isSelected ? '0 4px 12px rgba(79,142,247,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.2s',
      opacity: isSelected ? 0.95 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px', flex: 1 }}>
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          />
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{job.title}</h3>
              <span style={{
                padding: '4px 12px',
                background: statusColors[job.status],
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {statusIcons[job.status]} {job.status}
              </span>
            </div>

            <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>
              {job.company}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#666' }}>
                <strong>Last Update:</strong> {daysSinceUpdate === 0 ? 'Today' : `${daysSinceUpdate} days ago`}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                <strong>Days in Stage:</strong> {job.daysInStage}
              </div>
              {job.responseTime && (
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <strong>Response Time:</strong> {job.responseTime} days
                </div>
              )}
            </div>

            {job.nextAction && (
              <div style={{
                padding: '10px',
                background: '#fff8e1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#856404',
                marginBottom: '12px'
              }}>
                <strong>Next Action:</strong> {job.nextAction}
              </div>
            )}

            {expanded && (
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#666', fontWeight: '600' }}>
                  📊 Status History Timeline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {job.statusHistory.slice().reverse().map(([status, timestamp], idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '13px',
                        padding: '8px',
                        background: isLatest ? '#f0f7ff' : 'transparent',
                        borderRadius: '6px'
                      }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          background: statusColors[status],
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          flexShrink: 0
                        }}>
                          {statusIcons[status]}
                        </span>
                        <span style={{ 
                          textTransform: 'capitalize', 
                          fontWeight: '600', 
                          minWidth: '80px',
                          color: isLatest ? '#2196f3' : '#333'
                        }}>
                          {status}
                        </span>
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isLatest && (
                          <span style={{
                            marginLeft: 'auto',
                            padding: '2px 8px',
                            background: '#2196f3',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Response Time Analysis */}
                {job.statusHistory.length > 1 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
                      ⏱️ Response Time Analysis
                    </h5>
                    {job.statusHistory.slice(0, -1).map((_, idx) => {
                      const current = new Date(job.statusHistory[idx][1]);
                      const next = new Date(job.statusHistory[idx + 1][1]);
                      const days = Math.floor((next - current) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={idx} style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          <strong>{job.statusHistory[idx][0]}</strong> → <strong>{job.statusHistory[idx + 1][0]}</strong>: {days} day{days !== 1 ? 's' : ''}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
          <button
            onClick={() => setExpanded(!expanded)}
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
          >
            {expanded ? '▲ Less' : '▼ More'}
          </button>
          <button
            onClick={onViewDetails}
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
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

const JobDetailsModal = ({ job, onClose, statusColors, statusIcons }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>{job.title}</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999',
            padding: '0',
            width: '32px',
            height: '32px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#666' }}>Company</h3>
        <p style={{ fontSize: '16px', color: '#333' }}>{job.company}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#666' }}>Current Status</h3>
        <span style={{
          padding: '8px 16px',
          background: statusColors[job.status],
          color: 'white',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'capitalize',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {statusIcons[job.status]} {job.status}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#666' }}>Status Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {job.statusHistory.map(([status, timestamp], idx) => (
            <div key={idx} style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                width: '32px',
                height: '32px',
                background: statusColors[status],
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                {statusIcons[status]}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ textTransform: 'capitalize', fontWeight: '600', marginBottom: '4px' }}>
                  {status}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {new Date(timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {job.nextAction && (
        <div style={{
          padding: '16px',
          background: '#fff8e1',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#856404' }}>Next Action</h3>
          <p style={{ margin: 0, color: '#856404' }}>{job.nextAction}</p>
        </div>
      )}
    </div>
  </div>
);

const StatusUpdateModal = ({ jobs, onClose, onUpdate, statusColors, statusIcons }) => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const statuses = ['Interested', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
  
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Update Application Status</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Select Application
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">Choose an application...</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.company}
              </option>
            ))}
          </select>
        </div>

        {selectedJob && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: '#f0f7ff',
            borderRadius: '6px',
            fontSize: '13px'
          }}>
            <strong>Current Status:</strong>{' '}
            <span style={{
              padding: '2px 8px',
              background: statusColors[selectedJob.status],
              color: 'white',
              borderRadius: '10px',
              textTransform: 'capitalize',
              marginLeft: '4px'
            }}>
              {statusIcons[selectedJob.status]} {selectedJob.status}
            </span>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            New Status
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
{statuses.map(status => (
<button
key={status}
onClick={() => setNewStatus(status)}
disabled={!selectedJobId}
style={{
padding: '12px',
background: newStatus === status ? statusColors[status] : 'white',
color: newStatus === status ? 'white' : '#333',
border: `2px solid ${statusColors[status]}`,
borderRadius: '8px',
cursor: selectedJobId ? 'pointer' : 'not-allowed',
fontWeight: '600',
fontSize: '13px',
textTransform: 'capitalize',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
gap: '6px',
transition: 'all 0.2s',
opacity: selectedJobId ? 1 : 0.5
}}
>
{statusIcons[status]} {status}
</button>
))}
</div>
</div>
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
        Notes (Optional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any notes about this status change..."
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          fontSize: '14px',
          minHeight: '80px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
      />
    </div>

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
        onClick={() => {
          if (selectedJobId && newStatus) {
            onUpdate(selectedJobId, newStatus, notes);
          }
        }}
        disabled={!selectedJobId || !newStatus}
        style={{
          padding: '10px 20px',
          background: selectedJobId && newStatus ? '#4f8ef7' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: selectedJobId && newStatus ? 'pointer' : 'not-allowed',
          fontWeight: '600'
        }}
      >
        Update Status
      </button>
    </div>
  </div>
</div>
);
};
const BulkUpdateModal = ({ selectedCount, onClose, onUpdate, statusColors, statusIcons }) => {
const [newStatus, setNewStatus] = useState('');
const [notes, setNotes] = useState('');
const statuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
return (
<div
style={{
position: 'fixed',
top: 0,
left: 0,
right: 0,
bottom: 0,
background: 'rgba(0,0,0,0.5)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
zIndex: 1000,
padding: '20px'
}}
onClick={onClose}
>
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '32px',
maxWidth: '500px',
width: '100%',
boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
}}
onClick={(e) => e.stopPropagation()}
>
<h2 style={{ marginTop: 0, marginBottom: '8px' }}>Bulk Status Update</h2>
<p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
Updating <strong>{selectedCount}</strong> selected application{selectedCount !== 1 ? 's' : ''}
</p>
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
        New Status
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setNewStatus(status)}
            style={{
              padding: '12px',
              background: newStatus === status ? statusColors[status] : 'white',
              color: newStatus === status ? 'white' : '#333',
              border: `2px solid ${statusColors[status]}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {statusIcons[status]} {status}
          </button>
        ))}
      </div>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
        Notes (Optional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes that will be applied to all selected applications..."
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          fontSize: '14px',
          minHeight: '80px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
      />
    </div>

    <div style={{
      padding: '12px',
      background: '#fff8e1',
      borderRadius: '6px',
      marginBottom: '24px',
      fontSize: '13px',
      color: '#856404'
    }}>
      <strong>⚠️ Note:</strong> This will update all {selectedCount} selected application{selectedCount !== 1 ? 's' : ''} to the same status.
    </div>

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
        onClick={() => {
          if (newStatus) {
            onUpdate(newStatus, notes);
          }
        }}
        disabled={!newStatus}
        style={{
          padding: '10px 20px',
          background: newStatus ? '#ff9800' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: newStatus ? 'pointer' : 'not-allowed',
          fontWeight: '600'
        }}
      >
        Update All ({selectedCount})
      </button>
    </div>
  </div>
</div>
);
};