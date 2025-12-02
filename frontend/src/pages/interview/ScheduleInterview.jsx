// src/components/Jobs/ScheduleInterviewFromJob.jsx
import React, { useState, useEffect } from 'react';
import JobsAPI from '../../api/jobs';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';

function ScheduleInterviewFromJob({ jobId, onClose, onSuccess }) {
  const handleClose = () => {
    if (onClose && typeof onClose === 'function') {
      onClose();
    } else {
      window.history.back();
    }
  };
  
function convertLocalDateTimeToUTC(localDateTimeString) {
  if (!localDateTimeString) return null;
  const localDate = new Date(localDateTimeString);
  return localDate.toISOString(); // Returns UTC ISO string
}

  const [formData, setFormData] = useState({
    job_application_uuid: jobId || '',
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
    notes: '',
    scenario_name: '',
    company_name: ''
  });
  
  const [jobDetails, setJobDetails] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobApplications();
  }, []);

  useEffect(() => {
    if (jobId && jobApplications.length > 0) {
      const job = jobApplications.find(j => j.id === jobId);
      if (job) {
        setJobDetails(job);
        setFormData(prev => ({
          ...prev,
          scenario_name: job.title || '',
          company_name: job.company || ''
        }));
      }
    }
  }, [jobId, jobApplications]);

  const loadJobApplications = async () => {
    setLoadingJobs(true);
    try {
      const response = await JobsAPI.getAll();
      
      const jobsList = (response.data || [])
        .filter(job => job.status === 'Interview')
        .map(job => ({
          id: job._id,
          title: job.title,
          company: typeof job.company === 'string' ? job.company : job.company?.name || 'Unknown Company',
          location: job.location,
          status: job.status
        }));
      
      setJobApplications(jobsList);
      
      if (jobsList.length === 0) {
        console.warn('No jobs in Interview stage found');
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      setJobApplications([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'job_application_uuid') {
      const selectedJob = jobApplications.find(j => j.id === value);
      if (selectedJob) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          scenario_name: selectedJob.title || '',
          company_name: selectedJob.company || ''
        }));
        setJobDetails(selectedJob);
        return;
      }
    }
    
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

    if (!formData.scenario_name || !formData.company_name) {
      setError('Please select a job application or enter job details manually');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSend = {
          ...formData,
          interview_datetime: convertLocalDateTimeToUTC(formData.interview_datetime)
        };

        console.log('📅 Datetime Debug:');
        console.log('  Local:', formData.interview_datetime);
        console.log('  UTC:', dataToSend.interview_datetime);

        const response = await InterviewScheduleAPI.createSchedule(dataToSend);

        onSuccess?.({ 
        message: 'Interview scheduled successfully!',
        schedule_uuid: response.data.schedule_uuid 
      });
      handleClose();
    } catch (err) {
      console.error('Submit Error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay"
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
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="modal-content" style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div className="modal-header" style={{
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            type="button"
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
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

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

          {/* Job Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Job Application *
            </label>
            <select
              name="job_application_uuid"
              value={formData.job_application_uuid}
              onChange={handleChange}
              disabled={loadingJobs}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="">
                {loadingJobs ? 'Loading...' : 
                 jobApplications.length === 0 ? 'No jobs in Interview stage - enter manually below' :
                 'Select a job or enter manually below'}
              </option>
              {jobApplications.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Entry */}
          {!formData.job_application_uuid && (
            <div style={{
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Job Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Position *</label>
                  <input
                    type="text"
                    name="scenario_name"
                    value={formData.scenario_name}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
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
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min="15"
              max="480"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Location Type */}
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
                  <div>{type === 'video' ? '🎥' : type === 'phone' ? '📞' : '🏢'}</div>
                  <div style={{ textTransform: 'capitalize' }}>{type.replace('-', ' ')}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Video Platform (conditional) */}
          {formData.location_type === 'video' && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Video Platform
                </label>
                <select
                  name="video_platform"
                  value={formData.video_platform}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                >
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="meet">Google Meet</option>
                  <option value="webex">Webex</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Meeting Link
                </label>
                <input
                  type="url"
                  name="video_link"
                  value={formData.video_link}
                  onChange={handleChange}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </>
          )}

          {/* Phone Number (conditional) */}
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
                  borderRadius: '8px'
                }}
              />
            </div>
          )}

          {/* Location Details (conditional) */}
          {formData.location_type === 'in-person' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Address
              </label>
              <textarea
                name="location_details"
                value={formData.location_details}
                onChange={handleChange}
                rows="3"
                placeholder="Enter the full address..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Interviewer Details */}
          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Interviewer Information (Optional)</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Name</label>
                <input
                  type="text"
                  name="interviewer_name"
                  value={formData.interviewer_name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Title</label>
                <input
                  type="text"
                  name="interviewer_title"
                  value={formData.interviewer_title}
                  onChange={handleChange}
                  placeholder="e.g., Senior Engineer"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  name="interviewer_email"
                  value={formData.interviewer_email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone</label>
                <input
                  type="tel"
                  name="interviewer_phone"
                  value={formData.interviewer_phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Add any additional notes about this interview..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Info about auto-generated tasks */}
          <div style={{
            padding: '12px',
            background: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            💡 Preparation tasks will be automatically generated based on your job details and interview information
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
            <button
              type="button"
              onClick={handleClose}
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
              type="submit"
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
        </form>
      </div>
    </div>
  );
}

export default ScheduleInterviewFromJob;