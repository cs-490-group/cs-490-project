import React, { useState, useEffect } from 'react';

function WritingPractice() {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [timeLimit, setTimeLimit] = useState(300);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isPracticing, setIsPracticing] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  const questionBank = [
    { uuid: '1', text: 'Tell me about a time when you had to deal with a difficult team member.', category: 'behavioral', recommended_time: 300 },
    { uuid: '2', text: 'Describe a situation where you had to learn a new technology quickly.', category: 'behavioral', recommended_time: 300 },
    { uuid: '3', text: 'How would you approach debugging a complex production issue?', category: 'technical', recommended_time: 300 },
    { uuid: '4', text: 'Tell me about a time when you had to make a difficult decision with incomplete information.', category: 'situational', recommended_time: 300 },
    { uuid: '5', text: 'Describe a project where you demonstrated leadership.', category: 'behavioral', recommended_time: 300 }
  ];
  
  useEffect(() => {
    const words = responseText.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [responseText]);
  
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
  
  const handleStart = (question) => {
    setSelectedQuestion(question);
    setTimeLimit(question.recommended_time);
    setTimeRemaining(question.recommended_time);
    setResponseText('');
    setAnalysisResult(null);
    setShowResults(false);
    setIsPracticing(true);
  };
  
  const handleSubmit = () => {
    setIsPracticing(false);
    
    // Simulate analysis
    const timeTaken = timeLimit - timeRemaining;
    const clarity = Math.min(100, 60 + (wordCount / 100) * 20 + (responseText.includes('however') ? 10 : 0));
    const structure = Math.min(100, 50 + (wordCount > 75 ? 20 : 0) + (responseText.toLowerCase().includes('situation') ? 15 : 0) + (responseText.toLowerCase().includes('result') ? 15 : 0));
    const conciseness = Math.min(100, wordCount >= 75 && wordCount <= 150 ? 100 : 100 - Math.abs(wordCount - 112) * 0.5);
    const professionalism = 85;
    const overall = (clarity + structure + conciseness + professionalism) / 4;
    
    setAnalysisResult({
      clarity_score: clarity,
      structure_score: structure,
      conciseness_score: conciseness,
      professionalism_score: professionalism,
      overall_score: overall,
      word_count: wordCount,
      time_taken: timeTaken,
      strengths: clarity > 75 ? ['Clear and easy to understand communication'] : [],
      areas_for_improvement: structure < 60 ? ['STAR framework structure'] : [],
      specific_suggestions: [
        wordCount < 75 ? 'Expand your answer with more details and specific examples' : '',
        structure < 70 ? 'Structure your answer using STAR: Situation, Task, Action, Result' : ''
      ].filter(s => s)
    });
    
    setShowResults(true);
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
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Writing Practice</h1>
        <p style={{ color: '#666', margin: 0 }}>Practice timed responses and get detailed feedback</p>
      </div>
      
      {!selectedQuestion ? (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Select a Question</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questionBank.map(question => (
              <div
                key={question.uuid}
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
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Start Practice
                  </button>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#999' }}>
                  ⏱ Recommended time: {Math.floor(question.recommended_time / 60)} minutes
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !showResults ? (
        <div>
          {/* Timer Header */}
          <div style={{
            background: isPracticing ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#6c757d',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
              {selectedQuestion.category.toUpperCase()} QUESTION
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {formatTime(timeRemaining)}
            </div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>
              {isPracticing ? 'Time Remaining' : 'Practice Complete'}
            </div>
          </div>
          
          {/* Question */}
          <div style={{
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Question:</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>{selectedQuestion.text}</div>
          </div>
          
          {/* Response Editor */}
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
              placeholder="Start typing your response here..."
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
          
          {/* Action Buttons */}
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
                disabled={wordCount === 0}
                style={{
                  padding: '0.75rem 2rem',
                  background: wordCount === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: wordCount === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  flex: 1
                }}
              >
                Submit for Analysis
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Results Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>Analysis Complete</h2>
            <p style={{ color: '#666' }}>Here's your performance breakdown</p>
          </div>
          
          {/* Overall Score */}
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
              {Math.round(analysisResult.overall_score)}
            </div>
            <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              {analysisResult.overall_score >= 75 ? 'Excellent!' : analysisResult.overall_score >= 50 ? 'Good Progress' : 'Needs Improvement'}
            </div>
          </div>
          
          {/* Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <ScoreCard title="Clarity" score={analysisResult.clarity_score} icon="💡" />
            <ScoreCard title="Structure" score={analysisResult.structure_score} icon="🏗️" />
            <ScoreCard title="Conciseness" score={analysisResult.conciseness_score} icon="✂️" />
            <ScoreCard title="Professionalism" score={analysisResult.professionalism_score} icon="👔" />
          </div>
          
          {/* Feedback Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#155724' }}>✓ Strengths</h3>
              {analysisResult.strengths.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#155724' }}>
                  {analysisResult.strengths.map((s, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: '#155724' }}>Keep practicing to identify your strengths!</p>
              )}
            </div>
            
            <div style={{ padding: '1.5rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#856404' }}>⚠ Areas for Improvement</h3>
              {analysisResult.areas_for_improvement.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                  {analysisResult.areas_for_improvement.map((a, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: '#856404' }}>Great work! No major areas of concern.</p>
              )}
            </div>
          </div>
          
          {/* Specific Suggestions */}
          {analysisResult.specific_suggestions.length > 0 && (
            <div style={{ padding: '1.5rem', background: '#f0f4ff', borderRadius: '8px', border: '1px solid #667eea', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>💡 Specific Suggestions</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#333' }}>
                {analysisResult.specific_suggestions.map((s, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Word Count</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(analysisResult.conciseness_score) }}>
                {analysisResult.word_count}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Time Taken</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatTime(analysisResult.time_taken)}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Category</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {selectedQuestion.category}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setShowResults(false);
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