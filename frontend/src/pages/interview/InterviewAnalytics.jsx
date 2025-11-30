import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

function InterviewAnalytics() {
  const [timeframe, setTimeframe] = useState(90);
  
  const dashboardData = {
    total_interviews: 24,
    completed_interviews: 18,
    pending_interviews: 3,
    passed_interviews: 12,
    rejected_interviews: 6,
    offer_conversion_rate: 66.67,
    format_performance: {
      video: 75.0,
      phone: 60.0,
      'in-person': 70.0
    },
    strongest_areas: ['behavioral', 'company'],
    weakest_areas: ['technical'],
    performance_trend: 'improving',
    recommendations: [
      'Focus on technical interview preparation',
      'Continue practicing behavioral questions - you excel here',
      'Consider more mock interviews for technical roles'
    ]
  };
  
  const trendData = [
    { month: 'Jul', rate: 50 },
    { month: 'Aug', rate: 58 },
    { month: 'Sep', rate: 62 },
    { month: 'Oct', rate: 67 },
    { month: 'Nov', rate: 71 }
  ];
  
  const categoryPerformance = [
    { category: 'Behavioral', score: 85 },
    { category: 'Technical', score: 55 },
    { category: 'Situational', score: 72 },
    { category: 'Company', score: 80 },
    { category: 'Leadership', score: 68 }
  ];
  
  const formatData = [
    { name: 'Video', value: 10, rate: 75 },
    { name: 'Phone', value: 5, rate: 60 },
    { name: 'In-Person', value: 3, rate: 70 }
  ];
  
  const outcomeData = [
    { name: 'Offers', value: 12, color: '#28a745' },
    { name: 'Rejected', value: 6, color: '#dc3545' },
    { name: 'Pending', value: 3, color: '#ffc107' }
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
          color: trend === 'up' ? '#28a745' : trend === 'down' ? '#dc3545' : '#666',
          fontWeight: '500'
        }}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
        </div>
      )}
    </div>
  );
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Interview Analytics</h1>
          <p style={{ color: '#666', margin: 0 }}>Track your performance and identify improvement areas</p>
        </div>
        
        {/* Timeframe Selector */}
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
        
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <MetricCard
            title="Total Interviews"
            value={dashboardData.total_interviews}
            subtitle={`${dashboardData.completed_interviews} completed`}
            icon="📊"
          />
          <MetricCard
            title="Offer Conversion Rate"
            value={`${dashboardData.offer_conversion_rate}%`}
            subtitle={`${dashboardData.passed_interviews} offers received`}
            trend="up"
            icon="🎯"
          />
          <MetricCard
            title="Success Rate"
            value={`${Math.round((dashboardData.passed_interviews / dashboardData.completed_interviews) * 100)}%`}
            subtitle="Passed interviews"
            trend="up"
            icon="✅"
          />
          <MetricCard
            title="Avg Preparation"
            value="87%"
            subtitle="Task completion rate"
            icon="📝"
          />
        </div>
        
        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Trend Chart */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Conversion Rate Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#667eea" strokeWidth={3} dot={{ fill: '#667eea', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Performance Radar */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Performance by Category</h3>
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
          
          {/* Format Success Rate */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Success Rate by Format</h3>
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
          
          {/* Outcome Distribution */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Interview Outcomes</h3>
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
        
        {/* Insights Panel */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💡</span> AI-Powered Insights
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ color: '#28a745', marginBottom: '0.75rem' }}>✓ Strengths</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                {dashboardData.strongest_areas.map((area, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                    <strong>{area}</strong> interviews - consistently strong performance
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#dc3545', marginBottom: '0.75rem' }}>⚠ Areas for Improvement</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                {dashboardData.weakest_areas.map((area, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                    <strong>{area}</strong> interviews - needs more practice
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.75rem 0' }}>📌 Recommendations</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {dashboardData.recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', color: '#666' }}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Comparison with Benchmarks */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Industry Benchmark Comparison</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Your Conversion Rate</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>66.7%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Industry Average</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#999' }}>25.0%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#155724', marginBottom: '0.5rem' }}>Your Performance</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>+41.7%</div>
              <div style={{ fontSize: '0.85rem', color: '#155724', marginTop: '0.25rem' }}>Above average</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewAnalytics;