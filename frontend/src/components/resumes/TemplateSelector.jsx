import React from 'react';
import '../../styles/resumes.css';

/**
 * TemplateSelector Component
 * Display available templates with previews
 * Shows actual template layout previews instead of generic mock boxes
 * Related to UC-046
 */
export default function TemplateSelector({ templates, selectedTemplate, onSelect }) {
  // Render template-specific preview layouts
  const renderTemplatePreview = (templateId) => {
    switch (templateId?.toLowerCase()) {
      case 'functional':
        return (
          <div className="template-preview-content">
            <div className="preview-name">Name</div>
            <div className="preview-line"></div>
            <div className="preview-section-title">SKILLS</div>
            <div className="preview-line"></div>
            <div className="preview-line short"></div>
            <div className="preview-section-title">EXPERIENCE</div>
            <div className="preview-line"></div>
            <div className="preview-line short"></div>
          </div>
        );
      case 'hybrid':
        return (
          <div className="template-preview-content">
            <div className="preview-name">Name</div>
            <div className="preview-line"></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <div className="preview-section-title">SKILLS</div>
                <div className="preview-line short"></div>
              </div>
            </div>
            <div className="preview-section-title">EXPERIENCE</div>
            <div className="preview-line"></div>
            <div className="preview-line short"></div>
          </div>
        );
      case 'chronological':
      default:
        return (
          <div className="template-preview-content">
            <div className="preview-name">Name</div>
            <div className="preview-line"></div>
            <div className="preview-section-title">SUMMARY</div>
            <div className="preview-line"></div>
            <div className="preview-section-title">EXPERIENCE</div>
            <div className="preview-line"></div>
            <div className="preview-line short"></div>
          </div>
        );
    }
  };

  return (
    <div className="template-selector">
      {templates && templates.length > 0 ? (
        <div className="templates-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => onSelect(template.id)}
            >
              <div className="template-preview">
                {renderTemplatePreview(template.id)}
              </div>
              <div className="template-info">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <small className="text-muted">{template.preview}</small>
              </div>
              {selectedTemplate === template.id && (
                <div className="template-selected">✓ Selected</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">No templates available</div>
      )}
    </div>
  );
}
