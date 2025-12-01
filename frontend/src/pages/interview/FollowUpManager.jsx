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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const templateTypes = [
    { value: 'thank_you', label: '✉️ Thank You Note', description: 'Send within 24 hours of interview' },
    { value: 'status_inquiry', label: '❓ Status Inquiry', description: 'Follow up on decision timeline' },
    { value: 'feedback_request', label: '📝 Feedback Request', description: 'Ask for constructive feedback' },
    { value: 'networking', label: '🤝 Networking Follow-up', description: 'Maintain professional relationship' }
  ];
  
  useEffect(() => {
    loadUserProfile();
    loadCompletedInterviews();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      console.log('[FollowUpManager] Loading user profile...');
      const response = await ProfilesAPI.get();
      console.log('[FollowUpManager] User profile:', response.data);
      setUserProfile(response.data);
    } catch (err) {
      console.error('[FollowUpManager] Error loading profile:', err);
      // Don't set error state here - profile is optional
    }
  };
  
  const loadCompletedInterviews = async () => {
    try {
      console.log('[FollowUpManager] Loading completed interviews...');
      
      const response = await InterviewScheduleAPI.getUpcomingInterviews();
      console.log('[FollowUpManager] API Response:', response.data);
      
      const data = response.data;
      
      // Filter to completed interviews and sort by date
      const allInterviews = [
        ...(data.upcoming_interviews || []),
        ...(data.past_interviews || [])
      ];
      
      const completed = allInterviews
        .filter(i => i.status === 'completed')
        .sort((a, b) => new Date(b.interview_datetime) - new Date(a.interview_datetime));
      
      console.log('[FollowUpManager] Completed interviews:', completed.length);
      setInterviews(completed);
      setError('');
    } catch (err) {
      console.error('[FollowUpManager] Error loading interviews:', err);
      setError('Failed to load interviews: ' + (err.response?.data?.detail || err.message));
    }
  };
  
  const replaceTemplatePlaceholders = (text) => {
    if (!text) return text;
    
    let updatedText = text;
    
    // Replace [Your Name] with actual user name
    if (userProfile?.full_name) {
      updatedText = updatedText.replace(/\[Your Name\]/g, userProfile.full_name);
    }
    
    // Replace "Hiring Team" or "Dear Hiring Team" with interviewer name if available
    if (selectedInterview?.interviewer_name) {
      updatedText = updatedText.replace(
        /Dear Hiring Team/g, 
        `Dear ${selectedInterview.interviewer_name}`
      );
      updatedText = updatedText.replace(
        /Hiring Team/g, 
        selectedInterview.interviewer_name
      );
    }
    
    return updatedText;
  };
  
  const handleGenerate = async () => {
    if (!selectedInterview) {
      setError('Please select an interview');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('[FollowUpManager] Generating template for:', selectedInterview.uuid || selectedInterview._id);
      
      const topics = specificTopics.split(',').map(t => t.trim()).filter(t => t);
      
      const response = await FollowUpAPI.generateTemplate(
        selectedInterview.uuid || selectedInterview._id,
        templateType,
        customNotes || null,
        topics.length > 0 ? topics : null
      );
      
      console.log('[FollowUpManager] Generated template:', response.data);
      
      const data = response.data;
      
      // Replace placeholders in both subject and body
      const processedSubject = replaceTemplatePlaceholders(data.subject);
      const processedBody = replaceTemplatePlaceholders(data.body);
      
      setGeneratedTemplate({
        template_uuid: data.template_uuid,
        subject: processedSubject,
        body: processedBody,
        suggested_send_time: data.suggested_send_time,
        interviewer_email: data.interviewer_email || selectedInterview.interviewer_email
      });
      
      setEditedSubject(processedSubject);
      setEditedBody(processedBody);
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
    
    setSendingEmail(true);
    setError('');
    
    try {
      console.log('[FollowUpManager] Marking template as sent:', generatedTemplate.template_uuid);
      
      // Mark template as sent in the backend
      await FollowUpAPI.markAsSent(generatedTemplate.template_uuid);
      
      console.log('[FollowUpManager] Template marked as sent');
      
      // Get recipient email (interviewer or fallback to empty)
      const recipientEmail = generatedTemplate.interviewer_email || '';
      
      // Get sender email (from user profile)
      const senderEmail = userProfile?.email || '';
      
      // Build mailto link with proper formatting
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}${senderEmail ? `&from=${encodeURIComponent(senderEmail)}` : ''}`;
      
      console.log('[FollowUpManager] Opening email client for:', recipientEmail);
      
      // Open the user's email client
      window.location.href = mailtoLink;
      
      // Show success message
      alert(`Follow-up tracked successfully!\n\nYour email client has been opened with:\nTo: ${recipientEmail || 'Add recipient'}\nFrom: ${senderEmail || 'Your email'}\n\nThe follow-up has been marked as sent in your tracking system.`);
      
      // Reset form
      setGeneratedTemplate(null);
      setSelectedInterview(null);
      setCustomNotes('');
      setSpecificTopics('');
      
      // Reload interviews to update status
      await loadCompletedInterviews();
    } catch (err) {
      console.error('[FollowUpManager] Error sending follow-up:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to send follow-up');
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
      
      {/* Show user info if loaded */}
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
        {/* Left Panel - Interview Selection */}
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
                    onClick={() => setSelectedInterview(interview)}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Right Panel - Template Generation */}
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
              
              {/* Show recipient info */}
              {selectedInterview.interviewer_name && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  background: '#f0f4ff',
                  borderRadius: '8px',
                  border: '1px solid #667eea',
                  fontSize: '0.9rem'
                }}>
                  <strong>📨 Recipient:</strong> {selectedInterview.interviewer_name}
                  {selectedInterview.interviewer_email && (
                    <span style={{ color: '#666' }}> ({selectedInterview.interviewer_email})</span>
                  )}
                </div>
              )}
              
              {/* Template Type Selection */}
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
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Specific Topics */}
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
              
              {/* Custom Notes */}
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
              
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  background: loading ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
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
              
              {/* Email Recipient Info */}
              <div style={{
                padding: '0.75rem 1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                border: '1px solid #e0e0e0'
              }}>
                <div><strong>To:</strong> {generatedTemplate.interviewer_email || 'No email available'}</div>
                {userProfile?.email && (
                  <div style={{ marginTop: '0.25rem' }}><strong>From:</strong> {userProfile.email}</div>
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
              
              {generatedTemplate.suggested_send_time && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#e7f3ff',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  border: '1px solid #b3d9ff'
                }}>
                  <strong>💡 Recommended timing:</strong> Send by {new Date(generatedTemplate.suggested_send_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setGeneratedTemplate(null);
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
                  disabled={sendingEmail || !generatedTemplate.interviewer_email}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: sendingEmail || !generatedTemplate.interviewer_email ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: sendingEmail || !generatedTemplate.interviewer_email ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem',
                    flex: 2
                  }}
                  title={!generatedTemplate.interviewer_email ? 'No interviewer email available' : ''}
                >
                  {sendingEmail ? 'Sending...' : '📧 Send Email'}
                </button>
              </div>
              
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '6px', fontSize: '0.9rem' }}>
                <strong>💡 Tip:</strong> Review and personalize the template before sending for best results. This will open your email client with the template pre-filled.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowUpManager;