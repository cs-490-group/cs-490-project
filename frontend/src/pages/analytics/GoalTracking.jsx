import React, { useState } from "react";

const GoalTracking = () => {
  // Dummy data structured for easy backend integration
  // Backend would return: { goals, stats, insights }
  const [goalData] = useState({
    goals: [
      {
        id: 1,
        title: "Complete AWS Certification",
        category: "Skills Development",
        type: "short-term",
        targetDate: "2025-03-15",
        progress: 65,
        status: "in-progress",
        metrics: "Pass exam with 80%+ score",
        milestones: [
          { name: "Complete coursework", completed: true },
          { name: "Practice exams", completed: true },
          { name: "Schedule exam", completed: false },
          { name: "Pass certification", completed: false },
        ]
      },
      {
        id: 2,
        title: "Land Senior Developer Role",
        category: "Career Advancement",
        type: "long-term",
        targetDate: "2025-12-31",
        progress: 40,
        status: "in-progress",
        metrics: "Secure position at target company",
        milestones: [
          { name: "Update resume", completed: true },
          { name: "Apply to 10 positions", completed: true },
          { name: "Complete 5 interviews", completed: false },
          { name: "Receive offer", completed: false },
        ]
      },
      {
        id: 3,
        title: "Build Professional Network",
        category: "Networking",
        type: "long-term",
        targetDate: "2025-06-30",
        progress: 55,
        status: "in-progress",
        metrics: "Connect with 50 industry professionals",
        milestones: [
          { name: "Attend 3 meetups", completed: true },
          { name: "Connect with 25 people", completed: true },
          { name: "Connect with 50 people", completed: false },
          { name: "Schedule coffee chats", completed: false },
        ]
      },
      {
        id: 4,
        title: "Contribute to Open Source",
        category: "Skills Development",
        type: "short-term",
        targetDate: "2025-02-28",
        progress: 100,
        status: "completed",
        metrics: "Make 10 meaningful contributions",
        milestones: [
          { name: "Find projects", completed: true },
          { name: "First PR merged", completed: true },
          { name: "10 PRs merged", completed: true },
          { name: "Become regular contributor", completed: true },
        ]
      },
    ],
    stats: {
      totalGoals: 4,
      activeGoals: 3,
      completedGoals: 1,
      averageProgress: 65,
      onTrackGoals: 3,
      completionRate: 25,
    },
    insights: [
      "You've completed 75% of your short-term goals milestones",
      "Career advancement goals are progressing well - on track for target dates",
      "Consider setting a new skill development goal to maintain momentum",
    ]
  });

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
          <button className="goal-add-button">+ Add New Goal</button>
        </div>

        <div className="goals-list">
          {goalData.goals.map((goal) => {
            const daysRemaining = calculateDaysRemaining(goal.targetDate);
            const completedMilestones = goal.milestones.filter(m => m.completed).length;
            const totalMilestones = goal.milestones.length;

            return (
              <div key={goal.id} className="goal-card">
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
                    <span className="goal-category">📁 {goal.category}</span>
                  </div>
                </div>

                <div className="goal-card-body">
                  <div className="goal-metrics">
                    <strong>Success Metric:</strong> {goal.metrics}
                  </div>

                  <div className="goal-progress-section">
                    <div className="goal-progress-header">
                      <span>Progress: {goal.progress}%</span>
                      <span className="goal-deadline">
                        {goal.status === "completed" 
                          ? "✓ Completed" 
                          : daysRemaining > 0 
                            ? `${daysRemaining} days remaining`
                            : "Overdue"}
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

                  <div className="goal-milestones">
                    <div className="milestones-header">
                      <strong>Milestones</strong>
                      <span className="milestones-count">
                        {completedMilestones}/{totalMilestones} completed
                      </span>
                    </div>
                    <ul className="milestones-list">
                      {goal.milestones.map((milestone, idx) => (
                        <li key={idx} className={milestone.completed ? "completed" : ""}>
                          <span className="milestone-checkbox">
                            {milestone.completed ? "✓" : "○"}
                          </span>
                          <span className="milestone-name">{milestone.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Section */}
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
    </div>
  );
};

export default GoalTracking;