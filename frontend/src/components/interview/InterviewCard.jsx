import React from 'react';

function InterviewCard({ interview, onClick, onPrepare, onComplete }) {
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };
  
  const getTimeUntil = (datetime) => {
    const now = new Date();
    const interviewDate = new Date(datetime);
    const diff = interviewDate - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 7) return { text: `in ${days} days`, urgency: 'low' };
    if (days > 2) return { text: `in ${days} days`, urgency: 'medium' };
    if (days > 0) return { text: `in ${days} day${days > 1 ? 's' : ''}`, urgency: 'high' };
    if (hours > 0) return { text: `in ${hours} hour${hours > 1 ? 's' : ''}`, urgency: 'urgent' };
    if (diff > 0) return { text: 'today', urgency: 'urgent' };
    return { text: 'past', urgency: 'past' };
  };
  
  const getLocationIcon = (locationType) => {
    const icons = {
      video: '🎥',
      phone: '📞',
      'in-person': '🏢'
    };
    return icons[locationType] || '📍';
  };
  
  const getUrgencyColor = (urgency) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545',
      past: '#6c757d'
    };
    return colors[urgency] || '#6c757d';
  };
  
  const { date, time } = formatDateTime(interview.interview_datetime);
  const timeUntil = getTimeUntil(interview.interview_datetime);
  const prepCompletion = interview.preparation_completion_percentage || 0;
  
  return (
    <div 
      className={`interview-card urgency-${timeUntil.urgency}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Date Badge */}
      <div className="interview-date-badge">
        <div className="date-day">{date.split(' ')[1]}</div>
        <div className="date-month">{date.split(' ')[0]}</div>
      </div>
      
      {/* Card Content */}
      <div className="interview-card-content">
        <div className="interview-header">
          <h3 className="interview-title">
            {interview.job_title || interview.position || 'Interview'}
          </h3>
          <span 
            className="time-badge"
            style={{ backgroundColor: getUrgencyColor(timeUntil.urgency) }}
          >
            {timeUntil.text}
          </span>
        </div>
        
        <div className="interview-company">
          {interview.company_name || interview.company || 'Company'}
        </div>
        
        <div className="interview-meta">
          <span className="meta-item">
            {getLocationIcon(interview.location_type)} {interview.location_type}
          </span>
          <span className="meta-item">
            ⏰ {time}
          </span>
        </div>
        
        {interview.interviewer_name && (
          <div className="interviewer-info">
            <span className="interviewer-label">Interviewer:</span> {interview.interviewer_name}
            {interview.interviewer_title && <span className="interviewer-title"> • {interview.interviewer_title}</span>}
          </div>
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
              style={{ 
                width: `${prepCompletion}%`,
                backgroundColor: prepCompletion >= 75 ? '#28a745' : prepCompletion >= 50 ? '#ffc107' : '#dc3545'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="interview-card-actions" onClick={(e) => e.stopPropagation()}>
        {onPrepare && (
          <button 
            className="btn-action btn-prepare"
            onClick={(e) => {
              e.stopPropagation();
              onPrepare(interview.uuid);
            }}
          >
            📝 Prepare
          </button>
        )}
        {onComplete && (
          <button 
            className="btn-action btn-complete"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(interview.uuid);
            }}
          >
            ✅ Complete
          </button>
        )}
      </div>
    </div>
  );
}

export default InterviewCard;