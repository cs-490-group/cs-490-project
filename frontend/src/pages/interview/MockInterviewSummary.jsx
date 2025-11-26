import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MockInterviewAPI from "../../api/mockInterview";
import { useFlash } from "../../context/flashContext";
import "../../styles/mockInterview.css";

function MockInterviewSummary() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { showFlash } = useFlash();

  // State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await MockInterviewAPI.getInterviewSession(sessionId);

      if (response.data) {
        const sessionData = response.data.session || response.data;
        setSession(sessionData);
        setSessionCompleted(sessionData.status === "completed");
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      showFlash("Failed to load interview summary", "error");
      navigate("/interview/question-library");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    setCompleting(true);
    try {
      const response = await MockInterviewAPI.completeInterview(sessionId);

      if (response.data) {
        showFlash("Interview summary created! You can now download it.", "success");
        setSessionCompleted(true);
        loadSession();
      }
    } catch (error) {
      console.error("Error completing interview:", error);
      showFlash(
        error.response?.data?.detail || "Failed to complete interview",
        "error"
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadSummary = (format) => {
    if (!session) return;

    const metrics = calculateMetrics();
    const timestamp = new Date(session.started_at).toLocaleDateString();

    if (format === "txt") {
      downloadAsText(metrics, timestamp);
    } else if (format === "pdf") {
      downloadAsPDF(metrics, timestamp);
    }
  };

  const downloadAsText = (metrics, timestamp) => {
    let content = `MOCK INTERVIEW SUMMARY\n`;
    content += `${"=".repeat(60)}\n\n`;

    content += `Interview: ${session.scenario_name}\n`;
    content += `Date: ${timestamp}\n`;
    content += `Difficulty: ${session.difficulty_level}\n`;
    content += `Estimated Duration: ${session.estimated_duration_minutes} minutes\n\n`;

    content += `PERFORMANCE METRICS\n`;
    content += `${"-".repeat(60)}\n`;
    content += `Completion: ${metrics.completionPercentage}%\n`;
    content += `Questions Answered: ${metrics.totalAnswered} of ${metrics.totalQuestions}\n`;
    content += `Total Words Written: ${metrics.totalWordsWritten}\n`;
    content += `Average Words Per Response: ${metrics.avgWordCount}\n`;
    content += `Average Response Time: ${formatDuration(metrics.avgDuration)}\n\n`;

    content += `QUESTION BREAKDOWN\n`;
    content += `${"-".repeat(60)}\n`;
    content += `Behavioral: ${metrics.categoryBreakdown.behavioral} questions\n`;
    content += `Technical: ${metrics.categoryBreakdown.technical} questions\n`;
    content += `Situational: ${metrics.categoryBreakdown.situational} questions\n`;
    content += `Company-Specific: ${metrics.categoryBreakdown.company} questions\n\n`;

    if (session.responses && session.responses.length > 0) {
      content += `RESPONSES\n`;
      content += `${"-".repeat(60)}\n`;
      session.responses.forEach((response, idx) => {
        content += `\nQuestion ${idx + 1}: ${response.question_text}\n`;
        content += `Category: ${response.question_category}\n`;
        content += `Duration: ${formatDuration(response.response_duration_seconds)}\n`;
        content += `Word Count: ${response.word_count}\n`;
        content += `Response: ${response.response_text}\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mock-interview-summary-${sessionId.substring(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showFlash("Summary downloaded as text file", "success");
  };

  const downloadAsPDF = (metrics, timestamp) => {
    // Create HTML content for PDF
    let content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #1f3a70; text-align: center; border-bottom: 2px solid #4f8ef7; padding-bottom: 10px; }
            h2 { color: #4f8ef7; margin-top: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
            .header-info { background: #f5f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .metric { display: inline-block; width: 48%; margin: 10px 1%; padding: 10px; background: #f9f9f9; border-left: 3px solid #4f8ef7; }
            .question-response { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-left: 3px solid #ff9800; }
            .question-response strong { color: #1f3a70; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px; border: 1px solid #e0e0e0; }
            th { background: #4f8ef7; color: white; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Mock Interview Summary</h1>

          <div class="header-info">
            <p><strong>Interview:</strong> ${session.scenario_name}</p>
            <p><strong>Date:</strong> ${timestamp}</p>
            <p><strong>Difficulty:</strong> ${session.difficulty_level}</p>
            <p><strong>Estimated Duration:</strong> ${session.estimated_duration_minutes} minutes</p>
          </div>

          <h2>Performance Metrics</h2>
          <div class="metric">
            <strong>Completion:</strong> ${metrics.completionPercentage}%
          </div>
          <div class="metric">
            <strong>Questions Answered:</strong> ${metrics.totalAnswered}/${metrics.totalQuestions}
          </div>
          <div class="metric">
            <strong>Total Words:</strong> ${metrics.totalWordsWritten}
          </div>
          <div class="metric">
            <strong>Avg Words/Response:</strong> ${metrics.avgWordCount}
          </div>
          <div class="metric">
            <strong>Avg Response Time:</strong> ${formatDuration(metrics.avgDuration)}
          </div>
          <div class="metric">
            <strong>Behavioral Questions:</strong> ${metrics.categoryBreakdown.behavioral}
          </div>
          <div class="metric">
            <strong>Technical Questions:</strong> ${metrics.categoryBreakdown.technical}
          </div>
          <div class="metric">
            <strong>Situational Questions:</strong> ${metrics.categoryBreakdown.situational}
          </div>

          <h2>Your Responses</h2>
          ${
            session.responses && session.responses.length > 0
              ? session.responses
                  .map(
                    (response, idx) => `
            <div class="question-response">
              <strong>Q${idx + 1}: ${response.question_text}</strong><br>
              <em>Category: ${response.question_category} | Duration: ${formatDuration(response.response_duration_seconds)} | Words: ${response.word_count}</em><br><br>
              ${response.response_text}
            </div>
          `
                  )
                  .join("")
              : "<p>No responses recorded</p>"
          }
        </body>
      </html>
    `;

    // Create blob and download as HTML (can be opened in any browser)
    const blob = new Blob([content], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mock-interview-summary-${sessionId.substring(0, 8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showFlash("Summary downloaded as HTML file (open in browser or print to PDF)", "success");
  };

  const calculateMetrics = () => {
    if (!session || !session.responses) return null;

    const responses = session.responses;
    const totalQuestions = session.question_sequence.length;
    const totalWordsWritten = responses.reduce((sum, r) => sum + (r.word_count || 0), 0);
    const avgWordCount =
      responses.length > 0 ? Math.round(totalWordsWritten / responses.length) : 0;
    const avgDuration =
      responses.length > 0
        ? Math.round(
            responses.reduce((sum, r) => sum + (r.response_duration_seconds || 0), 0) /
              responses.length
          )
        : 0;

    const categoryBreakdown = {
      behavioral: responses.filter((r) => r.question_category === "behavioral").length,
      technical: responses.filter((r) => r.question_category === "technical").length,
      situational: responses.filter((r) => r.question_category === "situational").length,
      company: responses.filter((r) => r.question_category === "company").length
    };

    return {
      totalAnswered: responses.length,
      totalQuestions,
      completionPercentage: Math.round((responses.length / totalQuestions) * 100),
      totalWordsWritten,
      avgWordCount,
      avgDuration,
      categoryBreakdown,
      performanceSummary: session.performance_summary || {}
    };
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="mock-interview-summary-loading">
        <p>Loading interview summary...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mock-interview-summary-error">
        <p>Error loading interview summary</p>
        <button
          onClick={() => navigate("/interview/question-library")}
          className="btn btn-primary"
        >
          Return to Question Library
        </button>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="mock-interview-summary-container">
      {/* Header */}
      <div className="mock-interview-summary-header">
        <h1>Interview Complete</h1>
        <p className="scenario-name">{session.scenario_name}</p>
        {sessionCompleted && (
          <div className="completion-badge">✓ Summary Created</div>
        )}
      </div>

      {/* Main Content */}
      <div className="mock-interview-summary-content">
        {/* Performance Overview */}
        <section className="summary-section">
          <h2>Performance Overview</h2>

          <div className="metrics-grid">
            {/* Completion */}
            <div className="metric-card">
              <div className="metric-value">{metrics.completionPercentage}%</div>
              <div className="metric-label">Completed</div>
              <div className="metric-detail">
                {metrics.totalAnswered} of {metrics.totalQuestions} questions answered
              </div>
            </div>

            {/* Words Written */}
            <div className="metric-card">
              <div className="metric-value">{metrics.totalWordsWritten}</div>
              <div className="metric-label">Total Words</div>
              <div className="metric-detail">
                Avg {metrics.avgWordCount} words per response
              </div>
            </div>

            {/* Average Duration */}
            <div className="metric-card">
              <div className="metric-value">{formatDuration(metrics.avgDuration)}</div>
              <div className="metric-label">Avg Response Time</div>
              <div className="metric-detail">Per question average</div>
            </div>

            {/* Difficulty Level */}
            <div className="metric-card">
              <div className="metric-value">{session.difficulty_level}</div>
              <div className="metric-label">Difficulty Level</div>
              <div className="metric-detail">{session.estimated_duration_minutes} min session</div>
            </div>
          </div>
        </section>

        {/* Question Breakdown */}
        <section className="summary-section">
          <h2>Question Breakdown</h2>

          <div className="question-breakdown">
            {metrics.categoryBreakdown.behavioral > 0 && (
              <div className="breakdown-item">
                <div className="breakdown-icon">💬</div>
                <div className="breakdown-info">
                  <strong>Behavioral Questions</strong>
                  <p>{metrics.categoryBreakdown.behavioral} questions answered</p>
                </div>
              </div>
            )}

            {metrics.categoryBreakdown.technical > 0 && (
              <div className="breakdown-item">
                <div className="breakdown-icon">⚙️</div>
                <div className="breakdown-info">
                  <strong>Technical Questions</strong>
                  <p>{metrics.categoryBreakdown.technical} questions answered</p>
                </div>
              </div>
            )}

            {metrics.categoryBreakdown.situational > 0 && (
              <div className="breakdown-item">
                <div className="breakdown-icon">🎯</div>
                <div className="breakdown-info">
                  <strong>Situational Questions</strong>
                  <p>{metrics.categoryBreakdown.situational} questions answered</p>
                </div>
              </div>
            )}

            {metrics.categoryBreakdown.company > 0 && (
              <div className="breakdown-item">
                <div className="breakdown-icon">🏢</div>
                <div className="breakdown-info">
                  <strong>Company-Specific Questions</strong>
                  <p>{metrics.categoryBreakdown.company} questions answered</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Responses Review */}
        {session.responses && session.responses.length > 0 && (
          <section className="summary-section">
            <h2>Your Responses</h2>

            <div className="responses-list">
              {session.responses.map((response, idx) => (
                <div key={idx} className="response-card">
                  <div className="response-header">
                    <h4>Question {idx + 1}: {response.question_category}</h4>
                    <span className="response-meta">
                      {response.word_count} words • {formatDuration(response.response_duration_seconds)}
                    </span>
                  </div>

                  <div className="response-question">
                    <p><strong>{response.question_text}</strong></p>
                  </div>

                  <div className="response-answer">
                    <p>{response.response_text}</p>
                  </div>

                  {/* Placeholder for AI Coaching Feedback (UC-076) */}
                  {response.coaching_feedback ? (
                    <div className="coaching-feedback">
                      <h5>AI Coaching Feedback</h5>
                      <p>Score: {response.coaching_score}/100</p>
                      {/* More feedback details will be populated by UC-076 */}
                    </div>
                  ) : (
                    <div className="coaching-placeholder">
                      <p>💡 AI coaching feedback will be available when UC-076 is integrated</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        <section className="summary-section next-steps">
          <h2>Next Steps</h2>

          <div className="next-steps-list">
            <div className="next-step-item">
              <span className="step-icon">📊</span>
              <div className="step-content">
                <strong>View Analytics</strong>
                <p>Track your performance across multiple mock interviews</p>
              </div>
            </div>

            <div className="next-step-item">
              <span className="step-icon">🤖</span>
              <div className="step-content">
                <strong>AI Coaching Feedback</strong>
                <p>Get personalized suggestions to improve your responses</p>
              </div>
            </div>

            <div className="next-step-item">
              <span className="step-icon">📝</span>
              <div className="step-content">
                <strong>Practice More</strong>
                <p>Run another mock interview to build confidence</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="mock-interview-summary-actions">
        {!sessionCompleted && (
          <button
            onClick={handleCompleteInterview}
            className="btn btn-primary"
            disabled={completing}
          >
            {completing ? "Creating Summary..." : "Create Final Summary"}
          </button>
        )}

        {sessionCompleted && (
          <div className="download-section">
            <p className="download-label">Download Summary:</p>
            <button
              onClick={() => handleDownloadSummary("txt")}
              className="btn btn-secondary"
              disabled={completing}
              title="Download as plain text file"
            >
              📄 Download as Text
            </button>
            <button
              onClick={() => handleDownloadSummary("pdf")}
              className="btn btn-secondary"
              disabled={completing}
              title="Download as formatted HTML (print to PDF from browser)"
            >
              📋 Download as HTML
            </button>
          </div>
        )}

        <button
          onClick={() => navigate("/interview/question-library")}
          className="btn btn-secondary"
          disabled={completing}
        >
          Return to Question Library
        </button>

        <button
          onClick={() => navigate("/interview/mock-interview-start")}
          className="btn btn-outline-primary"
          disabled={completing}
        >
          Start Another Mock Interview
        </button>
      </div>
    </div>
  );
}

export default MockInterviewSummary;
