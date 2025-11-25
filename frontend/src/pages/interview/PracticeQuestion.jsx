import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import "../../styles/practiceQuestion.css";


function PracticeQuestion() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [userResponse, setUserResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    star: true,
    samples: false,
    guidance: false,
  });

  useEffect(() => {
    loadQuestion();
    loadUserResponse();
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      const response = await QuestionBankAPI.getQuestion(questionId);
      setQuestion(response.data || response);
    } catch (error) {
      console.error("Failed to load question:", error);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserResponse = async () => {
    try {
      const response = await QuestionBankAPI.getQuestionResponse(questionId);
      if (response.data?.response_html) {
        setUserResponse(response.data.response_html);
      }
    } catch (error) {
      // No saved response yet
      setUserResponse("");
    }
  };

  const handleSaveResponse = async () => {
    if (!userResponse.trim()) {
      setSavedFeedback("Please write a response before saving.");
      setTimeout(() => setSavedFeedback(""), 3000);
      return;
    }

    setSaving(true);
    try {
      const response = await QuestionBankAPI.saveQuestionResponse(questionId, {
        response_html: userResponse,
        is_marked_practiced: false,
      });
      setSavedFeedback("Response saved successfully! ✓");
      setTimeout(() => setSavedFeedback(""), 3000);
    } catch (error) {
      console.error("Error saving response:", error);
      setSavedFeedback("Error saving response. Please try again.");
      setTimeout(() => setSavedFeedback(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPracticed = async () => {
    try {
      await QuestionBankAPI.markQuestionPracticed(questionId);
      setSavedFeedback("Question marked as practiced! 🎉");
      setTimeout(() => setSavedFeedback(""), 3000);
    } catch (error) {
      console.error("Error marking as practiced:", error);
      setSavedFeedback("Error. Please try again.");
      setTimeout(() => setSavedFeedback(""), 3000);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="practice-question-loading">
        <p>Loading question...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="practice-question-error">
        <p>Question not found.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="practice-question-container">
      {/* Header */}
      <div className="practice-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="header-content">
          <span className={`category-badge ${question.category}`}>
            {question.category}
          </span>
          <span className={`difficulty-badge ${question.difficulty}`}>
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="practice-content">
        {/* Left Panel - Question & Guidance */}
        <div className="left-panel">
          {/* Question Prompt */}
          <section className="question-section">
            <h2 className="question-title">{question.prompt}</h2>

            {/* Interviewer Guidance */}
            {question.interviewer_guidance && (
              <div className="guidance-box">
                <h4>💡 What the Interviewer is Looking For</h4>
                <p>{question.interviewer_guidance}</p>
              </div>
            )}

            {/* Expected Skills */}
            {question.expected_skills && question.expected_skills.length > 0 && (
              <div className="skills-section">
                <h4>Key Skills Tested</h4>
                <div className="skills-list">
                  {question.expected_skills.map((skill) => (
                    <span key={skill} className="skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* STAR Framework */}
          {question.star_framework && (
            <section className="star-section">
              <button
                className="collapsible-header"
                onClick={() => toggleSection("star")}
              >
                <span>⭐ STAR Framework Guide</span>
                <span className={`arrow ${expandedSections.star ? "open" : ""}`}>
                  ▼
                </span>
              </button>

              {expandedSections.star && (
                <div className="star-content">
                  <div className="star-item">
                    <h5>Situation</h5>
                    <p>{question.star_framework.s}</p>
                  </div>
                  <div className="star-item">
                    <h5>Task</h5>
                    <p>{question.star_framework.t}</p>
                  </div>
                  <div className="star-item">
                    <h5>Action</h5>
                    <p>{question.star_framework.a}</p>
                  </div>
                  <div className="star-item">
                    <h5>Result</h5>
                    <p>{question.star_framework.r}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Sample Answers */}
          {question.sample_answers && question.sample_answers.length > 0 && (
            <section className="samples-section">
              <button
                className="collapsible-header"
                onClick={() => toggleSection("samples")}
              >
                <span>📝 Sample Answers</span>
                <span className={`arrow ${expandedSections.samples ? "open" : ""}`}>
                  ▼
                </span>
              </button>

              {expandedSections.samples && (
                <div className="samples-content">
                  {question.sample_answers.map((answer, idx) => (
                    <div key={idx} className="sample-answer">
                      <h5>Sample Answer {idx + 1}</h5>
                      <p>{answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Company Context */}
          {question.company_context && question.company_context.length > 0 && (
            <section className="company-context-section">
              <h4>🏢 Company Context</h4>
              <ul className="context-list">
                {question.company_context.map((context, idx) => (
                  <li key={idx}>{context}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Panel - Answer Input */}
        <div className="right-panel">
          <div className="editor-wrapper">
            <h3>Your Answer</h3>

            {/* Rich Text Editor */}
            <div className="editor-toolbar">
              <button
                className="toolbar-btn"
                onClick={() =>
                  setUserResponse(
                    `<strong>${userResponse}</strong>`
                  )
                }
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                className="toolbar-btn"
                onClick={() =>
                  setUserResponse(
                    `<em>${userResponse}</em>`
                  )
                }
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                className="toolbar-btn"
                onClick={() =>
                  setUserResponse(
                    `<u>${userResponse}</u>`
                  )
                }
                title="Underline"
              >
                <u>U</u>
              </button>
              <div className="toolbar-separator"></div>
              <button
                className="toolbar-btn"
                onClick={() =>
                  setUserResponse(userResponse + "\n• ")
                }
                title="Bullet Point"
              >
                •
              </button>
            </div>

            {/* Text Area */}
            <textarea
              className="answer-textarea"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Type your answer here... Use the toolbar for formatting. You can also use the STAR framework from the left panel to structure your response."
            />

            {/* Character Count */}
            <div className="char-count">
              {userResponse.length} characters
            </div>

            {/* Save Feedback */}
            {savedFeedback && (
              <div className={`save-feedback ${savedFeedback.includes("Error") ? "error" : "success"}`}>
                {savedFeedback}
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="save-btn"
                onClick={handleSaveResponse}
                disabled={saving || !userResponse.trim()}
              >
                {saving ? "Saving..." : "💾 Save Response"}
              </button>
              <button
                className="practiced-btn"
                onClick={handleMarkPracticed}
              >
                ✓ Mark as Practiced
              </button>
            </div>

            {/* Tips */}
            <div className="tips-box">
              <h5>💬 Tips</h5>
              <ul>
                <li>Be specific with examples and metrics</li>
                <li>Use the STAR framework for structure</li>
                <li>Highlight relevant skills</li>
                <li>Practice out loud before typing</li>
                <li>Keep answers to 2-3 minutes of speaking time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticeQuestion;
