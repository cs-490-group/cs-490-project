/**
 * AISuggestionPanel Component
 * Sidebar panel displaying AI suggestions for resumes
 * Related to UC-047, UC-049, UC-050
 */

import React, { useState } from 'react';
import './AISuggestionPanel.css';

export default function AISuggestionPanel({
  type, // 'content', 'skills', or 'experience'
  suggestions,
  onAccept,
  onReject,
  onClose,
  loading = false,
  experienceCount = 0,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!suggestions) {
    return null;
  }

  const renderContentSuggestions = () => {
    return (
      <div className="suggestion-content">
        <div className="suggestion-section">
          <h5>Generated Professional Summary</h5>
          <div className="suggestion-box">
            <p>{suggestions.generated_summary}</p>
          </div>
          <button
            className="btn btn-sm btn-success me-2"
            onClick={() => onAccept({ summary: suggestions.generated_summary })}
          >
            ✓ Accept Summary
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onReject('summary')}
          >
            ✗ Reject
          </button>
        </div>

        <div className="suggestion-section mt-4">
          <h5>Suggested Bullet Points ({suggestions.generated_bullets?.length || 0})</h5>
          {experienceCount === 0 && (
            <div className="alert alert-warning mb-3">
              ⚠️ You need to add at least one work experience entry before adding bullet points. Go to the Experience tab to add your work history first.
            </div>
          )}
          <div className="bullets-list">
            {suggestions.generated_bullets?.map((bullet, idx) => (
              <div key={idx} className="bullet-item">
                <input type="checkbox" id={`bullet-${idx}`} defaultChecked disabled={experienceCount === 0} />
                <label htmlFor={`bullet-${idx}`} className="bullet-text">
                  {bullet}
                </label>
              </div>
            ))}
          </div>
          <button
            className="btn btn-sm btn-success me-2"
            onClick={() => {
              const selectedBullets = suggestions.generated_bullets?.filter(
                (_, idx) => document.getElementById(`bullet-${idx}`)?.checked
              );
              onAccept({ experience_bullets: selectedBullets });
            }}
            disabled={experienceCount === 0}
            title={experienceCount === 0 ? 'Add experience entries first' : ''}
          >
            ✓ Add Selected Bullets
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onReject('bullets')}
          >
            ✗ Reject
          </button>
        </div>

        <div className="suggestion-section mt-4">
          <h5>Suggested Skills ({suggestions.suggested_skills?.length || 0})</h5>
          <div className="skills-list">
            {suggestions.suggested_skills?.map((skill, idx) => (
              <span key={idx} className="skill-badge">
                {skill}
                <input type="hidden" defaultValue={skill} />
              </span>
            ))}
          </div>
          <button
            className="btn btn-sm btn-success me-2"
            onClick={() => {
              const skills = Array.from(document.querySelectorAll('.skill-badge input')).map(
                (el) => el.value
              );
              onAccept({ skills });
            }}
          >
            ✓ Add All Skills
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onReject('skills')}
          >
            ✗ Reject
          </button>
        </div>

        <div className="suggestion-section mt-4">
          <div className="relevance-score">
            <strong>Relevance Score:</strong> {suggestions.relevance_score || 0}%
          </div>
          <p className="text-muted small">
            Keywords found: {suggestions.keywords_found?.join(', ') || 'None'}
          </p>
        </div>
      </div>
    );
  };

  const renderSkillsSuggestions = () => {
    return (
      <div className="suggestion-content">
        <div className="suggestion-section">
          <h5>Skills to Emphasize ({suggestions.skills_to_emphasize?.length || 0})</h5>
          <div className="skills-list highlight">
            {suggestions.skills_to_emphasize?.map((skill, idx) => (
              <span key={idx} className="skill-badge success">
                ⭐ {skill}
              </span>
            ))}
          </div>
          {suggestions.skills_to_emphasize?.length > 0 && (
            <button
              className="btn btn-sm btn-success mt-2"
              onClick={() => onAccept({ skills_to_emphasize: suggestions.skills_to_emphasize })}
            >
              ✓ Prioritize These
            </button>
          )}
        </div>

        <div className="suggestion-section mt-4">
          <h5>Recommended Skills ({suggestions.recommended_skills?.length || 0})</h5>
          <div className="skills-list">
            {suggestions.recommended_skills?.map((skill, idx) => (
              <span key={idx} className="skill-badge info">
                + {skill}
              </span>
            ))}
          </div>
          {suggestions.recommended_skills?.length > 0 && (
            <button
              className="btn btn-sm btn-info mt-2"
              onClick={() => onAccept({ recommended_skills: suggestions.recommended_skills })}
            >
              ✓ Add Recommended Skills
            </button>
          )}
        </div>

        <div className="suggestion-section mt-4">
          <h5>Missing Skills ({suggestions.missing_skills?.length || 0})</h5>
          {suggestions.missing_skills?.length > 0 ? (
            <div className="skills-list">
              {suggestions.missing_skills?.map((skill, idx) => (
                <span key={idx} className="skill-badge danger">
                  ⚠️ {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted">Great! You have all critical skills covered.</p>
          )}
        </div>

        <div className="suggestion-section mt-4">
          <div className="optimization-score">
            <strong>Optimization Score:</strong> {suggestions.optimization_score || 0}%
          </div>
          <p className="text-muted small">
            {suggestions.total_match}
          </p>
        </div>
      </div>
    );
  };

  const renderExperienceSuggestions = () => {
    // Debug logging
    console.log('[AISuggestionPanel] Experience suggestions:', suggestions);

    if (!suggestions.tailored_experiences || suggestions.tailored_experiences.length === 0) {
      return (
        <div className="suggestion-content">
          <div className="alert alert-warning">
            <p>No experience entries to tailor.</p>
            <p className="small text-muted">Make sure you have at least one work experience entry added to your resume.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="suggestion-content">
        {suggestions.tailored_experiences?.map((exp, expIdx) => (
          <div key={expIdx} className="suggestion-section">
            <div className="experience-header">
              <h5>{exp.title || 'Experience Entry'} #{exp.index + 1}</h5>
              <span className="relevance-badge">
                Relevance: {exp.relevance_score}%
              </span>
            </div>

            <div className="original-text">
              <strong>Original:</strong>
              <p className="text-muted">{exp.original || 'No description'}</p>
            </div>

            {exp.matched_keywords?.length > 0 && (
              <div className="matched-keywords">
                <strong>Matched Keywords:</strong>
                <div className="keywords-list">
                  {exp.matched_keywords.map((kw, idx) => (
                    <span key={idx} className="keyword-badge">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Per-bullet alternatives */}
            {exp.bullet_alternatives && exp.bullet_alternatives.length > 0 ? (
              <div className="bullet-alternatives-container">
                <strong>Tailor Each Bullet Point:</strong>
                {exp.bullet_alternatives.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="bullet-alternative-group">
                    <div className="original-bullet">
                      <strong>Original:</strong> {bullet.original_bullet}
                    </div>

                    <div className="alternatives-list">
                      {bullet.alternatives?.map((alt, altIdx) => (
                        <div key={altIdx} className="alternative-option">
                          <input
                            type="checkbox"
                            id={`bullet-${expIdx}-${bulletIdx}-${altIdx}`}
                            className="bullet-checkbox"
                            data-exp-idx={expIdx}
                            data-bullet-idx={bulletIdx}
                            data-alt-text={alt}
                          />
                          <label htmlFor={`bullet-${expIdx}-${bulletIdx}-${altIdx}`} className="alternative-text">
                            {alt}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small">No bullet point alternatives generated</p>
            )}

            <button
              className="btn btn-sm btn-success mt-3"
              onClick={() => {
                // Collect all selected bullet alternatives
                const selectedAlts = {};
                document.querySelectorAll(`.bullet-checkbox:checked`).forEach((checkbox) => {
                  const expIdx = parseInt(checkbox.getAttribute('data-exp-idx'));
                  const bulletIdx = parseInt(checkbox.getAttribute('data-bullet-idx'));
                  const altText = checkbox.getAttribute('data-alt-text');

                  if (!selectedAlts[bulletIdx]) {
                    selectedAlts[bulletIdx] = altText;
                  }
                });

                if (Object.keys(selectedAlts).length > 0) {
                  onAccept({
                    experience_index: exp.index,
                    bullet_replacements: selectedAlts
                  });
                } else {
                  alert('Please select at least one bullet point alternative');
                }
              }}
            >
              ✓ Apply Selected Changes
            </button>
            <button
              className="btn btn-sm btn-outline-secondary mt-3 ms-2"
              onClick={() => onReject(`experience-${exp.index}`)}
            >
              ✗ Skip
            </button>
          </div>
        ))}

        {suggestions.total_experiences > 0 && (
          <div className="suggestion-section mt-4">
            <div className="average-relevance">
              <strong>Average Relevance:</strong> {suggestions.average_relevance || 0}%
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTitleByType = () => {
    switch (type) {
      case 'content':
        return '✨ Generated Content';
      case 'skills':
        return '📊 Skills Optimization';
      case 'experience':
        return '🎯 Tailored Experience';
      default:
        return 'AI Suggestions';
    }
  };

  return (
    <div className="ai-suggestion-panel">
      <div className="panel-header">
        <h4>{getTitleByType()}</h4>
        <button className="btn-close" onClick={onClose}>×</button>
      </div>

      <div className="panel-body">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Generating suggestions...</p>
          </div>
        ) : !suggestions ? (
          <div className="alert alert-warning">
            <p>No suggestions available. Please try again.</p>
            <p className="small text-muted">Type: {type}</p>
          </div>
        ) : (
          <>
            {type === 'content' && renderContentSuggestions()}
            {type === 'skills' && renderSkillsSuggestions()}
            {type === 'experience' && renderExperienceSuggestions()}
          </>
        )}
      </div>

      <div className="panel-footer">
        <button className="btn btn-secondary btn-sm w-100" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
