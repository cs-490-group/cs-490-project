import React from 'react';
import '../../styles/resumes.css';

/**
 * ResumeSectionWrapper Component
 * Wraps resume sections to make them draggable
 * Allows reordering sections by drag-and-drop
 * Related to UC-048
 */
export default function ResumeSectionWrapper({
  sectionId,
  children,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  return (
    <div
      className={`resume-section-wrapper ${isDragging ? 'dragging' : ''}`}
      draggable={true}
      onDragStart={(e) => onDragStart(e, sectionId)}
      onDragOver={(e) => onDragOver(e, sectionId)}
      onDrop={(e) => onDrop(e, sectionId)}
      onDragEnd={onDragEnd}
      data-section-id={sectionId}
    >
      {/* Drag Handle */}
      <div className="section-drag-handle" title="Drag to reorder sections">
        <span className="drag-icon">⋮⋮</span>
      </div>

      {/* Section Content */}
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}
