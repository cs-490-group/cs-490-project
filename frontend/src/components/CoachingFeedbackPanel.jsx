import React, { useState } from "react";
import "../styles/coachingFeedback.css";

/**
 * UC-076: CoachingFeedbackPanel
 * Displays AI-powered coaching feedback for interview responses
 *
 * Props:
 *   - feedback: CoachingFeedback object containing detailed analysis
 *   - loading: Boolean - whether feedback is still being generated
 *   - questionCategory: String - question category (behavioral/technical/etc)
 *   - onSaveToLibrary: Optional callback when user saves feedback
 */
function CoachingFeedbackPanel({
  feedback = null,
  loading = false,
  questionCategory = "behavioral",
  onSaveToLibrary = null,
}) {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    strengths: true,
    improvements: true,
    detailed: false,
    star: false,
    language: false,
    alternative: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="coaching-feedback-panel loading">
        <div className="loading-spinner"></div>
        <p>Generating AI coaching feedback...</p>
      </div>
    );
  }

  // Show error state
  if (!feedback || feedback.error) {
    return (
      <div className="coaching-feedback-panel error">
        <div className="error-icon">⚠️</div>
        <p>Unable to generate coaching feedback at this time.</p>
        <div className="fallback-suggestions">
          <h4>Self-Evaluation Tips:</h4>
          <ul>
            {feedback?.fallback_suggestions?.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const {
    overall_score = 0,
    score_breakdown = {},
    strengths = [],
    areas_for_improvement = [],
    ai_commentary = "",
    recommended_improvements = [],
    alternative_response = "",
    detailed_feedback = {},
  } = feedback;

  // Color coding for scores
  const getScoreColor = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 50) return "fair";
    return "needs-work";
  };

  const scoreColor = getScoreColor(overall_score);

  return (
    <div className="coaching-feedback-panel">
      {/* Overall Score Card */}
      <div className={`score-card ${scoreColor}`}>
        <div className="score-number">{Math.round(overall_score)}</div>
        <div className="score-label">Overall Coaching Score</div>
        <div className="score-description">
          {overall_score >= 80 && "Excellent response! Strong performance."}
          {overall_score >= 65 && overall_score < 80 && "Good effort with room for improvement."}
          {overall_score >= 50 && overall_score < 65 && "Solid attempt. Focus on the areas below."}
          {overall_score < 50 && "Significant opportunity to strengthen this response."}
        </div>
      </div>

      {/* Score Breakdown Grid */}
      <div className="score-breakdown">
        <h3>Score Breakdown</h3>
        <div className="breakdown-grid">
          {score_breakdown.content_quality !== undefined && (
            <div className="breakdown-item">
              <span className="breakdown-label">Content Quality</span>
              <div className="breakdown-value">{Math.round(score_breakdown.content_quality)}</div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score_breakdown.content_quality}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
          {score_breakdown.structure_clarity !== undefined && (
            <div className="breakdown-item">
              <span className="breakdown-label">Structure & Clarity</span>
              <div className="breakdown-value">{Math.round(score_breakdown.structure_clarity)}</div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score_breakdown.structure_clarity}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
          {score_breakdown.length_appropriateness !== undefined && (
            <div className="breakdown-item">
              <span className="breakdown-label">Length Appropriateness</span>
              <div className="breakdown-value">{Math.round(score_breakdown.length_appropriateness)}</div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score_breakdown.length_appropriateness}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
          {score_breakdown.star_compliance !== undefined && score_breakdown.star_compliance !== null && (
            <div className="breakdown-item">
              <span className="breakdown-label">STAR Framework</span>
              <div className="breakdown-value">{Math.round(score_breakdown.star_compliance)}</div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score_breakdown.star_compliance}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
          {score_breakdown.language_quality !== undefined && (
            <div className="breakdown-item">
              <span className="breakdown-label">Language Quality</span>
              <div className="breakdown-value">{Math.round(score_breakdown.language_quality)}</div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score_breakdown.language_quality}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strengths Section */}
      <div
        className={`feedback-section strengths ${expandedSections.strengths ? "expanded" : ""}`}
      >
        <div
          className="section-header"
          onClick={() => toggleSection("strengths")}
        >
          <h3>✓ Strengths</h3>
          <span className="toggle-icon">{expandedSections.strengths ? "▼" : "▶"}</span>
        </div>
        {expandedSections.strengths && (
          <div className="section-content">
            {strengths.length > 0 ? (
              <ul className="strengths-list">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="strength-item">
                    <span className="strength-icon">+</span>
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Continue building on your responses. Each practice improves your skills.</p>
            )}
          </div>
        )}
      </div>

      {/* Areas for Improvement */}
      <div
        className={`feedback-section improvements ${expandedSections.improvements ? "expanded" : ""}`}
      >
        <div
          className="section-header"
          onClick={() => toggleSection("improvements")}
        >
          <h3>→ Areas for Improvement</h3>
          <span className="toggle-icon">{expandedSections.improvements ? "▼" : "▶"}</span>
        </div>
        {expandedSections.improvements && (
          <div className="section-content">
            {recommended_improvements.length > 0 ? (
              <div className="improvements-list">
                {recommended_improvements.map((improvement, idx) => (
                  <div key={idx} className="improvement-item">
                    <span className="improvement-number">{idx + 1}</span>
                    <p>{improvement}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Great job! Your response addresses key areas well.</p>
            )}
          </div>
        )}
      </div>

      {/* AI Commentary */}
      {ai_commentary && (
        <div className="feedback-section ai-commentary">
          <h3>💡 AI Coach's Insight</h3>
          <p className="commentary-text">{ai_commentary}</p>
        </div>
      )}

      {/* STAR Framework Analysis (for behavioral questions) */}
      {questionCategory === "behavioral" && detailed_feedback.star_framework && (
        <div
          className={`feedback-section star-analysis ${expandedSections.star ? "expanded" : ""}`}
        >
          <div
            className="section-header"
            onClick={() => toggleSection("star")}
          >
            <h3>⭐ STAR Framework Analysis</h3>
            <span className="toggle-icon">{expandedSections.star ? "▼" : "▶"}</span>
          </div>
          {expandedSections.star && (
            <div className="section-content">
              {renderSTARAnalysis(detailed_feedback.star_framework)}
            </div>
          )}
        </div>
      )}

      {/* Language Quality */}
      {detailed_feedback.language && (
        <div
          className={`feedback-section language ${expandedSections.language ? "expanded" : ""}`}
        >
          <div
            className="section-header"
            onClick={() => toggleSection("language")}
          >
            <h3>🎯 Language & Tone</h3>
            <span className="toggle-icon">{expandedSections.language ? "▼" : "▶"}</span>
          </div>
          {expandedSections.language && (
            <div className="section-content">
              {renderLanguageAnalysis(detailed_feedback.language)}
            </div>
          )}
        </div>
      )}

      {/* Alternative Response */}
      {alternative_response && (
        <div
          className={`feedback-section alternative ${expandedSections.alternative ? "expanded" : ""}`}
        >
          <div
            className="section-header"
            onClick={() => toggleSection("alternative")}
          >
            <h3>✨ Suggested Stronger Response</h3>
            <span className="toggle-icon">{expandedSections.alternative ? "▼" : "▶"}</span>
          </div>
          {expandedSections.alternative && (
            <div className="section-content">
              <div className="alternative-response-box">
                <p>{alternative_response}</p>
              </div>
              <p className="alternative-note">
                This is one possible stronger version. Use as inspiration, not a template.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Breakdown */}
      {detailed_feedback.content && (
        <div
          className={`feedback-section detailed ${expandedSections.detailed ? "expanded" : ""}`}
        >
          <div
            className="section-header"
            onClick={() => toggleSection("detailed")}
          >
            <h3>📊 Detailed Analysis</h3>
            <span className="toggle-icon">{expandedSections.detailed ? "▼" : "▶"}</span>
          </div>
          {expandedSections.detailed && (
            <div className="section-content">
              {renderDetailedAnalysis(detailed_feedback)}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="coaching-actions">
        {onSaveToLibrary && (
          <button
            className="btn btn-save"
            onClick={() => onSaveToLibrary(feedback)}
          >
            💾 Save Feedback
          </button>
        )}
        <button
          className="btn btn-print"
          onClick={() => window.print()}
        >
          🖨️ Print Feedback
        </button>
      </div>
    </div>
  );
}

/**
 * Render STAR Framework Analysis
 */
function renderSTARAnalysis(starData) {
  if (!starData.applicable) {
    return <p>STAR framework is primarily for behavioral questions.</p>;
  }

  const elements = [
    {
      key: "situation",
      label: "Situation",
      present: starData.situation_present,
      description: "Set the context and background of the challenge",
    },
    {
      key: "task",
      label: "Task",
      present: starData.task_present,
      description: "Explain your specific responsibility or goal",
    },
    {
      key: "action",
      label: "Action",
      present: starData.action_present,
      description: "Detail the specific steps you took",
    },
    {
      key: "result",
      label: "Result",
      present: starData.result_present,
      description: "Quantify the impact or measurable outcome",
    },
  ];

  return (
    <div className="star-analysis">
      <div className="star-score">
        <span className="score">{Math.round(starData.star_score)}/100</span>
        <span className="assessment">{starData.assessment}</span>
      </div>

      <div className="star-elements">
        {elements.map((element) => (
          <div
            key={element.key}
            className={`star-element ${element.present ? "present" : "missing"}`}
          >
            <div className="element-header">
              <span className="element-icon">{element.present ? "✓" : "✗"}</span>
              <h4>{element.label}</h4>
            </div>
            <p className="element-description">{element.description}</p>
          </div>
        ))}
      </div>

      {starData.missing_elements && starData.missing_elements.length > 0 && (
        <div className="suggestions">
          <h4>Recommendations:</h4>
          <ul>
            {starData.missing_elements.map((element, idx) => (
              <li key={idx}>{element}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Render Language Quality Analysis
 */
function renderLanguageAnalysis(languageData) {
  const { weak_phrases = [], filler_words = [] } = languageData;

  if (weak_phrases.length === 0 && filler_words.length === 0) {
    return <p>Great language use! Your response is clear and professional.</p>;
  }

  return (
    <div className="language-analysis">
      {weak_phrases.length > 0 && (
        <div className="weak-phrases">
          <h4>Phrases to Strengthen</h4>
          <div className="phrases-list">
            {weak_phrases.map((phrase, idx) => (
              <div key={idx} className="phrase-item">
                <div className="original">
                  <span className="label">Instead of:</span>
                  <code>{phrase.weak_phrase}</code>
                </div>
                <div className="arrow">→</div>
                <div className="replacement">
                  <span className="label">Use:</span>
                  <code>{phrase.strong_alternative}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filler_words.length > 0 && (
        <div className="filler-words">
          <h4>Minimize Filler Words</h4>
          <p>
            Consider removing or reducing instances of:{" "}
            <strong>{filler_words.map((w) => `"${w.filler}"`).join(", ")}</strong>
          </p>
          <p className="note">
            Filler words can distract from your message. Silence or pauses are better alternatives.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Render Detailed Analysis
 */
function renderDetailedAnalysis(detailedFeedback) {
  const { content = {}, structure = {}, length_and_timing = {} } = detailedFeedback;

  return (
    <div className="detailed-analysis">
      {content.content_score !== undefined && (
        <div className="analysis-item">
          <h4>Content Quality: {Math.round(content.content_score)}/100</h4>
          <p>{content.overall_assessment}</p>
        </div>
      )}

      {structure.clarity_verdict && (
        <div className="analysis-item">
          <h4>Structure & Clarity</h4>
          <p>
            {structure.clarity_verdict} - Your response uses{" "}
            {Math.round(structure.avg_sentence_length)} words per sentence on average.
          </p>
        </div>
      )}

      {length_and_timing.length_verdict && (
        <div className="analysis-item">
          <h4>Length Analysis: {length_and_timing.length_verdict}</h4>
          <p>
            Your response is {length_and_timing.word_count} words (target: {length_and_timing.ideal_range_words})
          </p>
        </div>
      )}
    </div>
  );
}

export default CoachingFeedbackPanel;
