import React from 'react';
import '../../styles/resumes.css';

/**
 * SharingControls Component
 * Generate and manage sharing settings for resume
 * Related to UC-054
 */
export default function SharingControls({
  isSharing,
  shareLink,
  shareSettings,
  onGenerateLink,
  onCopyLink,
  onRevokeShare,
  onSettingsChange,
}) {
  return (
    <div className="sharing-controls">
      {!isSharing ? (
        <div className="not-sharing">
          <p className="text-muted">Your resume is not currently shared.</p>
          <button onClick={onGenerateLink} className="btn btn-primary">
            Generate Share Link
          </button>
        </div>
      ) : (
        <div className="sharing-active">
          <div className="share-link-section mb-4">
            <label>Share Link</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={shareLink}
                readOnly
              />
              <button onClick={onCopyLink} className="btn btn-outline-secondary">
                Copy Link
              </button>
            </div>
            <small className="form-text text-muted">
              Anyone with this link can view your resume
            </small>
          </div>

          <div className="settings-section mb-4">
            <h6>Sharing Permissions</h6>
            <div className="form-check">
              <input
                type="checkbox"
                id="can_comment"
                className="form-check-input"
                checked={shareSettings.can_comment}
                onChange={(e) =>
                  onSettingsChange({
                    ...shareSettings,
                    can_comment: e.target.checked,
                  })
                }
              />
              <label className="form-check-label" htmlFor="can_comment">
                Allow others to comment
              </label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                id="can_download"
                className="form-check-input"
                checked={shareSettings.can_download}
                onChange={(e) =>
                  onSettingsChange({
                    ...shareSettings,
                    can_download: e.target.checked,
                  })
                }
              />
              <label className="form-check-label" htmlFor="can_download">
                Allow download
              </label>
            </div>

            <div className="form-group mt-3">
              <label htmlFor="expiration_days">Link expiration (days)</label>
              <input
                type="number"
                id="expiration_days"
                className="form-control"
                value={shareSettings.expiration_days}
                onChange={(e) =>
                  onSettingsChange({
                    ...shareSettings,
                    expiration_days: parseInt(e.target.value),
                  })
                }
                min="1"
                max="365"
              />
              <small className="form-text text-muted">
                Link will expire after this many days
              </small>
            </div>
          </div>

          <div className="actions">
            <button onClick={onRevokeShare} className="btn btn-danger">
              Revoke Share Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
