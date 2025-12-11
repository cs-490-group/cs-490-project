import React from 'react';
import '../../styles/resumes.css';

/**
 * ExportOptions Component
 * Display export format options
 * Related to UC-051
 */
export default function ExportOptions({ formats, selectedFormat, onSelect }) {
  return (
    <div className="export-options">
      {formats && formats.length > 0 ? (
        <div className="formats-grid">
          {formats.map((format) => (
            <div
              key={format.id}
              className={`format-card ${selectedFormat === format.id ? 'selected' : ''}`}
              onClick={() => onSelect(format.id)}
            >
              <div className="format-icon">
                {format.id === 'pdf' && '📄'}
                {format.id === 'docx' && '📝'}
                {format.id === 'html' && '🌐'}
                {format.id === 'txt' && '📋'}
              </div>
              <div className="format-info">
                <h5>{format.label}</h5>
                <p>.{format.extension}</p>
                <small>{format.description}</small>
              </div>
              {selectedFormat === format.id && (
                <div className="format-selected">✓</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">No export formats available</div>
      )}
    </div>
  );
}
