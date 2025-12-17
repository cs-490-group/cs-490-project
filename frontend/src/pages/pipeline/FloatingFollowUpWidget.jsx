import React, { useState } from 'react';

export default function FloatingFollowUpWidget({ interviews, onFollowUpClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Get completed interviews that need follow-up
  const getFollowUpOpportunities = () => {
    if (!interviews || interviews.length === 0) return [];

    const now = new Date();
    
    return interviews
      .filter(interview => interview.status === 'completed')
      .map(interview => {
        const interviewDate = new Date(interview.datetime);
        const hoursSince = Math.floor((now - interviewDate) / (1000 * 60 * 60));
        const daysSince = Math.floor(hoursSince / 24);
        
        // Determine follow-up type and urgency
        let followUpType = null;
        let urgency = null;
        let message = null;
        
        // Check if thank you note was sent
        const thankYouSent = interview.thank_you_note_sent || 
          (interview.follow_up_actions && interview.follow_up_actions.some(
            action => action.template_type === 'thank_you'
          ));
        
        if (!thankYouSent) {
          if (hoursSince <= 24) {
            followUpType = 'thank_you';
            urgency = 'high';
            message = 'Send thank you note now';
          } else if (daysSince <= 3) {
            followUpType = 'thank_you';
            urgency = 'medium';
            message = 'Thank you note overdue';
          }
        } else if (daysSince >= 5 && daysSince <= 10 && !interview.outcome) {
          followUpType = 'status_inquiry';
          urgency = 'medium';
          message = 'Consider status inquiry';
        } else if (daysSince >= 10 && !interview.outcome) {
          followUpType = 'status_inquiry';
          urgency = 'high';
          message = 'Status inquiry recommended';
        }
        
        // Feedback request after outcome
        if (interview.outcome && daysSince >= 3) {
          const feedbackSent = interview.follow_up_actions && interview.follow_up_actions.some(
            action => action.template_type === 'feedback_request'
          );
          
          if (!feedbackSent) {
            followUpType = 'feedback_request';
            urgency = 'low';
            message = interview.outcome === 'passed' ? 'Request onboarding tips' : 'Request feedback';
          }
        }
        
        return {
          ...interview,
          followUpType,
          urgency,
          message,
          daysSince,
          hoursSince
        };
      })
      .filter(item => item.followUpType !== null)
      .sort((a, b) => {
        // Sort by urgency (high > medium > low), then by days since
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        }
        return a.daysSince - b.daysSince;
      });
  };

  const followUpItems = getFollowUpOpportunities();
  const urgentCount = followUpItems.filter(item => item.urgency === 'high').length;
  const totalCount = followUpItems.length;

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getFollowUpIcon = (type) => {
    switch (type) {
      case 'thank_you': return '✉️';
      case 'status_inquiry': return '❓';
      case 'feedback_request': return '📝';
      case 'networking': return '🤝';
      default: return '📧';
    }
  };

  const getFollowUpLabel = (type) => {
    switch (type) {
      case 'thank_you': return 'Thank You Note';
      case 'status_inquiry': return 'Status Inquiry';
      case 'feedback_request': return 'Feedback Request';
      case 'networking': return 'Networking';
      default: return 'Follow-Up';
    }
  };

  const handleItemClick = (interview) => {
    if (onFollowUpClick) {
      onFollowUpClick(interview, interview.followUpType);
    }
    setIsExpanded(false);
  };

  if (isMinimized || totalCount === 0) return null;

  // Collapsed state - just the button
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          background: urgentCount > 0 
            ? 'linear-gradient(135deg, #ff5722 0%, #f44336 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }}
      >
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}
        </style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', lineHeight: '1' }}>📧</div>
          {totalCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#fff',
              color: urgentCount > 0 ? '#f44336' : '#667eea',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: `2px solid ${urgentCount > 0 ? '#f44336' : '#667eea'}`
            }}>
              {totalCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded state - full widget
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '420px',
        maxHeight: '600px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        background: urgentCount > 0 
          ? 'linear-gradient(135deg, #ff5722 0%, #f44336 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>📧</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Follow-Up Reminders</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {totalCount} pending
              {urgentCount > 0 && ` • ${urgentCount} urgent`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            title="Minimize"
          >
            ▼
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {followUpItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>All Caught Up!</div>
            <div style={{ fontSize: '14px' }}>No pending follow-ups</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {followUpItems.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  padding: '14px',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  border: `2px solid ${getUrgencyColor(item.urgency)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleItemClick(item)}
              >
                {/* Header with urgency badge */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'start',
                  marginBottom: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '14px', 
                      color: '#333',
                      marginBottom: '4px'
                    }}>
                      {item.position || item.scenario_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {item.company || item.company_name}
                    </div>
                  </div>
                  <div style={{
                    background: getUrgencyColor(item.urgency),
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    minWidth: '70px',
                    textAlign: 'center'
                  }}>
                    {item.urgency}
                  </div>
                </div>

                {/* Follow-up details */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{getFollowUpIcon(item.followUpType)}</span>
                    <span style={{ fontWeight: '600', color: '#333' }}>
                      {getFollowUpLabel(item.followUpType)}
                    </span>
                  </div>
                  <div style={{ color: '#666', paddingLeft: '22px' }}>
                    {item.message}
                  </div>
                  <div style={{ color: '#999', paddingLeft: '22px' }}>
                    Interview: {item.daysSince === 0 ? 'Today' : 
                      item.daysSince === 1 ? 'Yesterday' : 
                      `${item.daysSince} days ago`}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Generate {getFollowUpLabel(item.followUpType)}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #e0e0e0',
        padding: '12px 16px',
        background: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              flex: 1,
              padding: '10px',
              background: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#757575'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#9e9e9e'}
          >
            ✕ Close
          </button>
        </div>
        
        {/* Best practices tip */}
        <div style={{
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
          padding: '8px',
          background: '#fff3cd',
          borderRadius: '4px',
          border: '1px solid #ffc107'
        }}>
          💡 <strong>Tip:</strong> Send thank you notes within 24 hours for best results
        </div>
      </div>
    </div>
  );
}