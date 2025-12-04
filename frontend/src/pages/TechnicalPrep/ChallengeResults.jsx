import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import technicalPrepAPI from "../../api/technicalPrep";
import "../../styles/technicalPrep.css";

const ChallengeResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const uuid = localStorage.getItem("uuid");
  const [attempt, setAttempt] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const attemptRes = await technicalPrepAPI.getAttempt(attemptId);
      setAttempt(attemptRes.data.attempt);

      if (attemptRes.data.attempt?.challenge_id) {
        const challengeRes = await technicalPrepAPI.getChallenge(
          attemptRes.data.attempt.challenge_id
        );
        setChallenge(challengeRes.data.challenge);
      }
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!attempt) {
    return <div className="error-message">Results not found</div>;
  }

  const percentage = Math.round(attempt.score || 0);
  const passed = attempt.passed_tests || 0;
  const total = attempt.total_tests || 0;
  const durationMinutes = Math.round((attempt.duration_seconds || 0) / 60);

  return (
    <div className="technical-prep-container">
      <div className="results-page">
        {/* Header */}
        <div className="results-header">
          <h1>Challenge Results</h1>
          <h2>{challenge?.title || "Challenge"}</h2>
        </div>

        {/* Score Card */}
        <div className="results-score-card">
          <div className="score-circle">
            <div className="score-value">{percentage}%</div>
            <div className="score-label">Score</div>
          </div>

          <div className="score-stats">
            <div className="stat-item">
              <span className="stat-label">Tests Passed</span>
              <span className="stat-value">
                {passed} / {total}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time Spent</span>
              <span className="stat-value">{durationMinutes} min</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Language</span>
              <span className="stat-value">{attempt.language || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {percentage === 100 ? (
          <div className="success-message">
            <h3>🎉 Perfect Score!</h3>
            <p>Excellent work! You solved this challenge correctly.</p>
          </div>
        ) : percentage >= 80 ? (
          <div className="good-message">
            <h3>✅ Great Job!</h3>
            <p>You're doing well. Review the failed tests for further improvement.</p>
          </div>
        ) : (
          <div className="info-message">
            <h3>💡 Keep Practicing</h3>
            <p>Review the solution framework and try again to improve your score.</p>
          </div>
        )}

        {/* Test Results */}
        {attempt.test_results && attempt.test_results.length > 0 && (
          <div className="test-results-section">
            <h3>Test Results</h3>
            <div className="test-results-list">
              {attempt.test_results.map((test, idx) => (
                <div
                  key={idx}
                  className={`test-result-item ${test.passed ? "passed" : "failed"}`}
                >
                  <span className={`status-icon ${test.passed ? "pass" : "fail"}`}>
                    {test.passed ? "✓" : "✗"}
                  </span>
                  <div className="test-info">
                    <span className="test-name">
                      {test.description || `Test Case ${idx + 1}`}
                    </span>
                    {!test.passed && (
                      <span className="test-failed">Test Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="next-steps">
          <h3>Next Steps</h3>
          <div className="steps-grid">
            <div className="step-card">
              <h4>📚 Review Solution</h4>
              <p>Study the provided solution framework to understand the optimal approach</p>
            </div>
            <div className="step-card">
              <h4>🔁 Try Again</h4>
              <p>Attempt this challenge again to improve your score</p>
            </div>
            <div className="step-card">
              <h4>📈 Practice Similar</h4>
              <p>Find and solve similar challenges to build your skills</p>
            </div>
            <div className="step-card">
              <h4>📊 Track Progress</h4>
              <p>Check your statistics to see your improvement over time</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/technical-prep")}
          >
            Back to Home
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              const uuid = localStorage.getItem("uuid");
              navigate(`/technical-prep/challenge/${challenge?._id || attemptId}`);
            }}
          >
            Try Again
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(`/technical-prep/${attempt.challenge_type}`)}
          >
            More Challenges
          </button>
        </div>

        {/* Code Submitted */}
        {attempt.user_code && (
          <div className="code-review-section">
            <h3>Your Submission</h3>
            <pre className="submitted-code">
              <code>{attempt.user_code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeResults;
