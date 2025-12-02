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
  const [viewMode, setViewMode] = useState('upcoming');
  const [calendarStatus, setCalendarStatus] = useState({ connected: false, provider: null });
  
  useEffect(() => {
    loadInterviews();
    loadCalendarStatus();
  }, []);
  
  const loadCalendarStatus = async () => {
    try {
      const response = await InterviewScheduleAPI.getCalendarStatus();
      setCalendarStatus(response.data);
    } catch (err) {
      console.error('Error loading calendar status:', err);
      setCalendarStatus({ connected: false, provider: null });
    }
  };
  
  const connectCalendar = async (provider) => {
    try {
      const response = provider === 'google'
        ? await InterviewScheduleAPI.getGoogleAuthUrl()
        : await InterviewScheduleAPI.getOutlookAuthUrl();
      
      window.open(response.data.auth_url, '_blank', 'width=600,height=700');
      
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await InterviewScheduleAPI.getCalendarStatus();
          if (statusResponse.data.connected) {
            setCalendarStatus(statusResponse.data);
            showFlash(`Connected to ${statusResponse.data.provider} calendar`, 'success');
            clearInterval(checkInterval);
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 2000);
      
      setTimeout(() => clearInterval(checkInterval), 120000);
    } catch (err) {
      console.error('Calendar connection error:', err);
      showFlash('Failed to connect calendar', 'error');
    }
  };
  
  // Helper function to parse UTC datetime and convert to local Date object
  const parseUTCDateTime = (datetimeStr) => {
    if (!datetimeStr) return null;
    
    let isoString = datetimeStr;
    if (!isoString.includes('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
      isoString = isoString + 'Z';
    }
    
    return new Date(isoString);
  };
  
  const loadInterviews = async () => {
    try {
      const response = await InterviewScheduleAPI.getUpcomingInterviews();
      
      const now = new Date();
      const allInterviewsData = [
        ...(response.data.upcoming_interviews || []),
        ...(response.data.past_interviews || [])
      ];
      
      const upcoming = [];
      const past = [];
      
      allInterviewsData.forEach(interview => {
        const interviewTime = parseUTCDateTime(interview.interview_datetime);
        
        if (interviewTime && interviewTime >= now) {
          upcoming.push(interview);
        } else if (interviewTime) {
          past.push(interview);
        }
      });
      
      upcoming.sort((a, b) => parseUTCDateTime(a.interview_datetime) - parseUTCDateTime(b.interview_datetime));
      past.sort((a, b) => parseUTCDateTime(b.interview_datetime) - parseUTCDateTime(a.interview_datetime));
      
      setAllInterviews({ upcoming, past });
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
    const utcDate = parseUTCDateTime(interview.interview_datetime);
    
    if (!utcDate) {
      showFlash('Invalid interview date', 'error');
      return;
    }
    
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    const hours = String(utcDate.getHours()).padStart(2, '0');
    const minutes = String(utcDate.getMinutes()).padStart(2, '0');
    
    const localDatetimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setEditFormData({
      interview_datetime: localDatetimeString,
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
      const localDate = new Date(editFormData.interview_datetime);
      const utcDatetime = localDate.toISOString();
      
      const dataToSend = {
        ...editFormData,
        interview_datetime: utcDatetime
      };
      
      await InterviewScheduleAPI.updateSchedule(selectedInterview.uuid, dataToSend);
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
    const date = parseUTCDateTime(datetime);
    
    if (!date) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time',
        dayOfWeek: '',
        fullDateTime: 'Invalid DateTime'
      };
    }
    
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
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      fullDateTime: date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };
  
  const getTimeUntil = (datetime) => {
    const now = new Date();
    const interviewDate = parseUTCDateTime(datetime);
    
    if (!interviewDate) return 'invalid';
    
    const diffMs = interviewDate - now;
    
    if (diffMs < 0) {
      return 'past';
    }
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days > 7) {
      return `in ${days} days`;
    } else if (days >= 2) {
      return `in ${days} days`;
    } else if (days === 1) {
      return 'tomorrow';
    } else if (hours >= 2) {
      return `in ${hours} hours`;
    } else if (hours === 1) {
      return 'in 1 hour';
    } else if (minutes > 30) {
      return `in ${minutes} minutes`;
    } else if (minutes > 0) {
      return `in ${minutes} minutes`;
    } else {
      return 'now';
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
                  {interview.company_name && (
                    <p className="company-info">
                      <strong>Company:</strong> {interview.company_name}
                    </p>
                  )}
                  
                  {interview.interviewer_name && (
                    <p className="interviewer-info">
                      <strong>Interviewer:</strong> {interview.interviewer_name}
                      {interview.interviewer_title && ` - ${interview.interviewer_title}`}
                    </p>
                  )}
                  
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
                  {timeUntil !== 'past' && (
                    <button 
                      className="btn-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteInterview(interview.uuid);
                      }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
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
                <h4>Date & Time (Local)</h4>
                <p>{formatDateTime(selectedInterview.interview_datetime).fullDateTime}</p>
                <p className="time-until-detail">
                  <strong>Status:</strong> {getTimeUntil(selectedInterview.interview_datetime)}
                </p>
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
              
              <div className="detail-section">
                <h4>Calendar Sync</h4>
                {calendarStatus.connected ? (
                  <div style={{ color: '#28a745', marginBottom: '12px' }}>
                    ✓ Connected to {calendarStatus.provider}
                  </div>
                ) : (
                  <div>
                    <p style={{ marginBottom: '12px', color: '#666' }}>
                      Connect your calendar to automatically sync interview schedules
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => connectCalendar('google')}
                        style={{
                          padding: '10px 20px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        Connect Google Calendar
                      </button>
                      <button
                        onClick={() => connectCalendar('outlook')}
                        style={{
                          padding: '10px 20px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        Connect Outlook
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Date & Time (Local)</label>
                <input
                  type="datetime-local"
                  value={editFormData.interview_datetime}
                  onChange={(e) => setEditFormData({...editFormData, interview_datetime: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  💡 Enter time in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
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