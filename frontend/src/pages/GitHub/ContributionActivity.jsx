import React, { useState, useEffect } from 'react';
import { 
  FaGitAlt,
  FaCodeBranch,
  FaExclamationCircle,
  FaComments
} from 'react-icons/fa';
import githubAPI from '../../api/githubAPI';
import './ContributionActivity.css';

const ContributionActivity = () => {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await githubAPI.getContributionActivity();
      setActivity(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch activity');
      console.error('Error fetching contribution activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'push':
        return <FaGitAlt />;
      case 'pull_request':
        return <FaCodeBranch />;
      case 'issue':
        return <FaExclamationCircle />;
      default:
        return <FaComments />;
    }
  };

  const getActivityText = (activityItem) => {
    switch (activityItem.type) {
      case 'push':
        return `Pushed ${activityItem.commits} commit${activityItem.commits > 1 ? 's' : ''} to ${activityItem.repo}`;
      case 'pull_request':
        return `${activityItem.action} pull request in ${activityItem.repo}`;
      default:
        return `Activity in ${activityItem.repo}`;
    }
  };

  if (loading) {
    return (
      <div className="contribution-activity">
        <h3>Recent Activity</h3>
        <div className="activity-loading">
          <div className="spinner-small"></div>
          <p>Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contribution-activity">
        <h3>Recent Activity</h3>
        <div className="activity-error">
          <FaExclamationCircle />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!activity || activity.total_events === 0) {
    return (
      <div className="contribution-activity">
        <h3>Recent Activity</h3>
        <div className="no-activity">
          <p>No recent activity found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contribution-activity">
      <h3>
        <FaGitAlt /> Recent Activity
      </h3>

      <div className="activity-summary">
        <div className="summary-item">
          <div className="summary-value">{activity.total_events}</div>
          <div className="summary-label">Total Events</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{activity.push_events}</div>
          <div className="summary-label">Pushes</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{activity.pull_request_events}</div>
          <div className="summary-label">Pull Requests</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{activity.issue_events}</div>
          <div className="summary-label">Issues</div>
        </div>
      </div>

      {activity.recent_activity && activity.recent_activity.length > 0 && (
        <div className="activity-timeline">
          <h4>Recent Contributions</h4>
          {activity.recent_activity.slice(0, 10).map((item, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(item.type)}
              </div>
              <div className="activity-content">
                <div className="activity-text">{getActivityText(item)}</div>
                <div className="activity-date">{formatDate(item.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContributionActivity;