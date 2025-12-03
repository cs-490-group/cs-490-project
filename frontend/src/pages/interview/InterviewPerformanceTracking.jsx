import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Area, AreaChart } from 'recharts';

function InterviewPerformanceTracking() {
  const [timeframe, setTimeframe] = useState(90);
  const [filterType, setFilterType] = useState('all'); // all, real, mock
  
  // Mock data - replace with API calls
  const performanceData = {
    overall_stats: {
      total_interviews: 24,
      real_interviews: 18,
      mock_interviews: 6,
      offers_received: 12,
      conversion_rate: 66.67,
      avg_preparation_hours: 8.5,
      avg_confidence_score: 7.8,
      improvement_trend: 'improving'
    },
    conversion_by_stage: [
      { stage: 'Application', count: 50, rate: 100 },
      { stage: 'Phone Screen', count: 30, rate: 60 },
      { stage: 'Technical', count: 24, rate: 48 },
      { stage: 'Behavioral', count: 20, rate: 40 },
      { stage: 'Final', count: 18, rate: 36 },
      { stage: 'Offer', count: 12, rate: 24 }
    ],
    performance_over_time: [
      { month: 'Jul', real: 50, mock: 80, confidence: 6.5 },
      { month: 'Aug', real: 58, mock: 82, confidence: 7.0 },
      { month: 'Sep', real: 62, mock: 84, confidence: 7.3 },
      { month: 'Oct', real: 67, mock: 86, confidence: 7.6 },
      { month: 'Nov', real: 71, mock: 88, confidence: 7.8 }
    ],
    format_performance: [
      { format: 'Video', success_rate: 75, count: 10, avg_prep: 8 },
      { format: 'Phone', success_rate: 60, count: 5, avg_prep: 6 },
      { format: 'In-Person', success_rate: 70, count: 3, avg_prep: 10 }
    ],
    category_performance: [
      { category: 'Behavioral', score: 85, real: 88, mock: 82 },
      { category: 'Technical', score: 55, real: 52, mock: 58 },
      { category: 'Situational', score: 72, real: 70, mock: 74 },
      { category: 'Company', score: 80, real: 82, mock: 78 },
      { category: 'Leadership', score: 68, real: 65, mock: 71 }
    ],
    industry_performance: [
      { industry: 'Tech', interviews: 12, success: 8, rate: 66.7 },
      { industry: 'Finance', interviews: 4, success: 3, rate: 75.0 },
      { industry: 'Consulting', interviews: 2, success: 1, rate: 50.0 }
    ],
    feedback_themes: [
      { theme: 'Strong communication skills', sentiment: 'positive', frequency: 15 },
      { theme: 'Need more technical depth', sentiment: 'improvement', frequency: 8 },
      { theme: 'Excellent problem-solving', sentiment: 'positive', frequency: 12 },
      { theme: 'Could improve STAR structure', sentiment: 'improvement', frequency: 6 },
      { theme: 'Great cultural fit', sentiment: 'positive', frequency: 10 }
    ],
    confidence_anxiety: {
      avg_confidence_before: 6.2,
      avg_confidence_after: 7.8,
      anxiety_reduction: 35,
      preparation_correlation: 0.82
    },
    coaching_recommendations: [
      {
        area: 'Technical Interviews',
        priority: 'high',
        current_score: 55,
        target_score: 75,
        actions: [
          'Complete 5 more mock technical interviews',
          'Focus on data structures and algorithms',
          'Practice whiteboard coding sessions'
        ],
        estimated_improvement: 15
      },
      {
        area: 'Interview Preparation',
        priority: 'medium',
        current_score: 70,
        target_score: 85,
        actions: [
          'Increase preparation time by 2 hours per interview',
          'Research company culture more thoroughly',
          'Prepare more specific examples'
        ],
        estimated_improvement: 10
      }
    ],
    benchmarking: {
      your_conversion_rate: 66.7,
      industry_avg: 25.0,
      top_performers: 75.0,
      your_ranking_percentile: 85
    }
  };

  const MetricCard = ({ title, value, subtitle, trend, icon, color = '#667eea' }) => (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>{title}</div>
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem', color }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{subtitle}</div>
      )}
      {trend && (
        <div style={{ 
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: trend === 'up' ? '#28a745' : trend === 'down' ? '#dc3545' : '#666',
          fontWeight: '500'
        }}>
          {trend === 'up' ? '↗ Improving' : trend === 'down' ? '↘ Declining' : '→ Stable'}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Interview Performance Tracking</h1>
          <p style={{ color: '#666', margin: 0 }}>Comprehensive analytics to improve your interview success</p>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[7, 30, 90, 365].map(days => (
              <button
                key={days}
                onClick={() => setTimeframe(days)}
                style={{
                  padding: '0.5rem 1rem',
                  border: timeframe === days ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: timeframe === days ? '#f0f4ff' : 'white',
                  color: timeframe === days ? '#667eea' : '#666',
                  cursor: 'pointer',
                  fontWeight: timeframe === days ? '600' : '400'
                }}
              >
                {days === 365 ? 'All Time' : `${days} Days`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { value: 'all', label: 'All Interviews' },
              { value: 'real', label: 'Real Only' },
              { value: 'mock', label: 'Mock Only' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: filterType === filter.value ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: filterType === filter.value ? '#f0f4ff' : 'white',
                  color: filterType === filter.value ? '#667eea' : '#666',
                  cursor: 'pointer',
                  fontWeight: filterType === filter.value ? '600' : '400'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <MetricCard
            title="Interview-to-Offer Rate"
            value={`${performanceData.overall_stats.conversion_rate}%`}
            subtitle={`${performanceData.overall_stats.offers_received} offers from ${performanceData.overall_stats.total_interviews} interviews`}
            trend="up"
            icon="🎯"
            color="#28a745"
          />
          <MetricCard
            title="Total Interviews"
            value={performanceData.overall_stats.total_interviews}
            subtitle={`${performanceData.overall_stats.real_interviews} real, ${performanceData.overall_stats.mock_interviews} mock`}
            icon="📊"
          />
          <MetricCard
            title="Avg Preparation"
            value={`${performanceData.overall_stats.avg_preparation_hours}h`}
            subtitle="Per interview"
            icon="📝"
          />
          <MetricCard
            title="Confidence Score"
            value={performanceData.overall_stats.avg_confidence_score}
            subtitle="Out of 10"
            trend="up"
            icon="💪"
            color="#667eea"
          />
        </div>

        {/* Conversion Funnel */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Interview Stage Conversion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.conversion_by_stage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="stage" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="rate" fill="#667eea" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Trends */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Success Rate Over Time */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Success Rate Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData.performance_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="real" stroke="#667eea" fill="#667eea" fillOpacity={0.6} name="Real Interviews" />
                <Area type="monotone" dataKey="mock" stroke="#764ba2" fill="#764ba2" fillOpacity={0.4} name="Mock Interviews" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Confidence Progress */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Confidence Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData.performance_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="confidence" stroke="#28a745" strokeWidth={3} dot={{ fill: '#28a745', r: 6 }} name="Confidence Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Format & Category Analysis */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Format Performance */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Performance by Interview Format</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {performanceData.format_performance.map(format => (
                <div key={format.format} style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>{format.format}</span>
                    <span style={{ fontWeight: 'bold', color: '#667eea' }}>{format.success_rate}%</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    {format.count} interviews • Avg prep: {format.avg_prep}h
                  </div>
                  <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${format.success_rate}%`,
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance Radar */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Skills by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceData.category_performance}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Real Interviews" dataKey="real" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                <Radar name="Mock Interviews" dataKey="mock" stroke="#764ba2" fill="#764ba2" fillOpacity={0.4} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Breakdown */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Performance Across Industries</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {performanceData.industry_performance.map(industry => (
              <div key={industry.industry} style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{industry.industry}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
                  {industry.rate}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {industry.success}/{industry.interviews} successful
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Themes */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Common Feedback Themes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {performanceData.feedback_themes.map((feedback, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                background: feedback.sentiment === 'positive' ? '#d4edda' : '#fff3cd',
                borderRadius: '8px',
                border: `1px solid ${feedback.sentiment === 'positive' ? '#c3e6cb' : '#ffeaa7'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {feedback.sentiment === 'positive' ? '✓' : '⚠️'}
                  </span>
                  <span style={{ fontWeight: '500', color: feedback.sentiment === 'positive' ? '#155724' : '#856404' }}>
                    {feedback.theme}
                  </span>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'white',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: feedback.sentiment === 'positive' ? '#28a745' : '#ffc107'
                }}>
                  {feedback.frequency} mentions
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence & Anxiety Tracking */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Confidence & Anxiety Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Confidence Before</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {performanceData.confidence_anxiety.avg_confidence_before}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#155724', marginBottom: '0.5rem' }}>Confidence After</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {performanceData.confidence_anxiety.avg_confidence_after}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Anxiety Reduction</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {performanceData.confidence_anxiety.anxiety_reduction}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Prep Correlation</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {performanceData.confidence_anxiety.preparation_correlation}
              </div>
            </div>
          </div>
        </div>

        {/* Coaching Recommendations */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎯</span> Personalized Coaching Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {performanceData.coaching_recommendations.map((rec, idx) => (
              <div key={idx} style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>{rec.area}</h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: rec.priority === 'high' ? '#dc3545' : '#ffc107',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Current: {rec.current_score}% → Target: {rec.target_score}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Est. Improvement</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                      +{rec.estimated_improvement}%
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Action Items:</div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {rec.actions.map((action, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem', color: '#333' }}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmarking */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Benchmarking Against Industry Standards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f0f4ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#667eea', marginBottom: '0.5rem' }}>Your Rate</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {performanceData.benchmarking.your_conversion_rate}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Industry Avg</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#999' }}>
                {performanceData.benchmarking.industry_avg}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Top Performers</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#999' }}>
                {performanceData.benchmarking.top_performers}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#d4edda', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#155724', marginBottom: '0.5rem' }}>Your Percentile</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {performanceData.benchmarking.your_ranking_percentile}th
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: '#f0f4ff', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
            <strong style={{ color: '#667eea' }}>📊 Performance Summary:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#333' }}>
              You're performing in the <strong>85th percentile</strong>, with a conversion rate 
              <strong> {(performanceData.benchmarking.your_conversion_rate - performanceData.benchmarking.industry_avg).toFixed(1)}% above</strong> the industry average. 
              Keep up the excellent work! Focus on technical interview preparation to reach top performer levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewPerformanceTracking;