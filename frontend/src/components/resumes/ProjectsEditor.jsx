import React, { useState, useEffect } from 'react';
import ProjectsAPI from '../../api/projects';
import '../../styles/resumes.css';

/**
 * ProjectsEditor Component
 * Add, edit, and remove project entries
 * Related to UC-050
 */
export default function ProjectsEditor({ projects, onUpdate }) {
  const [items, setItems] = useState(projects || []);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await ProjectsAPI.getAll();
        setAvailableProjects(response.data || response);
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const handleAddProject = () => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        title: '',
        description: '',
        role: '',
        startDate: '',
        endDate: '',
        skills: [],
        url: '',
        achievements: '',
      },
    ]);
    setEditingId(newId);
  };

  const handleEditProject = (id) => {
    const item = items.find((e) => e.id === id);
    setFormData(item || {});
    setEditingId(id);
  };

  const handleSaveProject = () => {
    const updatedItems = items.map((item) =>
      item.id === editingId ? formData : item
    );
    setItems(updatedItems);
    onUpdate(updatedItems);
    setEditingId(null);
    setFormData({});
  };

  const handleDeleteProject = (id) => {
    if (window.confirm('Delete this project?')) {
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      onUpdate(updatedItems);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddFromProfile = (project) => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    const newProject = {
      id: newId,
      title: project.project_name || '',
      description: project.description || '',
      role: project.role || '',
      startDate: project.start_date || '',
      endDate: project.end_date || '',
      skills: project.skills || [],
      url: project.project_url || '',
      achievements: project.achievements || '',
    };
    setItems([...items, newProject]);
    onUpdate([...items, newProject]);
  };

  return (
    <div className="projects-editor">
      <div className="editor-header">
        <h3>Projects</h3>
        <button onClick={handleAddProject} className="btn btn-sm btn-success">
          + Add Project
        </button>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">No projects added yet</div>
      ) : (
        <div className="projects-list">
          {items.map((item) => (
            <div key={item.id} className="project-item-card">
              {editingId === item.id ? (
                <div className="project-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Project Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title || ''}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Your Role</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Lead Developer, Designer"
                        value={formData.role || ''}
                        onChange={(e) => handleFormChange('role', e.target.value)}
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
                    <label>Project Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Describe the project and your contributions"
                      value={formData.description || ''}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Skills Used (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., React, Node.js, MongoDB"
                        value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills || ''}
                        onChange={(e) => handleFormChange('skills', e.target.value.split(',').map(s => s.trim()))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Project URL (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., https://github.com/..."
                        value={formData.url || ''}
                        onChange={(e) => handleFormChange('url', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Key Achievements (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Key accomplishments or metrics"
                      value={formData.achievements || ''}
                      onChange={(e) => handleFormChange('achievements', e.target.value)}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={handleSaveProject}
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
                <div className="project-display">
                  <div className="project-header">
                    <div>
                      <strong>{item.title || 'Project'}</strong>
                      <p className="text-muted">{item.role && `Role: ${item.role}`}</p>
                    </div>
                    <div className="project-dates">
                      {item.startDate && item.endDate
                        ? `${item.startDate} - ${item.endDate}`
                        : item.startDate || ''}
                    </div>
                  </div>
                  {item.description && <p className="project-description">{item.description}</p>}
                  {item.skills && item.skills.length > 0 && (
                    <div className="project-skills">
                      <strong>Skills:</strong> {Array.isArray(item.skills) ? item.skills.join(', ') : item.skills}
                    </div>
                  )}
                  {item.achievements && <p className="project-achievements">{item.achievements}</p>}
                  {item.url && (
                    <p className="project-url">
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        View Project →
                      </a>
                    </p>
                  )}
                  <div className="item-actions">
                    <button
                      onClick={() => handleEditProject(item.id)}
                      className="btn btn-sm btn-warning"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(item.id)}
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

      {availableProjects.length > 0 && (
        <div className="quick-add-section">
          <h4>Import from Profile</h4>
          <div className="quick-add-buttons">
            {availableProjects.map((project, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFromProfile(project)}
                className="btn btn-sm btn-outline-primary"
                title={project.description}
              >
                + {project.project_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
