import React, { useState, useEffect } from 'react';

// Mock API - replace with actual API import
const ApplicationWorkflowAPI = {
  getApplicationFunnel: () => Promise.resolve({
    data: {
      total_applications: 45,
      stage_counts: { applied: 45, screening: 12, interview: 8, offer: 3, rejected: 15 },
      conversion_rates: {
        applied_to_screening: 26.67,
        screening_to_interview: 66.67,
        interview_to_offer: 37.5,
        overall: 6.67
      },
      rejection_rate: 33.33
    }
  }),
  getResponseTimes: () => Promise.resolve({
    data: {
      overall: { average_days: 12.5, min_days: 3, max_days: 30, sample_size: 25 }
    }
  }),
  getSuccessRates: () => Promise.resolve({
    data: {
      overall: {
        total_applications: 45,
        interview_rate: 17.78,
        offer_rate: 6.67,
        interviews: 8,
        offers: 3
      }
    }
  }),
  getApplicationTrends: () => Promise.resolve({
    data: {
      total_applications: 45,
      time_period_days: 90,
      weekly_average: 5.0,
      weekly_breakdown: [
        ['2024-10-01', 6],
        ['2024-10-08', 5],
        ['2024-10-15', 4],
        ['2024-10-22', 7],
        ['2024-10-29', 5],
        ['2024-11-05', 6],
        ['2024-11-12', 4],
        ['2024-11-19', 5],
        ['2024-11-26', 3]
      ],
      by_status: { Applied: 20, Screening: 10, Interview: 8, Offer: 3, Rejected: 4 }
    }
  }),
  getOptimizationRecommendations: () => Promise.resolve({
    data: [
      {
        category: "materials",
        priority: "high",
        title: "Improve Application Materials",
        description: "Your interview rate (17.8%) is below average. Consider tailoring your resume and cover letter more closely to each position.",
        action: "Review and improve resume/cover letter quality"
      },
      {
        category: "volume",
        priority: "medium",
        title: "Increase Application Volume",
        description: "You're averaging 5 applications per week. Consider increasing to 10-15 per week to improve chances.",
        action: "Set a goal of 10+ applications per week"
      }
    ]
  }),
  getPerformanceBenchmarks: () => Promise.resolve({
    data: {
      user_metrics: {
        response_time_days: 12.5,
        interview_rate: 17.78,
        offer_rate: 6.67,
        weekly_applications: 5.0
      },
      industry_benchmarks: {
        average_response_time_days: 14,
        average_interview_rate: 15.0,
        average_offer_rate: 3.0,
        average_applications_per_week: 10
      },
      comparisons: {
        response_time_vs_benchmark: "faster",
        interview_rate_vs_benchmark: "above",
        offer_rate_vs_benchmark: "above",
        activity_vs_benchmark: "below"
      }
    }
  })
};

