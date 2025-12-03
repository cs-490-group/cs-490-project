import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ResumesAPI from '../../api/resumes';
import ReviewImpactWidget from '../../components/ReviewImpactWidget';
import '../../styles/resumes.css';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

/**
 * ResumeList Component
 * Displays all user resumes with options to create, edit, delete, and manage versions
 * Related to UC-046, UC-052
 */
export default function ResumeList() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch resumes from backend
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ResumesAPI.getAll();
        setResumes(response.data || response);
      } catch (err) {
        setError(err.message || 'Failed to load resumes');
        console.error('Error loading resumes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const filteredResumes = resumes.filter((resume) =>
    resume.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        // Start deletion animation
        setDeletingId(id);
        // Wait for animation to complete (300ms) before API call
        setTimeout(async () => {
          await ResumesAPI.delete(id);
          setResumes(resumes.filter((resume) => resume._id !== id));
          setDeletingId(null);
        }, 300);
      } catch (err) {
        setDeletingId(null);
        alert('Failed to delete resume: ' + err.message);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await ResumesAPI.setDefault(id);
      setResumes(
        resumes.map((resume) => ({
          ...resume,
          default_resume: resume._id === id,
        }))
      );
      alert('Resume set as default');
    } catch (err) {
      alert('Failed to set default resume: ' + err.message);
    }
  };

  const handleRenameStart = (resume) => {
    setEditingId(resume._id);
    setEditingName(resume.name);
  };

  const handleRenameSave = async () => {
    if (!editingName.trim()) {
      alert('Resume name cannot be empty');
      return;
    }
    try {
      await ResumesAPI.update(editingId, { name: editingName.trim() });
      setResumes(
        resumes.map((resume) =>
          resume._id === editingId ? { ...resume, name: editingName.trim() } : resume
        )
      );
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      alert('Failed to rename resume: ' + err.message);
    }
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (loading) {
    return (
          <div className="dashboard-gradient min-vh-100 py-4">
            <Container>
              <h1 className="text-center text-white fw-bold mb-5 display-4">
                Resumes
              </h1>
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
                <Spinner animation="border" variant="light" className="mb-3" />
                <p className="text-white fs-5">Loading Resume data...</p>
              </div>
            </Container>
          </div>
        );
  }

  return (
    <div className="dashboard-gradient">
    <div className="container mt-5">
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="resume-list-header">
      {/* Group title + underline together */}
        <div style={{ display: "inline-block" }}>
          <h1
            style={{
            margin: 0,
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "2.5rem",
            fontFamily: '"Playfair Display", serif',
            WebkitTextFillColor: "#ffffff", // ensures true white text
          }}
        >
          My Resumes
        </h1>

        {/* Gradient underline directly under title */}
        <div
          style={{
            width: "90px",
            height: "4px",
            margin: "6px auto 0",
            borderRadius: "2px",
            background: "linear-gradient(90deg, #00c28a, #005e9e)",
          }}
        />
      </div>

        <Link to="/resumes/templates" className="btn btn-primary">
          + Create New Resume
        </Link>
      </div>

      <div className="search-bar mb-4">
        <input
          type="text"
          placeholder="Search resumes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <ReviewImpactWidget />

      {filteredResumes.length === 0 ? (
        <div className="alert alert-info">
          <p>No resumes found. <Link to="/resumes/templates">Create your first resume</Link></p>
        </div>
      ) : (
        <div className="resume-cards-grid">
          {filteredResumes.map((resume) => (
            <div
              key={resume._id}
              className={`resume-card ${deletingId === resume._id ? 'deleting' : ''}`}
            >
              <div className="resume-card-header">
                {editingId === resume._id ? (
                  <div className="resume-name-edit">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleRenameSave()}
                    />
                    <button
                      onClick={handleRenameSave}
                      className="btn btn-sm btn-success ms-2"
                      title="Save new name"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleRenameCancel}
                      className="btn btn-sm btn-secondary ms-1"
                      title="Cancel rename"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3>{resume.name}</h3>
                    {resume.default_resume && <span className="badge bg-success">Default</span>}
                  </>
                )}
              </div>
              <div className="resume-card-body">
                <p><strong>Template:</strong> {resume.template}</p>
                <p><strong>Updated:</strong> {new Date(resume.date_updated).toLocaleDateString()}</p>
              </div>
              <div className="resume-card-actions">
                <Link to={`/resumes/edit/${resume._id}`} className="btn btn-sm btn-secondary">
                  Edit
                </Link>
                <Link to={`/resumes/preview/${resume._id}`} className="btn btn-sm btn-info">
                  Preview
                </Link>
                <Link to={`/resumes/export/${resume._id}`} className="btn btn-sm btn-success">
                  Export
                </Link>
                <Link to={`/resumes/versions/${resume._id}`} className="btn btn-sm btn-warning">
                  Versions
                </Link>
                <Link to={`/resumes/feedback/${resume._id}`} className="btn btn-sm btn-outline-info">
                  Share & Feedback
                </Link>
                <button
                  onClick={() => handleSetDefault(resume._id)}
                  className={`btn btn-sm ${resume.default_resume ? 'btn-success' : 'btn-outline-success'}`}
                >
                  {resume.default_resume ? 'Default' : 'Set Default'}
                </button>
                <button
                  onClick={() => handleRenameStart(resume)}
                  disabled={editingId !== null}
                  className="btn btn-sm btn-primary"
                  title="Rename this resume"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(resume._id)}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
