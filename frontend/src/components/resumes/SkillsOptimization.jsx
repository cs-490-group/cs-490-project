import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Badge, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import ResumesAPI from '../../api/resumes';
import './SkillsOptimization.css';

/**
 * SkillsOptimization Component
 * Related to UC-049: Resume Skills Optimization
 * Provides AI-powered skills optimization based on job posting
 */
export default function SkillsOptimization({ resumeId, jobPosting, onApplySkills }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [appliedSkills, setAppliedSkills] = useState([]);

  const handleOptimizeSkills = async () => {
    if (!jobPosting || !jobPosting.title) {
      setError('Please select a job posting first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ResumesAPI.optimizeSkills(resumeId, jobPosting);
      const data = response.data || response;
      setSuggestions(data);
      setAppliedSkills([]);
    } catch (err) {
      setError(err.message || 'Failed to optimize skills');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillSelection = (skill) => {
    if (appliedSkills.includes(skill)) {
      setAppliedSkills(appliedSkills.filter(s => s !== skill));
    } else {
      setAppliedSkills([...appliedSkills, skill]);
    }
  };

  const handleApplySkills = () => {
    if (onApplySkills && appliedSkills.length > 0) {
      onApplySkills(appliedSkills);
      setAppliedSkills([]);
      setSuggestions(null);
    }
  };

  return (
    <div className="skills-optimization">
      {error && <Alert variant="danger">{error}</Alert>}

      {!suggestions ? (
        <Button
          variant="primary"
          onClick={handleOptimizeSkills}
          disabled={loading || !jobPosting?.title}
          className="w-100"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Analyzing Skills...
            </>
          ) : (
            'Optimize Skills for this Job'
          )}
        </Button>
      ) : (
        <Card className="skills-suggestions">
          <Card.Header className="bg-primary text-white">
            <Card.Title className="mb-0">Skills Optimization Results</Card.Title>
          </Card.Header>
          <Card.Body>
            {/* Optimization Score */}
            <div className="mb-4">
              <h6>Match Score: {suggestions.optimization_score || 0}%</h6>
              <ProgressBar
                now={suggestions.optimization_score || 0}
                variant={
                  (suggestions.optimization_score || 0) >= 75 ? 'success' :
                  (suggestions.optimization_score || 0) >= 50 ? 'warning' : 'danger'
                }
                aria-label="Skills Optimization Score"
              />
            </div>

            {/* Skills to Emphasize */}
            {suggestions.skills_to_emphasize && suggestions.skills_to_emphasize.length > 0 && (
              <div className="mb-4">
                <h6 className="text-success">💡 Skills to Emphasize</h6>
                <p className="text-muted small">Your existing skills that match the job:</p>
                <div className="skill-tags">
                  {suggestions.skills_to_emphasize.map((skill, idx) => (
                    <Badge
                      key={idx}
                      bg="success"
                      className="me-2 mb-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleSkillSelection(skill)}
                      title="Click to add to resume"
                    >
                      ✓ {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Skills */}
            {suggestions.recommended_skills && suggestions.recommended_skills.length > 0 && (
              <div className="mb-4">
                <h6 className="text-warning">⭐ Recommended Skills to Add</h6>
                <p className="text-muted small">High-value skills to add to your resume:</p>
                <div className="skill-tags">
                  {suggestions.recommended_skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      bg="warning"
                      className="me-2 mb-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleSkillSelection(skill)}
                      title="Click to add to resume"
                    >
                      + {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {suggestions.missing_skills && suggestions.missing_skills.length > 0 && (
              <div className="mb-4">
                <h6 className="text-danger">❌ Critical Skills Missing</h6>
                <p className="text-muted small">Skills this job requires that you don't have:</p>
                <div className="skill-tags">
                  {suggestions.missing_skills.map((skill, idx) => (
                    <Badge key={idx} bg="danger" className="me-2 mb-2">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            {suggestions.total_match && (
              <div className="mb-3 p-3 bg-light rounded">
                <small><strong>Analysis:</strong> {suggestions.total_match}</small>
              </div>
            )}

            {/* Selected Skills Count */}
            <div className="mb-3 p-3 bg-info text-white rounded">
              <small>
                <strong>{appliedSkills.length}</strong> skill{appliedSkills.length !== 1 ? 's' : ''} selected to apply
              </small>
            </div>

            <div className="d-flex gap-2">
              {appliedSkills.length > 0 && (
                <Button
                  variant="success"
                  onClick={handleApplySkills}
                  className="flex-grow-1"
                >
                  Apply Selected Skills ({appliedSkills.length})
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setSuggestions(null)}
              >
                Dismiss
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
