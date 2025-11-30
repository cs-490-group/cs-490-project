import React, { useState, useEffect } from 'react';

function ScheduleInterview() {
  const [formData, setFormData] = useState({
    job_application_uuid: '',
    interview_datetime: '',
    duration_minutes: 60,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location_type: 'video',
    location_details: '',
    video_platform: 'zoom',
    video_link: '',
    phone_number: '',
    interviewer_name: '',
    interviewer_email: '',
    interviewer_phone: '',
    interviewer_title: '',
    calendar_provider: 'google',
    auto_generate_prep_tasks: true,
    notes: ''
  });
  
  const [jobApplications, setJobApplications] = useState([
    { uuid: '1', company: 'TechCorp', position: 'Software Engineer' },
    { uuid: '2', company: 'StartupXYZ', position: 'Product Manager' }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async () => {
    if (!formData.job_application_uuid || !formData.interview_datetime) {
      setMessage('Please fill in required fields');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Interview scheduled successfully!');
      
      // Reset form
      setTimeout(() => {
        setFormData({
          ...formData,
          job_application_uuid: '',
          interview_datetime: '',
          notes: ''
        });
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Schedule Interview</h1>
        <p style={{ color: '#666', margin: 0 }}>Add a new interview to your calendar</p>
      </div>
      
      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          background: message.includes('success') ? '#d4edda' : '#f8d7da',
          color: message.includes('success') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Job Application Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Job Application *
          </label>
          <select
            name="job_application_uuid"
            value={formData.job_application_uuid}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
          >
            <option value="">Select a job application...</option>
            {jobApplications.map(app => (
              <option key={app.uuid} value={app.uuid}>
                {app.position} at {app.company}
              </option>
            ))}
          </select>
        </div>
        
        {/* Date and Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Interview Date & Time *
            </label>
            <input
              type="datetime-local"
              name="interview_datetime"
              value={formData.interview_datetime}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Duration (min)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min="15"
              step="15"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
        </div>
        
        {/* Location Type */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Interview Type *
          </label>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['video', 'phone', 'in-person'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="location_type"
                  value={type}
                  checked={formData.location_type === type}
                  onChange={handleChange}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{type.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Video Platform */}
        {formData.location_type === 'video' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Platform
              </label>
              <select
                name="video_platform"
                value={formData.video_platform}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              >
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
                <option value="teams">Microsoft Teams</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Meeting Link (optional)
              </label>
              <input
                type="text"
                name="video_link"
                value={formData.video_link}
                onChange={handleChange}
                placeholder="Will auto-generate if empty"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
          </div>
        )}
        
        {/* Phone Number */}
        {formData.location_type === 'phone' && (
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
        )}
        
        {/* Location Details */}
        {formData.location_type === 'in-person' && (
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Location Address
            </label>
            <input
              type="text"
              name="location_details"
              value={formData.location_details}
              onChange={handleChange}
              placeholder="123 Main St, City, State 12345"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
        )}
        
        {/* Interviewer Information */}
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Interviewer Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name</label>
              <input
                type="text"
                name="interviewer_name"
                value={formData.interviewer_name}
                onChange={handleChange}
                placeholder="Jane Smith"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
              <input
                type="text"
                name="interviewer_title"
                value={formData.interviewer_title}
                onChange={handleChange}
                placeholder="Engineering Manager"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
              <input
                type="email"
                name="interviewer_email"
                value={formData.interviewer_email}
                onChange={handleChange}
                placeholder="jane@company.com"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
              <input
                type="tel"
                name="interviewer_phone"
                value={formData.interviewer_phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
          </div>
        </div>
        
        {/* Calendar Integration */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Sync with Calendar
          </label>
          <select
            name="calendar_provider"
            value={formData.calendar_provider}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
          >
            <option value="">None</option>
            <option value="google">Google Calendar</option>
            <option value="outlook">Outlook Calendar</option>
          </select>
        </div>
        
        {/* Auto-generate Tasks */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="auto_generate_prep_tasks"
              checked={formData.auto_generate_prep_tasks}
              onChange={handleChange}
              style={{ cursor: 'pointer' }}
            />
            <span>Automatically generate preparation tasks</span>
          </label>
        </div>
        
        {/* Notes */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Add any additional notes or reminders..."
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', fontSize: '1rem' }}
          />
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '4px',
              background: loading ? '#ccc' : '#007bff',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleInterview;