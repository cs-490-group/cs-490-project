import React, { useState, useEffect } from 'react';
import EmploymentAPI from '../../api/employment';
import '../../styles/resumes.css';

/**
 * ExperienceEditor Component
 * Add, edit, and remove work experience entries
 * Related to UC-050
 */
export default function ExperienceEditor({ experience, onUpdate }) {
  const [items, setItems] = useState(experience || []);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [availableEmployment, setAvailableEmployment] = useState([]);
  const [loadingEmployment, setLoadingEmployment] = useState(false);

  // Load user's employment history
  useEffect(() => {
    const fetchEmployment = async () => {
      try {
        setLoadingEmployment(true);
        const response = await EmploymentAPI.getAll();
        setAvailableEmployment(response.data || response);
      } catch (err) {
        console.error('Error loading employment:', err);
      } finally {
        setLoadingEmployment(false);
      }
    };
    fetchEmployment();
  }, []);

  const handleAddExperience = () => {
    const newId = Math.max(...items.map((e) => e.id), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        skills: [],
      },
    ]);
    setEditingId(newId);
  };

  const handleEditExperience = (id) => {
    const item = items.find((e) => e.id === id);
    setFormData(item || {});
    setEditingId(id);
  };

  const handleSaveExperience = () => {
    const updatedItems = items.map((item) =>
      item.id === editingId ? formData : item
    );
    setItems(updatedItems);
    onUpdate(updatedItems);
    setEditingId(null);
    setFormData({});
  };

  const handleDeleteExperience = (id) => {
    if (window.confirm('Delete this experience entry?')) {
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      onUpdate(updatedItems);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Helper function to extract description text from string or object
  const getDescriptionText = (desc) => {
    if (!desc) return '';
    if (typeof desc === 'string') return desc;
    if (typeof desc === 'object' && desc.description) return desc.description;
    return '';
  };

  const handleAddFromProfile = (employment) => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    const newExperience = {
      id: newId,
      company: employment.company || '',
      position: employment.title || '',
      startDate: employment.start_date || '',
      endDate: employment.end_date || '',
      description: employment.description || '',
      skills: [],
    };
    setItems([...items, newExperience]);
    onUpdate([...items, newExperience]);
  };

  return (
    <div className="experience-editor">
      <div className="editor-header">
        <h3>Work Experience</h3>
        <button onClick={handleAddExperience} className="btn btn-sm btn-success">
          + Add Experience
        </button>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">No work experience added yet</div>
      ) : (
        <div className="experience-list">
          {items.map((item) => (
            <div key={item.id} className="experience-item-card">
              {editingId === item.id ? (
                <div className="experience-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Company</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.company || ''}
                        onChange={(e) => handleFormChange('company', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.position || ''}
                        onChange={(e) => handleFormChange('position', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date (YYYY-MM)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.startDate || ''}
                        onChange={(e) => handleFormChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date (YYYY-MM or "present")</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.endDate || ''}
                        onChange={(e) => handleFormChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description / Achievements</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={getDescriptionText(formData.description)}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Describe your accomplishments and responsibilities"
                    />
                  </div>
                  <div className="form-actions">
                    <button onClick={handleSaveExperience} className="btn btn-sm btn-primary">
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
                <div className="experience-display">
                  <div className="experience-header">
                    <h5>{item.position}</h5>
                    <span className="date">
                      {item.startDate} - {item.endDate}
                    </span>
                  </div>
                  <p className="company">{item.company}</p>
                  <p className="description">{getDescriptionText(item.description)}</p>
                  <div className="experience-actions">
                    <button
                      onClick={() => handleEditExperience(item.id)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(item.id)}
                      className="btn btn-sm btn-outline-danger"
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

      {/* Available Employment Section */}
      {availableEmployment.length > 0 && (
        <div className="available-employment mt-4">
          <h4>Quick Add from Profile</h4>
          <p className="text-muted">Click to add employment entries from your profile</p>
          <div className="employment-quick-add">
            {availableEmployment.map((emp) => (
              <div key={emp._id} className="quick-add-card">
                <div className="quick-add-info">
                  <p className="position-title">
                    <strong>{emp.title || 'No title'}</strong> at {emp.company || 'N/A'}
                  </p>
                  {emp.start_date && (
                    <p className="date-range">
                      {emp.start_date} {emp.end_date ? `- ${emp.end_date}` : '- Present'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddFromProfile(emp)}
                  className="btn btn-sm btn-outline-success"
                  title="Add this employment to resume"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingEmployment && (
        <div className="alert alert-info mt-3">Loading employment data...</div>
      )}
    </div>
  );
}
