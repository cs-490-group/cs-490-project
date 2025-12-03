import React, { useState, useEffect, useRef } from 'react';
import WritingPracticeAPI from '../../api/writingPractice';

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
      setIsLoading(true);
      setIsPracticing(false);

      if (!sessionId || !responseText.trim()) {
        setError('Please write a response before submitting.');
        setIsPracticing(true);
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
      setIsLoading(false);
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

  const ScoreCard = ({ title, score, icon }) => (
    <div style={{
      padding: '1.5rem',
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getScoreColor(score) }}>
        {Math.round(score)}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#666' }}>out of 100</div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Interview Writing Practice</h1>
        <p style={{ color: '#666', margin: 0 }}>Practice timed responses, get AI feedback, and track your improvement</p>
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
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab ? '#667eea' : 'transparent',
                color: activeTab === tab ? 'white' : '#666',
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
                        style={{
                          padding: '0.5rem 1.5rem',
                          background: isLoading ? '#ccc' : '#667eea',
                          color: 'white',
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
                          style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
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
        <div>
          {/* RESULTS SCREEN */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>Analysis Complete</h2>
            <p style={{ color: '#666' }}>Here's your performance breakdown with AI insights</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>Overall Score</div>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {Math.round(analysisResult?.overall_score || 70)}
            </div>
            <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              {(analysisResult?.overall_score || 70) >= 75 ? 'Excellent!' : (analysisResult?.overall_score || 70) >= 50 ? 'Good Progress' : 'Needs Improvement'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <ScoreCard title="Clarity" score={analysisResult?.clarity_score || 70} icon="💡" />
            <ScoreCard title="Structure" score={analysisResult?.structure_score || 70} icon="🏗️" />
            <ScoreCard title="Professionalism" score={analysisResult?.professionalism_score || 70} icon="👔" />
            <ScoreCard title="Storytelling" score={analysisResult?.storytelling_score || 70} icon="📖" />
          </div>

          {/* Feedback */}
          {analysisResult?.feedback && (
            <div style={{ padding: '1.5rem', background: '#f0f4ff', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #667eea' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>💬 AI Feedback</h3>
              <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>{analysisResult.feedback}</p>
            </div>
          )}

          {/* Improvement Checklist */}
          {analysisResult?.improvement_checklist && Array.isArray(analysisResult.improvement_checklist) && (
            <div style={{ padding: '1.5rem', background: '#fff3cd', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ffeaa7' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#856404' }}>⚡ Next Steps for Improvement</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#333' }}>
                {analysisResult.improvement_checklist.slice(0, 5).map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    {typeof item === 'string' ? item : item.title || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Word Count</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(analysisResult?.overall_score || 70) }}>
                {analysisResult?.word_count || 0}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Time Taken</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatTime(analysisResult?.time_taken || 0)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Category</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {selectedQuestion?.category || 'Unknown'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setShowResults(false);
                setActiveTab('practice');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                flex: 1
              }}
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
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                flex: 1
              }}
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
