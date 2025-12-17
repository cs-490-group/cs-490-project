import React, { useState, useEffect } from 'react';
import './CompetitiveAnalysis.css';
import { getCompetitiveAnalysis } from '../../api/performanceAnalytics';

const CompetitiveAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    fetchCompetitiveAnalysis();
  }, []);

  const fetchCompetitiveAnalysis = async () => {
    try {
      setLoading(true);
      const data = await getCompetitiveAnalysis();
      setAnalysisData(data.data);
    } catch (err) {
      console.error('Competitive Analysis Error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch competitive analysis');
    } finally {
      setLoading(false);
    }
  };

  const renderJobSearchPerformance = () => {
    if (!analysisData?.job_search_performance) return null;

    const { user_performance, peer_benchmarks, performance_vs_peers } = analysisData.job_search_performance;

    return (
      <div className="analysis-section">
        <h3>Job Search Performance</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Application Volume</h4>
            <div className="metric-value">{user_performance?.avg_applications_per_month?.toFixed(1) || 0}/month</div>
            <div className="peer-comparison">
              Peer Average: {peer_benchmarks?.average_applications_per_month?.toFixed(1) || 0}/month
            </div>
            <div className={`performance-indicator ${performance_vs_peers?.applications_volume || 'average'}`}>
              {performance_vs_peers?.applications_volume === 'above_average' ? '↑ Above Average' : '↓ Below Average'}
            </div>
          </div>

          <div className="metric-card">
            <h4>Success Rate</h4>
            <div className="metric-value">{((user_performance?.success_rate || 0) * 100).toFixed(1)}%</div>
            <div className="peer-comparison">
              Peer Average: {((peer_benchmarks?.average_success_rate || 0) * 100).toFixed(1)}%
            </div>
            <div className={`performance-indicator ${performance_vs_peers?.success_rate || 'average'}`}>
              {performance_vs_peers?.success_rate === 'above_average' ? '↑ Above Average' : '↓ Below Average'}
            </div>
          </div>

          <div className="metric-card">
            <h4>Interview Rate</h4>
            <div className="metric-value">{((user_performance?.interview_rate || 0) * 100).toFixed(1)}%</div>
            <div className="peer-comparison">
              Peer Average: {((peer_benchmarks?.average_interview_rate || 0) * 100).toFixed(1)}%
            </div>
            <div className={`performance-indicator ${performance_vs_peers?.interview_rate || 'average'}`}>
              {performance_vs_peers?.interview_rate === 'above_average' ? '↑ Above Average' : '↓ Below Average'}
            </div>
          </div>

          <div className="metric-card">
            <h4>Percentile Ranking</h4>
            <div className="metric-value">{peer_benchmarks?.percentile_ranking?.toFixed(0) || 0}th</div>
            <div className="peer-comparison">Among similar professionals</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompetitivePositioning = () => {
    if (!analysisData?.competitive_positioning) return null;

    const { skills_competitiveness, experience_positioning, achievements_comparison } = analysisData.competitive_positioning;

    return (
      <div className="analysis-section">
        <h3>Competitive Positioning</h3>
        <div className="positioning-grid">
          <div className="positioning-card">
            <h4>Skills Competitiveness</h4>
            <div className="skill-metrics">
              <div className="skill-metric">
                <span>Total Skills:</span>
                <span>{skills_competitiveness?.total_skills || 0}</span>
              </div>
              <div className="skill-metric">
                <span>Peer Average:</span>
                <span>{skills_competitiveness?.peer_average?.toFixed(1) || 0}</span>
              </div>
              <div className="skill-metric">
                <span>Skill Diversity:</span>
                <span>{skills_competitiveness?.skill_diversity || 0} categories</span>
              </div>
            </div>
          </div>

          <div className="positioning-card">
            <h4>Experience Positioning</h4>
            <div className="experience-metrics">
              <div className="experience-metric">
                <span>Years Experience:</span>
                <span>{experience_positioning?.years_experience || 0}</span>
              </div>
              <div className="experience-metric">
                <span>Industry Alignment:</span>
                <span>{((experience_positioning?.industry_alignment || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="positioning-card">
            <h4>Achievements</h4>
            <div className="achievement-metrics">
              <div className="achievement-metric">
                <span>Certifications:</span>
                <span>{achievements_comparison?.certifications || 0}</span>
              </div>
              <div className="achievement-metric">
                <span>Projects:</span>
                <span>{achievements_comparison?.projects || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSkillGapAnalysis = () => {
    if (!analysisData?.skill_gap_analysis) return null;

    const { current_skills, missing_common_skills, in_demand_skills, skill_coverage_percentage } = analysisData.skill_gap_analysis;

    return (
      <div className="analysis-section">
        <h3>Skill Gap Analysis</h3>
        <div className="skill-gap-container">
          <div className="skill-coverage">
            <h4>Skill Coverage: {skill_coverage_percentage?.toFixed(0) || 0}%</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${skill_coverage_percentage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="skills-columns">
            <div className="skills-column">
              <h4>Current Skills ({current_skills?.length || 0})</h4>
              <div className="skills-list">
                {current_skills?.slice(0, 10).map((skill, index) => (
                  <div key={index} className="skill-item current">{skill}</div>
                ))}
                {current_skills?.length > 10 && (
                  <div className="skill-more">+{current_skills.length - 10} more</div>
                )}
              </div>
            </div>

            <div className="skills-column">
              <h4>Missing Common Skills ({missing_common_skills?.length || 0})</h4>
              <div className="skills-list">
                {missing_common_skills?.slice(0, 5).map((skill, index) => (
                  <div key={index} className="skill-item missing">{skill}</div>
                ))}
                {missing_common_skills?.length > 5 && (
                  <div className="skill-more">+{missing_common_skills.length - 5} more</div>
                )}
              </div>
            </div>

            <div className="skills-column">
              <h4>In-Demand Skills ({in_demand_skills?.length || 0})</h4>
              <div className="skills-list">
                {in_demand_skills?.slice(0, 5).map((skill, index) => (
                  <div key={index} className="skill-item in-demand">{skill}</div>
                ))}
                {in_demand_skills?.length > 5 && (
                  <div className="skill-more">+{in_demand_skills.length - 5} more</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!analysisData?.recommendations) return null;

    return (
      <div className="analysis-section">
        <h3>Competitive Advantage Recommendations</h3>
        <div className="recommendations-list">
          {analysisData.recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card priority-${rec.priority}`}>
              <div className="recommendation-header">
                <h4>{rec.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
              </div>
              <p className="recommendation-text">{rec.recommendation}</p>
              <div className="expected-impact">
                <strong>Expected Impact:</strong> {rec.expected_impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMarketPositioning = () => {
    if (!analysisData?.market_positioning) return null;

    const { salary_positioning, positioning_suggestions } = analysisData.market_positioning;

    return (
      <div className="analysis-section">
        <h3>Market Positioning</h3>
        <div className="market-positioning-container">
          <div className="salary-positioning">
            <h4>Salary Positioning</h4>
            <div className="salary-metrics">
              <div className="salary-metric">
                <span>Current Salary:</span>
                <span>${(salary_positioning?.current_salary_range || 0).toLocaleString()}</span>
              </div>
              <div className="salary-metric">
                <span>Peer Average:</span>
                <span>${(salary_positioning?.peer_average || 0).toLocaleString()}</span>
              </div>
              <div className="salary-metric">
                <span>Market Percentile:</span>
                <span>{salary_positioning?.market_percentile?.toFixed(0) || 0}th</span>
              </div>
            </div>
          </div>

          {positioning_suggestions?.length > 0 && (
            <div className="positioning-suggestions">
              <h4>Positioning Suggestions</h4>
              <ul>
                {positioning_suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDifferentiationStrategies = () => {
    if (!analysisData?.differentiation_strategies) return null;

    return (
      <div className="analysis-section">
        <h3>Differentiation Strategies</h3>
        <div className="strategies-list">
          {analysisData.differentiation_strategies.map((strategy, index) => (
            <div key={index} className="strategy-card">
              <h4>{strategy.strategy?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
              <p>{strategy.description}</p>
              <div className="implementation">
                <strong>Implementation:</strong> {strategy.implementation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="competitive-analysis loading">
        <div className="loading-spinner"></div>
        <p>Analyzing competitive positioning...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="competitive-analysis error">
        <h3>Error Loading Competitive Analysis</h3>
        <p>{error}</p>
        <button onClick={fetchCompetitiveAnalysis} className="retry-button">Retry</button>
      </div>
    );
  }

  const tabs = [
    { id: 'performance', name: 'Performance', component: renderJobSearchPerformance },
    { id: 'positioning', name: 'Positioning', component: renderCompetitivePositioning },
    { id: 'skills', name: 'Skills Gap', component: renderSkillGapAnalysis },
    { id: 'recommendations', name: 'Recommendations', component: renderRecommendations },
    { id: 'market', name: 'Market Position', component: renderMarketPositioning },
    { id: 'strategies', name: 'Strategies', component: renderDifferentiationStrategies }
  ];

  return (
    <div className="competitive-analysis">
      <div className="analysis-header">
        <h2>Competitive Analysis & Benchmarking</h2>
        <p>Compare your performance against anonymous peer benchmarks</p>
        <div className="last-updated">
          Last updated: {analysisData && new Date(analysisData.last_updated).toLocaleString()}
        </div>
      </div>

      <div className="analysis-tabs">
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

      <div className="analysis-content">
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>
    </div>
  );
};

export default CompetitiveAnalysis;
