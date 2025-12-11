import React, { useState, useEffect } from 'react';
import CertificationsAPI from '../../api/certifications';
import '../../styles/resumes.css';

/**
 * CertificationsEditor Component
 * Add, edit, and remove certification entries
 * Related to UC-050
 */
export default function CertificationsEditor({ certifications, onUpdate }) {
  const [items, setItems] = useState(certifications || []);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [availableCertifications, setAvailableCertifications] = useState([]);
  const [loadingCertifications, setLoadingCertifications] = useState(false);

  // Load user's certifications
  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoadingCertifications(true);
        const response = await CertificationsAPI.getAll();
        setAvailableCertifications(response.data || response);
      } catch (err) {
        console.error('Error loading certifications:', err);
      } finally {
        setLoadingCertifications(false);
      }
    };
    fetchCertifications();
  }, []);

  const handleAddCertification = () => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        name: '',
        issuer: '',
        dateEarned: '',
        dateExpiry: '',
        certNumber: '',
        category: '',
      },
    ]);
    setEditingId(newId);
  };

  const handleEditCertification = (id) => {
    const item = items.find((e) => e.id === id);
    setFormData(item || {});
    setEditingId(id);
  };

  const handleSaveCertification = () => {
    const updatedItems = items.map((item) =>
      item.id === editingId ? formData : item
    );
    setItems(updatedItems);
    onUpdate(updatedItems);
    setEditingId(null);
    setFormData({});
  };

  const handleDeleteCertification = (id) => {
    if (window.confirm('Delete this certification?')) {
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      onUpdate(updatedItems);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddFromProfile = (cert) => {
    const newId = Math.max(...items.map((e) => e.id || 0), 0) + 1;
    const newCertification = {
      id: newId,
      name: cert.name || '',
      issuer: cert.issuer || '',
      dateEarned: cert.date_earned || '',
      dateExpiry: cert.date_expiry || '',
      certNumber: cert.cert_number || '',
      category: cert.category || '',
    };
    setItems([...items, newCertification]);
    onUpdate([...items, newCertification]);
  };

  return (
    <div className="certifications-editor">
      <div className="editor-header">
        <h3>Certifications</h3>
        <button onClick={handleAddCertification} className="btn btn-sm btn-success">
          + Add Certification
        </button>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">No certifications added yet</div>
      ) : (
        <div className="certifications-list">
          {items.map((item) => (
            <div key={item.id} className="certification-item-card">
              {editingId === item.id ? (
                <div className="certification-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Certification Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name || ''}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Issuer</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Google, AWS, Microsoft"
                        value={formData.issuer || ''}
                        onChange={(e) => handleFormChange('issuer', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date Earned</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., 2023-06"
                        value={formData.dateEarned || ''}
                        onChange={(e) => handleFormChange('dateEarned', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiry Date (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., 2025-06"
                        value={formData.dateExpiry || ''}
                        onChange={(e) => handleFormChange('dateExpiry', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Credential ID (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.certNumber || ''}
                        onChange={(e) => handleFormChange('certNumber', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Category (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Cloud, Security"
                        value={formData.category || ''}
                        onChange={(e) => handleFormChange('category', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={handleSaveCertification}
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
                <div className="certification-display">
                  <div className="certification-header">
                    <div>
                      <strong>{item.name || 'Certification'}</strong>
                      <p className="text-muted">{item.issuer || 'Issuer'}</p>
                    </div>
                    <div className="certification-date">{item.dateEarned}</div>
                  </div>
                  {item.category && <p className="certification-category">{item.category}</p>}
                  {item.certNumber && <p className="certification-number">ID: {item.certNumber}</p>}
                  {item.dateExpiry && <p className="certification-expiry">Expires: {item.dateExpiry}</p>}
                  <div className="item-actions">
                    <button
                      onClick={() => handleEditCertification(item.id)}
                      className="btn btn-sm btn-warning"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(item.id)}
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

      {availableCertifications.length > 0 && (
        <div className="quick-add-section">
          <h4>Import from Profile</h4>
          <div className="quick-add-buttons">
            {availableCertifications.map((cert, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFromProfile(cert)}
                className="btn btn-sm btn-outline-primary"
                title={`${cert.name} from ${cert.issuer}`}
              >
                + {cert.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
