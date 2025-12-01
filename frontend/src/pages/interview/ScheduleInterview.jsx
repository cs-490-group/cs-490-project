import React, { useState, useEffect } from 'react';

function ScheduleInterviewFromJob({ jobId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    job_application_uuid: jobId,
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
    calendar_provider: '',
    auto_generate_prep_tasks: true,
    notes: ''
  });
  
  const [jobDetails, setJobDetails] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate loading job details
    setJobDetails({
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.'
    });
    
    // Simulate calendar status
    setCalendarStatus({
      connected: false,
      provider: null
    });
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.interview_datetime) {
      setError('Please select interview date and time');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      onSuccess?.({ message: 'Interview scheduled successfully!' });
      onClose?.();
    }, 1000);
  };

  const connectCalendar = (provider) => {
    alert(`Connecting to ${provider} Calendar... (OAuth flow would open here)`);
    setTimeout(() => {
      setCalendarStatus({
        connected: true,
        provider: provider
      });
      setFormData(prev => ({ ...prev, calendar_provider: provider }));
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              Schedule Interview
            </h2>
            {jobDetails && (
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                {jobDetails.title} at {jobDetails.company}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee',
              color: '#c33',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Interview Date & Time *
            </label>
            <input
              type="datetime-local"
              name="interview_datetime"
              value={formData.interview_datetime}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Timezone
              </label>
              <input
                type="text"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Duration (min)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="15"
                step="15"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Interview Format *
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['video', 'phone', 'in-person'].map(type => (
                <label key={type} style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid',
                  borderColor: formData.location_type === type ? '#007bff' : '#ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  background: formData.location_type === type ? '#f0f7ff' : 'white'
                }}>
                  <input
                    type="radio"
                    name="location_type"
                    value={type}
                    checked={formData.location_type === type}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                    {type === 'video' ? '🎥' : type === 'phone' ? '📞' : '🏢'}
                  </div>
                  <div style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                    {type.replace('-', ' ')}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {formData.location_type === 'video' && (
            <div style={{
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Platform
                  </label>
                  <select
                    name="video_platform"
                    value={formData.video_platform}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  >
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    name="video_link"
                    value={formData.video_link}
                    onChange={handleChange}
                    placeholder="Auto-generated if left empty"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {formData.location_type === 'phone' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
          )}

          {formData.location_type === 'in-person' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Location Address
              </label>
              <input
                type="text"
                name="location_details"
                value={formData.location_details}
                onChange={handleChange}
                placeholder="123 Main St, City, State 12345"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
          )}

          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
              Interviewer Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Name
                </label>
                <input
                  type="text"
                  name="interviewer_name"
                  value={formData.interviewer_name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Title
                </label>
                <input
                  type="text"
                  name="interviewer_title"
                  value={formData.interviewer_title}
                  onChange={handleChange}
                  placeholder="Engineering Manager"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="interviewer_email"
                  value={formData.interviewer_email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="interviewer_phone"
                  value={formData.interviewer_phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{
            background: '#f0f7ff',
            border: '1px solid #b3d9ff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
              📅 Calendar Sync
            </h4>
            {calendarStatus?.connected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '8px 12px',
                  background: '#d4edda',
                  color: '#155724',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  ✓ Connected to {calendarStatus.provider === 'google' ? 'Google Calendar' : 'Outlook'}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!formData.calendar_provider}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      calendar_provider: e.target.checked ? calendarStatus.provider : ''
                    }))}
                  />
                  <span style={{ fontSize: '14px' }}>Add to calendar</span>
                </label>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#666' }}>
                  Connect your calendar to automatically sync interviews
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => connectCalendar('google')}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Connect Google Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => connectCalendar('outlook')}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Connect Outlook
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <input
                type="checkbox"
                name="auto_generate_prep_tasks"
                checked={formData.auto_generate_prep_tasks}
                onChange={handleChange}
              />
              <span style={{ fontWeight: '500' }}>
                ✨ Automatically generate preparation checklist
              </span>
            </label>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Add any additional notes..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                resize: 'vertical',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#ccc' : '#007bff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleInterviewFromJob;