/**
 * AI Resume API Client
 * Handles all AI-powered resume generation endpoints
 * UC-047: Generate Resume Content
 * UC-049: Optimize Skills
 * UC-050: Tailor Experience
 */

import api from './base';

const aiResumeAPI = {
  /**
   * UC-047: Generate AI resume content based on job posting
   * Generates tailored summary, bullet points, and suggested skills
   */
  generateContent: async (resumeId, jobPosting) => {
    try {
      console.log('[aiResumeAPI] Generating content for resume:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/generate-content`, {
        job_posting: jobPosting,
      });

      console.log('[aiResumeAPI] Content generated successfully');
      return response.data;
    } catch (err) {
      console.error('[aiResumeAPI] Content generation error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to generate content');
    }
  },

  /**
   * UC-049: Optimize resume skills based on job posting
   * Analyzes job requirements and suggests skills to emphasize, add, or remove
   */
  optimizeSkills: async (resumeId, jobPosting) => {
    try {
      console.log('[aiResumeAPI] Optimizing skills for resume:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/optimize-skills`, {
        job_posting: jobPosting,
      });

      console.log('[aiResumeAPI] Skills optimization complete');
      return response.data;
    } catch (err) {
      console.error('[aiResumeAPI] Skills optimization error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to optimize skills');
    }
  },

  /**
   * UC-050: Tailor resume experience descriptions
   * Generates alternative bullet points emphasizing relevant accomplishments
   */
  tailorExperience: async (resumeId, jobPosting) => {
    try {
      console.log('[aiResumeAPI] Tailoring experience for resume:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/tailor-experience`, {
        job_posting: jobPosting,
      });

      console.log('[aiResumeAPI] Experience tailoring complete');
      return response.data;
    } catch (err) {
      console.error('[aiResumeAPI] Experience tailoring error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to tailor experience');
    }
  },
};

export default aiResumeAPI;
