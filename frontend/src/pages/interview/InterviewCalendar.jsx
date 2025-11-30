import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';
import { useFlash } from '../../context/flashContext';
import '../../styles/interviewCalendar.css';

function InterviewCalendar() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming, past, all
  
  useEffect(() => {
    loadInterviews();
  }, []);
  
  const loadInterviews = async () => {
    try {
      const response = await InterviewScheduleAPI.getUpcomingInterviews();
      setInterviews(response.data.upcoming_interviews || []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      showFlash('Failed to load interviews', 'error');
    } finally {
      setLoading(false);
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
          Upcoming ({interviews.length})
        </button>
        <button 
          className={`view-btn ${viewMode === 'past' ? 'active' : ''}`}
          onClick={() => setViewMode('past')}
        >
          Past
        </button>
        <button 
          className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All
        </button>
      </div>
      
      {/* Interview List */}
      <div className="interview-list">
        {interviews.length === 0 ? (
          <div className="no-interviews">
            <div className="empty-state-icon">📅</div>
            <h3>No Upcoming Interviews</h3>
            <p>Schedule your first interview to get started</p>
            <button onClick={handleScheduleNew} className="btn btn-primary">
              Schedule Interview
            </button>
          </div>
        ) : (
          interviews.map((interview) => {
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
                <h4>Date & Time</h4>
                <p>{formatDateTime(selectedInterview.interview_datetime).dayOfWeek}, {formatDateTime(selectedInterview.interview_datetime).date} at {formatDateTime(selectedInterview.interview_datetime).time}</p>
              </div>
              
              <div className="detail-section">
                <h4>Location</h4>
                <p>
                  {getLocationIcon(selectedInterview.location_type)} {selectedInterview.location_type}
                  {selectedInterview.video_link && (
                    <a href={selectedInterview.video_link} target="_blank" rel="noopener noreferrer" className="video-link">
                      Join Meeting
                    </a>
                  )}
                </p>
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
                className="btn btn-secondary"
                onClick={() => navigate(`/interview/edit/${selectedInterview.uuid}`)}
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
    </div>
  );
}

export default InterviewCalendar;