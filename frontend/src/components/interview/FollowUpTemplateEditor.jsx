import React, { useState } from 'react';

function FollowUpTemplateEditor({ 
  template, 
  onSave, 
  onCancel,
  editable = true 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(template?.subject || '');
  const [editedBody, setEditedBody] = useState(template?.body || '');
  
  const handleToggleEdit = () => {
    if (isEditing) {
      // Switching to preview mode
      setIsEditing(false);
    } else {
      // Switching to edit mode
      setIsEditing(true);
    }
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave({
        subject: editedSubject,
        body: editedBody
      });
    }
    setIsEditing(false);
  };
  
  const handleReset = () => {
    setEditedSubject(template?.subject || '');
    setEditedBody(template?.body || '');
    setIsEditing(false);
  };
  
  const wordCount = editedBody.trim().split(/\s+/).filter(w => w).length;
  
  return (
    <div className="followup-template-editor">
      {/* Editor Header */}
      <div className="editor-header">
        <h3>{isEditing ? 'Edit Template' : 'Template Preview'}</h3>
        <div className="editor-actions">
          {editable && (
            <button 
              onClick={handleToggleEdit}
              className="btn-toggle-edit"
            >
              {isEditing ? '👁 Preview' : '✏️ Edit'}
            </button>
          )}
        </div>
      </div>
      
      {/* Template Container */}
      <div className="template-container">
        {/* Subject Line */}
        <div className="template-section subject-section">
          <label className="template-label">Subject:</label>
          {isEditing ? (
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="subject-input"
              placeholder="Email subject line..."
            />
          ) : (
            <div className="subject-preview">{editedSubject}</div>
          )}
        </div>
        
        {/* Email Body */}
        <div className="template-section body-section">
          <div className="body-header">
            <label className="template-label">Message:</label>
            {isEditing && (
              <span className="word-count">{wordCount} words</span>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="body-textarea"
              rows="15"
              placeholder="Type your message here..."
            />
          ) : (
            <div className="body-preview">
              {editedBody.split('\n').map((line, idx) => (
                <p key={idx}>{line || '\u00A0'}</p>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      {isEditing ? (
        <div className="editor-footer">
          <button 
            onClick={handleReset}
            className="btn-secondary"
          >
            Reset
          </button>
          <button 
            onClick={handleSave}
            className="btn-primary"
            disabled={!editedSubject || !editedBody}
          >
            Save Changes
          </button>
        </div>
      ) : (
        <div className="editor-footer">
          {onCancel && (
            <button 
              onClick={onCancel}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          {onSave && (
            <button 
              onClick={handleSave}
              className="btn-primary btn-send"
            >
              📧 Send Email
            </button>
          )}
        </div>
      )}
      
      {/* Tips */}
      {!isEditing && (
        <div className="editor-tips">
          <strong>💡 Tip:</strong> Review and personalize the template before sending for best results
        </div>
      )}
    </div>
  );
}

export default FollowUpTemplateEditor;