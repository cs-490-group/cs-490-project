import React, { useState } from 'react';
import '../../styles/resumes.css';

/**
 * SummaryEditor Component
 * Edit professional summary/objective
 * Related to UC-048
 */
export default function SummaryEditor({ summary, onUpdate }) {
  const [text, setText] = useState(summary || '');

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    onUpdate(value);
  };

  const characterCount = text.length;
  const maxCharacters = 500;
  const isNearLimit = characterCount > maxCharacters * 0.8;

  return (
    <div className="summary-editor">
      <h3>Professional Summary</h3>
      <p className="text-muted">Write a brief summary of your professional background and goals</p>

      <div className="form-group">
        <label htmlFor="summaryText" className="form-label">
          Summary
        </label>
        <textarea
          id="summaryText"
          className="form-control"
          rows="6"
          placeholder="e.g., Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code and mentoring junior developers."
          value={text}
          onChange={handleChange}
          maxLength={maxCharacters}
        />
        <small className={`form-text ${isNearLimit ? 'text-warning' : 'text-muted'}`}>
          {characterCount} / {maxCharacters} characters
          {isNearLimit && ' (getting close to limit)'}
        </small>
      </div>

      <div className="summary-editor-tips p-3 bg-light rounded">
        <h6 className="mb-2">💡 Tips for a Great Summary:</h6>
        <ul className="mb-0">
          <li>Keep it concise (2-3 sentences)</li>
          <li>Highlight your key strengths and experience</li>
          <li>Tailor it to the job you're applying for</li>
          <li>Use active language and strong action verbs</li>
        </ul>
      </div>
    </div>
  );
}
