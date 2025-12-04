import React from 'react';

function WritingAnalysisFeedback({ analysis, onRetry, onNewQuestion }) {
  if (!analysis) return null;
  
  const getScoreColor = (score) => {
    if (score >= 75) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  };
  
  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };
  
  const ScoreCircle = ({ score, label }) => (
    <div className="score-circle">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#f0f0f0"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="10"
          strokeDasharray={`${2 * Math.PI * 50}`}
          strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <text x="60" y="55" textAnchor="middle" fontSize="28" fontWeight="bold" fill={getScoreColor(score)}>
          {Math.round(score)}
        </text>
        <text x="60" y="75" textAnchor="middle" fontSize="12" fill="#666">
          {label}
        </text>
      </svg>
    </div>
  );
  
  const ScoreBar = ({ label, score, icon }) => (
    <div className="score-bar-item">
      <div className="score-bar-header">
        <span className="score-label">
          <span className="score-icon">{icon}</span>
          {label}
        </span>
        <span className="score-value" style={{ color: getScoreColor(score) }}>
          {Math.round(score)}
        </span>
      </div>
      <div className="score-bar-track">
        <div 
          className="score-bar-fill"
          style={{ 
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
    </div>
  );
  
  return (
    <div className="writing-analysis-feedback">
      {/* Overall Score */}
      <div className="overall-score-section">
        <h2>Analysis Complete</h2>
        <ScoreCircle 
          score={analysis.overall_score} 
          label="Overall"
        />
        <div className="score-label-text">
          {getScoreLabel(analysis.overall_score)}
        </div>
      </div>
      
      {/* Individual Scores */}
      <div className="individual-scores">
        <h3>Detailed Breakdown</h3>
        <div className="scores-grid">
          <ScoreBar 
            label="Clarity" 
            score={analysis.clarity_score} 
            icon="💡"
          />
          <ScoreBar 
            label="Structure" 
            score={analysis.structure_score} 
            icon="🏗️"
          />
          <ScoreBar 
            label="Conciseness" 
            score={analysis.conciseness_score} 
            icon="✂️"
          />
          <ScoreBar 
            label="Professionalism" 
            score={analysis.professionalism_score} 
            icon="👔"
          />
        </div>
      </div>
      
      {/* Feedback Sections */}
      <div className="feedback-sections">
        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="feedback-section strengths-section">
            <h3>
              <span className="section-icon">✓</span>
              Strengths
            </h3>
            <ul className="feedback-list">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Areas for Improvement */}
        {analysis.areas_for_improvement && analysis.areas_for_improvement.length > 0 && (
          <div className="feedback-section improvement-section">
            <h3>
              <span className="section-icon">⚠</span>
              Areas for Improvement
            </h3>
            <ul className="feedback-list">
              {analysis.areas_for_improvement.map((area, idx) => (
                <li key={idx}>{area}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Specific Suggestions */}
        {analysis.specific_suggestions && analysis.specific_suggestions.length > 0 && (
          <div className="feedback-section suggestions-section">
            <h3>
              <span className="section-icon">💡</span>
              Specific Suggestions
            </h3>
            <ul className="feedback-list">
              {analysis.specific_suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="analysis-stats">
        <div className="stat-item">
          <div className="stat-label">Word Count</div>
          <div className="stat-value">{analysis.word_count}</div>
        </div>
        {analysis.sentence_count && (
          <div className="stat-item">
            <div className="stat-label">Sentences</div>
            <div className="stat-value">{analysis.sentence_count}</div>
          </div>
        )}
        {analysis.sentence_complexity_avg && (
          <div className="stat-item">
            <div className="stat-label">Avg Sentence Length</div>
            <div className="stat-value">{Math.round(analysis.sentence_complexity_avg)} words</div>
          </div>
        )}
        {analysis.vocabulary_diversity_score && (
          <div className="stat-item">
            <div className="stat-label">Vocabulary Diversity</div>
            <div className="stat-value">{Math.round(analysis.vocabulary_diversity_score)}%</div>
          </div>
        )}
      </div>
      
      {/* Progress Indicator */}
      {analysis.comparison_with_previous && !analysis.comparison_with_previous.is_first_attempt && (
        <div className="progress-indicator">
          <div className="progress-header">
            <span>Progress Tracking</span>
            <span className="attempt-number">
              Attempt #{analysis.comparison_with_previous.attempt_number}
            </span>
          </div>
          <div className="progress-content">
            {analysis.comparison_with_previous.score_improvement > 0 ? (
              <div className="improvement-positive">
                <span className="improvement-icon">📈</span>
                <span className="improvement-text">
                  Improved by {Math.round(analysis.comparison_with_previous.score_improvement)} points!
                </span>
              </div>
            ) : analysis.comparison_with_previous.score_improvement < 0 ? (
              <div className="improvement-negative">
                <span className="improvement-icon">📉</span>
                <span className="improvement-text">
                  Decreased by {Math.abs(Math.round(analysis.comparison_with_previous.score_improvement))} points
                </span>
              </div>
            ) : (
              <div className="improvement-stable">
                <span className="improvement-icon">→</span>
                <span className="improvement-text">Similar to last attempt</span>
              </div>
            )}
            
            {analysis.comparison_with_previous.improved_areas && analysis.comparison_with_previous.improved_areas.length > 0 && (
              <div className="improved-areas">
                <strong>Improved:</strong> {analysis.comparison_with_previous.improved_areas.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="feedback-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary">
            🔄 Retry This Question
          </button>
        )}
        {onNewQuestion && (
          <button onClick={onNewQuestion} className="btn-primary">
            ➡️ Practice Another Question
          </button>
        )}
      </div>
    </div>
  );
}

export default WritingAnalysisFeedback;