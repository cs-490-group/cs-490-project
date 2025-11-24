/**
 * Templates API Client
 * Related to UC-046: Resume Template Management
 */

import api from './base';

const BASE_URL = '/templates';

class TemplatesAPI {
  // Create a new template
  add(data) {
    return api.post(BASE_URL, data);
  }

  // Get the built-in template library (no auth required)
  getLibrary() {
    return api.get(`${BASE_URL}/library`);
  }

  // Get all templates for the current user
  getUserTemplates() {
    return api.get(`${BASE_URL}/me`);
  }

  // Get the user's default template
  getDefaultTemplate() {
    return api.get(`${BASE_URL}/default`);
  }

  // Get public templates
  getPublicTemplates(limit = 20) {
    return api.get(`${BASE_URL}/public`, { params: { limit } });
  }

  // Get a specific template
  get(templateId) {
    return api.get(BASE_URL, { params: { template_id: templateId } });
  }

  // Update a template
  update(templateId, data) {
    return api.put(BASE_URL, data, { params: { template_id: templateId } });
  }

  // Delete a template
  delete(templateId) {
    return api.delete(BASE_URL, { params: { template_id: templateId } });
  }

  // Set a template as default
  setDefaultTemplate(templateId) {
    return api.put(`${BASE_URL}/${templateId}/set-default`);
  }

  // Create a template from an existing resume
  createFromResume(resumeId, templateName) {
    return api.post(`${BASE_URL}/${resumeId}/from-resume`, null, {
      params: { name: templateName }
    });
  }

  // Upload an HTML resume file as a template
  upload(formData) {
    return api.post(`${BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  // Share a template with other users
  shareTemplate(templateId, userIds) {
    return api.put(`${BASE_URL}/${templateId}/share`, { user_ids: userIds });
  }

  // Search templates
  search(query) {
    return api.get(`${BASE_URL}/search/${query}`);
  }
}

const templatesAPI = new TemplatesAPI();
export default templatesAPI;
