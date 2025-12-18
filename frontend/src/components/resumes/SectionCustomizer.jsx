import React, { useState } from 'react';
import '../../styles/resumes.css';

/**
 * SectionCustomizer Component
 * Toggle resume sections on/off and reorder via drag-and-drop
 * Related to UC-048
 */
export default function SectionCustomizer({ sections, onUpdate }) {
  const [items, setItems] = useState(sections || []);
  const [draggedItem, setDraggedItem] = useState(null);

  const allSections = [
    { id: 'contact', label: 'Contact Information', available: true },
    { id: 'summary', label: 'Professional Summary', available: true },
    { id: 'experience', label: 'Work Experience', available: true },
    { id: 'skills', label: 'Skills', available: true },
    { id: 'education', label: 'Education', available: true },
    { id: 'certifications', label: 'Certifications', available: false },
    { id: 'projects', label: 'Projects', available: false },
    { id: 'volunteer', label: 'Volunteer Work', available: false },
  ];

  const handleToggleSection = (sectionId) => {
    let updatedItems;
    if (items.includes(sectionId)) {
      updatedItems = items.filter((item) => item !== sectionId);
    } else {
      updatedItems = [...items, sectionId];
    }
    setItems(updatedItems);
    onUpdate(updatedItems);
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) {
      return;
    }

    const newItems = [...items];
    const draggedItemContent = newItems[draggedItem];
    newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, draggedItemContent);

    setItems(newItems);
    onUpdate(newItems);
    setDraggedItem(null);
  };

  return (
    <div className="section-customizer">
      <h3>Customize Resume Sections</h3>
      <p className="text-muted">Toggle sections on/off and drag to reorder</p>

      <div className="section-customizer-layout">
        <div className="available-sections">
          <h5>Available Sections</h5>
          {allSections.map((section) => (
            <div key={section.id} className="section-toggle">
              <input
                type="checkbox"
                id={section.id}
                checked={items.includes(section.id)}
                onChange={() => handleToggleSection(section.id)}
                disabled={!section.available}
              />
              <label htmlFor={section.id}>
                {section.label}
                {!section.available && <span className="badge bg-secondary ms-2">Coming Soon</span>}
              </label>
            </div>
          ))}
        </div>

        <div className="section-order">
          <h5>Section Order (Drag to Reorder)</h5>
          {items.length === 0 ? (
            <div className="alert alert-warning">No sections selected</div>
          ) : (
            <div className="section-list">
              {items.map((sectionId, index) => {
                const section = allSections.find((s) => s.id === sectionId);
                return (
                  <div
                    key={sectionId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`draggable-section ${draggedItem === index ? 'dragging' : ''}`}
                  >
                    <span className="drag-handle">⋮⋮</span>
                    <span>{section.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="section-presets mt-4">
        <h5>Quick Presets</h5>
        <div className="preset-buttons">
          <button
            onClick={() => {
              const preset = ['contact', 'summary', 'experience', 'skills', 'education'];
              setItems(preset);
              onUpdate(preset);
            }}
            className="btn btn-sm btn-outline-primary"
          >
            Standard Layout
          </button>
          <button
            onClick={() => {
              const preset = ['contact', 'experience', 'skills', 'education'];
              setItems(preset);
              onUpdate(preset);
            }}
            className="btn btn-sm btn-outline-primary"
          >
            No Summary
          </button>
          <button
            onClick={() => {
              const preset = ['contact', 'skills', 'experience', 'education'];
              setItems(preset);
              onUpdate(preset);
            }}
            className="btn btn-sm btn-outline-primary"
          >
            Skills First
          </button>
        </div>
      </div>
    </div>
  );
}
