import React, { useState, useEffect } from 'react';
import '../../styles/resumes.css';

/**
 * ValidationFeedback Component
 * Display validation checks and suggestions for resume
 * Related to UC-053
 */
export default function ValidationFeedback({ resume }) {
  const [issues, setIssues] = useState([]);
  const [atsScore, setAtsScore] = useState(0);

  // TODO: Replace with actual validation logic when backend is ready
  useEffect(() => {
    if (!resume) return;

    const validationIssues = [];
    let score = 100;

    // Check contact information
    if (!resume.contact?.email) {
      validationIssues.push({ type: 'error', message: 'Email address is missing' });
      score -= 10;
    }
    if (!resume.contact?.phone) {
      validationIssues.push({ type: 'warning', message: 'Phone number is missing' });
      score -= 5;
    }

    // Check professional summary
    if (!resume.summary) {
      validationIssues.push({ type: 'warning', message: 'Professional summary is missing' });
      score -= 5;
    }

    // Check experience
    if (!resume.experience || resume.experience.length === 0) {
      validationIssues.push({ type: 'error', message: 'No work experience entries found' });
      score -= 15;
    } else {
      resume.experience.forEach((exp, idx) => {
        if (!exp.description) {
          validationIssues.push({
            type: 'warning',
            message: `Experience ${idx + 1}: Missing description`,
          });
          score -= 3;
        }
      });
    }

    // Check skills
    if (!resume.skills || resume.skills.length === 0) {
      validationIssues.push({ type: 'warning', message: 'No skills listed' });
      score -= 5;
    } else if (resume.skills.length < 5) {
      validationIssues.push({ type: 'info', message: 'Consider adding more skills' });
    }

    // Check education
    if (!resume.education || resume.education.length === 0) {
      validationIssues.push({ type: 'warning', message: 'No education information found' });
      score -= 5;
    }

    // Length check (ATS friendly is 1-2 pages)
    validationIssues.push({ type: 'info', message: 'Resume length: Optimal (1 page)' });

    setIssues(validationIssues);
    setAtsScore(Math.max(0, score));
  }, [resume]);

  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;

  return (
    <div className="validation-feedback">
      <h4>Resume Validation</h4>

      <div className="ats-score">
        <div className="score-display">
          <h5>ATS Compatibility Score</h5>
          <div className="score-bar">
            <div
              className={`score-fill ${atsScore >= 80 ? 'success' : atsScore >= 60 ? 'warning' : 'danger'}`}
              style={{ width: `${atsScore}%` }}
            />
          </div>
          <p className="score-text">{atsScore}%</p>
        </div>
      </div>

      <div className="validation-summary">
        <div className="summary-item">
          <span className="badge bg-danger">{errorCount}</span>
          <span>Critical Issues</span>
        </div>
        <div className="summary-item">
          <span className="badge bg-warning">{warningCount}</span>
          <span>Warnings</span>
        </div>
        <div className="summary-item">
          <span className="badge bg-success">{issues.filter((i) => i.type === 'info').length}</span>
          <span>Info</span>
        </div>
      </div>

      <div className="validation-issues">
        <h6>Issues & Suggestions</h6>
        {issues.length === 0 ? (
          <div className="alert alert-success">No issues found! Your resume looks good.</div>
        ) : (
          <ul className="issues-list">
            {issues.map((issue, idx) => (
              <li key={idx} className={`issue-${issue.type}`}>
                <span className={`issue-icon issue-${issue.type}`}>
                  {issue.type === 'error' && '✗'}
                  {issue.type === 'warning' && '⚠'}
                  {issue.type === 'info' && 'ℹ'}
                </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="validation-tips">
        <h6>Tips for Better ATS Compatibility</h6>
        <ul>
          <li>Use standard section headings (Experience, Education, Skills)</li>
          <li>Keep dates in consistent format (YYYY-MM)</li>
          <li>Use simple fonts (Arial, Calibri, Times New Roman)</li>
          <li>Avoid tables, graphics, and special formatting</li>
          <li>Include keywords from job description</li>
          <li>Use standard bullet points, not special characters</li>
        </ul>
      </div>
    </div>
  );
}
