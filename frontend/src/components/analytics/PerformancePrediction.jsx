import React, { useState, useEffect } from 'react';
import './PerformancePrediction.css';
import { getPerformancePrediction } from '../../api/performanceAnalytics';

const PerformancePrediction = () => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('interview');

  useEffect(() => {
    fetchPerformancePrediction();
  }, []);

  const fetchPerformancePrediction = async () => {
    try {
      setLoading(true);
      const data = await getPerformancePrediction();
      setPredictionData(data.data);
    } catch (err) {
      console.error('Performance Prediction Error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch performance predictions');
    } finally {
      setLoading(false);
    }
  };

  const renderInterviewSuccess = () => {
    if (!predictionData?.interview_success) return null;

    const { success_probability, confidence_interval, factors, recommendations } = predictionData.interview_success;

    return (
      <div className="prediction-section">
        <h3>Interview Success Prediction</h3>
        <div className="prediction-overview">
          <div className="success-probability">
            <div className="probability-circle">
              <div className="circle-progress" style={{ 
                background: `conic-gradient(#3498db 0deg ${(success_probability || 0) * 360}deg, #e9ecef ${(success_probability || 0) * 360}deg 360deg)` 
              }}>
                <div className="circle-inner">
                  <span className="probability-value">{((success_probability || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="probability-label">Success Probability</div>
          </div>

          <div className="confidence-interval">
            <h4>Confidence Interval</h4>
            <div className="interval-bar">
              <div className="interval-range">
                <span>{((confidence_interval?.[0] || 0) * 100).toFixed(0)}%</span>
                <div className="range-line"></div>
                <span>{((confidence_interval?.[1] || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {factors?.length > 0 && (
          <div className="success-factors">
            <h4>Success Factors</h4>
            <ul>
              {factors.map((factor, index) => (
                <li key={index}>{factor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendations?.length > 0 && (
          <div className="prediction-recommendations">
            <h4>Recommendations</h4>
            <ul>
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderJobSearchTimeline = () => {
    if (!predictionData?.job_search_timeline) return null;

    const { estimated_timeline_days, confidence_level, factors, recommendations } = predictionData.job_search_timeline;

    return (
      <div className="prediction-section">
        <h3>Job Search Timeline Prediction</h3>
        <div className="timeline-prediction">
          <div className="timeline-visual">
            <div className="timeline-days">
              <span className="days-value">{estimated_timeline_days || 0}</span>
              <span className="days-label">Estimated Days</span>
            </div>
            <div className={`confidence-badge ${confidence_level}`}>
              {confidence_level?.toUpperCase()} Confidence
            </div>
          </div>

          <div className="timeline-breakdown">
            <div className="timeline-phases">
              <div className="phase">
                <div className="phase-bar" style={{ width: '30%' }}></div>
                <span>Application Phase</span>
              </div>
              <div className="phase">
                <div className="phase-bar" style={{ width: '40%' }}></div>
                <span>Interview Phase</span>
              </div>
              <div className="phase">
                <div className="phase-bar" style={{ width: '30%' }}></div>
                <span>Decision Phase</span>
              </div>
            </div>
          </div>

          {factors?.length > 0 && (
            <div className="timeline-factors">
              <h4>Timeline Factors</h4>
              <ul>
                {factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations?.length > 0 && (
            <div className="timeline-recommendations">
              <h4>Timeline Optimization</h4>
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSalaryNegotiation = () => {
    if (!predictionData?.salary_negotiation) return null;

    const { negotiation_success_probability, expected_increase_percentage, confidence_level, factors, recommendations } = predictionData.salary_negotiation;

    return (
      <div className="prediction-section">
        <h3>Salary Negotiation Prediction</h3>
        <div className="salary-prediction">
          <div className="negotiation-metrics">
            <div className="metric-card">
              <h4>Success Probability</h4>
              <div className="metric-value">{((negotiation_success_probability || 0) * 100).toFixed(0)}%</div>
              <div className={`confidence-indicator ${confidence_level}`}>
                {confidence_level} confidence
              </div>
            </div>

            <div className="metric-card">
              <h4>Expected Increase</h4>
              <div className="metric-value">{(expected_increase_percentage || 0).toFixed(0)}%</div>
              <div className="metric-description">Based on market data</div>
            </div>
          </div>

          {factors?.length > 0 && (
            <div className="negotiation-factors">
              <h4>Negotiation Factors</h4>
              <ul>
                {factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations?.length > 0 && (
            <div className="negotiation-recommendations">
              <h4>Negotiation Strategy</h4>
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOptimalTiming = () => {
    if (!predictionData?.optimal_timing) return null;

    const { optimal_timing_score, best_months_to_apply, current_month_assessment, recommendations } = predictionData.optimal_timing;

    const currentMonth = new Date().getMonth() + 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
      <div className="prediction-section">
        <h3>Optimal Career Timing</h3>
        <div className="timing-analysis">
          <div className="timing-score">
            <div className="score-circle">
              <div className="score-progress" style={{ 
                background: `conic-gradient(#2ecc71 0deg ${(optimal_timing_score || 0) * 360}deg, #e9ecef ${(optimal_timing_score || 0) * 360}deg 360deg)` 
              }}>
                <div className="score-inner">
                  <span className="score-value">{((optimal_timing_score || 0) * 100).toFixed(0)}</span>
                </div>
              </div>
            </div>
            <div className="score-label">Timing Score</div>
          </div>

          <div className="monthly-analysis">
            <h4>Monthly Hiring Activity</h4>
            <div className="months-grid">
              {monthNames.map((month, index) => {
                const monthNum = index + 1;
                const isOptimal = best_months_to_apply?.includes(monthNum);
                const isCurrent = monthNum === currentMonth;
                
                return (
                  <div 
                    key={month} 
                    className={`month-cell ${isOptimal ? 'optimal' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <span>{month}</span>
                    {isOptimal && <span className="optimal-indicator">★</span>}
                    {isCurrent && <span className="current-indicator">●</span>}
                  </div>
                );
              })}
            </div>
            <div className="month-legend">
              <span className="legend-item optimal">★ Optimal Month</span>
              <span className="legend-item current">● Current Month</span>
            </div>
          </div>

          <div className="current-assessment">
            <h4>Current Month Assessment</h4>
            <div className={`assessment-badge ${current_month_assessment}`}>
              {current_month_assessment?.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          {recommendations?.length > 0 && (
            <div className="timing-recommendations">
              <h4>Timing Recommendations</h4>
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderScenarioPlanning = () => {
    if (!predictionData?.scenario_planning) return null;

    const scenarios = predictionData.scenario_planning;

    return (
      <div className="prediction-section">
        <h3>Scenario Planning</h3>
        <div className="scenarios-grid">
          {Object.entries(scenarios).map(([key, scenario]) => (
            <div key={key} className="scenario-card">
              <h4>{scenario.description}</h4>
              <div className="scenario-metrics">
                <div className="scenario-metric">
                  <span>Success Rate:</span>
                  <span>{((scenario.predicted_success_rate || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="scenario-metric">
                  <span>Timeline:</span>
                  <span>{scenario.estimated_timeline_days || 0} days</span>
                </div>
                <div className="scenario-metric">
                  <span>Effort:</span>
                  <span className={`effort-level ${scenario.required_effort}`}>
                    {scenario.required_effort}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderImprovementRecommendations = () => {
    if (!predictionData?.improvement_recommendations) return null;

    return (
      <div className="prediction-section">
        <h3>Improvement Recommendations</h3>
        <div className="recommendations-list">
          {predictionData.improvement_recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-area">
                <h4>{rec.area?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
              </div>
              <p className="recommendation-text">{rec.recommendation}</p>
              <div className="expected-improvement">
                <strong>Expected Improvement:</strong> {rec.expected_improvement}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPredictionAccuracy = () => {
    if (!predictionData?.prediction_accuracy) return null;

    const { model_accuracy, sample_size, confidence_level, improvement_trend } = predictionData.prediction_accuracy;

    return (
      <div className="prediction-section">
        <h3>Prediction Accuracy</h3>
        <div className="accuracy-metrics">
          <div className="accuracy-overview">
            <div className="accuracy-score">
              <div className="accuracy-circle">
                <div className="accuracy-progress" style={{ 
                  background: `conic-gradient(#9b59b6 0deg ${(model_accuracy || 0) * 360}deg, #e9ecef ${(model_accuracy || 0) * 360}deg 360deg)` 
                }}>
                  <div className="accuracy-inner">
                    <span className="accuracy-value">{((model_accuracy || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="accuracy-label">Model Accuracy</div>
            </div>

            <div className="accuracy-details">
              <div className="detail-item">
                <span>Sample Size:</span>
                <span>{sample_size || 0}</span>
              </div>
              <div className="detail-item">
                <span>Confidence Level:</span>
                <span>{confidence_level}</span>
              </div>
              <div className="detail-item">
                <span>Trend:</span>
                <span className={`trend-indicator ${improvement_trend}`}>
                  {improvement_trend?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="accuracy-explanation">
            <p>
              Our prediction model continuously learns from your data and improves over time. 
              The accuracy score represents how well our predictions have matched actual outcomes 
              for users with similar profiles.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="performance-prediction loading">
        <div className="loading-spinner"></div>
        <p>Generating performance predictions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-prediction error">
        <h3>Error Loading Performance Predictions</h3>
        <p>{error}</p>
        <button onClick={fetchPerformancePrediction} className="retry-button">Retry</button>
      </div>
    );
  }

  const tabs = [
    { id: 'interview', name: 'Interview Success', component: renderInterviewSuccess },
    { id: 'timeline', name: 'Timeline', component: renderJobSearchTimeline },
    { id: 'salary', name: 'Salary Negotiation', component: renderSalaryNegotiation },
    { id: 'timing', name: 'Optimal Timing', component: renderOptimalTiming },
    { id: 'scenarios', name: 'Scenario Planning', component: renderScenarioPlanning },
    { id: 'improvements', name: 'Improvements', component: renderImprovementRecommendations },
    { id: 'accuracy', name: 'Accuracy', component: renderPredictionAccuracy }
  ];

  return (
    <div className="performance-prediction">
      <div className="prediction-header">
        <h2>Performance Prediction & Forecasting</h2>
        <p>Predict future job search outcomes based on historical data</p>
        <div className="last-updated">
          Last updated: {predictionData && new Date(predictionData.last_updated).toLocaleString()}
        </div>
      </div>

      <div className="prediction-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="prediction-content">
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>
    </div>
  );
};

export default PerformancePrediction;
