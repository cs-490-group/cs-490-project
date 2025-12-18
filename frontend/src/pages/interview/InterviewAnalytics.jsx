import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

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

const InterviewAnalyticsAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/interview-analytics/dashboard`, { 
      headers: getAuthHeaders() 
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  
  getTrends: async (timeframeDays = 90) => {
    const response = await fetch(`${API_BASE_URL}/interview-analytics/trends?timeframe_days=${timeframeDays}`, { 
      headers: getAuthHeaders() 
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  
  getComparison: async (compareWith = null) => {
    const url = compareWith 
      ? `${API_BASE_URL}/interview-analytics/comparison?compare_with=${compareWith}`
      : `${API_BASE_URL}/interview-analytics/comparison`;
    const response = await fetch(url, { headers: getAuthHeaders() });
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

function InterviewAnalytics() {
  const [timeframe, setTimeframe] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [avgPreparation, setAvgPreparation] = useState(null);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  useEffect(() => {
    if (dashboardData) {
      loadTrends();
    }
  }, [timeframe]);
  
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardRes, comparisonRes, interviewsRes] = await Promise.all([
        InterviewAnalyticsAPI.getDashboard(),
        InterviewAnalyticsAPI.getComparison(),
        InterviewScheduleAPI.getUpcomingInterviews()
      ]);
      
      setDashboardData(dashboardRes.data);
      setComparisonData(comparisonRes.data);
      
      // Calculate average preparation from all interviews
      const allInterviews = [
        ...(interviewsRes.upcoming_interviews || []),
        ...(interviewsRes.past_interviews || [])
      ];
      
      if (allInterviews.length > 0) {
        const avgPrep = allInterviews.reduce((sum, interview) => {
          return sum + (interview.preparation_completion_percentage || 0);
        }, 0) / allInterviews.length;
        setAvgPreparation(Math.round(avgPrep));
      }
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTrends = async () => {
    try {
      const response = await InterviewAnalyticsAPI.getTrends(timeframe);
      setTrendData(response.data.trend_data || []);
    } catch (err) {
      console.error('Error loading trends:', err);
    }
  };
  
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading analytics...</div>
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
          onClick={loadAnalytics}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No analytics data available yet. Complete some interviews to see your performance metrics.
      </div>
    );
  }
  
  const categoryPerformance = dashboardData.category_performance || [];
  const formatData = Object.entries(dashboardData.format_performance || {}).map(([name, rate]) => ({
    name: name.replace('_', '-'),
    rate: rate,
    value: 1
  }));
  
  const outcomeData = [
    { name: 'Offers', value: dashboardData.offers_received || 0, color: '#28a745' },
    { name: 'Rejected', value: (dashboardData.completed_interviews || 0) - (dashboardData.offers_received || 0), color: '#dc3545' },
    { name: 'Pending', value: (dashboardData.total_interviews || 0) - (dashboardData.completed_interviews || 0), color: '#ffc107' }
  ];
  
  const MetricCard = ({ title, value, subtitle, trend, icon }) => (
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
      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{subtitle}</div>
      )}
      {trend && (
        <div style={{ 
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: trend === 'improving' ? '#28a745' : trend === 'declining' ? '#dc3545' : '#666',
          fontWeight: '500'
        }}>
          {trend === 'improving' ? '↗ Improving' : trend === 'declining' ? '↘ Declining' : '→ Stable'}
        </div>
      )}
    </div>
  );
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Interview Analytics</h1>
          <p style={{ color: '#666', margin: 0 }}>Track your performance and identify improvement areas</p>
        </div>
        
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <MetricCard
            title="Total Interviews"
            value={dashboardData.total_interviews}
            subtitle={`${dashboardData.completed_interviews} completed`}
            icon="📊"
          />
          <MetricCard
            title="Offer Conversion Rate"
            value={`${dashboardData.conversion_rate}%`}
            subtitle={`${dashboardData.offers_received} offers received`}
            trend={dashboardData.performance_trend}
            icon="🎯"
          />
          <MetricCard
            title="Success Rate"
            value={`${dashboardData.completed_interviews > 0 ? Math.round((dashboardData.offers_received / dashboardData.completed_interviews) * 100) : 0}%`}
            subtitle="Passed interviews"
            trend={dashboardData.performance_trend}
            icon="✅"
          />
          <MetricCard
            title="Avg Preparation"
            value={avgPreparation !== null ? `${avgPreparation}%` : 'N/A'}
            subtitle={avgPreparation !== null ? "Task completion rate" : "No data yet"}
            icon="📝"
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {trendData.length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Conversion Rate Trend</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="conversion_rate" stroke="#667eea" strokeWidth={3} dot={{ fill: '#667eea', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {categoryPerformance.length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Performance by Category</h2>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={categoryPerformance}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {formatData.length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Success Rate by Format</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={formatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#764ba2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Interview Outcomes</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💡</span> AI-Powered Insights
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ color: '#28a745', marginBottom: '0.75rem' }}>✓ Strengths</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                {dashboardData.strongest_areas?.length > 0 ? (
                  dashboardData.strongest_areas.map((area, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                      <strong>{area}</strong> interviews - consistently strong performance
                    </li>
                  ))
                ) : (
                  <li style={{ marginBottom: '0.5rem' }}>Complete more interviews to see your strengths</li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#dc3545', marginBottom: '0.75rem' }}>⚠ Areas for Improvement</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                {dashboardData.weakest_areas?.length > 0 ? (
                  dashboardData.weakest_areas.map((area, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                      <strong>{area}</strong> interviews - needs more practice
                    </li>
                  ))
                ) : (
                  <li style={{ marginBottom: '0.5rem' }}>No weak areas identified yet</li>
                )}
              </ul>
            </div>
          </div>
          
          {dashboardData.recommendations?.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0' }}>📌 Recommendations</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {dashboardData.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem', color: '#666' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {comparisonData && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Industry Benchmark Comparison</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Your Conversion Rate</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {comparisonData.user_conversion_rate?.toFixed(1) || '0.0'}%
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Industry Average</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#999' }}>
                  {comparisonData.benchmark_conversion_rate?.toFixed(1) || '25.0'}%
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem', 
                background: comparisonData.performance_vs_benchmark === 'above' ? '#d4edda' : '#f8d7da',
                borderRadius: '8px' 
              }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: comparisonData.performance_vs_benchmark === 'above' ? '#155724' : '#721c24',
                  marginBottom: '0.5rem' 
                }}>
                  Your Performance
                </div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: comparisonData.performance_vs_benchmark === 'above' ? '#28a745' : '#dc3545'
                }}>
                  {comparisonData.difference > 0 ? '+' : ''}{comparisonData.difference?.toFixed(1) || '0.0'}%
                </div>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: comparisonData.performance_vs_benchmark === 'above' ? '#155724' : '#721c24',
                  marginTop: '0.25rem' 
                }}>
                  {comparisonData.performance_vs_benchmark === 'above' ? 'Above average' : 'Below average'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewAnalytics;