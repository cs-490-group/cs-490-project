import React, { useState, useEffect } from "react";
import "../../styles/timeTrackingModal.css";

const TimeTrackingModal = ({ entry = null, onSave, onCancel }) => {
  const isEdit = entry !== null;
  
  const [formData, setFormData] = useState({
    activity_type: "Applications",
    date: new Date().toISOString().split('T')[0],
    duration: "",
    notes: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activityTypes = [
    'Networking',
    'Applications',
    'Interview Prep',
    'Skill Development',
    'Research',
    'Follow-ups',
    'Portfolio Work',
    'Other'
  ];

  // Populate form when editing
  useEffect(() => {
    if (entry) {
      setFormData({
        activity_type: entry.activity_type || "Applications",
        date: entry.date || new Date().toISOString().split('T')[0],
        duration: entry.duration || "",
        notes: entry.notes || ""
      });
    }
  }, [entry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Duration validation
    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    } else {
      const duration = parseFloat(formData.duration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.duration = "Duration must be a positive number";
      } else if (duration > 24) {
        newErrors.duration = "Duration cannot exceed 24 hours per day";
      }
    }
    
    // Date validation
    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        newErrors.date = "Cannot log time for future dates";
      }
    }
    
    // Notes validation
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = "Notes must be less than 500 characters";
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
      const dataToSave = {
        activity_type: formData.activity_type,
        date: formData.date,
        duration: parseFloat(formData.duration),
        notes: formData.notes.trim() || undefined
      };
      
      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving time entry:', error);
      setErrors({ submit: error.response?.data?.detail || "Failed to save time entry" });
      setIsSubmitting(false);
    }
  };

  // Quick duration buttons
  const quickDurations = [0.25, 0.5, 1, 2, 3, 4];

  const setQuickDuration = (hours) => {
    setFormData(prev => ({ ...prev, duration: hours.toString() }));
    if (errors.duration) {
      setErrors(prev => ({ ...prev, duration: "" }));
    }
  };

  return (
    <div className="time-modal-overlay" onClick={onCancel}>
      <div className="time-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="time-modal-header">
          <h2>{isEdit ? "Edit Time Entry" : "Log Time Entry"}</h2>
          <button 
            className="time-modal-close" 
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="time-modal-form">
          {/* Activity Type */}
          <div className="time-form-group">
            <label htmlFor="activity_type" className="time-form-label">
              Activity Type <span className="time-required">*</span>
            </label>
            <select
              id="activity_type"
              name="activity_type"
              value={formData.activity_type}
              onChange={handleChange}
              className="time-form-select"
              disabled={isSubmitting}
              aria-label="Select activity type"
            >
              {activityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="time-form-group">
            <label htmlFor="date" className="time-form-label">
              Date <span className="time-required">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`time-form-input ${errors.date ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.date && <span className="time-error-message">{errors.date}</span>}
          </div>

          {/* Duration */}
          <div className="time-form-group">
            <label htmlFor="duration" className="time-form-label">
              Duration (hours) <span className="time-required">*</span>
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={`time-form-input ${errors.duration ? 'error' : ''}`}
              placeholder="e.g., 2.5"
              step="0.25"
              min="0.25"
              max="24"
              disabled={isSubmitting}
            />
            {errors.duration && <span className="time-error-message">{errors.duration}</span>}
            
            {/* Quick Duration Buttons */}
            <div className="time-quick-duration">
              <span className="time-quick-label">Quick select:</span>
              {quickDurations.map(hours => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setQuickDuration(hours)}
                  className="time-quick-btn"
                  disabled={isSubmitting}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="time-form-group">
            <label htmlFor="notes" className="time-form-label">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className={`time-form-textarea ${errors.notes ? 'error' : ''}`}
              placeholder="What did you work on? Any achievements or challenges?"
              rows="4"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="time-char-count">
              {formData.notes.length}/500 characters
            </div>
            {errors.notes && <span className="time-error-message">{errors.notes}</span>}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="time-error-banner">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="time-modal-actions">
            <button 
              type="button" 
              onClick={onCancel} 
              className="time-btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="time-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="time-spinner"></span>
                  {isEdit ? "Updating..." : "Logging..."}
                </>
              ) : (
                isEdit ? "Update Entry" : "Log Time"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeTrackingModal;