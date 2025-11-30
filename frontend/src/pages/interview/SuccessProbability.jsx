import React, { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

function SuccessProbability() {
  const [selectedInterview, setSelectedInterview] = useState('1');
  const [showComparison, setShowComparison] = useState(false);
  
  const interviews = [
    { uuid: '1', company: 'TechCorp', position: 'Software Engineer', datetime: '2025-12-15T14:00:00' },
    { uuid: '2', company: 'StartupXYZ', position: 'Product Manager', datetime: '2025-12-20T10:00:00' },
    { uuid: '3', company: 'BigCo', position: 'Data Scientist', datetime: '2025-12-22T15:00:00' }
  ];
  
  const predictions = {
    '1': {
      success_probability: 78.5,
      confidence_level: 'high',
      preparation_score: 85,
      role_match_score: 72,
      practice_hours: 8.5,
      historical_performance_score: 75,
      mock_interview_performance: 82,
      behavioral_prediction: 85,
      technical_prediction: 70,
      situational_prediction: 80,
      prioritized_actions: [
        { title: 'Review technical concepts', description: 'Focus on data structures and algorithms', priority: 'high', estimated_impact: 15 },
        { title: 'Complete final preparation tasks', description: 'Finish remaining checklist items', priority: 'medium', estimated_impact: 5 }
      ]
    },
    '2': {
      success_probability: 65.2,
      confidence_level: 'medium',
      preparation_score: 60,
      role_match_score: 68,
      practice_hours: 5.0,
      historical_performance_score: 75,
      mock_interview_performance: 65,
      behavioral_prediction: 70,
      technical_prediction: 55,
      situational_prediction: 70,
      prioritized_actions: [
        { title: 'Complete interview preparation', description: 'Only 60% of tasks complete', priority: 'high', estimated_impact: 10 },
        { title: 'More mock interview practice', description: 'Complete 2-3 more sessions', priority: 'high', estimated_impact: 10 }
      ]
    },
    '3': {
      success_probability: 82.0,
      confidence_level: 'high',
      preparation_score: 90,
      role_match_score: 85,
      practice_hours: 12.0,
      historical_performance_score: 75,
      mock_interview_performance: 88,
      behavioral_prediction: 90,
      technical_prediction: 78,
      situational_prediction: 82,
      prioritized_actions: [
        { title: 'Maintain preparation level', description: 'You\'re well-prepared! Stay confident', priority: 'low', estimated_impact: 5 }
      ]
    }
  };
  
  const currentPrediction = predictions[selectedInterview];
  
  const categoryData = [
    { category: 'Behavioral', score: currentPrediction.behavioral_prediction },
    { category: 'Technical', score: currentPrediction.technical_prediction },
    { category: 'Situational', score: currentPrediction.situational_prediction }
  ];
  
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
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Interview Success Probability</h1>
        <p style={{ color: '#666', margin: 0 }}>AI-powered predictions to optimize your preparation</p>
      </div>
      
      {/* Interview Selector */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>Select Interview</label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {interviews.map(interview => (
            <button
              key={interview.uuid}
              onClick={() => setSelectedInterview(interview.uuid)}
              style={{
                padding: '1rem 1.5rem',
                border: selectedInterview === interview.uuid ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '8px',
                background: selectedInterview === interview.uuid ? '#f0f4ff' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                flex: '1 1 calc(33.333% - 1rem)',
                minWidth: '250px'
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{interview.position}</div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>{interview.company}</div>
              <div style={{ fontSize: '0.85rem', color: '#999' }}>
                {new Date(interview.datetime).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Probability Gauge */}
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
        
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width="240" height="240" viewBox="0 0 240 240">
            {/* Background circle */}
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="20"
            />
            {/* Progress circle */}
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="white"
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * (1 - currentPrediction.success_probability / 100)}`}
              transform="rotate(-90 120 120)"
              strokeLinecap="round"
            />
            {/* Center text */}
            <text x="120" y="110" textAnchor="middle" fill="white" fontSize="48" fontWeight="bold">
              {Math.round(currentPrediction.success_probability)}%
            </text>
            <text x="120" y="140" textAnchor="middle" fill="white" fontSize="16" opacity="0.9">
              Success Rate
            </text>
          </svg>
        </div>
        
        <div style={{ fontSize: '1.2rem', marginTop: '1rem', fontWeight: '500' }}>
          {currentPrediction.success_probability >= 75 
            ? 'Excellent preparation! You\'re in great shape.' 
            : currentPrediction.success_probability >= 50 
            ? 'Good foundation. A few improvements can boost your success.' 
            : 'More preparation needed. Focus on key areas below.'}
        </div>
      </div>
      
      {/* Contributing Factors */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Contributing Factors</h3>
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
          <FactorCard 
            title="Mock Performance" 
            score={currentPrediction.mock_interview_performance} 
            icon="🎭"
            description="Practice session scores"
          />
        </div>
      </div>
      
      {/* Category Predictions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Category-Specific Predictions</h3>
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
      
      {/* Prioritized Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Prioritized Action Items</h3>
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
      
      {/* Compare Multiple Interviews */}
      <div style={{
        padding: '2rem',
        background: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Compare Interviews</h3>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          View side-by-side comparison of success probabilities across all upcoming interviews
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {interviews.map(interview => {
            const pred = predictions[interview.uuid];
            return (
              <div key={interview.uuid} style={{
                padding: '1.5rem',
                background: 'white',
                border: selectedInterview === interview.uuid ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '8px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{interview.position}</div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>{interview.company}</div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: getProbabilityColor(pred.success_probability),
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}>
                  {Math.round(pred.success_probability)}%
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                  Success Probability
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SuccessProbability;