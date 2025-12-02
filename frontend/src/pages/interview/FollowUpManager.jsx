import React, { useState, useEffect } from 'react';
import { InterviewScheduleAPI, FollowUpAPI } from '../../api/interviewSchedule';
import ProfilesAPI from '../../api/profiles';

function FollowUpManager() {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [templateType, setTemplateType] = useState('thank_you');
  const [customNotes, setCustomNotes] = useState('');
  const [specificTopics, setSpecificTopics] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [suggestedSendTime, setSuggestedSendTime] = useState(null);
  
  const templateTypes = [
    { value: 'thank_you', label: '✉️ Thank You Note', description: 'Send within 24 hours of interview', timing: '4 hours after interview' },
    { value: 'status_inquiry', label: '❓ Status Inquiry', description: 'Follow up on decision timeline', timing: '5-7 days after interview' },
    { value: 'feedback_request', label: '📝 Feedback Request', description: 'Ask for constructive feedback', timing: '3 days after outcome' },
    { value: 'networking', label: '🤝 Networking Follow-up', description: 'Maintain professional relationship', timing: '1 week after rejection' }
  ];
  
  useEffect(() => {
    loadUserProfile();
    loadCompletedInterviews();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const response = await ProfilesAPI.get();
      setUserProfile(response.data);
    } catch (err) {
      console.error('[FollowUpManager] Error loading profile:', err);
    }
  };
  
  const loadCompletedInterviews = async () => {
    try {
      const response = await InterviewScheduleAPI.getUpcomingInterviews();
      const data = response.data;
      
      const allInterviews = [
        ...(data.upcoming_interviews || []),
        ...(data.past_interviews || [])
      ];
      
      const completed = allInterviews
        .filter(i => i.status === 'completed')
        .sort((a, b) => new Date(b.interview_datetime) - new Date(a.interview_datetime));
      
      setInterviews(completed);
      
      // Set default recipient email if an interview is selected
      if (selectedInterview) {
        const updatedInterview = completed.find(i => 
          (i.uuid || i._id) === (selectedInterview.uuid || selectedInterview._id)
        );
        if (updatedInterview) {
          setSelectedInterview(updatedInterview);
          // Only set default email if current email is empty
          if (!recipientEmail) {
            setRecipientEmail(updatedInterview.interviewer_email || '');
          }
        }
      }
      
      setError('');
    } catch (err) {
      console.error('[FollowUpManager] Error loading interviews:', err);
      setError('Failed to load interviews: ' + (err.response?.data?.detail || err.message));
    }
  };
  
  const handleGenerate = async () => {
    if (!selectedInterview) {
      setError('Please select an interview');
      return;
    }
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid recipient email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const topics = specificTopics.split(',').map(t => t.trim()).filter(t => t);
      
      const response = await FollowUpAPI.generateTemplate(
        selectedInterview.uuid || selectedInterview._id,
        templateType,
        customNotes || null,
        topics.length > 0 ? topics : null
      );
      
      const data = response.data;
      
      // Keep the recipient email they entered, don't override it
      setGeneratedTemplate({
        template_uuid: data.template_uuid,
        subject: data.subject,
        body: data.body,
        interviewer_email: data.interviewer_email || selectedInterview.interviewer_email,
        user_email: data.user_email
      });
      
      // recipientEmail is already set from the input field
      setEditedSubject(data.subject);
      setEditedBody(data.body);
      setSuggestedSendTime(data.suggested_send_time);
      setIsEditing(false);
    } catch (err) {
      console.error('[FollowUpManager] Error generating template:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSend = async () => {
    if (!generatedTemplate) return;
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setSendingEmail(true);
    setError('');
    
    try {
      // Use the FollowUpAPI with edited subject and body
      const response = await FollowUpAPI.sendEmail(
        generatedTemplate.template_uuid,
        recipientEmail,
        editedSubject,
        editedBody
      );
      
      const result = response.data;
      
      const sentTo = result.sent_to || recipientEmail;
      const sentFrom = result.sent_from || userProfile?.email || 'system';
      
      alert(`✅ Email sent successfully!\n\nFrom: ${sentFrom}\nTo: ${sentTo}\n\nThe follow-up has been sent and tracked in your system.`);
      
      // Reset all state
      setGeneratedTemplate(null);
      setSelectedInterview(null);
      setCustomNotes('');
      setSpecificTopics('');
      setRecipientEmail('');
      setEditedSubject('');
      setEditedBody('');
      setIsEditing(false);
      
      // Reload interviews to show updated status
      await loadCompletedInterviews();
    } catch (err) {
      console.error('[FollowUpManager] Error sending follow-up:', err);
      
      // Better error handling
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to send follow-up. Please try again.');
      }
    } finally {
      setSendingEmail(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    const fullEmail = `Subject: ${editedSubject}\n\n${editedBody}`;
    navigator.clipboard.writeText(fullEmail);
    alert('Email template copied to clipboard!');
  };
  
  const daysSince = (datetime) => {
    const days = Math.floor((new Date() - new Date(datetime)) / (1000 * 60 * 60 * 24));
    return days;
  };
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Follow-Up Manager</h1>
        <p style={{ color: '#666', margin: 0 }}>Generate and send professional follow-up communications</p>
      </div>
      
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: '#fee',
          color: '#c33',
          borderRadius: '8px',
          border: '1px solid #fcc'
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: '#c33'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {userProfile && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: '#e7f3ff',
          borderRadius: '8px',
          border: '1px solid #b3d9ff',
          fontSize: '0.9rem'
        }}>
          <strong>📧 Sending as:</strong> {userProfile.full_name || 'User'} ({userProfile.email || 'No email set'})
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Select Interview</h3>
          
          {interviews.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f8f9fa',
              borderRadius: '8px',
              color: '#666'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              <p>No completed interviews yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Complete an interview first to generate follow-ups
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {interviews.map(interview => {
                const days = daysSince(interview.interview_datetime);
                const interviewId = interview.uuid || interview._id;
                return (
                  <div
                    key={interviewId}
                    onClick={() => {
                      setSelectedInterview(interview);
                      // Always set recipient email when selecting a new interview
                      setRecipientEmail(interview.interviewer_email || '');
                    }}
                    style={{
                      padding: '1rem',
                      border: selectedInterview?.uuid === interview.uuid || selectedInterview?._id === interview._id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedInterview?.uuid === interview.uuid || selectedInterview?._id === interview._id ? '#f0f4ff' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {interview.scenario_name || interview.job_title || 'Interview'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                      {interview.company_name || 'Company'}
                    </div>
                    {interview.interviewer_name && (
                      <div style={{ fontSize: '0.85rem', color: '#667eea', marginBottom: '0.25rem' }}>
                        👤 {interview.interviewer_name}
                        {interview.interviewer_email && (
                          <span style={{ color: '#999' }}> • {interview.interviewer_email}</span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#999' }}>
                      {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`}
                    </div>
                    {interview.outcome && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        background: interview.outcome === 'passed' ? '#d4edda' : interview.outcome === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color: interview.outcome === 'passed' ? '#155724' : interview.outcome === 'rejected' ? '#721c24' : '#856404',
                        display: 'inline-block'
                      }}>
                        {interview.outcome === 'passed' ? '✓ Offer Received' : interview.outcome === 'rejected' ? '✗ Not Selected' : 'Pending'}
                      </div>
                    )}
                    {interview.thank_you_note_sent && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#28a745'
                      }}>
                        ✓ Thank you sent
                      </div>
                    )}
                    {interview.follow_up_actions && interview.follow_up_actions.length > 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#667eea'
                      }}>
                        📧 {interview.follow_up_actions.length} follow-up{interview.follow_up_actions.length !== 1 ? 's' : ''} sent
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div>
          {!selectedInterview ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8f9fa', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
              <h3>Select an Interview</h3>
              <p style={{ color: '#666' }}>Choose an interview from the list to generate a follow-up</p>
            </div>
          ) : !generatedTemplate ? (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Generate Follow-Up</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>
                  Template Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {templateTypes.map(type => (
                    <div
                      key={type.value}
                      onClick={() => setTemplateType(type.value)}
                      style={{
                        padding: '1rem',
                        border: templateType === type.value ? '2px solid #667eea' : '1px solid #e0e0e0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: templateType === type.value ? '#f0f4ff' : 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{type.label}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{type.description}</div>
                      <div style={{ fontSize: '0.75rem', color: '#667eea', marginTop: '0.5rem' }}>
                        ⏰ Best timing: {type.timing}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Specific Topics Discussed (optional)
                </label>
                <input
                  type="text"
                  value={specificTopics}
                  onChange={(e) => setSpecificTopics(e.target.value)}
                  placeholder="e.g., microservices architecture, team culture, growth opportunities"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  Separate multiple topics with commas
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Custom Notes to Include (optional)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows="4"
                  placeholder="Add any personal notes or specific points you want to mention..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Recipient Email <span style={{ color: '#c33' }}>*</span>
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="interviewer@company.com"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: recipientEmail && !recipientEmail.includes('@') ? '2px solid #c33' : '1px solid #ddd', 
                    borderRadius: '6px', 
                    fontSize: '1rem', 
                    boxSizing: 'border-box' 
                  }}
                />
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  {selectedInterview?.interviewer_email && (
                    <span>Default: {selectedInterview.interviewer_email}</span>
                  )}
                  {!recipientEmail && !selectedInterview?.interviewer_email && (
                    <span style={{ color: '#c33' }}>Required: Enter the recipient's email address</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={loading || !recipientEmail || !recipientEmail.includes('@')}
                style={{
                  padding: '0.75rem 2rem',
                  background: (loading || !recipientEmail || !recipientEmail.includes('@')) ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (loading || !recipientEmail || !recipientEmail.includes('@')) ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  width: '100%'
                }}
              >
                {loading ? 'Generating...' : 'Generate Template'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Generated Follow-Up</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleCopyToClipboard}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      color: '#667eea',
                      border: '1px solid #667eea',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      color: '#667eea',
                      border: '1px solid #667eea',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {isEditing ? '👁 Preview' : '✏️ Edit'}
                  </button>
                </div>
              </div>
              
              {/* Recommended Timing */}
              {suggestedSendTime && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: '#f0f4ff',
                  borderRadius: '6px',
                  border: '1px solid #667eea',
                  fontSize: '0.9rem'
                }}>
                  <strong>⏰ Recommended Send Time:</strong> {new Date(suggestedSendTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    {templateType === 'thank_you' && 'Send within 24 hours for best results'}
                    {templateType === 'status_inquiry' && 'Follow up after giving them time to decide'}
                    {templateType === 'feedback_request' && 'Request feedback after processing the outcome'}
                    {templateType === 'networking' && 'Maintain relationship after some time has passed'}
                  </div>
                </div>
              )}
              
              {/* Editable Recipient Email */}
              <div style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                marginBottom: '1rem',
                border: '1px solid #e0e0e0'
              }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  📧 Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter recipient email address"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                {userProfile?.email && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>From:</strong> {userProfile.email}
                  </div>
                )}
              </div>
              
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', background: '#f8f9fa' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontWeight: '600', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>Subject: {editedSubject}</div>
                  )}
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  {isEditing ? (
                    <textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows="15"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1rem' }}>
                      {editedBody}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setGeneratedTemplate(null);
                    setRecipientEmail('');
                    setError('');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    flex: 1
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={sendingEmail || !recipientEmail || !recipientEmail.includes('@')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: sendingEmail || !recipientEmail || !recipientEmail.includes('@') ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: sendingEmail || !recipientEmail || !recipientEmail.includes('@') ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem',
                    flex: 2
                  }}
                  title={!recipientEmail || !recipientEmail.includes('@') ? 'Please enter a valid email address' : ''}
                >
                  {sendingEmail ? 'Sending Email...' : '📧 Send Email Now'}
                </button>
              </div>
              
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '6px', fontSize: '0.9rem' }}>
                <strong>💡 Tip:</strong> You can edit the recipient email address above before sending. The email will be sent immediately when you click "Send Email Now".
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowUpManager;