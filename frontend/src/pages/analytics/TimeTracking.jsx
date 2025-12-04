import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import timeTrackingAPI from "../../api/timeTracking";
import TimeTrackingModal from "./TimeTrackingModal";

const TimeTracking = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timeTrackingAPI.getAnalytics(selectedPeriod);
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error loading time tracking data:', err);
      setError(err.response?.data?.detail || 'Failed to load time tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      if (editingEntry) {
        await timeTrackingAPI.update(editingEntry._id, entryData);
      } else {
        await timeTrackingAPI.add(entryData);
      }
      loadAnalyticsData();
      setShowModal(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to save time entry:', error);
      throw error;
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) {
      return;
    }
    
    try {
      await timeTrackingAPI.delete(entryId);
      loadAnalyticsData();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      alert('Failed to delete time entry. Please try again.');
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  // Activity colors mapping
  const ACTIVITY_COLORS = {
    'Networking': '#007bff',
    'Applications': '#28a745',
    'Interview Prep': '#17a2b8',
    'Skill Development': '#ffc107',
    'Research': '#6f42c1',
    'Follow-ups': '#fd7e14',
    'Portfolio Work': '#e83e8c',
    'Other': '#6c757d'
  };

  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (loading) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Time Tracking & Productivity</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading your time tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Time Tracking & Productivity</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc3545' }}>
          <p>Error: {error}</p>
          <button 
            onClick={loadAnalyticsData}
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

  if (!analyticsData) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Time Tracking & Productivity</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No time tracking data yet. Start logging your job search activities!</p>
          <button 
            onClick={handleAddEntry}
            style={{ 
              marginTop: '1rem', 
              padding: '0.75rem 1.5rem', 
              cursor: 'pointer',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600
            }}
          >
            + Log Time Entry
          </button>
        </div>
      </div>
    );
  }

  const { summary, recent_entries, insights } = analyticsData;

  // Prepare data for pie chart
  const pieData = Object.entries(summary.activity_breakdown).map(([activity, data]) => ({
    name: activity,
    value: data.hours,
    percentage: data.percentage
  }));

  // Prepare data for bar chart
  const barData = Object.entries(summary.activity_breakdown)
    .sort((a, b) => b[1].hours - a[1].hours)
    .map(([activity, data]) => ({
      activity: activity,
      hours: data.hours
    }));

  return (
    <div className="analyticsDashboard-content">
      <div className="time-tracking-header">
        <h2>Time Tracking & Productivity</h2>
        <div className="time-tracking-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="time-period-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="time-add-btn" onClick={handleAddEntry}>
            + Log Time
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="time-stats-grid">
        <div className="time-stat-card">
          <div className="time-stat-label">Total Hours</div>
          <div className="time-stat-value">{summary.total_hours}h</div>
        </div>
        <div className="time-stat-card">
          <div className="time-stat-label">Daily Average</div>
          <div className="time-stat-value">{summary.daily_average}h</div>
        </div>
        <div className="time-stat-card">
          <div className="time-stat-label">Total Entries</div>
          <div className="time-stat-value">{summary.total_entries}</div>
        </div>
        <div className="time-stat-card">
          <div className="time-stat-label">Top Activity</div>
          <div className="time-stat-value" style={{ fontSize: '1rem' }}>
            {summary.most_productive_activity || 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="time-charts-container">
        {/* Pie Chart */}
        <div className="time-chart-card">
          <h3>Time Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ACTIVITY_COLORS[entry.name] || '#6c757d'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="time-chart-card">
          <h3>Hours by Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
              <Bar dataKey="hours" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Section */}
      {insights && insights.length > 0 && (
        <div className="time-insights">
          <h3>📊 Productivity Insights</h3>
          <ul className="time-insights-list">
            {insights.map((insight, idx) => (
              <li key={idx}>
                <span className="insight-bullet">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Entries List */}
      {recent_entries && recent_entries.length > 0 && (
        <div className="time-entries-section">
          <h3>Recent Time Entries</h3>
          <div className="time-entries-list">
            {recent_entries.map((entry) => (
              <div key={entry._id} className="time-entry-card">
                <div className="time-entry-header">
                  <div className="time-entry-date">{entry.date}</div>
                  <div className="time-entry-actions">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="time-action-btn time-edit-btn"
                      title="Edit entry"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry._id)}
                      className="time-action-btn time-delete-btn"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="time-entry-body">
                  <div 
                    className="time-entry-activity"
                    style={{ borderLeftColor: ACTIVITY_COLORS[entry.activity_type] || '#6c757d' }}
                  >
                    {entry.activity_type}
                  </div>
                  <div className="time-entry-duration">
                    ⏱️ {formatDuration(entry.duration)}
                  </div>
                  {entry.notes && (
                    <div className="time-entry-notes">{entry.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Tracking Modal */}
      {showModal && (
        <TimeTrackingModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default TimeTracking;