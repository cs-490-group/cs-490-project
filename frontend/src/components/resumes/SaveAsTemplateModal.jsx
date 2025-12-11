import React, { useState } from 'react';
import TemplatesAPI from '../../api/templates';

/**
 * SaveAsTemplateModal Component
 * Modal to save a resume as a reusable template
 * Related to UC-046: Resume Template Management
 */
export default function SaveAsTemplateModal({ resumeId, resumeName, onClose, onSuccess }) {
  const [templateName, setTemplateName] = useState(`${resumeName} Template`);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await TemplatesAPI.createFromResume(resumeId, templateName);

      // Update the template with description if provided
      if (description.trim()) {
        await TemplatesAPI.update(result.template_id, {
          description: description.trim()
        });
      }

      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to save template');
      console.error('Error saving template:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Save Resume as Template</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                {error}
              </div>
            )}

            <div className="form-group mb-3">
              <label htmlFor="templateName" className="form-label">
                Template Name <span className="text-danger">*</span>
              </label>
              <input
                id="templateName"
                type="text"
                className="form-control"
                placeholder="e.g., Professional Developer Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={loading}
              />
              <small className="form-text text-muted">
                This is the name that will appear in your template library
              </small>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="templateDescription" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="templateDescription"
                className="form-control"
                placeholder="Describe this template, e.g., 'Modern design with emphasis on projects'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows="3"
              />
            </div>

            <div className="alert alert-info mb-0">
              <small>
                The current formatting (colors, fonts, sections) will be saved with this template.
                You can reuse this template for future resumes.
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading || !templateName.trim()}
            >
              {loading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
