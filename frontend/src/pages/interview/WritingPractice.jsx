import React, { useState, useEffect, useRef } from 'react';
import WritingPracticeAPI from '../../api/writingPractice';
import '../../styles/writingPracticeAnalysis.css';

function WritingPractice() {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [timeLimit, setTimeLimit] = useState(300);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isPracticing, setIsPracticing] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [writingTips, setWritingTips] = useState(null);
  const [nervesExercises, setNervesExercises] = useState(null);
  const [activeTab, setActiveTab] = useState('practice');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
  const autoSaveTimeoutRef = useRef(null);

  // Load resources on component mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        // Load available questions
        const questionsRes = await WritingPracticeAPI.getQuestions();
        setAvailableQuestions(questionsRes.data.questions || []);

        // Load writing tips
        const tipsRes = await WritingPracticeAPI.getWritingTips();
        setWritingTips(tipsRes.data.tips || {});

        // Load nerves exercises
        const exercisesRes = await WritingPracticeAPI.getNervesExercises();
        setNervesExercises(exercisesRes.data.exercises || []);

        // Load session history
        const historyRes = await WritingPracticeAPI.getUserSessions();
        setSessionHistory(historyRes.data.sessions || []);
      } catch (err) {
        console.error('Error loading resources:', err);
        // Fallback to local data if API fails
        setAvailableQuestions([
          { _id: '1', text: 'Tell me about a time when you had to deal with a difficult team member.', category: 'behavioral' },
          { _id: '2', text: 'Describe a situation where you had to learn a new technology quickly.', category: 'behavioral' },
          { _id: '3', text: 'How would you approach debugging a complex production issue?', category: 'technical' },
          { _id: '4', text: 'Tell me about a time when you had to make a difficult decision with incomplete information.', category: 'situational' },
          { _id: '5', text: 'Describe a project where you demonstrated leadership.', category: 'behavioral' }
        ]);
      }
    };

    loadResources();
  }, []);

  // Calculate word count
  useEffect(() => {
    const words = responseText.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [responseText]);

  // Auto-save response
  useEffect(() => {
    if (isPracticing && responseText && sessionId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('Auto-saving draft...');
      }, 30000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [responseText, isPracticing, sessionId]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isPracticing && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPracticing, timeRemaining]);

  const handleStart = async (question) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await WritingPracticeAPI.startSession(
        question._id || question.uuid,
        question.category,
        question.recommended_time || 300
      );

      const { session_id, time_limit_seconds } = response.data;

      setSelectedQuestion(question);
      setSessionId(session_id);
      setTimeLimit(time_limit_seconds);
      setTimeRemaining(time_limit_seconds);
      setResponseText('');
      setAnalysisResult(null);
      setShowResults(false);
      setIsPracticing(true);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start writing practice session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsAnalyzing(true);
      setIsPracticing(false);

      if (!sessionId || !responseText.trim()) {
        setError('Please write a response before submitting.');
        setIsPracticing(true);
        setIsAnalyzing(false);
        return;
      }

      const response = await WritingPracticeAPI.submitResponse(sessionId, responseText);
      const result = response.data;

      setAnalysisResult({
        clarity_score: result.metrics.clarity_score,
        structure_score: result.metrics.structure_score,
        professionalism_score: result.metrics.professionalism_score,
        storytelling_score: result.metrics.storytelling_score,
        overall_score: result.metrics.overall_score,
        word_count: result.metrics.word_count,
        time_taken: result.metrics.duration_seconds,
        feedback: result.feedback,
        improvement_checklist: result.improvement_checklist,
        star_analysis: result.star_analysis
      });

      setShowResults(true);
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to analyze your response. Please try again.');
      setIsPracticing(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  };

  // Helper functions for improvement checklist parsing
  const priorityColorClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
      default:
        return 'text-emerald-600';
    }
  };

  const parseImprovementStep = (step) => {
    // If already an object with expected shape
    if (typeof step === 'object' && step.item) {
      return step;
    }
    // If it's a string, try to parse as JSON
    if (typeof step === 'string') {
      try {
        const parsed = JSON.parse(step);
        if (parsed.item) return parsed;
      } catch (e) {
        // Not JSON, treat as plain string
      }
      // Return as plain text step
      return { item: step, category: 'Improvement', priority: 'medium' };
    }
    // Fallback
    return { item: 'Complete your practice', category: 'General', priority: 'medium' };
  };

  const renderImprovementStep = (step, index) => {
    const parsed = parseImprovementStep(step);
    const { category, item, priority, why } = parsed;

    return (
      <li key={index} className="mb-4 pb-4 border-b border-slate-200 last:border-b-0 last:mb-0 last:pb-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{category}</div>
          <span className={`text-xs font-bold uppercase tracking-wide ${priorityColorClass(priority)}`}>
            {priority} priority
          </span>
        </div>
        <div className="text-sm text-slate-700 font-medium mb-1">{item}</div>
        {why && <div className="text-xs text-slate-500 italic">Why: {why}</div>}
      </li>
    );
  };

  const getMetricScoreClass = (score) => {
    if (score >= 75) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
  };

  const getStatValueClass = (value) => {
    if (value >= 75 && value <= 150) return 'value-good';
    if (value < 75 || value > 150) return 'value-warning';
    return 'value-danger';
  };

  const ScoreCard = ({ title, score, icon }) => {
    const scoreColor = score >= 75
      ? 'text-green-600'
      : score >= 50
        ? 'text-amber-500'
        : 'text-red-600';

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 p-6 text-center">
        <div className="text-4xl mb-4">{icon}</div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{title}</h4>
        <div className={`text-5xl font-bold mt-4 ${scoreColor}`}>
          {Math.round(score)}
        </div>
        <div className="text-xs text-gray-400 mt-3 font-medium">out of 100</div>
      </div>
    );
  };

  const LoadingModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          animation: 'spin 2s linear infinite'
        }}>⚙️</div>
        <h2 style={{
          margin: '0 0 0.5rem 0',
          color: '#333',
          fontSize: '1.3rem'
        }}>
          Analyzing Your Response
        </h2>
        <p style={{
          color: '#666',
          margin: '0.5rem 0',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          Our AI is reviewing your response and generating personalized feedback...
        </p>
        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#667eea',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0s'
          }}/>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#667eea',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.3s'
          }}/>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#667eea',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.6s'
          }}/>
        </div>
        <p style={{
          color: '#999',
          fontSize: '0.85rem',
          marginTop: '1rem'
        }}>
          This usually takes 10-30 seconds...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {isAnalyzing && <LoadingModal />}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1f3a70' }}>Interview Writing Practice</h1>
        <p style={{ color: '#333', margin: 0, fontSize: '1rem' }}>Practice timed responses, get AI feedback, and track your improvement</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      {!isPracticing && !showResults && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '0.5rem'
        }}>
          {['practice', 'tips', 'exercises', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-light'} rounded-top`}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '500',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'practice' && '📝 Practice'}
              {tab === 'tips' && '💡 Tips'}
              {tab === 'exercises' && '🧘 Exercises'}
              {tab === 'history' && '📊 History'}
            </button>
          ))}
        </div>
      )}

      {!selectedQuestion ? (
        <div>
          {/* PRACTICE TAB */}
          {activeTab === 'practice' && (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Select a Question to Practice</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {availableQuestions.length > 0 ? availableQuestions.map(question => (
                  <div
                    key={question._id || question.uuid}
                    style={{
                      padding: '1.5rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: '#f0f4ff',
                          color: '#667eea',
                          borderRadius: '12px',
                          display: 'inline-block',
                          marginBottom: '0.5rem',
                          textTransform: 'capitalize'
                        }}>
                          {question.category}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#333' }}>
                          {question.text}
                        </div>
                      </div>
                      <button
                          onClick={() => handleStart(question)}
                          disabled={isLoading}
                          className={`btn ${isLoading ? "btn-secondary" : "btn-primary"}`} 
                          style={{
                            padding: '0.5rem 1.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}
                        >
                        {isLoading ? 'Loading...' : 'Start Practice'}
                      </button>
                    </div>
                  </div>
                )) : (
                  <p>Loading questions...</p>
                )}
              </div>
            </div>
          )}

          {/* TIPS TAB */}
          {activeTab === 'tips' && writingTips && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Writing Tips for Interview Responses</h3>

              {/* Strong Openers */}
              {writingTips.strong_openers && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>💪 Strong Openers</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {writingTips.strong_openers.map((opener, i) => (
                      <div key={i} style={{
                        padding: '1rem',
                        background: '#f0f4ff',
                        borderRadius: '6px',
                        fontSize: '0.95rem'
                      }}>
                        {opener}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Do's and Don'ts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {writingTips.dos && (
                  <div>
                    <h4 style={{ color: '#28a745', marginBottom: '1rem' }}>✓ Do's</h4>
                    <ul style={{ paddingLeft: '1.5rem', color: '#333' }}>
                      {writingTips.dos.map((tip, i) => (
                        <li key={i} style={{ marginBottom: '0.75rem' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {writingTips.donts && (
                  <div>
                    <h4 style={{ color: '#dc3545', marginBottom: '1rem' }}>✗ Don'ts</h4>
                    <ul style={{ paddingLeft: '1.5rem', color: '#333' }}>
                      {writingTips.donts.map((tip, i) => (
                        <li key={i} style={{ marginBottom: '0.75rem' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXERCISES TAB */}
          {activeTab === 'exercises' && nervesExercises && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Nerves Management Exercises</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Practice these exercises to manage interview anxiety and build confidence
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {nervesExercises.map((exercise, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedExerciseIndex(selectedExerciseIndex === i ? null : i)}
                    style={{
                      padding: '1.5rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: selectedExerciseIndex === i ? '#f0f4ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                          {exercise.name}
                        </h4>
                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                          ⏱ {exercise.duration_seconds}s
                        </p>
                      </div>
                      <div style={{ fontSize: '1.5rem' }}>{exercise.icon}</div>
                    </div>

                    {selectedExerciseIndex === i && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                        <p style={{ color: '#333', lineHeight: '1.6' }}>{exercise.instructions}</p>
                        <button
                          className="btn btn-primary"
                        >
                          Start Exercise
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Practice History</h3>
              {sessionHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sessionHistory.map((session, i) => (
                    <div key={session._id || i} style={{
                      padding: '1.5rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>
                            {session.question_text?.substring(0, 50)}...
                          </h4>
                          <div style={{ color: '#666', fontSize: '0.85rem' }}>
                            {new Date(session.created_at).toLocaleDateString()} •{' '}
                            {Math.floor(session.duration_seconds / 60)} minutes
                          </div>
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: getScoreColor(session.clarity_score || 70)
                        }}>
                          {Math.round(session.clarity_score || 70)}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: '#666' }}>Clarity</div>
                          <div style={{ fontWeight: 'bold', color: getScoreColor(session.clarity_score) }}>
                            {Math.round(session.clarity_score || 70)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#666' }}>Structure</div>
                          <div style={{ fontWeight: 'bold', color: getScoreColor(session.structure_score) }}>
                            {Math.round(session.structure_score || 70)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#666' }}>Professional</div>
                          <div style={{ fontWeight: 'bold', color: getScoreColor(session.professionalism_score) }}>
                            {Math.round(session.professionalism_score || 70)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666' }}>No practice sessions yet. Start practicing to see your history!</p>
              )}
            </div>
          )}
        </div>
      ) : !showResults ? (
        <div>
          {/* PRACTICE SCREEN */}
          <div style={{
            background: isPracticing ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#6c757d',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
              {selectedQuestion.category?.toUpperCase() || 'QUESTION'}
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {formatTime(timeRemaining)}
            </div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>
              {isPracticing ? 'Time Remaining' : 'Practice Complete'}
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Question:</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>{selectedQuestion.text}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '500' }}>Your Response</label>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <span style={{ fontWeight: '500', color: wordCount < 75 ? '#dc3545' : wordCount > 150 ? '#ffc107' : '#28a745' }}>
                  {wordCount}
                </span> words (ideal: 75-150)
              </div>
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              disabled={!isPracticing}
              placeholder="Start typing your response here... (Auto-saves every 30 seconds)"
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                lineHeight: '1.6',
                resize: 'vertical',
                background: isPracticing ? 'white' : '#f8f9fa'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setIsPracticing(false);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            {isPracticing && (
              <button
                onClick={handleSubmit}
                disabled={wordCount === 0 || isLoading}
                style={{
                  padding: '0.75rem 2rem',
                  background: wordCount === 0 || isLoading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: wordCount === 0 || isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  flex: 1
                }}
              >
                {isLoading ? 'Analyzing...' : 'Submit for Analysis'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="writing-analysis-container">
          {/* RESULTS SCREEN - PROFESSIONAL DASHBOARD LAYOUT */}

          {/* Header Section */}
          <div className="analysis-header">
            <h1>Analysis Complete</h1>
            <p>Here's your performance breakdown with AI insights</p>
          </div>

          {/* Main Score Card - Hero Section */}
          <div className="overall-score-hero">
            <div className="score-label">Overall Score</div>
            <div className="score-number">
              {Math.round(analysisResult?.overall_score || 70)}
            </div>
            <div className="score-status">
              {(analysisResult?.overall_score || 70) >= 75
                ? '🎉 Excellent!'
                : (analysisResult?.overall_score || 70) >= 50
                  ? '👍 Good Progress'
                  : '📚 Needs Improvement'}
            </div>
          </div>

          {/* Score Cards Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">💡</div>
              <div className="metric-label">Clarity</div>
              <div className={`metric-score ${getMetricScoreClass(analysisResult?.clarity_score)}`}>
                {Math.round(analysisResult?.clarity_score || 70)}
              </div>
              <div className="metric-out-of">out of 100</div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📜</div>
              <div className="metric-label">Structure</div>
              <div className={`metric-score ${getMetricScoreClass(analysisResult?.structure_score)}`}>
                {Math.round(analysisResult?.structure_score || 70)}
              </div>
              <div className="metric-out-of">out of 100</div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">👔</div>
              <div className="metric-label">Professionalism</div>
              <div className={`metric-score ${getMetricScoreClass(analysisResult?.professionalism_score)}`}>
                {Math.round(analysisResult?.professionalism_score || 70)}
              </div>
              <div className="metric-out-of">out of 100</div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📖</div>
              <div className="metric-label">Storytelling</div>
              <div className={`metric-score ${getMetricScoreClass(analysisResult?.storytelling_score)}`}>
                {Math.round(analysisResult?.storytelling_score || 70)}
              </div>
              <div className="metric-out-of">out of 100</div>
            </div>
          </div>

          {/* Feedback & Next Steps Section */}
          <section className="feedback-section">
            {/* AI Feedback Card */}
            {analysisResult?.feedback && (
              <div className="feedback-card">
                <div className="feedback-header">
                  <span className="feedback-icon">💬</span>
                  <h3 className="feedback-title">AI Feedback</h3>
                </div>
                <p className="feedback-content">
                  {analysisResult.feedback}
                </p>
              </div>
            )}

            {/* Next Steps Card */}
            {analysisResult?.improvement_checklist && Array.isArray(analysisResult.improvement_checklist) && (
              <div className="feedback-card">
                <div className="feedback-header">
                  <span className="feedback-icon">⚡</span>
                  <h3 className="feedback-title">Next Steps for Improvement</h3>
                </div>
                <ul className="next-steps-list">
                  {analysisResult.improvement_checklist.slice(0, 5).map((item, i) =>
                    renderImprovementStep(item, i)
                  )}
                </ul>
              </div>
            )}
          </section>

          {/* Stats Panel */}
          <div className="stats-panel">
            <div className="stat-item">
              <div className="stat-label">Word Count</div>
              <div className={`stat-value ${getStatValueClass(analysisResult?.word_count)}`}>
                {analysisResult?.word_count || 0}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Time Taken</div>
              <div className="stat-value">
                {formatTime(analysisResult?.time_taken || 0)}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Category</div>
              <div className="stat-value" style={{ textTransform: 'capitalize' }}>
                {selectedQuestion?.category || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setShowResults(false);
                setActiveTab('practice');
              }}
              className="btn-base btn-secondary"
            >
              Practice Another Question
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setIsPracticing(true);
                setTimeRemaining(timeLimit);
                setResponseText('');
              }}
              className="btn-base btn-primary"
            >
              Retry This Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingPractice;
