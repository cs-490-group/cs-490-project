import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Get auth headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('session');
  const uuid = localStorage.getItem('uuid');
  
  return {
    'Authorization': `Bearer ${token}`,
    'uuid': uuid,
    'Content-Type': 'application/json'
  };
};

const InterviewScheduleAPI = {
  // ============================================================================
  // SCHEDULE CRUD
  // ============================================================================
  
  createSchedule: (scheduleData) => {
    return axios.post(
      `${API_BASE_URL}/interview/schedule`,
      scheduleData,
      { headers: getAuthHeaders() }
    );
  },
  
  getUpcomingInterviews: () => {
    return axios.get(
      `${API_BASE_URL}/interview/schedule/upcoming`,
      { headers: getAuthHeaders() }
    );
  },
  
  getSchedule: (scheduleId) => {
    return axios.get(
      `${API_BASE_URL}/interview/schedule/${scheduleId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  updateSchedule: (scheduleId, updateData) => {
    return axios.put(
      `${API_BASE_URL}/interview/schedule/${scheduleId}`,
      updateData,
      { headers: getAuthHeaders() }
    );
  },
  
  completeInterview: (scheduleId, outcomeData) => {
    return axios.post(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/complete`,
      outcomeData,
      { headers: getAuthHeaders() }
    );
  },
  
  cancelInterview: (scheduleId, reason) => {
    return axios.post(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/cancel`,
      { reason },
      { headers: getAuthHeaders() }
    );
  },
  
  deleteSchedule: (scheduleId) => {
    return axios.delete(
      `${API_BASE_URL}/interview/schedule/${scheduleId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  // ============================================================================
  // PREPARATION TASKS
  // ============================================================================
  
  getPreparationTasks: (scheduleId) => {
    return axios.get(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/preparation-tasks`,
      { headers: getAuthHeaders() }
    );
  },
  
  toggleTaskCompletion: (scheduleId, taskId) => {
    return axios.post(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/preparation-tasks/${taskId}/complete`,
      {},
      { headers: getAuthHeaders() }
    );
  },
  
  addTask: (scheduleId, task) => {
    return axios.post(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/preparation-tasks/add`,
      task,
      { headers: getAuthHeaders() }
    );
  },
  
  generateTasks: (scheduleId) => {
    return axios.post(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/preparation-tasks/generate`,
      {},
      { headers: getAuthHeaders() }
    );
  },
  
  deletePreparationTask: (scheduleId, taskId) => {
    return axios.delete(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/preparation-tasks/${taskId}`,
      { headers: getAuthHeaders() }
    );
  },

  updatePreparationTask: (scheduleId, taskId, taskData) => {
    return axios.put(
      `${API_BASE_URL}/interview/schedule/${scheduleId}/preparation-tasks/${taskId}/update`,
      taskData,
      { headers: getAuthHeaders() }
    );
  },

  // ============================================================================
  // CALENDAR INTEGRATION
  // ============================================================================
  
  getCalendarStatus: () => {
    return axios.get(
      `${API_BASE_URL}/interview/calendar/status`,
      { headers: getAuthHeaders() }
    );
  },
  
  getGoogleAuthUrl: () => {
    return axios.get(
      `${API_BASE_URL}/interview/calendar/auth/google`,
      { headers: getAuthHeaders() }
    );
  },
  
  getOutlookAuthUrl: () => {
    return axios.get(
      `${API_BASE_URL}/interview/calendar/auth/outlook`,
      { headers: getAuthHeaders() }
    );
  },
  
  syncToCalendar: (scheduleId) => {
    return axios.post(
      `${API_BASE_URL}/interview/calendar/sync/${scheduleId}`,
      {},
      { headers: getAuthHeaders() }
    );
  },
  
  disconnectCalendar: () => {
    return axios.delete(
      `${API_BASE_URL}/interview/calendar/disconnect`,
      { headers: getAuthHeaders() }
    );
  },

  // ============================================================================
  // COMPANY RESEARCH (UC-074)
  // ============================================================================

  generateCompanyResearch: (interviewId, regenerate = false, customPrompt = null) => {
    return axios.post(
      `${API_BASE_URL}/interview/research/generate`,
      {
        interview_id: interviewId,
        regenerate: regenerate,
        custom_prompt: customPrompt
      },
      { headers: getAuthHeaders() }
    );
  },

  getCompanyResearch: (scheduleId) => {
    return axios.get(
      `${API_BASE_URL}/interview/research/${scheduleId}`,
      { headers: getAuthHeaders() }
    );
  },

  regenerateCompanyResearch: (scheduleId, customPrompt = null) => {
    return axios.post(
      `${API_BASE_URL}/interview/research/${scheduleId}/regenerate`,
      { custom_prompt: customPrompt },
      { headers: getAuthHeaders() }
    );
  }
};

const FollowUpAPI = {
  // ============================================================================
  // FOLLOW-UP TEMPLATES
  // ============================================================================
  
  generateTemplate: (interviewUuid, templateType, customNotes = null, specificTopics = null) => {
    return axios.post(
      `${API_BASE_URL}/interview/followup/generate`,
      {
        interview_uuid: interviewUuid,
        template_type: templateType,
        custom_notes: customNotes,
        specific_topics: specificTopics
      },
      { headers: getAuthHeaders() }
    );
  },
  
  getTemplate: (templateId) => {
    return axios.get(
      `${API_BASE_URL}/interview/followup/${templateId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  getTemplatesByInterview: (interviewId) => {
    return axios.get(
      `${API_BASE_URL}/interview/followup/interview/${interviewId}/templates`,
      { headers: getAuthHeaders() }
    );
  },
  
  // Send email with edited subject and body
  sendEmail: (templateId, recipientEmail, subject, body) => {
    return axios.post(
      `${API_BASE_URL}/interview/followup/${templateId}/send`,
      {
        recipient_email: recipientEmail,
        subject: subject,
        body: body
      },
      { headers: getAuthHeaders() }
    );
  },
  
  markResponseReceived: (templateId, sentiment = null) => {
    return axios.post(
      `${API_BASE_URL}/interview/followup/${templateId}/response-received`,
      { sentiment },
      { headers: getAuthHeaders() }
    );
  }
};



export {
  InterviewScheduleAPI,
  FollowUpAPI,
};

export default InterviewScheduleAPI;