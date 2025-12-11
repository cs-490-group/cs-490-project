import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResumesAPI from '../../api/resumes';
import ResumePreview from '../../components/resumes/ResumePreview';
import ValidationFeedback from '../../components/resumes/ValidationFeedback';
import '../../styles/resumes.css';

/**
 * ResumePreviewPage Component
 * Full-screen preview of resume with validation feedback
 * Resizable print layout preview (8.5" x 11" aspect ratio)
 * Related to UC-053
 */
export default function ResumePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showValidation, setShowValidation] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(800); // Default width in pixels
  const previewContainerRef = useRef(null);
  const isResizing = useRef(false);

  // Fetch resume from backend
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ResumesAPI.get(id);
        setResume(response.data || response);
      } catch (err) {
        setError(err.message || 'Failed to load resume');
        console.error('Error loading resume:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [id]);

  // Handle resize start
  const handleResizeStart = () => {
    isResizing.current = true;
  };

  // Handle resize end
  useEffect(() => {
    const handleResizeEnd = () => {
      isResizing.current = false;
    };

    const handleMouseMove = (e) => {
      if (!isResizing.current || !previewContainerRef.current) return;

      const container = previewContainerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;

      // Constrain width between 400px and 1200px
      if (newWidth >= 400 && newWidth <= 1200) {
        setPreviewWidth(newWidth);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  if (loading) {
    return <div className="container mt-5"><h2>Loading resume...</h2></div>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error Loading Resume</h4>
          <p>{error}</p>
          <button onClick={() => navigate('/resumes')} className="btn btn-secondary">
            Back to Resumes
          </button>
        </div>
      </div>
    );
  }

  if (!resume) {
    return <div className="container mt-5"><h4>Resume not found</h4></div>;
  }

  // Calculate height based on 8.5" x 11" aspect ratio (1:1.294)
  const aspectRatio = 1.294;
  const previewHeight = previewWidth * aspectRatio;

  return (
    <div className="resume-preview-page">
      <div className="preview-header">
        <h1>{resume.name}</h1>
        <div className="preview-actions">
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="btn btn-secondary"
          >
            {showValidation ? 'Hide' : 'Show'} Validation
          </button>
          <button onClick={() => navigate(`/resumes/edit/${id}`)} className="btn btn-primary">
            Edit Resume
          </button>
          <button onClick={() => navigate(`/resumes/export/${id}`)} className="btn btn-success">
            Export Resume
          </button>
          <button onClick={() => navigate('/resumes')} className="btn btn-secondary">
            Back
          </button>
          <span className="preview-size-info">
            Size: {Math.round(previewWidth)}px × {Math.round(previewHeight)}px (drag corner to resize)
          </span>
        </div>
      </div>

      <div className="preview-layout" style={{ gap: '20px' }}>
        <div
          className="preview-main-resizable"
          ref={previewContainerRef}
          style={{
            width: `${previewWidth}px`,
            position: 'relative'
          }}
        >
          <div style={{ overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <ResumePreview resume={resume} />
          </div>

          {/* Resize Handle - Bottom Right Corner */}
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              bottom: '-12px',
              right: '-12px',
              width: '24px',
              height: '24px',
              cursor: 'nwse-resize',
              background: 'linear-gradient(135deg, transparent 50%, #4a90e2 50%)',
              borderRadius: '0 0 8px 0',
              zIndex: 100,
              opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => !isResizing.current && (e.currentTarget.style.opacity = '0.6')}
            title="Drag to resize preview"
          />
        </div>

        {showValidation && (
          <div className="preview-validation" style={{ minWidth: '300px' }}>
            <ValidationFeedback resume={resume} />
          </div>
        )}
      </div>
    </div>
  );
}
