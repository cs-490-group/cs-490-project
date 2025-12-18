import React, { useState, useEffect } from 'react';
import { Card, Alert, ProgressBar, Badge, ListGroup, Button, Spinner } from 'react-bootstrap';
import ResumesAPI from '../../api/resumes';
import './ResumeValidationPanel.css';

/**
 * ResumeValidationPanel Component
 * Related to UC-053: Resume Preview and Validation
 * Provides real-time resume validation and ATS scoring
 */
export default function ResumeValidationPanel({ resumeId, autoValidate = true }) {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (autoValidate && resumeId) {
      validateResume();
    }
  }, [resumeId, autoValidate]);

  const validateResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ResumesAPI.validateResume(resumeId);
      const data = response.data || response;
      setValidation(data);
    } catch (err) {
      setError(err.message || 'Failed to validate resume');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="validation-panel loading">
        <Card.Body className="text-center">
          <Spinner animation="border" className="me-2" />
          Validating resume...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Validation Error</Alert.Heading>
        <p>{error}</p>
        <Button size="sm" onClick={validateResume}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!validation) {
    return (
      <Card className="validation-panel">
        <Card.Body>
          <Button onClick={validateResume} variant="primary" className="w-100">
            Validate Resume
          </Button>
        </Card.Body>
      </Card>
    );
  }

  const getScoreVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (score) => {
    if (score >= 80) return '✓';
    if (score >= 60) return '⚠️';
    return '✗';
  };

  return (
    <Card className={`validation-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <Card.Header
        className={`cursor-pointer bg-${getScoreVariant(validation.score)}`}
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', color: 'white' }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="score-icon">{getStatusIcon(validation.score)}</span>
            <span className="ms-2">
              Resume Validation: <strong>{validation.score}/100</strong>
            </span>
          </div>
          <span>{expanded ? '▼' : '►'}</span>
        </div>
      </Card.Header>

      {expanded && (
        <Card.Body>
          {/* Summary */}
          {validation.summary && (
            <Alert variant="info" className="mb-3">
              <strong>Summary:</strong> {validation.summary}
            </Alert>
          )}

          {/* Scores */}
          <div className="scores-section mb-4">
            <h6 className="mb-3">Validation Scores</h6>
            <div className="score-item mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Overall Score</span>
                <Badge bg={getScoreVariant(validation.score)}>
                  {validation.score}%
                </Badge>
              </div>
              <ProgressBar
                now={validation.score}
                variant={getScoreVariant(validation.score)}
                aria-label="Overall Resume Score"
              />
            </div>

            {validation.ats_score !== undefined && (
              <div className="score-item">
                <div className="d-flex justify-content-between mb-2">
                  <span>ATS Compatibility Score</span>
                  <Badge bg={getScoreVariant(validation.ats_score)}>
                    {validation.ats_score}%
                  </Badge>
                </div>
                <ProgressBar
                  now={validation.ats_score}
                  variant={getScoreVariant(validation.ats_score)}
                  aria-label="ATS Compatibility Score"
                />
                <small className="text-muted d-block mt-2">
                  How well your resume will be parsed by Applicant Tracking Systems
                </small>
              </div>
            )}
          </div>

          {/* Critical Errors */}
          {validation.errors && validation.errors.length > 0 && (
            <div className="issues-section mb-4">
              <h6 className="text-danger mb-3">
                ❌ Critical Issues ({validation.errors.length})
              </h6>
              <ListGroup variant="flush">
                {validation.errors.map((error, idx) => (
                  <ListGroup.Item key={idx} className="border-danger bg-danger-light">
                    <small className="text-danger">{error}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div className="issues-section mb-4">
              <h6 className="text-warning mb-3">
                ⚠️ Warnings ({validation.warnings.length})
              </h6>
              <ListGroup variant="flush">
                {validation.warnings.map((warning, idx) => (
                  <ListGroup.Item key={idx} className="border-warning bg-warning-light">
                    <small className="text-warning">{warning}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Missing Sections */}
          {validation.missing_sections && validation.missing_sections.length > 0 && (
            <div className="issues-section mb-4">
              <h6 className="text-info mb-3">
                ℹ️ Missing Sections ({validation.missing_sections.length})
              </h6>
              <div className="missing-section-tags">
                {validation.missing_sections.map((section, idx) => (
                  <Badge key={idx} bg="info" className="me-2 mb-2">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="suggestions-section mb-4">
              <h6 className="mb-3">💡 Suggestions for Improvement</h6>
              <ListGroup variant="flush">
                {validation.suggestions.map((suggestion, idx) => (
                  <ListGroup.Item key={idx} className="bg-light">
                    <small>{suggestion}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Metrics */}
          {validation.metrics && (
            <div className="metrics-section mb-4 p-3 bg-light rounded">
              <h6 className="mb-3">Resume Metrics</h6>
              <div className="row">
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Word Count</small>
                  <strong>{validation.metrics.word_count || 0}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Pages</small>
                  <strong>{validation.metrics.estimated_pages || 1}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Experience</small>
                  <strong>{validation.metrics.experience_count || 0}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Skills</small>
                  <strong>{validation.metrics.skills_count || 0}</strong>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            onClick={validateResume}
            size="sm"
            className="me-2"
          >
            Re-validate
          </Button>
          <Button
            variant="secondary"
            onClick={() => setExpanded(false)}
            size="sm"
          >
            Collapse
          </Button>
        </Card.Body>
      )}
    </Card>
  );
}
