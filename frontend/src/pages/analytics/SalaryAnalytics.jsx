import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import salaryAPI from "../../api/salary";
import SalaryModal from "./SalaryModal";

const SalaryAnalytics = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    loadSalaryData();
  }, []);

  const loadSalaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salaryAPI.getAnalytics();
      setSalaryData(response.data);
    } catch (err) {
      console.error('Error loading salary data:', err);
      setError(err.response?.data?.detail || 'Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleSaveRecord = async (recordData) => {
    try {
      if (editingRecord) {
        await salaryAPI.update(editingRecord._id, recordData);
      } else {
        await salaryAPI.add(recordData);
      }
      loadSalaryData(); // Refresh data
      setShowModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to save salary record:', error);
      throw error;
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this salary record? This action cannot be undone.')) {
      return;
    }
    
    try {
      await salaryAPI.delete(recordId);
      loadSalaryData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete salary record:', error);
      alert('Failed to delete salary record. Please try again.');
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Salary Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading your salary data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Salary Analytics</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc3545' }}>
          <p>Error: {error}</p>
          <button onClick={loadSalaryData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  // Check if we have data to display main dashboard
  const hasData = salaryData && salaryData.salaryHistory && salaryData.salaryHistory.length > 0;

  // Sort history by year descending for the list view
  const sortedHistory = hasData 
    ? [...salaryData.salaryHistory].sort((a, b) => b.year - a.year) 
    : [];

  return (
    <div className="analyticsDashboard-content">
      <div className="salary-header-with-action">
        <h2>Salary Analytics</h2>
        <button className="salary-add-btn" onClick={handleAddRecord}>
          + Add Salary Record
        </button>
      </div>

      {!hasData ? (
        // EMPTY STATE
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No salary data found. Start by adding your first salary record!</p>
          <button 
            onClick={handleAddRecord}
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
            + Add Salary Record
          </button>
        </div>
      ) : (
        // MAIN DASHBOARD STATE
        <>
          {/* Stats Overview */}
          <div className="salary-stats-grid">
            <div className="salary-stat-card">
              <div className="salary-stat-label">Current Salary</div>
              <div className="salary-stat-value">{formatCurrency(salaryData.stats.currentSalary)}</div>
            </div>
            <div className="salary-stat-card">
              <div className="salary-stat-label">Market Average</div>
              <div className="salary-stat-value">{formatCurrency(salaryData.stats.marketAverage)}</div>
            </div>
            <div className="salary-stat-card">
              <div className="salary-stat-label">Market Percentile</div>
              <div className="salary-stat-value">{salaryData.stats.percentileRank}th</div>
            </div>
            <div className="salary-stat-card">
              <div className="salary-stat-label">Total Growth</div>
              <div className="salary-stat-value positive">+{salaryData.stats.totalGrowth}%</div>
            </div>
          </div>

          {/* Market Position Banner */}
          <div className="salary-position-banner">
            <strong>Market Position:</strong> {salaryData.marketPosition}
            <span className={`salary-position-indicator ${
              salaryData.marketPosition.includes("Above") 
                ? "positive" 
                : salaryData.marketPosition.includes("Below") 
                ? "negative" 
                : ""
            }`}>
              {salaryData.marketPosition.includes("Above") 
                ? "↑ Above Average" 
                : salaryData.marketPosition.includes("Below") 
                ? "↓ Below Average"
                : "= At Average"}
            </span>
          </div>

          {/* Salary Progression Chart */}
          <div className="salary-chart-container">
            <h3>Salary Progression vs Market</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salaryData.salaryHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} labelStyle={{ color: "#333" }} />
                <Legend />
                <Line type="monotone" dataKey="salary" stroke="#007bff" strokeWidth={3} name="Your Salary" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="market" stroke="#6c757d" strokeWidth={2} strokeDasharray="5 5" name="Market Average" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="salary-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            
            {/* Insights Section */}
            <div className="salary-insights">
              <h3>Key Insights</h3>
              <ul className="salary-insights-list">
                <li>
                  <span className="insight-icon">📊</span>
                  Your salary has grown {salaryData.stats.totalGrowth}% over the past {salaryData.salaryHistory.length} years
                </li>
                {salaryData.stats.marketAverage > 0 && (
                  <li>
                    <span className="insight-icon">🎯</span>
                    You're currently earning {((salaryData.stats.currentSalary / salaryData.stats.marketAverage - 1) * 100).toFixed(1)}% 
                    {salaryData.stats.currentSalary > salaryData.stats.marketAverage ? ' above' : ' below'} market average
                  </li>
                )}
              </ul>
            </div>

            {/* NEW: Salary History List with Edit/Delete */}
            <div className="salary-history-list">
              <h3>History & Actions</h3>
              <div className="history-list-container" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                {sortedHistory.map((record) => (
                  <div 
                    key={record._id} 
                    className="history-item"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '1rem',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: 'white'
                    }}
                  >
                    <div className="history-info">
                      <div style={{ fontWeight: 'bold' }}>{record.year}</div>
                      <div style={{ color: '#007bff' }}>{formatCurrency(record.salary)}</div>
                    </div>
                    <div className="history-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditRecord(record)}
                        className="goal-action-btn goal-edit-btn"
                        title="Edit Record"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteRecord(record._id)}
                        className="goal-action-btn goal-delete-btn"
                        title="Delete Record"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal - Placed outside conditional logic so it always works */}
      {showModal && (
        <SalaryModal
          record={editingRecord}
          onSave={handleSaveRecord}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default SalaryAnalytics;