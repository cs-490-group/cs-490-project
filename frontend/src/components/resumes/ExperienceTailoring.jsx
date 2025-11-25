import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Badge, Spinner, Alert, ListGroup, Accordion } from 'react-bootstrap';
import ResumesAPI from '../../api/resumes';
import './ExperienceTailoring.css';

/**
 * ExperienceTailoring Component
 * Related to UC-050: Resume Experience Tailoring
 * Provides AI-powered experience description tailoring based on job posting
 */
export default function ExperienceTailoring({ resumeId, jobPosting, experiences, onApplyTailoring }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedVariations, setSelectedVariations] = useState({});

  const handleTailorExperience = async () => {
    if (!jobPosting || !jobPosting.title) {
      setError('Please select a job posting first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ResumesAPI.tailorExperience(resumeId, jobPosting);
      const data = response.data || response;
      setSuggestions(data);
      setSelectedVariations({});
    } catch (err) {
      setError(err.message || 'Failed to tailor experience');
    } finally {
      setLoading(false);
    }
  };

  const selectVariation = (expIndex, bulletIndex, variationIndex) => {
    const key = `${expIndex}_${bulletIndex}`;
    setSelectedVariations(prev => ({
      ...prev,
      [key]: variationIndex
    }));
  };

  const handleApplyTailoring = () => {
    if (onApplyTailoring && Object.keys(selectedVariations).length > 0) {
      onApplyTailoring(selectedVariations, suggestions);
      setSelectedVariations({});
      setSuggestions(null);
    }
  };

  return (
    <div className="experience-tailoring">
      {error && <Alert variant="danger">{error}</Alert>}

      {!suggestions ? (
        <Button
          variant="primary"
          onClick={handleTailorExperience}
          disabled={loading || !jobPosting?.title}
          className="w-100"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Analyzing Experience...
            </>
          ) : (
            'Tailor Experience for this Job'
          )}
        </Button>
      ) : (
        <Card className="experience-suggestions">
          <Card.Header className="bg-primary text-white">
            <Card.Title className="mb-0">Experience Tailoring Suggestions</Card.Title>
          </Card.Header>
          <Card.Body>
            {suggestions.tailored_experiences && suggestions.tailored_experiences.length > 0 ? (
              <>
                <div className="summary mb-4 p-3 bg-light rounded">
                  <small>
                    <strong>Average Relevance Score:</strong> {suggestions.average_relevance || 0}%
                  </small>
                  <div className="mt-2">
                    <small className="text-muted">
                      {suggestions.total_experiences} experiences analyzed
                    </small>
                  </div>
                </div>

                <Accordion className="experience-accordion">
                  {suggestions.tailored_experiences.map((exp, expIdx) => (
                    <Accordion.Item eventKey={`exp-${expIdx}`} key={expIdx}>
                      <Accordion.Header>
                        <div className="exp-header">
                          <span className="exp-title">{exp.title}</span>
                          <Badge bg={exp.relevance_score >= 75 ? 'success' : exp.relevance_score >= 50 ? 'warning' : 'danger'}>
                            Relevance: {exp.relevance_score}%
                          </Badge>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        {/* Matched Keywords */}
                        {exp.matched_keywords && exp.matched_keywords.length > 0 && (
                          <div className="mb-3">
                            <h6>Matched Keywords:</h6>
                            <div className="keyword-tags">
                              {exp.matched_keywords.map((kw, idx) => (
                                <Badge key={idx} bg="info" className="me-2 mb-2">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bullet Point Alternatives */}
                        {exp.variations && exp.variations.length > 0 && (
                          <div className="variations">
                            <h6 className="mb-3">Description Alternatives:</h6>
                            {exp.variations.map((variation, varIdx) => (
                              <div key={varIdx} className="variation-item mb-3 p-3 border rounded">
                                <small className="text-muted mb-2">
                                  <strong>Original:</strong>
                                </small>
                                <div className="original-text mb-2">
                                  <small>{variation.original || exp.original_description}</small>
                                </div>

                                {variation.alternatives && variation.alternatives.length > 0 && (
                                  <div className="alternatives">
                                    <small className="text-muted mb-2">
                                      <strong>Suggested Improvements:</strong>
                                    </small>
                                    {variation.alternatives.map((alt, altIdx) => (
                                      <div
                                        key={altIdx}
                                        className={`alternative-option p-2 mb-2 rounded cursor-pointer ${
                                          selectedVariations[`${expIdx}_${varIdx}`] === altIdx ? 'selected' : ''
                                        }`}
                                        onClick={() => selectVariation(expIdx, varIdx, altIdx)}
                                      >
                                        <input
                                          type="radio"
                                          name={`exp-${expIdx}-var-${varIdx}`}
                                          checked={selectedVariations[`${expIdx}_${varIdx}`] === altIdx}
                                          onChange={() => selectVariation(expIdx, varIdx, altIdx)}
                                          className="me-2"
                                        />
                                        <small>{alt}</small>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>

                <div className="mt-4 p-3 bg-info text-white rounded">
                  <small>
                    <strong>{Object.keys(selectedVariations).length}</strong> suggestions selected
                  </small>
                </div>

                <div className="d-flex gap-2 mt-3">
                  {Object.keys(selectedVariations).length > 0 && (
                    <Button
                      variant="success"
                      onClick={handleApplyTailoring}
                      className="flex-grow-1"
                    >
                      Apply Selected ({Object.keys(selectedVariations).length})
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => setSuggestions(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="warning">No experience suggestions available.</Alert>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
