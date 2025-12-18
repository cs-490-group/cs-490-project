import React, { useState } from 'react';
import '../../styles/resumes.css';

/**
 * ReorderSectionsEditor Component
 * Allows users to toggle sections on/off and reorder them via drag-and-drop
 * Related to UC-048: Resume Section Customization
 */
export default function ReorderSectionsEditor({ sections, onUpdate }) {
  const [items, setItems] = useState(sections || []);
  const [draggedItem, setDraggedItem] = useState(null);

  const allSections = [
    { id: 'contact', label: 'Contact Information', available: true },
    { id: 'summary', label: 'Professional Summary', available: true },
    { id: 'experience', label: 'Work Experience', available: true },
    { id: 'education', label: 'Education', available: true },
    { id: 'skills', label: 'Skills', available: true },
    { id: 'certifications', label: 'Certifications', available: false },
    { id: 'projects', label: 'Projects', available: false },
    { id: 'volunteer', label: 'Volunteer Work', available: false },
  ];

  const sectionLabels = {
    contact: 'Contact Information',
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Certifications',
    projects: 'Projects',
    volunteer: 'Volunteer Work',
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...items];
    const draggedItemContent = newItems[draggedItem];
    newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, draggedItemContent);

    setItems(newItems);
    setDraggedItem(null);
    onUpdate(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleToggleSection = (sectionId) => {
    let updatedItems;
    if (items.includes(sectionId)) {
      // Remove section
      updatedItems = items.filter((item) => item !== sectionId);
    } else {
      // Add section
      updatedItems = [...items, sectionId];
    }
    setItems(updatedItems);
    onUpdate(updatedItems);
  };

  return (
    <div className="reorder-sections-editor">
      <h3>Manage Sections</h3>
      <p className="text-muted">Enable/disable sections and drag to reorder them</p>

      {/* Enabled Sections - Draggable */}
      <div className="section-group">
        <h5 className="section-group-title">Active Sections</h5>
        <div className="sections-drag-list">
          {items.length > 0 ? (
            items.map((sectionId, index) => (
              <div
                key={index}
                className={`draggable-section-item ${draggedItem === index ? 'dragging' : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle-icon">⋮⋮</span>
                <span className="section-label">{sectionLabels[sectionId] || sectionId}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleToggleSection(sectionId)}
                  title="Remove section"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted text-center p-3">No sections enabled. Add sections below.</p>
          )}
        </div>
      </div>

      {/* Available Sections - Toggle */}
      <div className="section-group mt-4">
        <h5 className="section-group-title">Available Sections</h5>
        <div className="available-sections">
          {allSections.map((section) => (
            <div key={section.id} className="section-toggle">
              <input
                type="checkbox"
                id={`section-${section.id}`}
                checked={items.includes(section.id)}
                onChange={() => handleToggleSection(section.id)}
                disabled={!section.available}
              />
              <label htmlFor={`section-${section.id}`}>
                {section.label}
                {!section.available && <span className="badge bg-secondary ms-2">Coming Soon</span>}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="section-reorder-info mt-3 p-2 bg-light rounded">
        <small className="text-muted">
          💡 Tip: Check/uncheck to add or remove sections. Drag active sections up or down to reorder them.
        </small>
      </div>
    </div>
  );
}
