import api from './base';

const BASE_URL = "/time-tracking";
const timeTrackingAPI = {
  // Add a new time entry
  add: (entryData) => {
    return api.post(`${BASE_URL}`, entryData);
  },

  // Get a specific time entry
  get: (entryId) => {
    return api.get(`${BASE_URL}`, {
      params: { entry_id: entryId }
    });
  },

  // Get all time entries for current user
  getAll: () => {
    return api.get(`${BASE_URL}/me`);
  },

  // Update a time entry
  update: (entryId, entryData) => {
    return api.put(`${BASE_URL}`, entryData, {
      params: { entry_id: entryId }
    });
  },

  // Delete a time entry
  delete: (entryId) => {
    return api.delete(`${BASE_URL}`, {
      params: { entry_id: entryId }
    });
  },

  // Get time summary
  getSummary: (days = 30) => {
    return api.get(`${BASE_URL}/summary`, {
      params: { days }
    });
  },

  // Get recent entries
  getRecent: (limit = 10) => {
    return api.get(`${BASE_URL}/recent`, {
      params: { limit }
    });
  },

  // Get complete analytics
  getAnalytics: (days = 30) => {
    return api.get(`${BASE_URL}/analytics`, {
      params: { days }
    });
  }
};

export default timeTrackingAPI;
