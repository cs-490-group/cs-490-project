import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Get auth headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
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
      `${API_BASE_URL}/interview-schedule/create`,
      scheduleData,
      { headers: getAuthHeaders() }
    );
  },
  
  getUpcomingInterviews: () => {
    return axios.get(
      `${API_BASE_URL}/interview-schedule/upcoming`,
      { headers: getAuthHeaders() }
    );
  },
  
  getSchedule: (scheduleId) => {
    return axios.get(
      `${API_BASE_URL}/interview-schedule/${scheduleId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  updateSchedule: (scheduleId, updateData) => {
    return axios.put(
      `${API_BASE_URL}/interview-schedule/${scheduleId}/update`,
      updateData,
      { headers: getAuthHeaders() }
    );
  },
  
  completeInterview: (scheduleId, outcomeData) => {
    return axios.post(
      `${API_BASE_URL}/interview-schedule/${scheduleId}/complete`,
      outcomeData,
      { headers: getAuthHeaders() }
    );
  },
  
  cancelInterview: (scheduleId, reason) => {
    return axios.post(
      `${API_BASE_URL}/interview-schedule/${scheduleId}/cancel`,
      { reason },
      { headers: getAuthHeaders() }
    );
  },
  
  deleteSchedule: (scheduleId) => {
    return axios.delete(
      `${API_BASE_URL}/interview-schedule/${scheduleId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  // ============================================================================
  // PREPARATION TASKS
  // ============================================================================
  
  addTask: (scheduleId, task) => {
    return axios.post(
      `${API_BASE_URL}/interview-schedule/${scheduleId}/tasks/add`,
      task,
      { headers: getAuthHeaders() }
    );
  },
  
  completeTask: (scheduleId, taskId) => {
    return axios.put(
      `${API_BASE_URL}/interview-schedule/${scheduleId}/tasks/${taskId}/complete`,
      {},
      { headers: getAuthHeaders() }
    );
  },
  
  generateTasks: (scheduleId) => {
    return axios.post(
      `${API_BASE_URL}/interview-schedule/${scheduleId}/tasks/generate`,
      {},
      { headers: getAuthHeaders() }
    );
  }
};

const InterviewAnalyticsAPI = {
  // ============================================================================
  // ANALYTICS (UC-080)
  // ============================================================================
  
  getDashboard: () => {
    return axios.get(
      `${API_BASE_URL}/interview-analytics/dashboard`,
      { headers: getAuthHeaders() }
    );
  },
  
  getTrends: (timeframeDays = 90) => {
    return axios.get(
      `${API_BASE_URL}/interview-analytics/trends?timeframe_days=${timeframeDays}`,
      { headers: getAuthHeaders() }
    );
  },
  
  getComparison: (compareWith = null) => {
    const url = compareWith 
      ? `${API_BASE_URL}/interview-analytics/comparison?compare_with=${compareWith}`
      : `${API_BASE_URL}/interview-analytics/comparison`;
    
    return axios.get(url, { headers: getAuthHeaders() });
  }
};

const FollowUpAPI = {
  // ============================================================================
  // FOLLOW-UP TEMPLATES (UC-082)
  // ============================================================================
  
  generateTemplate: (interviewUuid, templateType, customNotes = null, specificTopics = null) => {
    return axios.post(
      `${API_BASE_URL}/interview-followup/generate`,
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
      `${API_BASE_URL}/interview-followup/${templateId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  getTemplatesByInterview: (interviewId) => {
    return axios.get(
      `${API_BASE_URL}/interview-followup/interview/${interviewId}/templates`,
      { headers: getAuthHeaders() }
    );
  },
  
  markAsSent: (templateId) => {
    return axios.post(
      `${API_BASE_URL}/interview-followup/${templateId}/send`,
      {},
      { headers: getAuthHeaders() }
    );
  },
  
  markResponseReceived: (templateId, sentiment = null) => {
    return axios.post(
      `${API_BASE_URL}/interview-followup/${templateId}/response-received`,
      { sentiment },
      { headers: getAuthHeaders() }
    );
  }
};

const WritingPracticeAPI = {
  // ============================================================================
  // WRITING PRACTICE (UC-084)
  // ============================================================================
  
  startSession: (questionUuid, timeLimitSeconds = 300) => {
    return axios.post(
      `${API_BASE_URL}/writing-practice/start`,
      null,
      { 
        params: { question_uuid: questionUuid, time_limit_seconds: timeLimitSeconds },
        headers: getAuthHeaders() 
      }
    );
  },
  
  submitResponse: (sessionUuid, questionUuid, responseText, timeTaken, questionCategory = 'general') => {
    return axios.post(
      `${API_BASE_URL}/writing-practice/submit`,
      null,
      {
        params: {
          session_uuid: sessionUuid,
          question_uuid: questionUuid,
          response_text: responseText,
          time_taken_seconds: timeTaken,
          question_category: questionCategory
        },
        headers: getAuthHeaders()
      }
    );
  },
  
  getSessions: () => {
    return axios.get(
      `${API_BASE_URL}/writing-practice/sessions`,
      { headers: getAuthHeaders() }
    );
  },
  
  getSession: (sessionId) => {
    return axios.get(
      `${API_BASE_URL}/writing-practice/sessions/${sessionId}`,
      { headers: getAuthHeaders() }
    );
  },
  
  getSessionsByQuestion: (questionId) => {
    return axios.get(
      `${API_BASE_URL}/writing-practice/sessions/question/${questionId}`,
      { headers: getAuthHeaders() }
    );
  }
};

const SuccessPredictionAPI = {
  // ============================================================================
  // SUCCESS PREDICTION (UC-085)
  // ============================================================================
  
  getProbability: (interviewId) => {
    return axios.get(
      `${API_BASE_URL}/success-prediction/${interviewId}/probability`,
      { headers: getAuthHeaders() }
    );
  },
  
  compareInterviews: (interviewIds) => {
    return axios.post(
      `${API_BASE_URL}/success-prediction/compare`,
      { interview_ids: interviewIds },
      { headers: getAuthHeaders() }
    );
  }
};

export {
  InterviewScheduleAPI,
  InterviewAnalyticsAPI,
  FollowUpAPI,
  WritingPracticeAPI,
  SuccessPredictionAPI
};

export default InterviewScheduleAPI;