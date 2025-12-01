import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';
import { useFlash } from '../../context/flashContext';
import '../../styles/interviewCalendar.css';

function InterviewCalendar() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  
  const [allInterviews, setAllInterviews] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming, past, all
  
  useEffect(() => {
    loadInterviews();
  }, []);
  
  const loadInterviews = async () => {
    try {
      const response = await InterviewScheduleAPI.getUpcomingInterviews();
      setAllInterviews({
        upcoming: response.data.upcoming_interviews || [],
        past: response.data.past_interviews || []
      });
    } catch (error) {
      console.error('Failed to load interviews:', error);
      showFlash('Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const getDisplayedInterviews = () => {
    switch(viewMode) {
      case 'upcoming':
        return allInterviews.upcoming;
      case 'past':
        return allInterviews.past;
      case 'all':
        return [...allInterviews.upcoming, ...allInterviews.past];
      default:
        return allInterviews.upcoming;
    }
  };
  
  const handleInterviewClick = (interview) => {
    setSelectedInterview(interview);
    setShowDetails(true);
  };
  
  const handleScheduleNew = () => {
    navigate('/interview/schedule-interview');
  };
  
  const handleCompleteInterview = async (interviewId) => {
    navigate(`/interview/complete/${interviewId}`);
  };
  
  const handleEditInterview = (interview) => {
    setEditFormData({
      interview_datetime: new Date(interview.interview_datetime).toISOString().slice(0, 16),
      duration_minutes: interview.duration_minutes || 60,
      location_type: interview.location_type || 'video',
      video_link: interview.video_link || '',
      video_platform: interview.video_platform || 'zoom',
      phone_number: interview.phone_number || '',
      location_details: interview.location_details || '',
      interviewer_name: interview.interviewer_name || '',
      interviewer_email: interview.interviewer_email || '',
      interviewer_phone: interview.interviewer_phone || '',
      interviewer_title: interview.interviewer_title || '',
      notes: interview.notes || '',
      scenario_name: interview.scenario_name || '',
      company_name: interview.company_name || ''
    });
    setSelectedInterview(interview);
    setShowDetails(false);
    setShowEditModal(true);
  };
  
  const handleSaveEdit = async () => {
    if (!selectedInterview) return;
    
    try {
      await InterviewScheduleAPI.updateSchedule(selectedInterview.uuid, editFormData);
      showFlash('Interview updated successfully', 'success');
      setShowEditModal(false);
      setEditFormData(null);
      loadInterviews();
    } catch (error) {
      console.error('Failed to update interview:', error);
      showFlash('Failed to update interview', 'error');
    }
  };
  
  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) {
      return;
    }
    
    try {
      await InterviewScheduleAPI.deleteSchedule(interviewId);
      showFlash('Interview deleted successfully', 'success');
      setShowDetails(false);
      setShowEditModal(false);
      loadInterviews();
    } catch (error) {
      console.error('Failed to delete interview:', error);
      showFlash('Failed to delete interview', 'error');
    }
  };
  
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      }),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };
  
  const getTimeUntil = (datetime) => {
    const now = new Date();
    const interviewDate = new Date(datetime);
    const diff = interviewDate - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (diff > 0) {
      return 'today';
    } else {
      return 'past';
    }
  };
  
  const getLocationIcon = (locationType) => {
    switch(locationType) {
      case 'video': return '🎥';
      case 'phone': return '📞';
      case 'in-person': return '🏢';
      default: return '📍';
    }
  };
  
  if (loading) {
    return (
      <div className="interview-calendar-loading">
        <p>Loading interview schedule...</p>
      </div>
    );
  }
  
  const displayedInterviews = getDisplayedInterviews();
  
  return (
    <div className="interview-calendar-container">
      {/* Header */}
      <div className="interview-calendar-header">
        <div className="header-left">
          <h1>Interview Calendar</h1>
          <p>Manage your upcoming interviews and track preparation</p>
        </div>
        <div className="header-right">
          <button onClick={handleScheduleNew} className="btn btn-primary">
            + Schedule Interview
          </button>
        </div>
      </div>
      
      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <button 
          className={`view-btn ${viewMode === 'upcoming' ? 'active' : ''}`}
          onClick={() => setViewMode('upcoming')}
        >
          Upcoming ({allInterviews.upcoming.length})
        </button>
        <button 
          className={`view-btn ${viewMode === 'past' ? 'active' : ''}`}
          onClick={() => setViewMode('past')}
        >
          Past ({allInterviews.past.length})
        </button>
        <button 
          className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All ({allInterviews.upcoming.length + allInterviews.past.length})
        </button>
      </div>
      
      {/* Interview List */}
      <div className="interview-list">
        {displayedInterviews.length === 0 ? (
          <div className="no-interviews">
            <div className="empty-state-icon">📅</div>
            <h3>No {viewMode === 'upcoming' ? 'Upcoming' : viewMode === 'past' ? 'Past' : ''} Interviews</h3>
            <p>Schedule your first interview to get started</p>
            <button onClick={handleScheduleNew} className="btn btn-primary">
              Schedule Interview
            </button>
          </div>
        ) : (
          displayedInterviews.map((interview) => {
            const { date, time, dayOfWeek } = formatDateTime(interview.interview_datetime);
            const timeUntil = getTimeUntil(interview.interview_datetime);
            const prepCompletion = interview.preparation_completion_percentage || 0;
            
            return (
              <div 
                key={interview.uuid} 
                className="interview-card"
                onClick={() => handleInterviewClick(interview)}
              >
                <div className="interview-card-header">
                  <div className="interview-date-badge">
                    <div className="date-day">{date.split(' ')[1]}</div>
                    <div className="date-month">{date.split(' ')[0]}</div>
                  </div>
                  <div className="interview-details">
                    <h3 className="interview-title">
                      {interview.scenario_name || 'Interview'}
                    </h3>
                    <div className="interview-meta">
                      <span className="meta-item">
                        {getLocationIcon(interview.location_type)} {interview.location_type}
                      </span>
                      <span className="meta-item">⏰ {time}</span>
                      <span className="meta-item time-until">{timeUntil}</span>
                    </div>
                  </div>
                </div>
                
                <div className="interview-card-body">
                  {interview.interviewer_name && (
                    <p className="interviewer-info">
                      <strong>Interviewer:</strong> {interview.interviewer_name}
                      {interview.interviewer_title && ` - ${interview.interviewer_title}`}
                    </p>
                  )}
                  
                  {/* Preparation Progress */}
                  <div className="prep-progress">
                    <div className="prep-header">
                      <span>Preparation</span>
                      <span className="prep-percentage">{prepCompletion}%</span>
                    </div>
                    <div className="prep-bar">
                      <div 
                        className="prep-bar-fill" 
                        style={{ width: `${prepCompletion}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="interview-card-actions">
                  <button 
                    className="btn-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/interview/prepare/${interview.uuid}`);
                    }}
                  >
                    Prepare
                  </button>
                  <button 
                    className="btn-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteInterview(interview.uuid);
                    }}
                  >
                    Complete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Interview Details Modal */}
      {showDetails && selectedInterview && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Interview Details</h2>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Position & Company</h4>
                <p><strong>{selectedInterview.scenario_name || 'Interview'}</strong> at {selectedInterview.company_name || 'Company'}</p>
              </div>
              
              <div className="detail-section">
                <h4>Date & Time</h4>
                <p>{formatDateTime(selectedInterview.interview_datetime).dayOfWeek}, {formatDateTime(selectedInterview.interview_datetime).date} at {formatDateTime(selectedInterview.interview_datetime).time}</p>
              </div>
              
              <div className="detail-section">
                <h4>Location</h4>
                <p>
                  {getLocationIcon(selectedInterview.location_type)} {selectedInterview.location_type}
                </p>
                {selectedInterview.video_link && (
                  <a href={selectedInterview.video_link} target="_blank" rel="noopener noreferrer" className="video-link">
                    Join Meeting
                  </a>
                )}
                {selectedInterview.location_details && (
                  <p>{selectedInterview.location_details}</p>
                )}
                {selectedInterview.phone_number && (
                  <p>📞 {selectedInterview.phone_number}</p>
                )}
              </div>
              
              {selectedInterview.interviewer_name && (
                <div className="detail-section">
                  <h4>Interviewer</h4>
                  <p>
                    {selectedInterview.interviewer_name}
                    {selectedInterview.interviewer_title && ` - ${selectedInterview.interviewer_title}`}
                  </p>
                  {selectedInterview.interviewer_email && (
                    <p className="contact-info">📧 {selectedInterview.interviewer_email}</p>
                  )}
                </div>
              )}
              
              {selectedInterview.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedInterview.notes}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteInterview(selectedInterview.uuid)}
              >
                Delete
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleEditInterview(selectedInterview)}
              >
                Edit
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowDetails(false);
                  navigate(`/interview/prepare/${selectedInterview.uuid}`);
                }}
              >
                View Preparation
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editFormData && selectedInterview && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Interview</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Position</label>
                <input
                  type="text"
                  value={editFormData.scenario_name}
                  onChange={(e) => setEditFormData({...editFormData, scenario_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company</label>
                <input
                  type="text"
                  value={editFormData.company_name}
                  onChange={(e) => setEditFormData({...editFormData, company_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Date & Time</label>
                <input
                  type="datetime-local"
                  value={editFormData.interview_datetime}
                  onChange={(e) => setEditFormData({...editFormData, interview_datetime: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Duration (minutes)</label>
                <input
                  type="number"
                  value={editFormData.duration_minutes}
                  onChange={(e) => setEditFormData({...editFormData, duration_minutes: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Location Type</label>
                <select
                  value={editFormData.location_type}
                  onChange={(e) => setEditFormData({...editFormData, location_type: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="video">Video</option>
                  <option value="phone">Phone</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              
              {editFormData.location_type === 'video' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Video Platform</label>
                    <select
                      value={editFormData.video_platform}
                      onChange={(e) => setEditFormData({...editFormData, video_platform: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="zoom">Zoom</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="meet">Google Meet</option>
                      <option value="webex">Webex</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Meeting Link</label>
                    <input
                      type="url"
                      value={editFormData.video_link}
                      onChange={(e) => setEditFormData({...editFormData, video_link: e.target.value})}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </>
              )}
              
              {editFormData.location_type === 'phone' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={editFormData.phone_number}
                    onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}
              
              {editFormData.location_type === 'in-person' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Address</label>
                  <textarea
                    value={editFormData.location_details}
                    onChange={(e) => setEditFormData({...editFormData, location_details: e.target.value})}
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Interviewer Name</label>
                <input
                  type="text"
                  value={editFormData.interviewer_name}
                  onChange={(e) => setEditFormData({...editFormData, interviewer_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Interviewer Title</label>
                <input
                  type="text"
                  value={editFormData.interviewer_title}
                  onChange={(e) => setEditFormData({...editFormData, interviewer_title: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Interviewer Email</label>
                <input
                  type="email"
                  value={editFormData.interviewer_email}
                  onChange={(e) => setEditFormData({...editFormData, interviewer_email: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  rows="4"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewCalendar;