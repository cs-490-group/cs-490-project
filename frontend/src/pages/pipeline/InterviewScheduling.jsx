import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';
import JobsAPI from '../../api/jobs';

const InterviewScheduling = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load interviews
      const interviewsRes = await InterviewScheduleAPI.getUpcomingInterviews();
      
      // Load jobs that are in Interview status
      const jobsRes = await JobsAPI.getAll();
      
      const allInterviews = [
        ...(interviewsRes.data.upcoming_interviews || []),
        ...(interviewsRes.data.past_interviews || [])
      ];

      // Process interviews data
      const processedInterviews = allInterviews.map(interview => ({
        id: interview.uuid,
        applicationId: interview.job_application_uuid,
        position: interview.scenario_name,
        company: interview.company_name,
        datetime: interview.interview_datetime,
        type: interview.location_type,
        platform: interview.video_platform,
        link: interview.video_link,
        duration: interview.duration_minutes,
        interviewer: interview.interviewer_name ? {
          name: interview.interviewer_name,
          title: interview.interviewer_title,
          email: interview.interviewer_email,
          phone: interview.interviewer_phone
        } : null,
        status: interview.status,
        prepTasks: interview.preparation_tasks || [],
        notes: interview.notes,
        location: interview.location_details,
        phone: interview.phone_number
      }));

      // Process jobs - filter for Interview status
      const interviewJobs = (jobsRes.data || [])
        .filter(job => job.status === 'Interview')
        .map(job => ({
          id: job._id,
          title: job.title,
          company: typeof job.company === 'string' ? job.company : job.company?.name || 'Unknown',
          status: job.status,
          hasInterview: processedInterviews.some(i => i.applicationId === job._id)
        }));

      setInterviews(processedInterviews);
      setApplications(interviewJobs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleFromApplication = (app) => {
    setSelectedApp(app);
    setShowScheduleModal(true);
  };

  const handleScheduleInterview = async (formData) => {
    try {
      await InterviewScheduleAPI.createSchedule({
        job_application_uuid: formData.applicationId,
        interview_datetime: formData.datetime,
        duration_minutes: formData.duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location_type: formData.type,
        location_details: formData.location,
        video_platform: formData.platform,
        video_link: formData.link,
        phone_number: formData.phone,
        interviewer_name: formData.interviewerName,
        interviewer_email: formData.interviewerEmail,
        interviewer_phone: formData.interviewerPhone,
        interviewer_title: formData.interviewerTitle,
        notes: formData.notes,
        scenario_name: selectedApp?.title || formData.position,
        company_name: selectedApp?.company || formData.company
      });

      await loadData(); // Reload data
      setShowScheduleModal(false);
      setSelectedApp(null);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      alert('Failed to schedule interview. Please try again.');
    }
  };

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };

  const getTimeUntil = (datetime) => {
    const now = new Date();
    const interviewDate = new Date(datetime);
    const diffMs = interviewDate - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diffMs < 0) return 'past';
    if (days > 7) return `in ${days} days`;
    if (days > 1) return `in ${days} days`;
    if (days === 1) return 'tomorrow';
    if (hours > 1) return `in ${hours} hours`;
    return 'soon';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f0f0f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '16px', color: '#666' }}>Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
            📅 Interview Scheduling
          </h2>
          <p style={{ margin: '4px 0 0', color: '#666' }}>
            Schedule and manage interviews from your applications
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/interview/calendar')}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            View Full Calendar
          </button>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="calendar">Calendar View</option>
            <option value="list">List View</option>
            <option value="upcoming">Upcoming Only</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{interviews.length}</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Scheduled Interviews</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(240, 147, 251, 0.3)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {applications.filter(a => !a.hasInterview).length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Need Scheduling</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {interviews.filter(i => {
              const prepCompleted = i.prepTasks?.filter(t => t.completed).length || 0;
              const prepTotal = i.prepTasks?.length || 1;
              return prepCompleted === prepTotal;
            }).length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Fully Prepared</div>
        </div>
      </div>

      {/* Applications Needing Scheduling */}
      {applications.filter(a => !a.hasInterview).length > 0 && (
        <div style={{
          background: '#fff8e1',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#856404', fontSize: '18px' }}>
            ⚠️ Applications Ready for Interview Scheduling
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {applications.filter(a => !a.hasInterview).map(app => (
              <div
                key={app.id}
                style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {app.title} at {app.company}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Status: {app.status}
                  </div>
                </div>
                <button
                  onClick={() => handleScheduleFromApplication(app)}
                  style={{
                    padding: '8px 16px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Schedule Interview
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Interviews */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '20px', color: '#333' }}>
          Scheduled Interviews
        </h3>
        {interviews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No interviews scheduled yet</p>
            <p style={{ fontSize: '14px' }}>Schedule interviews from your applications</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px'
          }}>
            {interviews.map(interview => {
              const { date, time, dayOfWeek } = formatDateTime(interview.datetime);
              const timeUntil = getTimeUntil(interview.datetime);
              const prepCompleted = interview.prepTasks?.filter(t => t.completed).length || 0;
              const prepTotal = interview.prepTasks?.length || 1;
              const prepPercentage = Math.round((prepCompleted / prepTotal) * 100);

              return (
                <div
                  key={interview.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Date Badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      minWidth: '80px'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {date.split(' ')[1]}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        {date.split(' ')[0]}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      background: timeUntil === 'past' ? '#e0e0e0' : '#e3f2fd',
                      color: timeUntil === 'past' ? '#666' : '#1976d2',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {timeUntil}
                    </div>
                  </div>

                  {/* Interview Details */}
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                    {interview.position}
                  </h4>
                  <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                    {interview.company}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <div>⏰ {dayOfWeek}, {time}</div>
                    <div>
                      {interview.type === 'video' && `🎥 ${interview.platform || 'Video Call'}`}
                      {interview.type === 'phone' && '📞 Phone Interview'}
                      {interview.type === 'in-person' && '🏢 In-Person'}
                    </div>
                    {interview.interviewer && (
                      <div>
                        👤 {interview.interviewer.name}
                        {interview.interviewer.title && ` - ${interview.interviewer.title}`}
                      </div>
                    )}
                  </div>

                  {/* Preparation Progress */}
                  <div style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '13px'
                    }}>
                      <span style={{ fontWeight: '600' }}>Preparation</span>
                      <span style={{ color: '#667eea', fontWeight: '600' }}>
                        {prepPercentage}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${prepPercentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      {prepCompleted} of {prepTotal} tasks completed
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/interview/prepare/${interview.id}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                    >
                      Prepare
                    </button>
                    {interview.type === 'video' && interview.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(interview.link, '_blank');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        Join Meeting
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedApp && (
        <ScheduleInterviewModal
          application={selectedApp}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedApp(null);
          }}
          onSchedule={handleScheduleInterview}
        />
      )}
    </div>
  );
};

// Schedule Interview Modal Component
const ScheduleInterviewModal = ({ application, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    applicationId: application.id,
    datetime: '',
    duration: 60,
    type: 'video',
    platform: 'zoom',
    link: '',
    phone: '',
    location: '',
    interviewerName: '',
    interviewerTitle: '',
    interviewerEmail: '',
    interviewerPhone: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.datetime) {
      alert('Please select a date and time for the interview');
      return;
    }

    await onSchedule(formData);
  };

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Schedule Interview</h2>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
              {application.title} at {application.company}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              width: '32px',
              height: '32px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* DateTime */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Interview Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min="15"
              max="480"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Interview Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Interview Format *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {['video', 'phone', 'in-person'].map(type => (
                <label
                  key={type}
                  style={{
                    padding: '12px',
                    border: '2px solid',
                    borderColor: formData.type === type ? '#667eea' : '#ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: formData.type === type ? '#f0f4ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                    {type === 'video' ? '🎥' : type === 'phone' ? '📞' : '🏢'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {type === 'in-person' ? 'In-Person' : type}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.type === 'video' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Video Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="meet">Google Meet</option>
                  <option value="webex">Webex</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          {formData.type === 'phone' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {formData.type === 'in-person' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Address
              </label>
              <textarea
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                rows="3"
                placeholder="Enter the full address..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Interviewer Details */}
          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
              Interviewer Information (Optional)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.interviewerName}
                  onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.interviewerTitle}
onChange={(e) => setFormData({ ...formData, interviewerTitle: e.target.value })}
placeholder="e.g., Senior Engineer"
style={{
width: '100%',
padding: '10px',
border: '1px solid #ddd',
borderRadius: '6px',
fontSize: '14px',
boxSizing: 'border-box'
}}
/>
</div>
<div style={{ gridColumn: '1 / -1' }}>
<label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
Email
</label>
<input
type="email"
value={formData.interviewerEmail}
onChange={(e) => setFormData({ ...formData, interviewerEmail: e.target.value })}
style={{
width: '100%',
padding: '10px',
border: '1px solid #ddd',
borderRadius: '6px',
fontSize: '14px',
boxSizing: 'border-box'
}}
/>
</div>
<div style={{ gridColumn: '1 / -1' }}>
<label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
Phone
</label>
<input
type="tel"
value={formData.interviewerPhone}
onChange={(e) => setFormData({ ...formData, interviewerPhone: e.target.value })}
style={{
width: '100%',
padding: '10px',
border: '1px solid #ddd',
borderRadius: '6px',
fontSize: '14px',
boxSizing: 'border-box'
}}
/>
</div>
</div>
</div>
      {/* Notes */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows="3"
          placeholder="Add any additional notes..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Info Box */}
      <div style={{
        padding: '12px',
        background: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#1976d2'
      }}>
        💡 Preparation tasks will be automatically generated based on your interview details
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '12px 24px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '12px 32px',
            border: 'none',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
          }}
        >
          Schedule Interview
        </button>
      </div>
    </form>
  </div>
</div>
);
};
export default InterviewScheduling;