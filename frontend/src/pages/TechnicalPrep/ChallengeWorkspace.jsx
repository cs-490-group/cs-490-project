import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import technicalPrepAPI from "../../api/technicalPrep";
import "../../styles/technicalPrep.css";

const ChallengeWorkspace = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const uuid = localStorage.getItem("uuid");

  const [challenge, setChallenge] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("problem");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const res = await technicalPrepAPI.getChallenge(challengeId);
      setChallenge(res.data.challenge);

      // Start attempt
      const attemptRes = await technicalPrepAPI.startAttempt(uuid, challengeId);
      setAttemptId(attemptRes.data.attempt_id);
      setIsRunning(true);
    } catch (error) {
      console.error("Error loading challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!attemptId || !code.trim()) return;

    try {
      setSubmitting(true);
      const res = await technicalPrepAPI.submitCode(attemptId, code, language);
      setTestResults(res.data);
    } catch (error) {
      console.error("Error submitting code:", error);
      setTestResults({ error: "Failed to run tests" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!testResults || !attemptId) return;

    try {
      setSubmitting(true);
      await technicalPrepAPI.completeAttempt(
        attemptId,
        testResults.score || 0,
        testResults.passed || 0,
        testResults.total || 0,
        code
      );

      navigate(`/technical-prep/results/${attemptId}`);
    } catch (error) {
      console.error("Error completing challenge:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!challenge) {
    return <div className="error-message">Challenge not found</div>;
  }

  const coding = challenge.coding_challenge;
  const timeLeft = challenge.time_limit_minutes
    ? challenge.time_limit_minutes * 60 - timer
    : null;

  return (
    <div className="challenge-workspace">
      {/* Header */}
      <div className="workspace-header">
        <button className="back-btn" onClick={() => navigate("/technical-prep")}>
          ← Back
        </button>
        <h1>{challenge.title}</h1>
        <div className="header-actions">
          {timeLeft && (
            <div className={`timer ${timeLeft < 300 ? "warning" : ""}`}>
              ⏱️ {formatTime(Math.max(0, timeLeft))}
            </div>
          )}
          <span className="difficulty-badge" style={{ backgroundColor: "#f59e0b" }}>
            {challenge.difficulty}
          </span>
        </div>
      </div>

      <div className="workspace-content">
        {/* Left Panel - Problem */}
        <div className="problem-panel">
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === "problem" ? "active" : ""}`}
              onClick={() => setActiveTab("problem")}
            >
              Problem
            </button>
            <button
              className={`tab-btn ${activeTab === "solution" ? "active" : ""}`}
              onClick={() => setActiveTab("solution")}
            >
              Solution
            </button>
            {testResults && (
              <button
                className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
                onClick={() => setActiveTab("results")}
              >
                Results
              </button>
            )}
          </div>

          {activeTab === "problem" && (
            <div className="problem-content">
              <h2>Problem Description</h2>
              <p>{challenge.description}</p>

              {coding && (
                <>
                  {coding.constraints && coding.constraints.length > 0 && (
                    <div className="section">
                      <h3>Constraints:</h3>
                      <ul>
                        {coding.constraints.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {coding.example_input && (
                    <div className="section">
                      <h3>Example:</h3>
                      <div className="code-block">
                        <strong>Input:</strong> {coding.example_input}
                      </div>
                      <div className="code-block">
                        <strong>Output:</strong> {coding.example_output}
                      </div>
                    </div>
                  )}

                  {coding.test_cases && coding.test_cases.length > 0 && !coding.test_cases[0].is_hidden && (
                    <div className="section">
                      <h3>Sample Test Cases:</h3>
                      {coding.test_cases.slice(0, 2).map((tc, idx) => (
                        <div key={idx} className="test-case">
                          <p><strong>Test {idx + 1}:</strong> {tc.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "solution" && coding?.solution_framework && (
            <div className="solution-content">
              <h2>{coding.solution_framework.title}</h2>
              <p>{coding.solution_framework.overview}</p>

              <div className="section">
                <h3>Approach:</h3>
                <ol>
                  {coding.solution_framework.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {coding.solution_framework.pseudocode && (
                <div className="section">
                  <h3>Pseudocode:</h3>
                  <pre className="pseudocode">{coding.solution_framework.pseudocode}</pre>
                </div>
              )}

              <div className="complexity-section">
                <div className="complexity-item">
                  <strong>Time Complexity:</strong> {coding.solution_framework.time_complexity}
                </div>
                <div className="complexity-item">
                  <strong>Space Complexity:</strong> {coding.solution_framework.space_complexity}
                </div>
              </div>

              {coding.solution_framework.common_mistakes && (
                <div className="section">
                  <h3>Common Mistakes:</h3>
                  <ul>
                    {coding.solution_framework.common_mistakes.map((mistake, idx) => (
                      <li key={idx}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "results" && testResults && (
            <div className="results-content">
              <h2>Test Results</h2>
              <div className="results-summary">
                <div className="result-stat">
                  <span>Score:</span>
                  <strong>{Math.round(testResults.score || 0)}%</strong>
                </div>
                <div className="result-stat">
                  <span>Passed Tests:</span>
                  <strong>{testResults.passed}/{testResults.total}</strong>
                </div>
              </div>

              {testResults.test_results && (
                <div className="test-list">
                  {testResults.test_results.map((test, idx) => (
                    <div key={idx} className={`test-item ${test.passed ? "passed" : "failed"}`}>
                      <span className={`status ${test.passed ? "✓" : "✗"}`}>
                        {test.passed ? "✓" : "✗"}
                      </span>
                      <span className="test-name">{test.description || `Test ${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Editor */}
        <div className="editor-panel">
          <div className="editor-header">
            <label>Language:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
            </select>
          </div>

          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your solution here..."
          />

          <div className="editor-actions">
            <button
              className="btn-primary"
              onClick={handleRunCode}
              disabled={submitting || !code.trim()}
            >
              {submitting ? "Running..." : "Run Tests"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? "Hide Solution" : "Show Solution"}
            </button>
            {testResults && testResults.passed === testResults.total && (
              <button
                className="btn-success"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Solution"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeWorkspace;
