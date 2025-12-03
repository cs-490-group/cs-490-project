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

const InterviewAnalyticsAPI = {
  // ============================================================================
  // ANALYTICS (UC-080)
  // ============================================================================
  
  /**
   * Get comprehensive analytics dashboard with all metrics
   * @returns {Promise} Dashboard data including overall stats, trends, and recommendations
   */
  getDashboard: () => {
    return axios.get(
      `${API_BASE_URL}/interview-analytics/dashboard`,
      { headers: getAuthHeaders() }
    );
  },
  
  /**
   * Get detailed trend analysis over a specified timeframe
   * @param {number} timeframeDays - Number of days to analyze (7, 30, 90, 365)
   * @returns {Promise} Trend data for the specified period
   */
  getTrends: (timeframeDays = 90) => {
    return axios.get(
      `${API_BASE_URL}/interview-analytics/trends?timeframe_days=${timeframeDays}`,
      { headers: getAuthHeaders() }
    );
  },
  
  /**
   * Compare user's performance with another user or industry benchmarks
   * @param {string|null} compareWith - UUID of user to compare with, or null for industry average
   * @returns {Promise} Comparison data
   */
  getComparison: (compareWith = null) => {
    const url = compareWith 
      ? `${API_BASE_URL}/interview-analytics/comparison?compare_with=${compareWith}`
      : `${API_BASE_URL}/interview-analytics/comparison`;
    
    return axios.get(url, { headers: getAuthHeaders() });
  }
};

const SuccessPredictionAPI = {
  // ============================================================================
  // SUCCESS PREDICTION (UC-085)
  // ============================================================================
  
  /**
   * Calculate interview success probability for a specific interview
   * @param {string} interviewId - MongoDB _id of the interview schedule
   * @returns {Promise} Prediction data including probability score and contributing factors
   */
  getProbability: (interviewId) => {
    return axios.get(
      `${API_BASE_URL}/success-prediction/${interviewId}/probability`,
      { headers: getAuthHeaders() }
    );
  },
  
  /**
   * Compare success probabilities across multiple interviews
   * @param {Array<string>} interviewIds - Array of interview MongoDB _ids to compare
   * @returns {Promise} Comparison data for all specified interviews
   */
  compareInterviews: (interviewIds) => {
    return axios.post(
      `${API_BASE_URL}/success-prediction/compare`,
      { interview_ids: interviewIds },
      { headers: getAuthHeaders() }
    );
  }
};

export { InterviewAnalyticsAPI, SuccessPredictionAPI };
export default InterviewAnalyticsAPI;