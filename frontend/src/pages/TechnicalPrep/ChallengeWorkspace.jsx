import React, { useState, useEffect, useRef } from "react";
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
  const [generatedSolution, setGeneratedSolution] = useState(null);
  const [generatingSolution, setGeneratingSolution] = useState(false);

  const attemptInitializedRef = useRef(false);

  useEffect(() => {
    // Reset attempt tracking when challenge changes
    attemptInitializedRef.current = false;
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

      // Only start attempt ONCE per challenge using ref
      if (!attemptInitializedRef.current) {
        attemptInitializedRef.current = true;
        const attemptRes = await technicalPrepAPI.startAttempt(uuid, challengeId);
        setAttemptId(attemptRes.data.attempt_id);
        setIsRunning(true);
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!attemptId || !code.trim()) {
      alert("Please write some code first");
      return;
    }

    try {
      setSubmitting(true);
      setTestResults(null); // Clear previous results

      const res = await technicalPrepAPI.submitCode(attemptId, code, language);

      console.log("Test results response:", res.data);
      console.log("test_results array:", res.data.test_results);
      console.log("test_results length:", res.data.test_results?.length);

      if (res.data.success) {
        setTestResults(res.data);
        // Automatically switch to results tab
        setActiveTab("results");
      } else {
        setTestResults({
          error: res.data.error || "Failed to run tests",
          success: false
        });
        setActiveTab("results");
      }
    } catch (error) {
      console.error("Error submitting code:", error);
      setTestResults({
        error: error.message || "Failed to run tests. Check your connection.",
        success: false
      });
      setActiveTab("results");
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

  const handleGenerateSolution = async () => {
    try {
      setGeneratingSolution(true);
      const res = await technicalPrepAPI.generateSolution(challengeId, language);
      if (res.data.success) {
        setGeneratedSolution(res.data.solution);
        setActiveTab("solution");
      } else {
        // Show error message if solution generation failed
        alert(res.data.error || "Failed to generate solution. Please try again later.");
      }
    } catch (error) {
      console.error("Error generating solution:", error);
      alert("Failed to generate solution. Please check your connection and try again.");
    } finally {
      setGeneratingSolution(false);
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
              <h2>{challenge.title || "Problem"}</h2>

              {/* Main description with proper formatting */}
              <div style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.7",
                marginBottom: "24px",
                color: "#1f2937",
                fontSize: "1rem"
              }}>
                {challenge.description}
              </div>

              {coding && (
                <>
                  {/* Constraints section */}
                  {coding?.constraints && Array.isArray(coding.constraints) && coding.constraints.length > 0 && (
                    <div className="section" style={{ marginBottom: "24px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "#111827" }}>Constraints</h3>
                      <ul style={{ paddingLeft: "20px" }}>
                        {coding.constraints.map((c, idx) => (
                          <li key={idx} style={{ marginBottom: "6px", color: "#6b7280" }}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples section */}
                  {coding?.example_input && (
                    <div className="section" style={{ marginBottom: "24px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "#111827" }}>Examples</h3>
                      <div className="code-block" style={{ marginBottom: "10px" }}>
                        <div style={{ marginBottom: "8px" }}>
                          <strong style={{ color: "#6b7280" }}>Input:</strong> <span style={{ fontFamily: "monospace" }}>{JSON.stringify(coding.example_input)}</span>
                        </div>
                      </div>
                      <div className="code-block">
                        <div>
                          <strong style={{ color: "#6b7280" }}>Output:</strong> <span style={{ fontFamily: "monospace" }}>{JSON.stringify(coding.example_output)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sample test cases */}
                  {coding?.test_cases && Array.isArray(coding.test_cases) && coding.test_cases.length > 0 && (
                    <div className="section">
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "#111827" }}>Sample Test Cases</h3>
                      {coding.test_cases.slice(0, 3).map((tc, idx) => (
                        <div key={idx} className="test-case" style={{ marginBottom: "16px" }}>
                          <p style={{ marginBottom: "8px", fontWeight: "600", color: "#111827" }}>
                            Example {idx + 1}: {tc.description}
                          </p>
                          <div style={{ fontSize: "0.95rem", color: "#6b7280", marginBottom: "6px", fontFamily: "monospace" }}>
                            <strong>Input:</strong> {JSON.stringify(tc.input)}
                          </div>
                          <div style={{ fontSize: "0.95rem", color: "#6b7280", fontFamily: "monospace" }}>
                            <strong>Output:</strong> {JSON.stringify(tc.expected_output)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "solution" && (
            <div className="solution-content">
              {generatedSolution ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2>AI-Generated Solution</h2>
                    <button
                      onClick={() => setGeneratedSolution(null)}
                      style={{
                        padding: "8px 16px",
                        background: "#e5e7eb",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      padding: "10px 15px",
                      backgroundColor: "#f3f4f6",
                      fontWeight: "600",
                      borderBottom: "1px solid #e5e7eb"
                    }}>
                      {language.charAt(0).toUpperCase() + language.slice(1)}
                    </div>
                    <pre style={{
                      margin: "0",
                      padding: "15px",
                      backgroundColor: "#1f2937",
                      color: "#f3f4f6",
                      fontSize: "0.85rem",
                      overflow: "auto",
                      maxHeight: "500px"
                    }}>
                      <code>{generatedSolution}</code>
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  <h2>{coding?.solution_framework?.title || "Solution"}</h2>
                  <p>{coding?.solution_framework?.overview}</p>

                  <div style={{ marginBottom: "20px" }}>
                    <button
                      onClick={handleGenerateSolution}
                      disabled={generatingSolution}
                      className="btn btn-primary"
                    >
                      {generatingSolution ? "Generating..." : "Generate Solution with AI"}
                    </button>
                  </div>

                  {coding?.solution_framework?.steps && Array.isArray(coding.solution_framework.steps) && coding.solution_framework.steps.length > 0 && (
                    <div className="section">
                      <h3>Approach:</h3>
                      <ol>
                        {coding.solution_framework.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {coding?.solution_framework?.solution_code && Object.keys(coding.solution_framework.solution_code).length > 0 && (
                    <div className="section">
                      <h3>Solution Code:</h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "15px",
                    marginBottom: "20px"
                  }}>
                    {Object.entries(coding.solution_framework.solution_code).map(([lang, code]) => (
                      <div key={lang} style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          padding: "10px 15px",
                          backgroundColor: "#f3f4f6",
                          fontWeight: "600",
                          borderBottom: "1px solid #e5e7eb"
                        }}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </div>
                        <pre style={{
                          margin: "0",
                          padding: "15px",
                          backgroundColor: "#1f2937",
                          color: "#f3f4f6",
                          fontSize: "0.85rem",
                          overflow: "auto",
                          maxHeight: "400px"
                        }}>
                          <code>{code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                  {coding?.solution_framework?.pseudocode && (
                    <div className="section">
                      <h3>Pseudocode:</h3>
                      <pre className="pseudocode">{coding.solution_framework.pseudocode}</pre>
                    </div>
                  )}

                  {coding?.solution_framework?.time_complexity || coding?.solution_framework?.space_complexity ? (
                    <div className="complexity-section">
                      {coding?.solution_framework?.time_complexity && (
                        <div className="complexity-item">
                          <strong>Time Complexity:</strong> {coding.solution_framework.time_complexity}
                        </div>
                      )}
                      {coding?.solution_framework?.space_complexity && (
                        <div className="complexity-item">
                          <strong>Space Complexity:</strong> {coding.solution_framework.space_complexity}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {coding?.solution_framework?.common_mistakes && Array.isArray(coding.solution_framework.common_mistakes) && coding.solution_framework.common_mistakes.length > 0 && (
                    <div className="section">
                      <h3>Common Mistakes:</h3>
                      <ul>
                        {coding.solution_framework.common_mistakes.map((mistake, idx) => (
                          <li key={idx}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "results" && (
            <div className="results-content">
              <h2>Test Results</h2>

              {testResults?.error ? (
                // Error message
                <div style={{
                  backgroundColor: "#fee2e2",
                  border: "2px solid #fca5a5",
                  borderRadius: "8px",
                  padding: "16px",
                  color: "#991b1b",
                  marginTop: "16px"
                }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#7f1d1d" }}>❌ Error</h3>
                  <p style={{ margin: 0 }}>{testResults.error}</p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem" }}>
                    Make sure your code is syntactically correct and the logic is sound.
                  </p>
                </div>
              ) : testResults ? (
                <>
                  {/* Summary Stats */}
                  <div className="results-summary">
                    <div className="result-stat">
                      <span>Score:</span>
                      <strong>{Math.round(testResults.score || 0)}%</strong>
                    </div>
                    <div className="result-stat">
                      <span>Passed Tests:</span>
                      <strong>{testResults.passed || 0}/{testResults.total || 0}</strong>
                    </div>
                  </div>

                  {/* Test Results List */}
                  {testResults?.test_results && Array.isArray(testResults.test_results) && testResults.test_results.length > 0 ? (
                    <div className="test-list">
                      {testResults.test_results.map((test, idx) => (
                        <div key={idx} className={`test-item ${test.passed ? "passed" : "failed"}`}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", width: "100%" }}>
                            <span className={`status ${test.passed ? "pass" : "fail"}`} style={{ marginTop: "4px", fontSize: "1.2rem" }}>
                              {test.passed ? "✓" : "✗"}
                            </span>
                            <div style={{ flex: 1 }}>
                              <span className="test-name" style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                                {test.description || `Test ${test.test_number || idx + 1}`}
                              </span>
                              {test.input && (
                                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "6px", fontFamily: "monospace", backgroundColor: "#f3f4f6", padding: "6px", borderRadius: "4px" }}>
                                  <strong>Input:</strong> {JSON.stringify(test.input)}
                                </div>
                              )}
                              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "6px", fontFamily: "monospace", backgroundColor: "#f3f4f6", padding: "6px", borderRadius: "4px" }}>
                                <strong>Expected:</strong> {JSON.stringify(test.expected)}
                              </div>
                              {test.actual && (
                                <div style={{ fontSize: "0.85rem", color: test.passed ? "#10b981" : "#ef4444", marginBottom: "6px", fontFamily: "monospace", backgroundColor: "#f3f4f6", padding: "6px", borderRadius: "4px", fontWeight: "500" }}>
                                  <strong>Got:</strong> {String(test.actual).substring(0, 200)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: "#fef3c7",
                      border: "2px solid #fbbf24",
                      borderRadius: "8px",
                      padding: "16px",
                      color: "#92400e",
                      marginTop: "16px"
                    }}>
                      <h3 style={{ margin: "0 0 8px 0", color: "#78350f" }}>⚠️ No Test Cases Found</h3>
                      <p style={{ margin: 0 }}>
                        This challenge doesn't have any test cases configured. Your code appears to have executed, but we cannot verify it against test cases.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  backgroundColor: "#dbeafe",
                  border: "2px solid #93c5fd",
                  borderRadius: "8px",
                  padding: "16px",
                  color: "#0c4a6e",
                  marginTop: "16px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    👈 Write some code and click "Run Tests" to see results here
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                    Your code will be executed and tested against the test cases
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Editor */}
        <div className="editor-panel">
          <div className="editor-header">
            <label>Language:</label>
            <select aria-label="Select language" value={language} onChange={(e) => setLanguage(e.target.value)}>
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
