import api from "./base";

/**
 * AI-Powered Referral Message Generation API
 */

export const referralMessagesAPI = {
  /**
   * Generate AI-powered referral request message
   * @param {Object} data - Request data
   * @param {Object} data.user_profile - User's profile data
   * @param {Object} data.job_details - Job posting details
   * @param {Object} data.contact_info - Contact information
   * @param {string} data.relationship_context - Relationship type (professional, personal, academic)
   * @param {string} data.tone - Message tone (professional, casual, formal, enthusiastic)
   * @returns {Promise<Object>} Generated message data
   */
  generateMessage: async (data) => {
    try {
      const response = await api.post("/referral-message/generate", data);
      return response.data;
    } catch (error) {
      console.error("Error generating referral message:", error);
      throw error;
    }
  },

  /**
   * Generate multiple message variations for A/B testing
   * @param {Object} data - Request data
   * @param {Object} data.user_profile - User's profile data
   * @param {Object} data.job_details - Job posting details
   * @param {Object} data.contact_info - Contact information
   * @param {string} data.relationship_context - Relationship type
   * @param {number} data.num_variations - Number of variations to generate
   * @returns {Promise<Object>} Array of message variations
   */
  generateVariations: async (data) => {
    try {
      const response = await api.post("/referral-message/variations", data);
      return response.data;
    } catch (error) {
      console.error("Error generating message variations:", error);
      throw error;
    }
  },

  /**
   * Analyze message quality and personalization
   * @param {Object} data - Request data
   * @param {string} data.message - Message to analyze
   * @param {Object} data.job_details - Job details
   * 
- @	 * @ 
-	 *
-	 *   
-	 * @.
-	 * @0
-. * @param:00
-.
- }
  * @param {Object} data.contact_info - Contact information
   * @returns {Promise<Object>} Message analysis data
   */
  analyzeMessage: async (data) => {
    try {
      const response = await api.post("/referral-message/analyze", data);
      return response.data;
    } catch (error) {
      console.error("Error analyzing message:", error);
      throw error;
    }
  }
};

export default referralMessagesAPI;
