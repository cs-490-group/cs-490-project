import React, { useState, useEffect } from "react";
import goalsAPI from "../../api/goals";
import GoalModal from "./GoalModal";

const GoalTracking = () => {
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    loadGoalData();
  }, [refreshTrigger]);

  const loadGoalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsAPI.getAnalytics();
      setGoalData(response.data);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError(err.response?.data?.detail || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMilestone = async (goalId, milestoneId, currentStatus) => {
    try {
      await goalsAPI.toggleMilestone(goalId, milestoneId, !currentStatus);
      // Refresh data after successful toggle
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error toggling milestone:', err);
      alert('Failed to update milestone');
    }
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (editingGoal) {
        // Update existing goal
        await goalsAPI.update(editingGoal._id, goalData);
      } else {
        // Create new goal
        await goalsAPI.add(goalData);
      }
      setRefreshTrigger(prev => prev + 1);
      setShowModal(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw error; // Let modal handle the error display
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }
    
    try {
      await goalsAPI.delete(goalId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Goal Tracking & Achievement</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Goal Tracking & Achievement</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc3545' }}>
          <p>Error: {error}</p>
          <button 
            onClick={loadGoalData}
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              cursor: 'pointer',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!goalData || !goalData.goals) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Goal Tracking & Achievement</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No goals found. Start by adding your first goal!</p>
          <button 
            className="goal-add-button"
            onClick={handleAddGoal}
            style={{ marginTop: '1rem' }}
          >
            + Add Your First Goal
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#28a745";
      case "in-progress": return "#007bff";
      case "at-risk": return "#ffc107";
      case "overdue": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed": return "Completed";
      case "in-progress": return "In Progress";
      case "at-risk": return "At Risk";
      case "overdue": return "Overdue";
      default: return "Not Started";
    }
  };

  const calculateDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="analyticsDashboard-content">
      <h2>Goal Tracking & Achievement</h2>
      
      {/* Stats Overview */}
      <div className="goal-stats-grid">
        <div className="goal-stat-card">
          <div className="goal-stat-label">Total Goals</div>
          <div className="goal-stat-value">{goalData.stats.totalGoals}</div>
        </div>
        <div className="goal-stat-card">
          <div className="goal-stat-label">Active Goals</div>
          <div className="goal-stat-value">{goalData.stats.activeGoals}</div>
        </div>
        <div className="goal-stat-card">
          <div className="goal-stat-label">Completed</div>
          <div className="goal-stat-value success">{goalData.stats.completedGoals}</div>
        </div>
        <div className="goal-stat-card">
          <div className="goal-stat-label">Avg Progress</div>
          <div className="goal-stat-value">{goalData.stats.averageProgress}%</div>
        </div>
      </div>

      {/* Goals List */}
      <div className="goals-section">
        <div className="goals-header">
          <h3>Your Career Goals</h3>
          <button className="goal-add-button" onClick={handleAddGoal}>+ Add New Goal</button>
        </div>

        <div className="goals-list">
          {goalData.goals.map((goal) => {
            const daysRemaining = calculateDaysRemaining(goal.target_date);
            const completedMilestones = goal.milestones?.filter(m => m.completed).length || 0;
            const totalMilestones = goal.milestones?.length || 0;

            return (
              <div key={goal._id} className="goal-card">
                <div className="goal-card-header">
                  <div className="goal-title-section">
                    <h4 className="goal-title">{goal.title}</h4>
                    <span className={`goal-type-badge ${goal.type}`}>
                      {goal.type === "short-term" ? "Short-term" : "Long-term"}
                    </span>
                    <span 
                      className="goal-status-badge" 
                      style={{ backgroundColor: getStatusColor(goal.status) }}
                    >
                      {getStatusLabel(goal.status)}
                    </span>
                  </div>
                  <div className="goal-meta">
                    <span className="goal-category">📁 {goal.category || 'General'}</span>
                    <div className="goal-actions">
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="goal-action-btn goal-edit-btn"
                        title="Edit goal"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="goal-action-btn goal-delete-btn"
                        title="Delete goal"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="goal-card-body">
                  {goal.metrics && (
                    <div className="goal-metrics">
                      <strong>Success Metric:</strong> {goal.metrics}
                    </div>
                  )}

                  <div className="goal-progress-section">
                    <div className="goal-progress-header">
                      <span>Progress: {goal.progress}%</span>
                      <span className="goal-deadline">
                        {goal.status === "completed" 
                          ? "✓ Completed" 
                          : daysRemaining !== null && daysRemaining > 0 
                            ? `${daysRemaining} days remaining`
                            : daysRemaining !== null && daysRemaining <= 0
                            ? "Overdue"
                            : "No deadline set"}
                      </span>
                    </div>
                    <div className="goal-progress-bar">
                      <div 
                        className="goal-progress-fill" 
                        style={{ 
                          width: `${goal.progress}%`,
                          backgroundColor: getStatusColor(goal.status)
                        }}
                      />
                    </div>
                  </div>

                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="goal-milestones">
                      <div className="milestones-header">
                        <strong>Milestones</strong>
                        <span className="milestones-count">
                          {completedMilestones}/{totalMilestones} completed
                        </span>
                      </div>
                      <ul className="milestones-list">
                        {goal.milestones.map((milestone, idx) => (
                          <li 
                            key={milestone._id || idx} 
                            className={milestone.completed ? "completed" : ""}
                            onClick={() => handleToggleMilestone(goal._id, milestone._id, milestone.completed)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="milestone-checkbox">
                              {milestone.completed ? "✓" : "○"}
                            </span>
                            <span className="milestone-name">{milestone.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Section */}
      {goalData.insights && goalData.insights.length > 0 && (
        <div className="goal-insights">
          <h3>📊 Insights & Recommendations</h3>
          <ul className="goal-insights-list">
            {goalData.insights.map((insight, idx) => (
              <li key={idx}>
                <span className="insight-bullet">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievement Summary */}
      <div className="achievement-summary">
        <div className="achievement-icon">🏆</div>
        <div className="achievement-text">
          <h4>Keep up the great work!</h4>
          <p>
            You're making solid progress on your career goals. 
            {goalData.stats.completedGoals > 0 && ` You've completed ${goalData.stats.completedGoals} goal${goalData.stats.completedGoals > 1 ? 's' : ''} so far!`}
          </p>
        </div>
      </div>

      {/* Goal Modal */}
      {showModal && (
        <GoalModal
          goal={editingGoal}
          onSave={handleSaveGoal}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default GoalTracking;