export default function AnalyticsDashboard() {
  const [funnel, setFunnel] = useState(null);
  const [responseTimes, setResponseTimes] = useState(null);
  const [successRates, setSuccessRates] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('90');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [funnelRes, responseRes, successRes, trendsRes, recsRes, benchRes] = await Promise.all([
        ApplicationWorkflowAPI.getApplicationFunnel(),
        ApplicationWorkflowAPI.getResponseTimes(),
        ApplicationWorkflowAPI.getSuccessRates(),
        ApplicationWorkflowAPI.getApplicationTrends(parseInt(timeRange)),
        ApplicationWorkflowAPI.getOptimizationRecommendations(),
        ApplicationWorkflowAPI.getPerformanceBenchmarks()
      ]);
      setFunnel(funnelRes.data);
      setResponseTimes(responseRes.data);
      setSuccessRates(successRes.data);
      setTrends(trendsRes.data);
      setRecommendations(recsRes.data || []);
      setBenchmarks(benchRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f0f0f0',
          borderTop: '4px solid #4f8ef7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#333', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          📊 Application Analytics
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            background: 'white'
          }}
        >
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          icon="📝"
          title="Total Applications"
          value={funnel?.total_applications || 0}
          subtitle="All time"
          color="#4f8ef7"
        />
        <MetricCard
          icon="📞"
          title="Interview Rate"
          value={`${successRates?.overall?.interview_rate || 0}%`}
          subtitle={`${successRates?.overall?.interviews || 0} interviews`}
          color="#34c759"
        />
        <MetricCard
          icon="🎯"
          title="Offer Rate"
          value={`${successRates?.overall?.offer_rate || 0}%`}
          subtitle={`${successRates?.overall?.offers || 0} offers`}
          color="#ff9500"
        />
        <MetricCard
          icon="⏱️"
          title="Avg Response Time"
          value={`${responseTimes?.overall?.average_days || 0} days`}
          subtitle={`${responseTimes?.overall?.sample_size || 0} responses`}
          color="#5856d6"
        />
      </div>

      {/* Performance Benchmarks */}
      {benchmarks && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '20px' }}>
            📈 Performance vs Industry Benchmarks
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <BenchmarkComparison
              metric="Interview Rate"
              yourValue={benchmarks.user_metrics.interview_rate}
              benchmark={benchmarks.industry_benchmarks.average_interview_rate}
              comparison={benchmarks.comparisons.interview_rate_vs_benchmark}
              unit="%"
            />
            <BenchmarkComparison
              metric="Offer Rate"
              yourValue={benchmarks.user_metrics.offer_rate}
              benchmark={benchmarks.industry_benchmarks.average_offer_rate}
              comparison={benchmarks.comparisons.offer_rate_vs_benchmark}
              unit="%"
            />
            <BenchmarkComparison
              metric="Response Time"
              yourValue={benchmarks.user_metrics.response_time_days}
              benchmark={benchmarks.industry_benchmarks.average_response_time_days}
              comparison={benchmarks.comparisons.response_time_vs_benchmark}
              unit=" days"
              lowerIsBetter={true}
            />
            <BenchmarkComparison
              metric="Weekly Applications"
              yourValue={benchmarks.user_metrics.weekly_applications}
              benchmark={benchmarks.industry_benchmarks.average_applications_per_week}
              comparison={benchmarks.comparisons.activity_vs_benchmark}
              unit=""
            />
          </div>
        </div>
      )}

      {/* Application Funnel */}
      {funnel && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '20px' }}>
            🎯 Application Funnel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(funnel.stage_counts).map(([stage, count]) => {
              const percentage = (count / funnel.total_applications) * 100;
              const isRejected = stage === 'rejected';
              return (
                <div key={stage}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <span style={{
                      textTransform: 'capitalize',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {stage}
                    </span>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '32px',
                    background: '#f5f5f5',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: isRejected
                        ? 'linear-gradient(90deg, #ff3b30, #ff6b60)'
                        : 'linear-gradient(90deg, #4f8ef7, #6fa3ff)',
                      transition: 'width 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>
                      {percentage > 15 && `${count}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Rates */}
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
              Conversion Rates
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <ConversionRate
                label="Applied → Screening"
                rate={funnel.conversion_rates.applied_to_screening}
              />
              <ConversionRate
                label="Screening → Interview"
                rate={funnel.conversion_rates.screening_to_interview}
              />
              <ConversionRate
                label="Interview → Offer"
                rate={funnel.conversion_rates.interview_to_offer}
              />
              <ConversionRate
                label="Overall Success"
                rate={funnel.conversion_rates.overall}
                highlight={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Application Trends */}
      {trends && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '20px' }}>
            📈 Application Trends
          </h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Weekly Average: <strong style={{ color: '#4f8ef7', fontSize: '18px' }}>
              {trends.weekly_average}
            </strong> applications
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '6px',
            height: '220px',
            padding: '10px',
            background: '#fafafa',
            borderRadius: '8px'
          }}>
            {trends.weekly_breakdown.map(([week, count]) => {
              const maxCount = Math.max(...trends.weekly_breakdown.map(w => w[1]));
              const height = (count / maxCount) * 180;
              return (
                <div key={week} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#4f8ef7'
                  }}>
                    {count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${height}px`,
                      background: 'linear-gradient(180deg, #4f8ef7, #6fa3ff)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      minHeight: '4px'
                    }}
                    title={`${count} applications`}
                  />
                  <span style={{
                    fontSize: '9px',
                    color: '#999',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    whiteSpace: 'nowrap'
                  }}>
                    {new Date(week).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '20px' }}>
            💡 Optimization Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  background: rec.priority === 'high' ? '#fff8e1' : '#e3f2fd',
                  borderLeft: `4px solid ${rec.priority === 'high' ? '#ff9500' : '#4f8ef7'}`,
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
                    {rec.title}
                  </h4>
                  <span style={{
                    padding: '4px 12px',
                    background: rec.priority === 'high' ? '#ff9500' : '#4f8ef7',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {rec.priority}
                  </span>
                </div>
                <p style={{
                  color: '#666',
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {rec.description}
                </p>
                <div style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#555'
                }}>
                  <strong>💪 Action:</strong> {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MetricCard = ({ icon, title, value, subtitle, color }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
    <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
    <div style={{
      fontSize: '32px',
      fontWeight: 'bold',
      color,
      marginBottom: '8px',
      lineHeight: '1'
    }}>
      {value}
    </div>
    <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px', fontWeight: '600' }}>
      {title}
    </div>
    <div style={{ color: '#999', fontSize: '12px' }}>{subtitle}</div>
  </div>
);

const BenchmarkComparison = ({ metric, yourValue, benchmark, comparison, unit, lowerIsBetter = false }) => {
  const isAbove = lowerIsBetter
    ? (comparison === 'faster' || comparison === 'below')
    : (comparison === 'above');
  const percentDiff = ((yourValue - benchmark) / benchmark) * 100;

  return (
    <div style={{
      padding: '16px',
      background: '#fafafa',
      borderRadius: '6px',
      border: `2px solid ${isAbove ? '#d4edda' : '#f8d7da'}`
    }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{metric}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          {yourValue}{unit}
        </span>
        <span style={{ fontSize: '12px', color: '#999' }}>
          vs {benchmark}{unit}
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: isAbove ? '#155724' : '#721c24'
      }}>
        <span>{isAbove ? '↑' : '↓'}</span>
        <span>{Math.abs(percentDiff).toFixed(1)}% {isAbove ? 'above' : 'below'} average</span>
      </div>
    </div>
  );
};

const ConversionRate = ({ label, rate, highlight = false }) => (
  <div style={{
    padding: '12px',
    background: highlight ? '#e3f2fd' : '#fafafa',
    borderRadius: '6px',
    border: highlight ? '2px solid #4f8ef7' : '1px solid #e0e0e0'
  }}>
    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{label}</div>
    <div style={{
      fontSize: '24px',
      fontWeight: 'bold',
      color: highlight ? '#4f8ef7' : '#333'
    }}>
      {rate.toFixed(1)}%
    </div>
  </div>
);