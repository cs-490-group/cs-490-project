import React, { useState, useEffect } from "react";
import "../../styles/goalModal.css";

const GoalModal = ({ goal = null, onSave, onCancel }) => {
  const isEdit = goal !== null;
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "short-term",
    target_date: "",
    metrics: "",
    milestones: []
  });
  
  const [newMilestone, setNewMilestone] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || "",
        category: goal.category || "",
        type: goal.type || "short-term",
        target_date: goal.target_date || "",
        metrics: goal.metrics || "",
        milestones: goal.milestones || []
      });
    }
  }, [goal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setFormData(prev => ({
        ...prev,
        milestones: [
          ...prev.milestones,
          { 
            // Don't add _id for new milestones - backend will generate
            name: newMilestone.trim(), 
            completed: false,
            order_index: prev.milestones.length
          }
        ]
      }));
      setNewMilestone("");
    }
  };

  const handleRemoveMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleMilestoneKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMilestone();
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Goal title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }
    
    if (formData.category && formData.category.length > 100) {
      newErrors.category = "Category must be less than 100 characters";
    }
    
    if (formData.target_date) {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate < today) {
        newErrors.target_date = "Target date should be in the future";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format data for backend
      const dataToSave = {
        ...formData,
        title: formData.title.trim(),
        category: formData.category.trim() || undefined,
        metrics: formData.metrics.trim() || undefined,
        target_date: formData.target_date || undefined,
      };
      
      // When editing, don't send milestones array
      // Milestones should be managed through dedicated endpoints
      if (isEdit) {
        delete dataToSave.milestones;
      }
      
      await onSave(dataToSave);
      // onSave should close the modal
    } catch (error) {
      console.error('Error saving goal:', error);
      setErrors({ submit: error.message || "Failed to save goal" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="goal-modal-overlay" onClick={onCancel}>
      <div className="goal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="goal-modal-header">
          <h2>{isEdit ? "Edit Goal" : "Add New Goal"}</h2>
          <button 
            className="goal-modal-close" 
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="goal-modal-form">
          {/* Title */}
          <div className="goal-form-group">
            <label htmlFor="title" className="goal-form-label">
              Goal Title <span className="goal-required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`goal-form-input ${errors.title ? 'error' : ''}`}
              placeholder="e.g., Complete AWS Certification"
              maxLength={200}
              disabled={isSubmitting}
            />
            {errors.title && <span className="goal-error-message">{errors.title}</span>}
          </div>

          {/* Type and Category Row */}
          <div className="goal-form-row">
            <div className="goal-form-group">
              <label htmlFor="type" className="goal-form-label">
                Goal Type <span className="goal-required">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="goal-form-select"
                disabled={isSubmitting}
              >
                <option value="short-term">Short-term</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>

            <div className="goal-form-group">
              <label htmlFor="category" className="goal-form-label">
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`goal-form-input ${errors.category ? 'error' : ''}`}
                placeholder="e.g., Skills Development"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.category && <span className="goal-error-message">{errors.category}</span>}
            </div>
          </div>

          {/* Target Date */}
          <div className="goal-form-group">
            <label htmlFor="target_date" className="goal-form-label">
              Target Date
            </label>
            <input
              type="date"
              id="target_date"
              name="target_date"
              value={formData.target_date}
              onChange={handleChange}
              className={`goal-form-input ${errors.target_date ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.target_date && <span className="goal-error-message">{errors.target_date}</span>}
          </div>

          {/* Success Metrics */}
          <div className="goal-form-group">
            <label htmlFor="metrics" className="goal-form-label">
              Success Metrics
            </label>
            <textarea
              id="metrics"
              name="metrics"
              value={formData.metrics}
              onChange={handleChange}
              className="goal-form-textarea"
              placeholder="How will you measure success? e.g., Pass exam with 80%+ score"
              rows="3"
              disabled={isSubmitting}
            />
            <span className="goal-form-hint">
              Define clear, measurable criteria for achieving this goal
            </span>
          </div>

          {/* Milestones */}
          <div className="goal-form-group">
            <label className="goal-form-label">
              Milestones
            </label>
            {!isEdit ? (
              <>
                <div className="goal-milestone-input-group">
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyPress={handleMilestoneKeyPress}
                    className="goal-form-input"
                    placeholder="Add a milestone..."
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddMilestone}
                    className="goal-milestone-add-btn"
                    disabled={!newMilestone.trim() || isSubmitting}
                  >
                    Add
                  </button>
                </div>
                <span className="goal-form-hint">
                  Break your goal into smaller, actionable steps
                </span>
              </>
            ) : (
              <span className="goal-form-hint">
                Milestones can be toggled on/off by clicking them in the goal view. Add/remove milestones by creating a new goal.
              </span>
            )}
            
            {formData.milestones.length > 0 && (
              <ul className="goal-milestones-preview">
                {formData.milestones.map((milestone, index) => (
                  <li key={milestone._id || index} className="goal-milestone-item">
                    <span className="goal-milestone-number">{index + 1}.</span>
                    <span className="goal-milestone-name">{milestone.name}</span>
                    {!isEdit && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMilestone(index)}
                        className="goal-milestone-remove"
                        disabled={isSubmitting}
                        aria-label="Remove milestone"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="goal-error-banner">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="goal-modal-actions">
            <button 
              type="button" 
              onClick={onCancel} 
              className="goal-btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="goal-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="goal-spinner"></span>
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEdit ? "Update Goal" : "Create Goal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;