import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MockInterviewAPI from "../../api/mockInterview";
import QuestionBankAPI from "../../api/questionBank";
import { useFlash } from "../../context/flashContext";
import "../../styles/mockInterview.css";

function MockInterviewQuestion() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { showFlash } = useFlash();

  // Session state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [responseStartTime, setResponseStartTime] = useState(null);
  const [showGuidance, setShowGuidance] = useState(false);

  // Preview state
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [previewTimeRemaining, setPreviewTimeRemaining] = useState(5);

  // Timer
  const [responseTimer, setResponseTimer] = useState(0);
  const timerRef = useRef(null);
  const previewTimerRef = useRef(null);
  const interviewStartTimeRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [sessionId]);

  // Preview timer - counts down 5 seconds
  useEffect(() => {
    if (!isPreviewMode || !currentQuestion) return;

    previewTimerRef.current = setInterval(() => {
      setPreviewTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [isPreviewMode, currentQuestion]);

  // Handle preview end - separate from interval to avoid state update race conditions
  useEffect(() => {
    if (previewTimeRemaining <= 0 && isPreviewMode) {
      clearInterval(previewTimerRef.current);
      setIsPreviewMode(false);
      setResponseTimer(0);
      setResponseStartTime(new Date());
    }
  }, [previewTimeRemaining, isPreviewMode]);

  // Response timer - counts up from 0 when in answer mode
  useEffect(() => {
    if (!session || isPreviewMode) return;

    timerRef.current = setInterval(() => {
      setResponseTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, isPreviewMode]);

  // Count words as user types
  useEffect(() => {
    const words = responseText.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [responseText]);

  const loadSession = async () => {
    try {
      const response = await MockInterviewAPI.getInterviewSession(sessionId);

      if (response.data) {
        const sessionData = response.data.session || response.data;
        setSession(sessionData);

        // Set interview start time if not already set
        if (!interviewStartTimeRef.current && sessionData.started_at) {
          interviewStartTimeRef.current = new Date(sessionData.started_at);
        }

        // Get current question
        if (
          sessionData.current_question_index < sessionData.question_sequence.length
        ) {
          const questionUuid = sessionData.question_sequence[sessionData.current_question_index];

          // Fetch full question details from question bank
          try {
            const questionResponse = await QuestionBankAPI.getQuestion(questionUuid);
            const questionData = questionResponse.data || questionResponse;

            setCurrentQuestion({
              uuid: questionUuid,
              text: questionData.prompt || "Question text not found",
              category: questionData.category || "Unknown",
              difficulty: questionData.difficulty || "Unknown",
              expected_skills: questionData.expected_skills || [],
              guidance: questionData.interviewer_guidance || "",
              star_framework: questionData.star_framework || null,
              number: sessionData.current_question_index + 1,
              total: sessionData.question_sequence.length,
              question_category: questionData.category,
              question_difficulty: questionData.difficulty
            });
          } catch (questionError) {
            console.error("Failed to load question details:", questionError);
            showFlash("Failed to load question details", "error");
          }

          // Reset to preview mode for new question
          setIsPreviewMode(true);
          setPreviewTimeRemaining(5);
          setResponseTimer(0);
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      showFlash("Failed to load interview session", "error");
      navigate("/interview/question-library");
    } finally {
      setLoading(false);
    }
  };

  // Submit response and move to next question
  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      showFlash("Please provide a response before submitting", "error");
      return;
    }

    if (wordCount < 10) {
      showFlash("Response should be at least 10 words", "error");
      return;
    }

    setSubmitting(true);
    try {
      const duration = responseStartTime
        ? Math.floor((new Date() - responseStartTime) / 1000)
        : 0;

      const responseData = {
        response_text: responseText,
        response_duration_seconds: duration
      };

      const response = await MockInterviewAPI.submitInterviewResponse(
        sessionId,
        responseData
      );

      if (response.data) {
        showFlash("Response saved successfully", "success");

        if (response.data.next_question) {
          // More questions to go
          // Fetch full question details for the next question
          try {
            const nextQuestionResponse = await QuestionBankAPI.getQuestion(
              response.data.next_question.uuid
            );
            const nextQuestionData = nextQuestionResponse.data || nextQuestionResponse;

            setCurrentQuestion({
              uuid: response.data.next_question.uuid,
              text: nextQuestionData.prompt || "Question text not found",
              category: nextQuestionData.category || "Unknown",
              difficulty: nextQuestionData.difficulty || "Unknown",
              expected_skills: nextQuestionData.expected_skills || [],
              guidance: nextQuestionData.interviewer_guidance || "",
              star_framework: nextQuestionData.star_framework || null,
              number: response.data.next_question.question_number,
              total: response.data.next_question.total_questions,
              question_category: nextQuestionData.category,
              question_difficulty: nextQuestionData.difficulty
            });
          } catch (error) {
            console.error("Failed to load next question:", error);
            showFlash("Failed to load next question", "error");
          }

          setResponseText("");
          setResponseStartTime(new Date());
          setShowGuidance(false);
          setIsPreviewMode(true);
          setPreviewTimeRemaining(5);
          setResponseTimer(0);
        } else {
          // Interview complete
          showFlash("All questions completed!", "success");
          navigate(`/interview/mock-interview-summary/${sessionId}`);
        }
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      showFlash(
        error.response?.data?.detail || "Failed to submit response",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle abandon interview
  const handleAbandonInterview = () => {
    if (
      window.confirm(
        "Are you sure you want to abandon this interview? Progress will be lost."
      )
    ) {
      setSubmitting(true);
      MockInterviewAPI.abandonInterview(sessionId)
        .then(() => {
          showFlash("Interview abandoned", "info");
          navigate("/interview/question-library");
        })
        .catch((error) => {
          console.error("Error abandoning interview:", error);
          showFlash("Failed to abandon interview", "error");
          setSubmitting(false);
        });
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getProgressPercentage = () => {
    if (!session || !currentQuestion) return 0;
    return (
      ((currentQuestion.number - 1) / currentQuestion.total) * 100
    );
  };

  if (loading) {
    return (
      <div className="mock-interview-question-loading">
        <p>Loading interview...</p>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="mock-interview-question-error">
        <p>Error loading interview question</p>
        <button
          onClick={() => navigate("/interview/question-library")}
          className="btn btn-primary"
        >
          Return to Question Library
        </button>
      </div>
    );
  }

  return (
    <div className="mock-interview-question-container">
      {/* Header */}
      <div className="mock-interview-question-header">
        <div className="header-left">
          <h1>Mock Interview in Progress</h1>
          <p className="scenario-name">{session.scenario_name}</p>
        </div>
        <div className="header-right">
          <div className="timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">
              {isPreviewMode ? `Preview: ${previewTimeRemaining}s` : formatTime(responseTimer)}
            </span>
          </div>
          <button
            onClick={handleAbandonInterview}
            className="btn btn-danger btn-sm"
            disabled={submitting}
          >
            Abandon
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mock-interview-progress-section">
        <div className="progress-info">
          <span className="progress-text">
            Question {currentQuestion.number} of {currentQuestion.total}
          </span>
          <span className="progress-percentage">
            {Math.round(getProgressPercentage())}% Complete
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      {isPreviewMode ? (
        // PREVIEW MODE - Show question for 5 seconds
        <div className="mock-interview-preview-screen">
          <div className="preview-content">
            <div className="preview-title">Question {currentQuestion.number} of {currentQuestion.total}</div>
            <div className="preview-question-box">
              <h2>{currentQuestion.text}</h2>
            </div>

            {/* STAR Framework Preview */}
            {currentQuestion.star_framework && (
              <div className="preview-star-framework">
                <h4>📋 STAR Framework Guide</h4>
                <div className="preview-star-items">
                  <div className="preview-star-item">
                    <strong>Situation:</strong> {currentQuestion.star_framework.s}
                  </div>
                  <div className="preview-star-item">
                    <strong>Task:</strong> {currentQuestion.star_framework.t}
                  </div>
                  <div className="preview-star-item">
                    <strong>Action:</strong> {currentQuestion.star_framework.a}
                  </div>
                  <div className="preview-star-item">
                    <strong>Result:</strong> {currentQuestion.star_framework.r}
                  </div>
                </div>
              </div>
            )}

            {/* Expected Skills Preview */}
            {currentQuestion.expected_skills && currentQuestion.expected_skills.length > 0 && (
              <div className="preview-skills">
                <h4>🎯 Skills Being Evaluated</h4>
                <div className="preview-skills-list">
                  {currentQuestion.expected_skills.map((skill, idx) => (
                    <span key={idx} className="preview-skill-badge">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="preview-countdown">
              <p>Get ready! Answer screen appears in:</p>
              <div className="countdown-timer">{previewTimeRemaining}</div>
              <p className="preview-hint">💡 Take a moment to read the question and think about your answer...</p>
            </div>
          </div>
        </div>
      ) : (
        // ANSWER MODE - Show response textarea
        <div className="mock-interview-question-content">
        {/* Question Section */}
        <div className="question-section">
          <div className="question-metadata">
            <span className="badge badge-category">
              {currentQuestion.question_category || "Question"}
            </span>
            <span className="badge badge-difficulty">
              {currentQuestion.question_difficulty || "Level Unknown"}
            </span>
          </div>

          <div className="question-text">
            <h2>{currentQuestion.text}</h2>
          </div>

          {/* STAR Framework Guidance (for behavioral questions) */}
          {currentQuestion.star_framework && (
            <div className="star-guidance">
              <button
                className="btn-guidance-toggle"
                onClick={() => setShowGuidance(!showGuidance)}
              >
                {showGuidance ? "Hide STAR Framework Guide" : "Show STAR Framework Guide"}
              </button>

              {showGuidance && (
                <div className="star-framework-details">
                  <h4>STAR Method Guide:</h4>
                  <div className="star-item">
                    <strong>S - Situation:</strong>
                    <p>{currentQuestion.star_framework.s}</p>
                  </div>
                  <div className="star-item">
                    <strong>T - Task:</strong>
                    <p>{currentQuestion.star_framework.t}</p>
                  </div>
                  <div className="star-item">
                    <strong>A - Action:</strong>
                    <p>{currentQuestion.star_framework.a}</p>
                  </div>
                  <div className="star-item">
                    <strong>R - Result:</strong>
                    <p>{currentQuestion.star_framework.r}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expected Skills */}
          {currentQuestion.expected_skills &&
            currentQuestion.expected_skills.length > 0 && (
              <div className="expected-skills">
                <h4>Skills Evaluated:</h4>
                <div className="skills-list">
                  {currentQuestion.expected_skills.map((skill, idx) => (
                    <span key={idx} className="skill-badge">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Response Section */}
        <div className="response-section">
          <div className="response-header">
            <h3>Your Response</h3>
            <span className="word-count">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>

          <textarea
            className="response-textarea"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Type your answer here. Aim for a clear, concise response (typically 60-120 words)..."
            disabled={submitting}
          ></textarea>

          <div className="response-tips">
            <p>
              💡 <strong>Tip:</strong> Speak naturally as if in a real interview. Think about the STAR
              framework for behavioral questions.
            </p>
          </div>
        </div>
        </div>
      )}

      {/* Actions - Only show in answer mode */}
      {!isPreviewMode && (
        <div className="mock-interview-question-actions">
          <button
            onClick={handleAbandonInterview}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Abandon Interview
          </button>
          <button
            onClick={handleSubmitResponse}
            className="btn btn-primary"
            disabled={submitting || wordCount < 10}
          >
            {submitting ? "Submitting..." : "Submit & Next Question"}
          </button>
        </div>
      )}
    </div>
  );
}

export default MockInterviewQuestion;
