import React, { useState, useEffect } from "react";
import "../../styles/salaryModal.css";

const SalaryModal = ({ record = null, onSave, onCancel }) => {
  const isEdit = record !== null;
  
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    salary_amount: "",
    job_role: "",
    company: "",
    location: "",
    employment_type: "full-time",
    bonus: "",
    equity_value: "",
    notes: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (record) {
      setFormData({
        year: record.year || new Date().getFullYear(),
        salary_amount: record.salary_amount || "",
        job_role: record.job_role || "",
        company: record.company || "",
        location: record.location || "",
        employment_type: record.employment_type || "full-time",
        bonus: record.bonus || "",
        equity_value: record.equity_value || "",
        notes: record.notes || ""
      });
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return "";
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setFormData(prev => ({ ...prev, [name]: numericValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Year validation
    const currentYear = new Date().getFullYear();
    if (!formData.year) {
      newErrors.year = "Year is required";
    } else if (formData.year < 2000 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 2000 and ${currentYear + 1}`;
    }
    
    // Salary validation
    if (!formData.salary_amount) {
      newErrors.salary_amount = "Salary amount is required";
    } else {
      const salary = parseFloat(formData.salary_amount);
      if (isNaN(salary) || salary <= 0) {
        newErrors.salary_amount = "Please enter a valid salary amount";
      } else if (salary < 1000) {
        newErrors.salary_amount = "Salary seems too low. Please verify.";
      } else if (salary > 10000000) {
        newErrors.salary_amount = "Salary seems too high. Please verify.";
      }
    }
    
    // Optional field validations
    if (formData.job_role && formData.job_role.length > 100) {
      newErrors.job_role = "Job role must be less than 100 characters";
    }
    
    if (formData.company && formData.company.length > 100) {
      newErrors.company = "Company name must be less than 100 characters";
    }
    
    if (formData.location && formData.location.length > 100) {
      newErrors.location = "Location must be less than 100 characters";
    }
    
    if (formData.bonus) {
      const bonus = parseFloat(formData.bonus);
      if (isNaN(bonus) || bonus < 0) {
        newErrors.bonus = "Bonus must be a positive number";
      }
    }
    
    if (formData.equity_value) {
      const equity = parseFloat(formData.equity_value);
      if (isNaN(equity) || equity < 0) {
        newErrors.equity_value = "Equity value must be a positive number";
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
        year: parseInt(formData.year),
        salary_amount: parseFloat(formData.salary_amount),
        job_role: formData.job_role.trim() || undefined,
        company: formData.company.trim() || undefined,
        location: formData.location.trim() || undefined,
        employment_type: formData.employment_type,
        bonus: formData.bonus ? parseFloat(formData.bonus) : 0,
        equity_value: formData.equity_value ? parseFloat(formData.equity_value) : 0,
        notes: formData.notes.trim() || undefined
      };
      
      await onSave(dataToSave);
      // onSave should close the modal
    } catch (error) {
      console.error('Error saving salary record:', error);
      setErrors({ submit: error.message || "Failed to save salary record" });
      setIsSubmitting(false);
    }
  };

  // Calculate total compensation
  const calculateTotal = () => {
    const base = parseFloat(formData.salary_amount) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const equity = parseFloat(formData.equity_value) || 0;
    return base + bonus + equity;
  };

  const totalComp = calculateTotal();

  return (
    <div className="salary-modal-overlay" onClick={onCancel}>
      <div className="salary-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="salary-modal-header">
          <h2>{isEdit ? "Edit Salary Record" : "Add Salary Record"}</h2>
          <button 
            className="salary-modal-close" 
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="salary-modal-form">
          {/* Year and Salary Row */}
          <div className="salary-form-row">
            <div className="salary-form-group">
              <label htmlFor="year" className="salary-form-label">
                Year <span className="salary-required">*</span>
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={`salary-form-input ${errors.year ? 'error' : ''}`}
                min="2000"
                max={new Date().getFullYear() + 1}
                disabled={isSubmitting}
              />
              {errors.year && <span className="salary-error-message">{errors.year}</span>}
            </div>

            <div className="salary-form-group">
              <label htmlFor="salary_amount" className="salary-form-label">
                Base Salary <span className="salary-required">*</span>
              </label>
              <div className="salary-input-wrapper">
                <span className="salary-currency-symbol">$</span>
                <input
                  type="text"
                  id="salary_amount"
                  name="salary_amount"
                  value={formatCurrency(formData.salary_amount)}
                  onChange={handleCurrencyChange}
                  className={`salary-form-input salary-currency-input ${errors.salary_amount ? 'error' : ''}`}
                  placeholder="100,000"
                  disabled={isSubmitting}
                />
              </div>
              {errors.salary_amount && <span className="salary-error-message">{errors.salary_amount}</span>}
            </div>
          </div>

          {/* Job Role and Company Row */}
          <div className="salary-form-row">
            <div className="salary-form-group">
              <label htmlFor="job_role" className="salary-form-label">
                Job Role
              </label>
              <input
                type="text"
                id="job_role"
                name="job_role"
                value={formData.job_role}
                onChange={handleChange}
                className={`salary-form-input ${errors.job_role ? 'error' : ''}`}
                placeholder="e.g., Senior Software Engineer"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.job_role && <span className="salary-error-message">{errors.job_role}</span>}
            </div>

            <div className="salary-form-group">
              <label htmlFor="company" className="salary-form-label">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`salary-form-input ${errors.company ? 'error' : ''}`}
                placeholder="e.g., Tech Corp"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.company && <span className="salary-error-message">{errors.company}</span>}
            </div>
          </div>

          {/* Location and Employment Type Row */}
          <div className="salary-form-row">
            <div className="salary-form-group">
              <label htmlFor="location" className="salary-form-label">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`salary-form-input ${errors.location ? 'error' : ''}`}
                placeholder="e.g., San Francisco, CA"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.location && <span className="salary-error-message">{errors.location}</span>}
            </div>

            <div className="salary-form-group">
              <label htmlFor="employment_type" className="salary-form-label">
                Employment Type
              </label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="salary-form-select"
                disabled={isSubmitting}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>

          {/* Bonus and Equity Row */}
          <div className="salary-form-row">
            <div className="salary-form-group">
              <label htmlFor="bonus" className="salary-form-label">
                Annual Bonus
              </label>
              <div className="salary-input-wrapper">
                <span className="salary-currency-symbol">$</span>
                <input
                  type="text"
                  id="bonus"
                  name="bonus"
                  value={formatCurrency(formData.bonus)}
                  onChange={handleCurrencyChange}
                  className={`salary-form-input salary-currency-input ${errors.bonus ? 'error' : ''}`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              {errors.bonus && <span className="salary-error-message">{errors.bonus}</span>}
            </div>

            <div className="salary-form-group">
              <label htmlFor="equity_value" className="salary-form-label">
                Equity Value
              </label>
              <div className="salary-input-wrapper">
                <span className="salary-currency-symbol">$</span>
                <input
                  type="text"
                  id="equity_value"
                  name="equity_value"
                  value={formatCurrency(formData.equity_value)}
                  onChange={handleCurrencyChange}
                  className={`salary-form-input salary-currency-input ${errors.equity_value ? 'error' : ''}`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              {errors.equity_value && <span className="salary-error-message">{errors.equity_value}</span>}
            </div>
          </div>

          {/* Total Compensation Summary */}
          {totalComp > 0 && (
            <div className="salary-total-summary">
              <span className="salary-total-label">Total Compensation:</span>
              <span className="salary-total-value">
                ${totalComp.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="salary-form-group">
            <label htmlFor="notes" className="salary-form-label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="salary-form-textarea"
              placeholder="Additional details about this compensation package..."
              rows="3"
              disabled={isSubmitting}
            />
            <span className="salary-form-hint">
              Include details about benefits, stock options, or other perks
            </span>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="salary-error-banner">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="salary-modal-actions">
            <button 
              type="button" 
              onClick={onCancel} 
              className="salary-btn-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="salary-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="salary-spinner"></span>
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Update Record" : "Add Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryModal;