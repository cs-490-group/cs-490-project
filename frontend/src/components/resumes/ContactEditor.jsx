import React, { useState } from 'react';
import '../../styles/resumes.css';

/**
 * ContactEditor Component
 * Edit contact information (name, email, phone, address, linkedin)
 * Related to UC-048
 */
export default function ContactEditor({ contact, onUpdate }) {
  const [formData, setFormData] = useState(contact || {});

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  return (
    <div className="contact-editor">
      <h3>Contact Information</h3>
      <p className="text-muted">Enter your contact details</p>

      <div className="form-group">
        <label htmlFor="contactName" className="form-label">
          Full Name
        </label>
        <input
          id="contactName"
          type="text"
          className="form-control"
          placeholder="John Smith"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="contactEmail" className="form-label">
            Email
          </label>
          <input
            id="contactEmail"
            type="email"
            className="form-control"
            placeholder="john.smith@email.com"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactPhone" className="form-label">
            Phone
          </label>
          <input
            id="contactPhone"
            type="tel"
            className="form-control"
            placeholder="(555) 123-4567"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="contactAddress" className="form-label">
          Address
        </label>
        <input
          id="contactAddress"
          type="text"
          className="form-control"
          placeholder="San Francisco, CA"
          value={formData.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="contactLinkedin" className="form-label">
          LinkedIn URL
        </label>
        <input
          id="contactLinkedin"
          type="url"
          className="form-control"
          placeholder="linkedin.com/in/yourprofile"
          value={formData.linkedin || ''}
          onChange={(e) => handleInputChange('linkedin', e.target.value)}
        />
      </div>
    </div>
  );
}
