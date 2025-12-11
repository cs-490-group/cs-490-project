import React, { useState, useEffect } from 'react';
import SkillsAPI from '../../api/skills';
import '../../styles/resumes.css';

/**
 * SkillsManager Component
 * Add, remove, and reorder skills in resume
 * Related to UC-049
 */
export default function SkillsManager({ skills, onUpdate }) {
  const [items, setItems] = useState(skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState(null);

  // Load user's skills from profile
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true);
        setError(null);
        const response = await SkillsAPI.getAll();
        setAvailableSkills(response.data || response);
      } catch (err) {
        setError('Failed to load skills');
        console.error('Error loading skills:', err);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const skillName = newSkill.trim();

      // Check if skill already exists in profile
      const skillExists = availableSkills.some(s => s.name === skillName);

      // If skill doesn't exist, create it
      if (!skillExists) {
        await SkillsAPI.add({ name: skillName });
        // Add to available skills
        setAvailableSkills([...availableSkills, { name: skillName }]);
      }

      // Add skill to resume (if not already added)
      if (!items.includes(skillName)) {
        const updatedItems = [...items, skillName];
        setItems(updatedItems);
        onUpdate(updatedItems);
      }

      setNewSkill('');
    } catch (err) {
      setError('Failed to add skill');
      console.error('Error adding skill:', err);
    }
  };

  const handleRemoveSkill = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onUpdate(updatedItems);
  };

  const handleMoveSkill = (index, direction) => {
    const newItems = [...items];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setItems(newItems);
    onUpdate(newItems);
  };

  return (
    <div className="skills-manager">
      <h3>Skills</h3>

      <div className="add-skill-form mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter a skill (e.g., React, Python, Leadership)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <button onClick={handleAddSkill} className="btn btn-primary">
            Add Skill
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">No skills added yet</div>
      ) : (
        <div className="skills-list">
          {items.map((skill, index) => (
            <div key={index} className="skill-item">
              <span className="skill-name">{skill}</span>
              <div className="skill-actions">
                <button
                  onClick={() => handleMoveSkill(index, 'up')}
                  disabled={index === 0}
                  className="btn btn-sm btn-outline-secondary"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveSkill(index, 'down')}
                  disabled={index === items.length - 1}
                  className="btn btn-sm btn-outline-secondary"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleRemoveSkill(index)}
                  className="btn btn-sm btn-outline-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="skills-info mt-3">
        <small className="text-muted">
          Tip: Reorder skills by relevance to the job. Add skills that match job requirements for better ATS compatibility.
        </small>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mt-3">{error}</div>
      )}

      {/* Available Skills Section */}
      {availableSkills.length > 0 && (
        <div className="available-skills mt-4 pt-4 border-top">
          <h4>Quick Add from Profile</h4>
          <p className="text-muted">Click to add existing skills to your resume</p>
          <div className="skills-quick-add">
            {availableSkills.map((skill) => (
              <button
                key={skill._id || skill.name}
                onClick={() => {
                  if (!items.includes(skill.name)) {
                    const updatedItems = [...items, skill.name];
                    setItems(updatedItems);
                    onUpdate(updatedItems);
                  }
                }}
                disabled={items.includes(skill.name)}
                className={`btn btn-sm ${
                  items.includes(skill.name)
                    ? 'btn-success'
                    : 'btn-outline-success'
                }`}
                title={items.includes(skill.name) ? 'Already added' : 'Click to add'}
              >
                {skill.name}
                {items.includes(skill.name) && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loadingSkills && (
        <div className="alert alert-info mt-3">Loading skills from profile...</div>
      )}
    </div>
  );
}
