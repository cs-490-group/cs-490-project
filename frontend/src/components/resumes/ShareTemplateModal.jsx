import React, { useState } from 'react';
import TemplatesAPI from '../../api/templates';
import '../../styles/resumes.css';

/**
 * ShareTemplateModal Component
 * Modal dialog to share a template with other users
 * Related to UC-046: Template Sharing
 */
export default function ShareTemplateModal({
  templateId,
  templateName,
  onClose,
  onSuccess
}) {
  const [userIds, setUserIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    try {
      setError(null);
      setSuccess(false);

      // Parse user IDs from input (comma-separated or line-separated)
      const ids = userIds
        .split(/[,\n]/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (ids.length === 0) {
        setError('Please enter at least one user ID');
        return;
      }

      setLoading(true);
      await TemplatesAPI.shareTemplate(templateId, ids);
      setSuccess(true);
      setUserIds('');

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || 'Failed to share template';
      setError(errorMessage);
      console.error('Error sharing template:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">Share Template</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            disabled={loading}
          />
        </div>

        <div className="modal-body">
          <p className="text-muted mb-3">
            Share "<strong>{templateName}</strong>" with other users
          </p>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-3" role="alert">
              Template shared successfully!
            </div>
          )}

          <div className="form-group">
            <label htmlFor="userIds" className="form-label">
              User IDs (comma or line separated)
            </label>
            <textarea
              id="userIds"
              className="form-control"
              rows="4"
              placeholder="Enter user IDs, one per line or comma-separated"
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              disabled={loading}
            />
            <small className="form-text text-muted mt-2">
              Example: user123, user456 or<br />
              user123<br />
              user456
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
            onClick={handleShare}
            disabled={loading || userIds.trim().length === 0}
          >
            {loading ? 'Sharing...' : 'Share Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
