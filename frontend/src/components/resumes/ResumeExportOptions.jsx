import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import ResumesAPI from '../../api/resumes';
import { getAllThemes, getThemeByName } from '../../utils/resumeExportThemes';
import './ResumeExportOptions.css';
import posthog from 'posthog-js';

/**
 * ResumeExportOptions Component
 * Related to UC-051: Resume Export and Formatting
 * Provides options to export resume in multiple formats with theme selection
 */
export default function ResumeExportOptions({ resumeId, resumeName }) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedTheme, setSelectedTheme] = useState('professional');
  const [customFileName, setCustomFileName] = useState(resumeName || 'resume');
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [printOptimized, setPrintOptimized] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const themes = getAllThemes();
  const currentTheme = getThemeByName(selectedTheme);

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Universal format, best for email and online applications',
      icon: '📄'
    },
    {
      id: 'docx',
      name: 'Word (.docx)',
      description: 'Editable format for further customization',
      icon: '📝'
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'Web-friendly format for portfolios and websites',
      icon: '🌐'
    },
    {
      id: 'txt',
      name: 'Plain Text',
      description: 'Simple format for ATS parsing',
      icon: '📋'
    }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(false);

      let response;
      const filename = `${customFileName}.${selectedFormat === 'docx' ? 'docx' : selectedFormat}`;

      switch (selectedFormat) {
        case 'pdf':
          response = await ResumesAPI.exportPDF(resumeId);
          break;
        case 'docx':
          response = await ResumesAPI.generateDOCX(resumeId);
          break;
        case 'html':
          response = await ResumesAPI.exportHTML(resumeId);
          break;
        case 'txt':
          response = await ResumesAPI.exportPlainText(resumeId);
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create blob and download
      const blob = response instanceof Blob ? response : new Blob([response.data], {
        type: response.type || 'application/octet-stream'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      posthog.capture('resume_exported', { resume_id: resumeId, format: selectedFormat });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="resume-export-options">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && (
        <Alert variant="success">
          ✓ Resume exported successfully!
        </Alert>
      )}

      <Row className="mb-4">
        {/* Format Selection */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <Card.Title className="mb-0">Export Format</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="format-selection">
                {exportFormats.map(format => (
                  <div
                    key={format.id}
                    className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="format-header">
                      <span className="format-icon">{format.icon}</span>
                      <span className="format-name">{format.name}</span>
                      {selectedFormat === format.id && <Badge bg="primary" className="ms-2">Selected</Badge>}
                    </div>
                    <small className="text-muted">{format.description}</small>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Theme Selection */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <Card.Title className="mb-0">Theme</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="theme-grid">
                {themes.map(theme => (
                  <div
                    key={theme.id}
                    className={`theme-option ${selectedTheme === theme.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTheme(theme.id)}
                    title={theme.description}
                  >
                    <div className="theme-preview">
                      <div
                        className="preview-primary"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="preview-accent"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <small className="theme-label">{theme.name}</small>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Export Options */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <Card.Title className="mb-0">Export Options</Card.Title>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>File Name</Form.Label>
              <div className="input-group">
                <Form.Control
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Enter resume name"
                />
                <span className="input-group-text">.{selectedFormat === 'docx' ? 'docx' : selectedFormat}</span>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Print-Optimized (for paper applications)"
                checked={printOptimized}
                onChange={(e) => setPrintOptimized(e.target.checked)}
              />
              <small className="text-muted d-block mt-2">
                Removes background colors and optimizes spacing for printing
              </small>
            </Form.Group>

            {selectedFormat !== 'txt' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Add Watermark/Branding"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                />
                <small className="text-muted d-block mt-2">
                  Adds a subtle watermark to your resume
                </small>
              </Form.Group>
            )}
          </Form>
        </Card.Body>
      </Card>

      {/* Theme Preview */}
      <Card className="mb-4">
        <Card.Header className="bg-secondary text-white">
          <Card.Title className="mb-0">Theme Preview</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="theme-preview-card">
            <div className="preview-header" style={{ borderBottomColor: currentTheme.colors.accent }}>
              <div style={{ color: currentTheme.colors.primary }}>
                <h3 style={{ fontFamily: currentTheme.fonts.heading }}>John Doe</h3>
                <p style={{ color: currentTheme.colors.accent }}>Software Engineer</p>
              </div>
            </div>
            <div className="preview-section" style={{ marginTop: currentTheme.spacing.sectionMargin }}>
              <h4 style={{ color: currentTheme.colors.primary, fontFamily: currentTheme.fonts.heading }}>
                Experience
              </h4>
              <div style={{ marginBottom: currentTheme.spacing.itemMargin }}>
                <strong style={{ fontFamily: currentTheme.fonts.heading }}>Senior Developer</strong>
                <p style={{ fontStyle: 'italic', color: currentTheme.colors.accent }}>
                  Tech Company | 2021 - Present
                </p>
                <p style={{
                  fontFamily: currentTheme.fonts.body,
                  lineHeight: currentTheme.spacing.lineHeight
                }}>
                  Led development of key features and mentored junior developers
                </p>
              </div>
            </div>
            <div className="preview-section" style={{ marginTop: currentTheme.spacing.sectionMargin }}>
              <h4 style={{ color: currentTheme.colors.primary, fontFamily: currentTheme.fonts.heading }}>
                Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8pt' }}>
                {['JavaScript', 'React', 'Node.js'].map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: currentTheme.colors.accent,
                      color: 'white',
                      padding: '2pt 6pt',
                      borderRadius: '3pt',
                      fontSize: '9pt'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Export Button */}
      <div className="export-actions d-flex gap-2">
        <Button
          variant="success"
          size="lg"
          onClick={handleExport}
          disabled={exporting || !customFileName}
          className="flex-grow-1"
        >
          {exporting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Exporting...
            </>
          ) : (
            <>
              ⬇️ Export as {exportFormats.find(f => f.id === selectedFormat)?.name}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
