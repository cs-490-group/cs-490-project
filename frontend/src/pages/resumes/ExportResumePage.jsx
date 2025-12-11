import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExportOptions from '../../components/resumes/ExportOptions';
import PDFAPI from '../../api/pdf';
import resumesAPI from '../../api/resumes';
import '../../styles/resumes.css';

/**
 * ExportResumePage Component
 * Export resume in multiple formats (PDF, DOCX, HTML, TXT)
 * Related to UC-051
 */
export default function ExportResumePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [theme, setTheme] = useState('professional');
  const [exporting, setExporting] = useState(false);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addWatermark, setAddWatermark] = useState(false);
  const [printOptimized, setPrintOptimized] = useState(true);

  // Fetch resume data from API
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const resumeData = await resumesAPI.get(id);
        setResume(resumeData);
        setFilename(resumeData.name?.replace(/\s+/g, '_') || 'resume');
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load resume');
        console.error('Error fetching resume:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const exportFormats = [
    { id: 'pdf', label: 'PDF', extension: 'pdf', description: 'Universal format with professional formatting' },
    { id: 'docx', label: 'Word Document', extension: 'docx', description: 'Editable Microsoft Word format' },
    { id: 'html', label: 'HTML', extension: 'html', description: 'Web-friendly format' },
    { id: 'txt', label: 'Plain Text', extension: 'txt', description: 'For ATS systems' },
  ];

  const themes = [
    { id: 'professional', label: 'Professional', description: 'Clean and traditional' },
    { id: 'modern', label: 'Modern', description: 'Contemporary design' },
    { id: 'minimal', label: 'Minimal', description: 'Minimalist style' },
    { id: 'creative', label: 'Creative', description: 'Bold and colorful' },
  ];

  /**
   * Helper function to trigger file download
   */
  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${selectedFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Handle resume export
   * Currently supports PDF format via LaTeX
   * Multi-format support (DOCX, HTML, TXT) to be implemented
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      let fileBlob;

      if (selectedFormat === 'pdf') {
        // Export PDF from stored resume data
        console.log('Exporting PDF from resume data...');
        fileBlob = await PDFAPI.exportPDFFromData(id);
      } else if (selectedFormat === 'docx') {
        // Export DOCX from stored resume data
        console.log('Exporting DOCX from resume data...');
        fileBlob = await PDFAPI.generateDOCX(id);
      } else if (selectedFormat === 'html') {
        // Export HTML from stored resume data
        console.log('Exporting HTML from resume data...');
        fileBlob = await PDFAPI.exportHTMLFromData(id);
      } else {
        // Other formats not yet available
        throw new Error('TXT export is not yet available. Please use PDF, DOCX, or HTML format.');
      }

      if (!fileBlob || fileBlob.size === 0) {
        throw new Error(`Failed to generate ${selectedFormat.toUpperCase()} file`);
      }

      downloadFile(fileBlob, filename);
    } catch (err) {
      setError(err.message || `Error exporting to ${selectedFormat.toUpperCase()}`);
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="container mt-5"><h2>Loading resume...</h2></div>;
  }

  if (!resume) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h2>Error</h2>
          <p>{error || 'Resume not found'}</p>
          <button onClick={() => navigate('/resumes')} className="btn btn-secondary">
            Back to Resumes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="export-header">
        <h1>Export Resume</h1>
        <button onClick={() => navigate(`/resumes/edit/${id}`)} className="btn btn-secondary">
          Back
        </button>
      </div>

      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="export-layout">
        <div className="export-options">
          <h3>Choose Format</h3>
          <ExportOptions
            formats={exportFormats}
            selectedFormat={selectedFormat}
            onSelect={setSelectedFormat}
          />
          {selectedFormat === 'txt' && (
            <div className="alert alert-info mt-3">
              <small>TXT export coming soon. Currently PDF, DOCX, and HTML are available.</small>
            </div>
          )}
        </div>

        <div className="theme-options">
          <h3>Choose Theme</h3>
          <div className="theme-grid">
            {themes.map((t) => (
              <div
                key={t.id}
                className={`theme-card ${theme === t.id ? 'selected' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <h4>{t.label}</h4>
                <p>{t.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="export-settings">
          <h3>Settings</h3>
          <div className="form-group mb-3">
            <label className="form-label">Filename</label>
            <input
              type="text"
              className="form-control"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
            />
            <small className="form-text text-muted">
              File will be saved as: {filename}.{selectedFormat}
            </small>
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              id="addWatermark"
              className="form-check-input"
              checked={addWatermark}
              onChange={(e) => setAddWatermark(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="addWatermark">
              Add watermark / Branding
            </label>
            <small className="form-text text-muted d-block">
              Adds a subtle "Resume" watermark to the document
            </small>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              id="printOptimized"
              className="form-check-input"
              checked={printOptimized}
              onChange={(e) => setPrintOptimized(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="printOptimized">
              Print-optimized version
            </label>
            <small className="form-text text-muted d-block">
              Optimizes colors and spacing for printing
            </small>
          </div>
        </div>

        <div className="export-actions mt-4">
          <button
            onClick={handleExport}
            disabled={exporting || !filename.trim() || selectedFormat === 'txt'}
            className="btn btn-primary btn-lg"
            title={selectedFormat === 'txt' ? 'TXT export not yet available' : ''}
          >
            {exporting ? 'Exporting...' : `Download as ${selectedFormat.toUpperCase()}`}
          </button>
          <button onClick={() => navigate('/resumes')} className="btn btn-secondary btn-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
