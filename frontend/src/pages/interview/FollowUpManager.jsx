import React, { useState } from 'react';

function FollowUpManager() {
  const [interviews, setInterviews] = useState([
    { uuid: '1', company: 'TechCorp', position: 'Software Engineer', interviewer_name: 'Jane Smith', interview_datetime: '2025-11-25T14:00:00', status: 'completed', outcome: null },
    { uuid: '2', company: 'StartupXYZ', position: 'Product Manager', interviewer_name: 'John Doe', interview_datetime: '2025-11-20T10:00:00', status: 'completed', outcome: 'rejected' },
    { uuid: '3', company: 'BigCo', position: 'Data Scientist', interviewer_name: 'Alice Johnson', interview_datetime: '2025-11-15T15:30:00', status: 'completed', outcome: 'passed' }
  ]);
  
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [templateType, setTemplateType] = useState('thank_you');
  const [customNotes, setCustomNotes] = useState('');
  const [specificTopics, setSpecificTopics] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  
  const templateTypes = [
    { value: 'thank_you', label: '✉️ Thank You Note', description: 'Send within 24 hours of interview' },
    { value: 'status_inquiry', label: '❓ Status Inquiry', description: 'Follow up on decision timeline' },
    { value: 'feedback_request', label: '📝 Feedback Request', description: 'Ask for constructive feedback' },
    { value: 'networking', label: '🤝 Networking Follow-up', description: 'Maintain professional relationship' }
  ];
  
  const handleGenerate = () => {
    if (!selectedInterview) {
      alert('Please select an interview');
      return;
    }
    
    const topics = specificTopics.split(',').map(t => t.trim()).filter(t => t);
    
    // Simulate template generation
    const templates = {
      thank_you: {
        subject: `Thank You - ${selectedInterview.position} Interview`,
        body: `Dear ${selectedInterview.interviewer_name},

Thank you for taking the time to meet with me on ${new Date(selectedInterview.interview_datetime).toLocaleDateString()} to discuss the ${selectedInterview.position} position at ${selectedInterview.company}. I truly enjoyed our conversation and learning more about the role and your team.

${topics.length > 0 ? `I was particularly interested in our discussion about ${topics.join(', ')}. It reinforced my enthusiasm for this opportunity and how my skills align with the team's needs.\n\n` : ''}${customNotes ? customNotes + '\n\n' : ''}I'm excited about the possibility of contributing to ${selectedInterview.company}'s success and believe my experience would enable me to make an immediate impact on your team.

Thank you again for the opportunity to interview. I look forward to hearing from you about the next steps in the process.

Best regards,
[Your Name]`
      },
      status_inquiry: {
        subject: `Following Up - ${selectedInterview.position} Position`,
        body: `Dear ${selectedInterview.interviewer_name},

I hope this email finds you well. I wanted to follow up regarding the ${selectedInterview.position} position we discussed during our interview on ${new Date(selectedInterview.interview_datetime).toLocaleDateString()}.

I remain very interested in joining ${selectedInterview.company} and contributing to your team's success. I wanted to check in to see if there are any updates on the hiring timeline or if you need any additional information from me.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
[Your Name]`
      },
      feedback_request: {
        subject: `Feedback Request - ${selectedInterview.position} Interview`,
        body: `Dear ${selectedInterview.interviewer_name},

Thank you for taking the time to interview me for the ${selectedInterview.position} position${selectedInterview.outcome === 'passed' ? '. I\'m excited to have received the offer' : ''}${selectedInterview.outcome === 'rejected' ? '. While I\'m disappointed not to be moving forward' : ''}.

I'm committed to continuous improvement and would greatly appreciate any feedback you could provide about my interview performance. Understanding areas where I could strengthen my candidacy would be invaluable for my professional development.

Any insights you can share would be greatly appreciated.

Best regards,
[Your Name]`
      },
      networking: {
        subject: 'Thank You and Staying Connected',
        body: `Dear ${selectedInterview.interviewer_name},

I wanted to reach out one more time to thank you for the opportunity to interview for the ${selectedInterview.position} position at ${selectedInterview.company}. Although I won't be joining the team at this time, I truly enjoyed learning about your work and the culture at ${selectedInterview.company}.

I would love to stay connected and hear about any future opportunities that might be a good fit. If you're open to it, I'd appreciate the opportunity to connect on LinkedIn and stay in touch.

Wishing you and the team continued success.

Best regards,
[Your Name]`
      }
    };
    
    const template = templates[templateType];
    setGeneratedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.body);
    setIsEditing(false);
  };
  
  const handleSend = () => {
    alert('Follow-up email sent successfully!\n\nIn production, this would:\n1. Send the email via your email client\n2. Track the sent status\n3. Set reminder for response follow-up');
    setGeneratedTemplate(null);
    setSelectedInterview(null);
    setCustomNotes('');
    setSpecificTopics('');
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
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Panel - Interview Selection */}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Select Interview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {interviews.map(interview => {
              const days = daysSince(interview.interview_datetime);
              return (
                <div
                  key={interview.uuid}
                  onClick={() => setSelectedInterview(interview)}
                  style={{
                    padding: '1rem',
                    border: selectedInterview?.uuid === interview.uuid ? '2px solid #667eea' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedInterview?.uuid === interview.uuid ? '#f0f4ff' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{interview.position}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>{interview.company}</div>
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>
                    Interviewed {days} day{days !== 1 ? 's' : ''} ago
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
                </div>
              );
            })}
          </div>
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
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
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
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', fontSize: '1rem' }}
                />
              </div>
              
              <button
                onClick={handleGenerate}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  width: '100%'
                }}
              >
                Generate Template
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Generated Follow-Up</h3>
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
              
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', background: '#f8f9fa' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontWeight: '600' }}
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
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', fontSize: '1rem', lineHeight: '1.6' }}
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1rem' }}>
                      {editedBody}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setGeneratedTemplate(null)}
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
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem',
                    flex: 2
                  }}
                >
                  📧 Send Email
                </button>
              </div>
              
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '6px', fontSize: '0.9rem' }}>
                <strong>💡 Tip:</strong> Review and personalize the template before sending for best results
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowUpManager;