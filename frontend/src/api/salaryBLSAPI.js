/**
 * SalaryBLS API Client
 * Handles all API calls to the salaryBLS endpoints
 */

import api from "./base";

const BASE_URL = "/salaryBLS";

class SalaryBLSAPI {
  /**
   * Search for salary data by job title and location
   * @param {Object} data - Search parameters
   * @param {string} data.job_title - Job title to search
   * @param {string} data.city - City name
   * @param {string} [data.state] - State abbreviation (optional)
   * @returns {Promise} Response with salary percentiles
   */
  search(data) {
    return api.post(`${BASE_URL}/search`, data);
  }

  /**
   * Get recent salary searches
   * @param {number} [limit=10] - Maximum number of results
   * @returns {Promise} Response with recent searches
   */
  getRecentSearches(limit = 10) {
    return api.get(`${BASE_URL}/recent-searches`, {
      params: { limit }
    });
  }

  /**
   * Search for salary data by job title across all cached locations
   * @param {string} jobTitle - Job title to search
   * @returns {Promise} Response with salary data for all locations
   */
  searchByTitle(jobTitle) {
    return api.get(`${BASE_URL}/search-by-title/${encodeURIComponent(jobTitle)}`);
  }

  /**
   * Get cache statistics
   * @returns {Promise} Response with cache statistics
   */
  getStats() {
    return api.get(`${BASE_URL}/stats`);
  }

  /**
   * Delete a cached salary entry
   * @param {string} entryId - ID of the cached entry to delete
   * @returns {Promise} Response indicating success
   */
  deleteCache(entryId) {
    return api.delete(`${BASE_URL}/cache/${entryId}`);
  }
}

export default new SalaryBLSAPI();