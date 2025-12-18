import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, AlertCircle, Award, Zap, ArrowUp, ArrowDown, Briefcase, Users, Download, Plus, CheckCircle, X } from 'lucide-react';
import ApplicationWorkflowAPI from '../../api/applicationWorkflow';
import JobsAPI from '../../api/jobs';
import posthog from 'posthog-js';

export default function AnalyticsDashboard() {
  const [funnel, setFunnel] = useState(null);
  const [responseTimes, setResponseTimes] = useState(null);
  const [successRates, setSuccessRates] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('90');
  const [error, setError] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'applications_per_week',
    target_value: 10,
    description: ''
  });
  const [editingGoal, setEditingGoal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Additional analytics from jobs data
  const [industryBreakdown, setIndustryBreakdown] = useState({});
  const [jobTypeBreakdown, setJobTypeBreakdown] = useState({});
  const [statusDistribution, setStatusDistribution] = useState({});

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the imported API classes instead of direct fetch calls
      const [funnelRes, responseRes, successRes, trendsRes, recsRes, benchRes, jobsRes, goalsRes] = await Promise.all([
        ApplicationWorkflowAPI.getApplicationFunnel(),
        ApplicationWorkflowAPI.getResponseTimes(),
        ApplicationWorkflowAPI.getSuccessRates(),
        ApplicationWorkflowAPI.getApplicationTrends(parseInt(timeRange)),
        ApplicationWorkflowAPI.getOptimizationRecommendations(),
        ApplicationWorkflowAPI.getPerformanceBenchmarks(),
        JobsAPI.getAll(),
        ApplicationWorkflowAPI.getGoals()
      ]);
      
      // Extract data from axios responses
      setFunnel(funnelRes.data);
      setResponseTimes(responseRes.data);
      setSuccessRates(successRes.data);
      setTrends(trendsRes.data);
      setRecommendations(recsRes.data || []);
      setBenchmarks(benchRes.data);
      setJobs(jobsRes.data || []);
      setGoals(goalsRes.data || []);

      // Process jobs data for additional insights
      processJobsData(jobsRes.data || []);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processJobsData = (jobsData) => {
    // Industry breakdown
    const industries = {};
    const jobTypes = {};
    const statuses = {};

    jobsData.forEach(job => {
      // Count by industry
      const industry = job.industry || 'Unknown';
      industries[industry] = (industries[industry] || 0) + 1;

      // Count by job type
      const jobType = job.job_type || 'Unknown';
      jobTypes[jobType] = (jobTypes[jobType] || 0) + 1;

      // Count by status - normalize status to lowercase
      const status = (job.status || 'applied').toLowerCase();
      statuses[status] = (statuses[status] || 0) + 1;
    });

    setIndustryBreakdown(industries);
    setJobTypeBreakdown(jobTypes);
    setStatusDistribution(statuses);
  };

  const handleCreateGoal = async () => {
    try {
      await ApplicationWorkflowAPI.createGoal(newGoal);
      setShowGoalModal(false);
      setNewGoal({ goal_type: 'applications_per_week', target_value: 10, description: '' });
      await loadAnalytics();
      posthog.capture('goal_created', { goal_type: newGoal.goal_type });
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleUpdateGoal = async () => {
    try {
      await ApplicationWorkflowAPI.updateGoal(editingGoal._id, {
        goal_type: editingGoal.goal_type,
        target_value: editingGoal.target_value,
        description: editingGoal.description
      });
      setEditingGoal(null);
      await loadAnalytics();
      posthog.capture('goal_updated', { goal_id: editingGoal._id });
    } catch (error) {
      console.error('Failed to update goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await ApplicationWorkflowAPI.deleteGoal(goalId);
      setShowDeleteConfirm(null);
      await loadAnalytics();
      posthog.capture('goal_deleted', { goal_id: goalId });
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };
  
  const calculateGoalProgress = (goal) => {
    switch(goal.goal_type) {
      case 'applications_per_week':
        return trends ? (trends.weekly_average / goal.target_value) * 100 : 0;
      case 'interview_rate':
        return successRates?.overall ? (successRates.overall.interview_rate / goal.target_value) * 100 : 0;
      case 'offer_rate':
        return successRates?.overall ? (successRates.overall.offer_rate / goal.target_value) * 100 : 0;
      default:
        return 0;
    }
  };

  const exportToCSV = () => {
    try {
      // Prepare funnel data
      const funnelCSV = [
        ['Application Funnel Analytics'],
        ['Stage', 'Count', 'Percentage'],
        ...Object.entries(funnel?.stage_counts || {}).map(([stage, count]) => [
          stage,
          count,
          `${((count / (funnel?.total_applications || 1)) * 100).toFixed(1)}%`
        ]),
        [],
        ['Conversion Rates'],
        ['Metric', 'Rate'],
        ['Applied to Screening', `${funnel?.conversion_rates?.applied_to_screening || 0}%`],
        ['Screening to Interview', `${funnel?.conversion_rates?.screening_to_interview || 0}%`],
        ['Interview to Offer', `${funnel?.conversion_rates?.interview_to_offer || 0}%`],
        ['Overall Success', `${funnel?.conversion_rates?.overall || 0}%`],
        [],
      ];

      // Prepare benchmarks data
      const benchmarksCSV = [
        ['Performance Benchmarks'],
        ['Metric', 'Your Value', 'Industry Average', 'Comparison'],
        ['Interview Rate', `${benchmarks?.user_metrics?.interview_rate || 0}%`, `${benchmarks?.industry_benchmarks?.average_interview_rate || 0}%`, benchmarks?.comparisons?.interview_rate_vs_benchmark || '-'],
        ['Offer Rate', `${benchmarks?.user_metrics?.offer_rate || 0}%`, `${benchmarks?.industry_benchmarks?.average_offer_rate || 0}%`, benchmarks?.comparisons?.offer_rate_vs_benchmark || '-'],
        ['Response Time', `${benchmarks?.user_metrics?.response_time_days || 0} days`, `${benchmarks?.industry_benchmarks?.average_response_time_days || 0} days`, benchmarks?.comparisons?.response_time_vs_benchmark || '-'],
        ['Weekly Applications', benchmarks?.user_metrics?.weekly_applications || 0, benchmarks?.industry_benchmarks?.average_applications_per_week || 0, benchmarks?.comparisons?.activity_vs_benchmark || '-'],
        [],
      ];

      // Prepare trends data
      const trendsCSV = [
        ['Application Trends'],
        ['Week', 'Applications'],
        ...((trends?.weekly_breakdown || []).map(([week, count]) => [
          new Date(week).toLocaleDateString(),
          count
        ])),
        [],
        ['Weekly Average', trends?.weekly_average || 0],
        [],
      ];

      // Prepare industry breakdown
      const industryCSV = [
        ['Industry Breakdown'],
        ['Industry', 'Count', 'Percentage'],
        ...Object.entries(industryBreakdown).map(([industry, count]) => [
          industry,
          count,
          `${((count / jobs.length) * 100).toFixed(1)}%`
        ]),
        [],
      ];

      // Prepare job type breakdown
      const jobTypeCSV = [
        ['Job Type Breakdown'],
        ['Type', 'Count', 'Percentage'],
        ...Object.entries(jobTypeBreakdown).map(([type, count]) => [
          type,
          count,
          `${((count / jobs.length) * 100).toFixed(1)}%`
        ]),
        [],
      ];

      // Prepare goals data
      const goalsCSV = [
        ['Goals & Progress'],
        ['Goal Type', 'Target Value', 'Current Progress', 'Status'],
        ...goals.map(goal => {
          const progress = calculateGoalProgress(goal);
          return [
            goal.goal_type.replace(/_/g, ' '),
            goal.target_value,
            `${progress.toFixed(1)}%`,
            progress >= 100 ? 'Completed' : 'In Progress'
          ];
        }),
        [],
      ];

      // Combine all data
      const allData = [
        ...funnelCSV,
        ...benchmarksCSV,
        ...trendsCSV,
        ...industryCSV,
        ...jobTypeCSV,
        ...goalsCSV,
        ['Generated on', new Date().toLocaleString()]
      ];

      // Convert to CSV string
      const csvContent = allData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `application_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export analytics. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #4f8ef7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666', fontSize: '14px' }}>Loading analytics...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <AlertCircle size={48} color="#ff3b30" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#333', marginBottom: '8px' }}>Failed to Load Analytics</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={loadAnalytics}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ 
            color: '#333', 
            margin: '0 0 8px 0', 
            fontSize: '32px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <BarChart3 size={36} color="#4f8ef7" />
            Application Analytics
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Track your job search performance and get optimization insights
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={exportToCSV}
            style={{
              padding: '12px 16px',
              background: '#34c759',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            Export Report
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white',
              fontWeight: '500'
            }}
            aria-label="Select date range"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          icon={<Briefcase size={32} />}
          title="Total Applications"
          value={funnel?.total_applications || 0}
          subtitle="All time"
          color="#4f8ef7"
        />
        <MetricCard
          icon={<Users size={32} />}
          title="Interview Rate"
          value={`${successRates?.overall?.interview_rate?.toFixed(1) || 0}%`}
          subtitle={`${successRates?.overall?.interviews || 0} interviews`}
          color="#34c759"
        />
        <MetricCard
          icon={<Award size={32} />}
          title="Offer Rate"
          value={`${successRates?.overall?.offer_rate?.toFixed(1) || 0}%`}
          subtitle={`${successRates?.overall?.offers || 0} offers`}
          color="#ff9500"
        />
        <MetricCard
          icon={<Clock size={32} />}
          title="Avg Response Time"
          value={`${responseTimes?.overall?.average_days || 0} days`}
          subtitle={`${responseTimes?.overall?.sample_size || 0} responses`}
          color="#5856d6"
        />
      </div>

      {/* Goal Tracking Section */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ 
            color: '#333', 
            margin: 0,
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target size={24} color="#34c759" />
            Goals & Progress
          </h3>
          <button
            onClick={() => setShowGoalModal(true)}
            style={{
              padding: '10px 16px',
              background: '#34c759',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            New Goal
          </button>
        </div>

       {goals.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No goals set yet. Create your first goal to track your progress!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {goals.map((goal) => {
              const progress = calculateGoalProgress(goal);
              const isComplete = progress >= 100;
              const isEditing = editingGoal && editingGoal._id === goal._id;
              
              return (
                <div
                  key={goal._id}
                  style={{
                    padding: '16px',
                    background: isComplete ? '#e8f5e9' : '#fafafa',
                    borderRadius: '8px',
                    border: `2px solid ${isComplete ? '#34c759' : '#e0e0e0'}`
                  }}
                >
                  {isEditing ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          Goal Type
                        </label>
                        <select
                          value={editingGoal.goal_type}
                          onChange={(e) => setEditingGoal({ ...editingGoal, goal_type: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}
                          aria-label="Select goal type"
                        >
                          <option value="applications_per_week">Applications Per Week</option>
                          <option value="interview_rate">Interview Rate (%)</option>
                          <option value="offer_rate">Offer Rate (%)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          Target Value
                        </label>
                        <input
                          type="number"
                          value={editingGoal.target_value}
                          onChange={(e) => setEditingGoal({ ...editingGoal, target_value: parseFloat(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}
                          aria-label="Enter target value"
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          Description
                        </label>
                        <textarea
                          value={editingGoal.description || ''}
                          onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setEditingGoal(null)}
                          style={{
                            padding: '8px 16px',
                            background: '#e0e0e0',
                            color: '#333',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateGoal}
                          className="btn btn-primary"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '16px' }}>
                            {goal.goal_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          {goal.description && (
                            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{goal.description}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isComplete && <CheckCircle size={24} color="#34c759" />}
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className="btn btn-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(goal._id)}
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: '#666' }}>Progress</span>
                          <span style={{ fontWeight: '600', color: isComplete ? '#34c759' : '#333' }}>
                            {Math.min(progress, 100).toFixed(1)}% of {goal.target_value}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '12px',
                          background: '#e0e0e0',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(progress, 100)}%`,
                            height: '100%',
                            background: isComplete 
                              ? 'linear-gradient(90deg, #34c759, #5ed77e)'
                              : 'linear-gradient(90deg, #4f8ef7, #6fa3ff)',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Create New Goal</h3>
              <button
                onClick={() => setShowGoalModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Goal Type
                </label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  aria-label="Select goal type"
                >
                  <option value="applications_per_week">Applications Per Week</option>
                  <option value="interview_rate">Interview Rate (%)</option>
                  <option value="offer_rate">Offer Rate (%)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Target Value
                </label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  aria-label="Enter target value"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="What do you want to achieve?"
                />
              </div>

              <button
                onClick={handleCreateGoal}
                style={{
                  padding: '12px',
                  background: '#34c759',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#333' }}>Delete Goal?</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGoal(showDeleteConfirm)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}`
      {/* Industry & Job Type Breakdown */}
      {(Object.keys(industryBreakdown).length > 0 || Object.keys(jobTypeBreakdown).length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Industry Breakdown */}
          {Object.keys(industryBreakdown).length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                color: '#333', 
                marginBottom: '16px', 
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Briefcase size={20} color="#4f8ef7" />
                Applications by Industry
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(industryBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([industry, count]) => {
                    const percentage = ((count / jobs.length) * 100).toFixed(1);
                    return (
                      <div key={industry}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                            {industry}
                          </span>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #4f8ef7, #6fa3ff)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Job Type Breakdown */}
          {Object.keys(jobTypeBreakdown).length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                color: '#333', 
                marginBottom: '16px', 
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Target size={20} color="#34c759" />
                Applications by Type
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(jobTypeBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const percentage = ((count / jobs.length) * 100).toFixed(1);
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                            {type}
                          </span>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #34c759, #5ed77e)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

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
          <h3 style={{ 
            color: '#333', 
            marginBottom: '16px', 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <TrendingUp size={24} color="#4f8ef7" />
            Performance vs Industry Benchmarks
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
          <h3 style={{ 
            color: '#333', 
            marginBottom: '16px', 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target size={24} color="#4f8ef7" />
            Application Funnel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(funnel.stage_counts).map(([stage, count]) => {
              const percentage = funnel.total_applications > 0 ? (count / funnel.total_applications) * 100 : 0;
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
                      fontSize: '14px',
                      color: '#333'
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
      {trends && trends.weekly_breakdown && trends.weekly_breakdown.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            color: '#333', 
            marginBottom: '16px', 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <TrendingUp size={24} color="#4f8ef7" />
            Application Trends
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
            borderRadius: '8px',
            overflowX: 'auto'
          }}>
            {trends.weekly_breakdown.map(([week, count]) => {
              const maxCount = Math.max(...trends.weekly_breakdown.map(w => w[1]), 1);
              const height = (count / maxCount) * 180;
              return (
                <div key={week} style={{
                  flex: 1,
                  minWidth: '40px',
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
                      height: `${Math.max(height, 4)}px`,
                      background: 'linear-gradient(180deg, #4f8ef7, #6fa3ff)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
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
          <h3 style={{ 
            color: '#333', 
            marginBottom: '16px', 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Zap size={24} color="#ff9500" />
            Optimization Recommendations
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
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <h4 style={{ margin: 0, color: '#333', fontSize: '16px', fontWeight: '600' }}>
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

// Helper Components
const MetricCard = ({ icon, title, value, subtitle, color }) => (
  <div style={{
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '12px',
      color: color
    }}>
      {icon}
    </div>
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
  const percentDiff = benchmark > 0 ? ((yourValue - benchmark) / benchmark) * 100 : 0;

  return (
    <div style={{
      padding: '16px',
      background: '#fafafa',
      borderRadius: '6px',
      border: `2px solid ${isAbove ? '#d4edda' : '#f8d7da'}`
    }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
        {metric}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
        {isAbove ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
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
    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
      {label}
    </div>
    <div style={{
      fontSize: '24px',
      fontWeight: 'bold',
      color: highlight ? '#4f8ef7' : '#333'
    }}>
      {rate?.toFixed(1) || 0}%
    </div>
  </div>
);