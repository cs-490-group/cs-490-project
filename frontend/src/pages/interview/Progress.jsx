import React, { useState, useEffect } from "react";
import QuestionBankAPI from "../../api/questionBank";
import "../../styles/progress.css";

function Progress() {
  const [stats, setStats] = useState({
    totalQuestionsViewed: 0,
    totalQuestionsPracticed: 0,
    totalResponsesSaved: 0,
    byCategory: {},
    byDifficulty: {},
    byRole: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressStats();
  }, []);

  const loadProgressStats = async () => {
    try {
      // Try to load from API
      const response = await QuestionBankAPI.getPracticedQuestions();
      const practiceHistory = response.data || response || [];

      if (Array.isArray(practiceHistory) && practiceHistory.length > 0) {
        // Calculate statistics
        const stats = {
          totalQuestionsViewed: practiceHistory.length,
          totalQuestionsPracticed: practiceHistory.filter(
            (q) => q.is_marked_practiced
          ).length,
          totalResponsesSaved: practiceHistory.filter(
            (q) => q.response_html
          ).length,
          byCategory: {},
          byDifficulty: {},
          byRole: {},
        };

        // Group by category
        practiceHistory.forEach((q) => {
          const category = q.category || "Unknown";
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

          const difficulty = q.difficulty || "Unknown";
          stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;

          const role = q.role_name || "Unknown";
          stats.byRole[role] = (stats.byRole[role] || 0) + 1;
        });

        setStats(stats);
      }
    } catch (error) {
      console.log("No progress data available yet");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="progress-loading">
        <p>Loading your progress...</p>
      </div>
    );
  }

  const completionRate =
    stats.totalQuestionsViewed > 0
      ? Math.round(
          (stats.totalQuestionsPracticed / stats.totalQuestionsViewed) * 100
        )
      : 0;

  return (
    <div className="progress-container">
      {/* Header */}
      <div className="progress-header">
        <h1>Your Interview Prep Progress</h1>
        <p>Track your practice sessions and improvement</p>
      </div>

      {/* Overview Stats */}
      <div className="progress-overview">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalQuestionsViewed}</h3>
            <p className="stat-label">Questions Viewed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalQuestionsPracticed}</h3>
            <p className="stat-label">Marked as Practiced</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalResponsesSaved}</h3>
            <p className="stat-label">Responses Saved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3 className="stat-value">{completionRate}%</h3>
            <p className="stat-label">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="progress-breakdown">
        {/* By Category */}
        <div className="breakdown-section">
          <h3>Progress by Category</h3>
          {Object.keys(stats.byCategory).length > 0 ? (
            <div className="breakdown-chart">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="category-name">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span className="breakdown-count">{count}</span>
                  </div>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill"
                      style={{
                        width: `${
                          (count / stats.totalQuestionsViewed) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No category data yet</p>
          )}
        </div>

        {/* By Difficulty */}
        <div className="breakdown-section">
          <h3>Progress by Difficulty</h3>
          {Object.keys(stats.byDifficulty).length > 0 ? (
            <div className="breakdown-chart">
              {Object.entries(stats.byDifficulty)
                .sort((a, b) => {
                  const order = { entry: 1, mid: 2, senior: 3 };
                  return (order[a[0]] || 0) - (order[b[0]] || 0);
                })
                .map(([difficulty, count]) => (
                  <div key={difficulty} className="breakdown-item">
                    <div className="breakdown-label">
                      <span className="difficulty-name">
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </span>
                      <span className="breakdown-count">{count}</span>
                    </div>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill"
                        style={{
                          width: `${
                            (count / stats.totalQuestionsViewed) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="no-data">No difficulty data yet</p>
          )}
        </div>

        {/* By Role */}
        {Object.keys(stats.byRole).length > 0 && (
          <div className="breakdown-section">
            <h3>Progress by Role</h3>
            <div className="role-list">
              {Object.entries(stats.byRole)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([role, count]) => (
                  <div key={role} className="role-item">
                    <span className="role-name">{role}</span>
                    <div className="role-badge">{count} questions</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {stats.totalQuestionsViewed === 0 && (
        <div className="progress-empty">
          <p>📊 No progress yet</p>
          <p>Start practicing interview questions to see your progress here!</p>
        </div>
      )}
    </div>
  );
}

export default Progress;
