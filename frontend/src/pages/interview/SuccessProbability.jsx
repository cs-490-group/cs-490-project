import React, { useState, useEffect } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('session');
  const uuid = localStorage.getItem('uuid');
  
  return {
    'Authorization': `Bearer ${token}`,
    'uuid': uuid,
    'Content-Type': 'application/json'
  };
};

const SuccessPredictionAPI = {
  getProbability: async (interviewId) => {
    const response = await fetch(`${API_BASE_URL}/success-prediction/${interviewId}/probability`, { 
      headers: getAuthHeaders() 
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  
  compareInterviews: async (interviewIds) => {
    const response = await fetch(`${API_BASE_URL}/success-prediction/compare`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(interviewIds)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

const InterviewScheduleAPI = {
  getUpcomingInterviews: async () => {
    const response = await fetch(`${API_BASE_URL}/interview/schedule/upcoming`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

function SuccessProbability() {
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  
  useEffect(() => {
    loadInterviews();
  }, []);
  
  useEffect(() => {
    if (selectedInterview) {
      loadPrediction(selectedInterview);
    }
  }, [selectedInterview]);
  
  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await InterviewScheduleAPI.getUpcomingInterviews();
      const upcomingInterviews = response.upcoming_interviews || [];
      
      if (upcomingInterviews.length === 0) {
        setError('No upcoming interviews found. Schedule an interview to see success predictions.');
        setLoading(false);
        return;
      }
      
      setInterviews(upcomingInterviews);
      setSelectedInterview(upcomingInterviews[0]._id || upcomingInterviews[0].uuid);
      
      // Only compare if we have 2+ interviews
      if (upcomingInterviews.length >= 2) {
        try {
          const interviewIds = upcomingInterviews.map(i => i._id || i.uuid);
          const compRes = await SuccessPredictionAPI.compareInterviews(interviewIds);
          setComparisonData(compRes.comparison);
        } catch (compErr) {
          console.warn('Comparison failed:', compErr);
          // Non-critical error, continue without comparison
        }
      }
      
    } catch (err) {
      console.error('Error loading interviews:', err);
      setError(err.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };
  
  const loadPrediction = async (interviewId) => {
    try {
      const response = await SuccessPredictionAPI.getProbability(interviewId);
      setCurrentPrediction(response.prediction);
    } catch (err) {
      console.error('Error loading prediction:', err);
    }
  };
  
  const getProbabilityColor = (prob) => {
    if (prob >= 75) return '#28a745';
    if (prob >= 50) return '#ffc107';
    return '#dc3545';
  };
  
  const getConfidenceIcon = (level) => {
    if (level === 'high') return '🎯';
    if (level === 'medium') return '📊';
    return '❓';
  };
  
  const FactorCard = ({ title, score, icon, description }) => (
    <div style={{
      padding: '1.5rem',
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {typeof score === 'number' ? Math.round(score) : score}
        </div>
        {description && (
          <div style={{ fontSize: '0.85rem', color: '#999' }}>{description}</div>
        )}
      </div>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `conic-gradient(${getProbabilityColor(score)} ${score * 3.6}deg, #f0f0f0 0deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          fontWeight: 'bold'
        }}>
          {Math.round(score)}%
        </div>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading predictions...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ 
          padding: '1.5rem', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={loadInterviews}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!currentPrediction) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Loading prediction data...
      </div>
    );
  }
  
  const categoryData = [
    { category: 'Behavioral', score: currentPrediction.behavioral_prediction },
    { category: 'Technical', score: currentPrediction.technical_prediction },
    { category: 'Situational', score: currentPrediction.situational_prediction }
  ];
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Interview Success Probability</h1>
        <p style={{ color: '#666', margin: 0 }}>AI-powered predictions to optimize your preparation</p>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>Select Interview</label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {interviews.map(interview => (
            <button
              key={interview._id || interview.uuid}
              onClick={() => setSelectedInterview(interview._id || interview.uuid)}
              style={{
                padding: '1rem 1.5rem',
                border: (interview._id || interview.uuid) === selectedInterview ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '8px',
                background: (interview._id || interview.uuid) === selectedInterview ? '#f0f4ff' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                flex: '1 1 calc(33.333% - 1rem)',
                minWidth: '250px'
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {interview.scenario_name || interview.job_title || 'Interview'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                {interview.company_name || 'Company'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#999' }}>
                {new Date(interview.interview_datetime).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '3rem 2rem',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '2rem',
        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.9 }}>
          {getConfidenceIcon(currentPrediction.confidence_level)} {currentPrediction.confidence_level.toUpperCase()} CONFIDENCE
        </div>
        
        <div key={currentPrediction.success_probability} style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="240" height="240" viewBox="0 0 240 240" style={{ overflow: "visible" }}>
          {/* Background ring */}
          <circle
            cx="120"
            cy="120"
            r="100"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="20"
          />

          {/* Animated progress ring */}
          <circle
            cx="120"
            cy="120"
            r="100"
            fill="none"
            stroke="white"
            strokeWidth="20"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - currentPrediction.success_probability / 100)}
            transform="rotate(-90 120 120)"
            strokeLinecap="round"
            style={{
              animation: "dashAnim 0.9s ease-out forwards"
            }}
          />
          
          <text x="120" y="110" textAnchor="middle" fill="white" fontSize="48" fontWeight="bold">
            {Math.round(currentPrediction.success_probability)}%
          </text>
          <text x="120" y="140" textAnchor="middle" fill="white" fontSize="16" opacity="0.9">
            Success Rate
          </text>
        </svg>

        {/* Keyframe animation */}
        <style>
          {`
            @keyframes dashAnim {
              from {
                stroke-dashoffset: ${2 * Math.PI * 100};
              }
              to {
                stroke-dashoffset: ${2 * Math.PI * 100 * (1 - currentPrediction.success_probability / 100)};
              }
            }
          `}
        </style>
      </div>


        
        <div style={{ fontSize: '1.2rem', marginTop: '1rem', fontWeight: '500' }}>
          {currentPrediction.success_probability >= 75 
            ? 'Excellent preparation! You\'re in great shape.' 
            : currentPrediction.success_probability >= 50 
            ? 'Good foundation. A few improvements can boost your success.' 
            : 'More preparation needed. Focus on key areas below.'}
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Contributing Factors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <FactorCard 
            title="Preparation" 
            score={currentPrediction.preparation_score} 
            icon="📝"
            description="Task completion rate"
          />
          <FactorCard 
            title="Role Match" 
            score={currentPrediction.role_match_score} 
            icon="🎯"
            description="Skills alignment"
          />
          <FactorCard 
            title="Practice Hours" 
            score={currentPrediction.practice_hours} 
            icon="⏱️"
            description="Mock & writing practice"
          />
          <FactorCard 
            title="Historical Performance" 
            score={currentPrediction.historical_performance_score} 
            icon="📊"
            description="Past interview success"
          />
          {currentPrediction.mock_interview_performance && (
            <FactorCard 
              title="Mock Performance" 
              score={currentPrediction.mock_interview_performance} 
              icon="🎭"
              description="Practice session scores"
            />
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Category-Specific Predictions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={categoryData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Predicted Score" dataKey="score" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryData.map(cat => (
              <div key={cat.category} style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>{cat.category}</span>
                  <span style={{ fontWeight: 'bold', color: getProbabilityColor(cat.score) }}>
                    {cat.score}%
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${cat.score}%`,
                    background: getProbabilityColor(cat.score),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {currentPrediction.prioritized_actions?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Prioritized Action Items</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentPrediction.prioritized_actions.map((action, idx) => (
              <div key={idx} style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'start',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: action.priority === 'high' ? '#dc3545' : action.priority === 'medium' ? '#ffc107' : '#28a745',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {action.priority}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '1.1rem' }}>{action.title}</div>
                  <div style={{ color: '#666', fontSize: '0.95rem' }}>{action.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Estimated Impact</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>+{action.estimated_impact}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {comparisonData && interviews.length > 1 && (
        <div style={{
          padding: '2rem',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Compare Interviews</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            View side-by-side comparison of success probabilities across all upcoming interviews
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {comparisonData.interviews?.map(interview => (
              <div key={interview.interview_id} style={{
                padding: '1.5rem',
                background: 'white',
                border: interview.interview_id === selectedInterview ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '8px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{interview.interview_name}</div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>{interview.company_name}</div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: getProbabilityColor(interview.success_probability),
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}>
                  {Math.round(interview.success_probability)}%
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                  Success Probability
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SuccessProbability;