import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplatesAPI from '../../api/templates';
import ResumesAPI from '../../api/resumes';
import ResumePreview from '../../components/resumes/ResumePreview';
import ShareTemplateModal from '../../components/resumes/ShareTemplateModal';
import '../../styles/resumes.css';

/**
 * TemplateLibraryPage Component
 * Browse and preview resume templates side-by-side
 * Related to UC-046: Resume Template Management
 */

// Sample resume data to demonstrate templates
const SAMPLE_RESUME = {
  contact: {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/johnsmith'
  },
  summary: 'Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code and mentoring junior developers.',
  experience: [
    {
      id: 1,
      position: 'Senior Software Engineer',
      company: 'Tech Corp',
      startDate: 'Jan 2022',
      endDate: 'Present',
      description: 'Led development of microservices architecture, improving system performance by 40%'
    },
    {
      id: 2,
      position: 'Software Engineer',
      company: 'StartupXYZ',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      description: 'Built and maintained customer-facing web applications using React and Node.js'
    }
  ],
  education: [
    {
      id: 1,
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      school: 'State University',
      year: '2019'
    }
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'Git'],
  colors: { primary: '#1a1a1a', accent: '#2c3e50' },
  fonts: { heading: 'Calibri', body: 'Calibri' }
};

export default function TemplateLibraryPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [creating, setCreating] = useState(false);
  const [sharingTemplateId, setSharingTemplateId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch built-in template library
        const libraryResponse = await TemplatesAPI.getLibrary();
        const libraryData = libraryResponse.data || libraryResponse;
        const builtInTemplates = Array.isArray(libraryData)
          ? libraryData.map(t => ({
              ...t,
              _id: t.id,
              template_type: t.id,
              is_default: false,
              isBuiltIn: true
            }))
          : [];

        // Fetch user templates
        let userTemplates = [];
        try {
          const userResponse = await TemplatesAPI.getUserTemplates();
          userTemplates = Array.isArray(userResponse) ? userResponse : (userResponse.data || []);
        } catch (err) {
          // User might not be authenticated, ignore and just show built-in templates
          console.log('Could not load user templates:', err.message);
        }

        // Combine built-in templates with user templates
        const allTemplates = [...builtInTemplates, ...userTemplates];
        setTemplates(allTemplates);

        // Select first template by default
        if (allTemplates.length > 0) {
          setSelectedTemplate(allTemplates[0]);
        }
      } catch (err) {
        // Properly extract error message
        let errorMessage = 'Failed to load templates';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err?.detail) {
          errorMessage = err.detail;
        }
        setError(errorMessage);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setDeletingId(templateId);
      await TemplatesAPI.deleteTemplate(templateId);
      const updatedTemplates = templates.filter(t => t._id !== templateId);
      setTemplates(updatedTemplates);
      if (selectedTemplate?._id === templateId) {
        // Select first built-in template or first remaining template
        const builtInTemplate = updatedTemplates.find(t => t.isBuiltIn);
        setSelectedTemplate(builtInTemplate || updatedTemplates[0]);
      }
    } catch (err) {
      alert('Failed to delete template: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateResume = async (template) => {
    if (!resumeName.trim()) {
      alert('Please enter a resume name');
      return;
    }

    try {
      setCreating(true);

      // Copy template's colors and fonts if available, otherwise use defaults
      const templateColors = template.colors || { primary: '#1a1a1a', accent: '#2c3e50' };
      const templateFonts = template.fonts || { heading: 'Calibri', body: 'Calibri' };

      const result = await ResumesAPI.add({
        name: resumeName.trim(),
        template: template.template_type,
        templateId: template.id,  // Store the template ID for rendering
        sections: ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'],
        contact: {
          name: '',
          email: '',
          phone: '',
          address: '',
          linkedin: ''
        },
        summary: '',
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        skills: [],
        colors: templateColors,
        fonts: templateFonts,
      });

      const resumeId = result.data?._id || result.data?.resume_id || result._id;
      navigate(`/resumes/edit/${resumeId}`);
    } catch (err) {
      alert('Failed to create resume: ' + err.message);
      console.error('Error creating resume:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await TemplatesAPI.setDefaultTemplate(templateId);
      setTemplates(templates.map(t => ({
        ...t,
        is_default: t._id === templateId
      })));
    } catch (err) {
      alert('Failed to set default template: ' + err.message);
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate HTML file
    if (file.type !== 'text/html' && !file.name.toLowerCase().endsWith('.html')) {
      alert('Please upload an HTML file');
      return;
    }

    setImportFile(file);
    setImportName(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleImportTemplate = async () => {
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    if (!importName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('name', importName.trim());
      formData.append('description', importDescription.trim());

      const result = await TemplatesAPI.upload(formData);

      // Add new template to list
      if (result.template) {
        setTemplates([...templates, {
          ...result.template,
          _id: result.template_id
        }]);
        setSelectedTemplate(result.template);
      }

      // Reset form
      setShowImportModal(false);
      setImportFile(null);
      setImportName('');
      setImportDescription('');
      alert('Template imported successfully!');
    } catch (err) {
      alert('Failed to import template: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 py-4">
        <div className="text-center p-5">
          <h2 className="text-white mb-3">Loading templates...</h2>
        </div>
      </div>
    );
  }

  // Create demo resume with selected template
  const demoResume = selectedTemplate ? {
    ...SAMPLE_RESUME,
    template: selectedTemplate.template_type
  } : null;

  return (
    <div className="dashboard-gradient template-library-container">
      <div className="template-library-header">
        <div>
          <h1>Resume Templates</h1>
          <p className="text-muted">Browse and preview template styles</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger m-4" role="alert">
          {error}
        </div>
      )}

      <div className="template-library-layout">
        {/* Left Side: Template List */}
        <div className="template-list-panel">
          <div className="template-list-header-section">
            <h3>Available Templates</h3>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-sm btn-success"
              title="Import HTML resume as template"
            >
              📥 Import HTML
            </button>
          </div>
          <div className="template-list">
            {templates.map((template) => (
              <div
                key={template._id}
                className={`template-list-item ${selectedTemplate?._id === template._id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="template-list-header">
                  <h4>{template.name}</h4>
                  {template.is_default && <span className="badge bg-primary">Default</span>}
                </div>
                <p className="template-type-badge">{template.template_type}</p>
                <p className="template-description">{template.description}</p>

                {!template.isBuiltIn && (
                  <div className="template-list-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingTemplateId(template._id);
                      }}
                      disabled={deletingId === template._id}
                      className="btn btn-sm btn-info btn-block mb-2"
                    >
                      Share
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template._id);
                      }}
                      disabled={deletingId === template._id}
                      className="btn btn-sm btn-danger btn-block"
                    >
                      {deletingId === template._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Template Preview */}
        <div className="template-preview-panel">
          {selectedTemplate ? (
            <>
              <div className="template-preview-header">
                <h2>{selectedTemplate.name} Preview</h2>
                <p className="text-muted">This is how your resume will look with this template</p>
              </div>

              {/* Resume Name Input */}
              <div className="form-group mb-3">
                <label htmlFor="resumeName" className="form-label">
                  Resume Name
                </label>
                <input
                  id="resumeName"
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="e.g., Software Engineer Resume, Product Manager Resume"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  disabled={creating}
                />
              </div>

              {/* Live Preview */}
              <div className="template-preview-box">
                {demoResume && <ResumePreview resume={demoResume} />}
              </div>

              {/* Action Buttons */}
              <div className="template-preview-actions">
                <button
                  onClick={() => handleCreateResume(selectedTemplate)}
                  disabled={creating || !resumeName.trim()}
                  className="btn btn-primary btn-lg btn-block mb-2"
                >
                  {creating ? 'Creating...' : 'Use This Template'}
                </button>
                {!selectedTemplate.is_default && !selectedTemplate.isBuiltIn && (
                  <button
                    onClick={() => handleSetDefault(selectedTemplate._id)}
                    disabled={creating}
                    className="btn btn-outline-secondary btn-lg btn-block"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => navigate('/resumes')}
                  disabled={creating}
                  className="btn btn-secondary btn-lg btn-block"
                >
                  Back to Resumes
                </button>
              </div>
            </>
          ) : (
            <div className="template-preview-empty">
              <p>Select a template to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Share Template Modal */}
      {sharingTemplateId && (
        <ShareTemplateModal
          templateId={sharingTemplateId}
          templateName={templates.find(t => t._id === sharingTemplateId)?.name}
          onClose={() => setSharingTemplateId(null)}
          onSuccess={() => {
            setSharingTemplateId(null);
            // Optionally refresh templates after successful share
            alert('Template shared successfully!');
          }}
        />
      )}

      {/* Import Template Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => !importing && setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import HTML Resume as Template</h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => !importing && setShowImportModal(false)}
                disabled={importing}
              />
            </div>

            <div className="modal-body">
              <div className="form-group mb-3">
                <label htmlFor="templateFile" className="form-label">
                  HTML Resume File
                </label>
                <input
                  id="templateFile"
                  type="file"
                  accept=".html"
                  className="form-control"
                  onChange={handleFileSelected}
                  disabled={importing}
                />
                <small className="text-muted">Select an HTML file exported from your resume</small>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="templateName" className="form-label">
                  Template Name
                </label>
                <input
                  id="templateName"
                  type="text"
                  className="form-control"
                  placeholder="e.g., My Professional Resume"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  disabled={importing}
                />
              </div>

              <div className="form-group mb-3">
                <label htmlFor="templateDescription" className="form-label">
                  Description (Optional)
                </label>
                <textarea
                  id="templateDescription"
                  className="form-control"
                  placeholder="Describe your template..."
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  disabled={importing}
                  rows="3"
                />
              </div>

              {importFile && (
                <div className="alert alert-info">
                  <strong>Selected file:</strong> {importFile.name}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImportTemplate}
                disabled={importing || !importFile || !importName.trim()}
              >
                {importing ? 'Importing...' : 'Import Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
