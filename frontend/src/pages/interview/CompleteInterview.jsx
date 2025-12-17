import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';

function CompleteInterview() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showFollowUpSuggestion, setShowFollowUpSuggestion] = useState(false);
  
  const [formData, setFormData] = useState({
    outcome: 'pending',
    outcome_notes: '',
    interviewer_feedback: '',
    performance_rating: 0,
    questions_discussed: '',
    what_went_well: '',
    what_to_improve: ''
  });
  
  useEffect(() => {
    if (scheduleId) {
      loadInterview();
    }
  }, [scheduleId]);
  
  const loadInterview = async () => {
    setLoading(true);
    try {
      console.log('[CompleteInterview] Loading interview:', scheduleId);
      
      const response = await InterviewScheduleAPI.getSchedule(scheduleId);
      console.log('[CompleteInterview] API Response:', response.data);
      
      // Handle both response formats
      const interviewData = response.data?.interview || response.data;
      
      if (!interviewData) {
        throw new Error('Interview not found');
      }
      
      console.log('[CompleteInterview] Interview data:', interviewData);
      setInterview(interviewData);
      setMessage('');
    } catch (error) {
      console.error('[CompleteInterview] Failed to load interview:', error);
      setMessage('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };
  
  const outcomes = [
    { value: 'passed', label: '✅ Passed - Moving Forward', color: '#28a745' },
    { value: 'rejected', label: '❌ Rejected - Not Selected', color: '#dc3545' },
    { value: 'pending', label: '⏳ Pending - Awaiting Decision', color: '#ffc107' }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, performance_rating: rating }));
  };
  
  const handleSubmit = async () => {
    if (!formData.outcome) {
      setMessage('Please select an outcome');
      return;
    }
    
    setSubmitting(true);
    setMessage('');
    
    try {
      console.log('[CompleteInterview] Submitting:', formData);
      
      // Call the API to complete the interview
      await InterviewScheduleAPI.completeInterview(scheduleId, {
        outcome: formData.outcome,
        outcome_notes: formData.outcome_notes,
        interviewer_feedback: formData.interviewer_feedback
      });
      
      console.log('[CompleteInterview] Successfully completed interview');
      setMessage('Interview completed successfully!');
      
      setTimeout(() => {
        setShowFollowUpSuggestion(true);
      }, 1500);
    } catch (error) {
      console.error('[CompleteInterview] Error:', error);
      setMessage('Failed to complete interview: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p>Loading interview details...</p>
      </div>
    );
  }
  
  if (!interview) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Interview not found</p>
          <button 
            onClick={() => navigate('/interview/calendar')}
            className="btn btn-primary"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {!showFollowUpSuggestion ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => navigate('/interview/calendar')}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Back to Calendar
            </button>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Complete Interview</h1>
            <p style={{ color: '#666', margin: 0 }}>Record the outcome and your experience</p>
          </div>
          
          {/* Interview Info Card */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {interview.scenario_name || interview.job_title || 'Interview'}
            </div>
            <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.25rem' }}>
              {interview.company_name || 'Company'}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Interviewed with {interview.interviewer_name || 'Interviewer'} on {new Date(interview.interview_datetime).toLocaleDateString()}
            </div>
          </div>
          
          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              background: message.includes('success') ? '#d4edda' : '#f8d7da',
              color: message.includes('success') ? '#155724' : '#721c24',
              border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {message}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Interview Outcome */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                Interview Outcome *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {outcomes.map(outcome => (
                  <div
                    key={outcome.value}
                    onClick={() => setFormData(prev => ({ ...prev, outcome: outcome.value }))}
                    style={{
                      padding: '1.5rem',
                      border: formData.outcome === outcome.value ? `3px solid ${outcome.color}` : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: formData.outcome === outcome.value ? `${outcome.color}10` : 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {outcome.label.split(' ')[0]}
                    </div>
                    <div style={{ fontWeight: '500', color: outcome.color }}>
                      {outcome.label.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Performance Rating */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                Rate Your Performance
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem 0' }}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <div
                    key={rating}
                    onClick={() => handleRatingClick(rating)}
                    style={{
                      fontSize: '3rem',
                      cursor: 'pointer',
                      opacity: formData.performance_rating >= rating ? 1 : 0.3,
                      transition: 'all 0.2s ease',
                      transform: formData.performance_rating >= rating ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    ⭐
                  </div>
                ))}
              </div>
              {formData.performance_rating > 0 && (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                  {formData.performance_rating === 5 ? 'Excellent!' : 
                   formData.performance_rating === 4 ? 'Very Good' :
                   formData.performance_rating === 3 ? 'Good' :
                   formData.performance_rating === 2 ? 'Fair' : 'Needs Improvement'}
                </div>
              )}
            </div>
            
            {/* Outcome Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                Outcome Notes
              </label>
              <textarea
                name="outcome_notes"
                value={formData.outcome_notes}
                onChange={handleChange}
                rows="4"
                placeholder="Any additional details about the outcome..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            {/* Interviewer Feedback */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                Interviewer Feedback
              </label>
              <textarea
                name="interviewer_feedback"
                value={formData.interviewer_feedback}
                onChange={handleChange}
                rows="4"
                placeholder="Any feedback received from the interviewer..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            {/* Questions/Topics Discussed */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                Questions/Topics Discussed
              </label>
              <textarea
                name="questions_discussed"
                value={formData.questions_discussed}
                onChange={handleChange}
                rows="3"
                placeholder="List the main questions or topics covered in the interview..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            {/* What Went Well / What to Improve */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                  ✅ What Went Well
                </label>
                <textarea
                  name="what_went_well"
                  value={formData.what_went_well}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Aspects of your performance that went well..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    resize: 'vertical',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', fontSize: '1.1rem' }}>
                  ⚠️ What to Improve
                </label>
                <textarea
                  name="what_to_improve"
                  value={formData.what_to_improve}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Areas you'd like to improve for next time..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    resize: 'vertical',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={() => navigate('/interview/calendar')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.outcome}
                style={{
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: submitting || !formData.outcome ? '#ccc' : '#667eea',
                  color: 'white',
                  cursor: submitting || !formData.outcome ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  flex: 2
                }}
              >
                {submitting ? 'Saving...' : 'Complete Interview'}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Follow-Up Suggestion Screen */
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
          <h2 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>Interview Completed!</h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Your interview experience has been recorded successfully.
          </p>
          
          <div style={{
            padding: '2rem',
            background: '#f0f4ff',
            border: '2px solid #667eea',
            borderRadius: '12px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginTop: 0, color: '#667eea' }}>💡 Next Step Recommendation</h3>
            {formData.outcome === 'passed' ? (
              <p style={{ color: '#333', lineHeight: '1.6' }}>
                Congratulations! We recommend sending a thank you email expressing your excitement about the offer
                and confirming your interest in the position.
              </p>
            ) : formData.outcome === 'rejected' ? (
              <p style={{ color: '#333', lineHeight: '1.6' }}>
                Consider sending a thank you email and requesting feedback to help improve your future interviews.
                You might also want to maintain the professional relationship for future opportunities.
              </p>
            ) : (
              <p style={{ color: '#333', lineHeight: '1.6' }}>
                We recommend sending a thank you email within 24 hours to reiterate your interest and keep
                the conversation fresh.
              </p>
            )}
            
            <button
              onClick={() => navigate(`/interview/follow-up`)}
              className="btn btn-primary"
            >
              Generate Follow-Up Email
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/interview/calendar')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem'
              }}
            >
              Back to Calendar
            </button>
            <button
              onClick={() => navigate('/interview/analytics')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem'
              }}
            >
              View Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompleteInterview;