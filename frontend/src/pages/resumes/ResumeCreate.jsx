import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumesAPI from '../../api/resumes';
import TemplateSelector from '../../components/resumes/TemplateSelector';
import '../../styles/resumes.css';

/**
 * ResumeCreate Component
 * Allows users to create a new resume by selecting a template
 * Related to UC-046
 */
export default function ResumeCreate() {
  const navigate = useNavigate();
  const [resumeName, setResumeName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const templates = [
    {
      id: 'chronological',
      name: 'Chronological',
      description: 'Best for candidates with consistent career progression',
      preview: 'Traditional format with work experience listed in reverse chronological order',
    },
    {
      id: 'functional',
      name: 'Functional',
      description: 'Best for career changers and those with gaps',
      preview: 'Focus on skills and achievements rather than chronological work history',
    },
    {
      id: 'hybrid',
      name: 'Hybrid',
      description: 'Combines skills and experience for maximum impact',
      preview: 'Balanced format combining both skills and chronological work experience',
    },
  ];

  const handleCreate = async () => {
    if (!resumeName.trim()) {
      alert('Please enter a resume name');
      return;
    }
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    try {
      setLoading(true);
      const result = await ResumesAPI.add({
        name: resumeName.trim(),
        template: selectedTemplate,
        sections: ['contact', 'summary', 'experience', 'education', 'skills'],
        contact: {},
        summary: '',
        experience: [],
        education: [],
        skills: [],
        colors: { primary: '#1a1a1a', accent: '#2c3e50' },
        fonts: { heading: 'Calibri', body: 'Calibri' },
      });

      // Redirect to editor with the new resume ID
      const resumeId = result.data?._id || result.data?.resume_id || result._id;
      navigate(`/resumes/edit/${resumeId}`);
    } catch (err) {
      alert('Failed to create resume: ' + err.message);
      console.error('Error creating resume:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="create-resume-header">
        <h1>Create New Resume</h1>
        <p>Get started by naming your resume and selecting a template</p>
      </div>

      <div className="create-resume-form">
        <div className="form-group mb-4">
          <label htmlFor="resumeName" className="form-label">
            Resume Name
          </label>
          <input
            id="resumeName"
            type="text"
            className="form-control"
            placeholder="e.g., Software Engineer Resume, Product Manager Resume"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
          />
        </div>

        <div className="template-selection">
          <h3 className="mb-4">Select a Template</h3>
          <TemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        </div>

        <div className="form-actions mt-5">
          <button
            onClick={handleCreate}
            disabled={loading || !resumeName.trim() || !selectedTemplate}
            className="btn btn-primary btn-lg"
          >
            {loading ? 'Creating...' : 'Create Resume'}
          </button>
          <button
            onClick={() => navigate('/resumes/templates')}
            className="btn btn-info btn-lg"
          >
            Preview Templates
          </button>
          <button onClick={() => navigate('/resumes')} className="btn btn-secondary btn-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
