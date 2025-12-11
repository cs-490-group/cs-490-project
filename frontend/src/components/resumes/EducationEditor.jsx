import React, { useState, useEffect } from 'react';
import EducationAPI from '../../api/education';
import '../../styles/resumes.css';

/**
 * EducationEditor Component
 * Add, edit, and remove education entries
 * Related to UC-050
 */
export default function EducationEditor({ education, onUpdate }) {
  const [items, setItems] = useState(education || []);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [availableEducation, setAvailableEducation] = useState([]);
  const [loadingEducation, setLoadingEducation] = useState(false);

  // Load user's education history
  useEffect(() => {
    const fetchEducation = async () => {
      try {
        setLoadingEducation(true);
        const response = await EducationAPI.getAll();
        setAvailableEducation(response.data || response);
      } catch (err) {
        console.error('Error loading education:', err);
      } finally {
        setLoadingEducation(false);
      }
    };
    fetchEducation();
  }, []);

  const handleAddEducation = () => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        school: '',
        degree: '',
        field: '',
        year: '',
        gpa: '',
        achievements: '',
      },
    ]);
    setEditingId(newId);
  };

  const handleEditEducation = (id) => {
    const item = items.find((e) => e.id === id);
    setFormData(item || {});
    setEditingId(id);
  };

  const handleSaveEducation = () => {
    const updatedItems = items.map((item) =>
      item.id === editingId ? formData : item
    );
    setItems(updatedItems);
    onUpdate(updatedItems);
    setEditingId(null);
    setFormData({});
  };

  const handleDeleteEducation = (id) => {
    if (window.confirm('Delete this education entry?')) {
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      onUpdate(updatedItems);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddFromProfile = (eduItem) => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    const newEducation = {
      id: newId,
      school: eduItem.institution_name || '',
      degree: eduItem.degree || '',
      field: eduItem.field_of_study || '',
      year: eduItem.graduation_date || '',
      gpa: eduItem.gpa || '',
      achievements: eduItem.achievements || '',
    };
    setItems([...items, newEducation]);
    onUpdate([...items, newEducation]);
  };

  return (
    <div className="education-editor">
      <div className="editor-header">
        <h3>Education</h3>
        <button onClick={handleAddEducation} className="btn btn-sm btn-success">
          + Add Education
        </button>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">No education added yet</div>
      ) : (
        <div className="education-list">
          {items.map((item) => (
            <div key={item.id} className="education-item-card">
              {editingId === item.id ? (
                <div className="education-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>School/Institution</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.school || ''}
                        onChange={(e) => handleFormChange('school', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Degree</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Bachelor's, Master's"
                        value={formData.degree || ''}
                        onChange={(e) => handleFormChange('degree', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Field of Study</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Computer Science"
                        value={formData.field || ''}
                        onChange={(e) => handleFormChange('field', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Graduation Year</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., 2022"
                        value={formData.year || ''}
                        onChange={(e) => handleFormChange('year', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>GPA (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., 3.8"
                        value={formData.gpa || ''}
                        onChange={(e) => handleFormChange('gpa', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Achievements (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Summa Cum Laude"
                        value={formData.achievements || ''}
                        onChange={(e) => handleFormChange('achievements', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={handleSaveEducation}
                      className="btn btn-sm btn-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn btn-sm btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="education-display">
                  <div className="education-header">
                    <div>
                      <strong>{item.degree || 'Degree'}</strong>
                      <p className="text-muted">{item.school || 'School'}</p>
                    </div>
                    <div className="education-year">{item.year}</div>
                  </div>
                  {item.field && <p className="education-field">{item.field}</p>}
                  {item.gpa && <p className="education-gpa">GPA: {item.gpa}</p>}
                  {item.achievements && (
                    <p className="education-achievements">{item.achievements}</p>
                  )}
                  <div className="item-actions">
                    <button
                      onClick={() => handleEditEducation(item.id)}
                      className="btn btn-sm btn-warning"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(item.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {availableEducation.length > 0 && (
        <div className="quick-add-section">
          <h4>Import from Profile</h4>
          <div className="quick-add-buttons">
            {availableEducation.map((edu, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFromProfile(edu)}
                className="btn btn-sm btn-outline-primary"
                title={`${edu.degree} in ${edu.field_of_study}`}
              >
                + {edu.institution_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
