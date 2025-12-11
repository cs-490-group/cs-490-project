import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import salaryAPI from "../../api/salary";
import SalaryModal from "./SalaryModal";

const getCompanyName = (company) => {
    if (company === null || company === undefined) return "Unknown Company";
    if (typeof company === 'string') return company;
    if (typeof company === 'object') return company.name || "Company Info Available";
    return "Unknown Company";
};

const SalaryAnalytics = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [salaryRecords, setSalaryRecords] = useState([]);
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
      
      // Fetch both analytics and full records
      const [analyticsResponse, recordsResponse] = await Promise.all([
        salaryAPI.getAnalytics(),
        salaryAPI.getAll()
      ]);
      
      setSalaryData(analyticsResponse.data);
      setSalaryRecords(recordsResponse.data);
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
        // Update existing record
        await salaryAPI.update(editingRecord._id, recordData);
      } else {
        // Create new record
        await salaryAPI.add(recordData);
      }
      loadSalaryData(); // Refresh
      setShowModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to save salary record:', error);
      throw error; // Let modal handle the error display
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this salary record? This action cannot be undone.')) {
      return;
    }
    
    try {
      await salaryAPI.delete(recordId);
      loadSalaryData(); // Refresh
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
          <button 
            onClick={loadSalaryData}
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

  if (!salaryData || !salaryData.salaryHistory) {
    return (
      <div className="analyticsDashboard-content">
        <h2>Salary Analytics</h2>
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
      </div>
    );
  }

  return (
    <div className="analyticsDashboard-content">
      <div className="salary-header-with-action">
        <h2>Salary Analytics</h2>
        <button className="salary-add-btn" onClick={handleAddRecord}>
          + Add Salary Record
        </button>
      </div>
      
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
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelStyle={{ color: "#333" }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="salary" 
              stroke="#007bff" 
              strokeWidth={3}
              name="Your Salary"
              dot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="market" 
              stroke="#6c757d" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Market Average"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Section */}
      {salaryData.insights && salaryData.insights.length > 0 && (
        <div className="salary-insights">
          <h3>Key Insights</h3>
          <ul className="salary-insights-list">
            {salaryData.insights.map((insight, idx) => (
              <li key={idx}>
                <span className="insight-icon">📊</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Salary Records List */}
      {salaryRecords && salaryRecords.length > 0 && (
        <div className="salary-records-section">
          <h3>Your Salary History</h3>
          <div className="salary-records-list">
            {[...salaryRecords]
              .sort((a, b) => b.year - a.year)
              .map((record) => {
                const totalComp = (record.salary_amount || 0) + (record.bonus || 0) + (record.equity_value || 0);
                
                return (
                  <div key={record._id} className="salary-record-card">
                    <div className="salary-record-header">
                      <div className="salary-record-year">{record.year}</div>
                      <div className="salary-record-actions">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="salary-action-btn salary-edit-btn"
                          title="Edit record"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record._id)}
                          className="salary-action-btn salary-delete-btn"
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="salary-record-body">
                      <div className="salary-record-main">
                        <div className="salary-record-amount">
                          {formatCurrency(record.salary_amount)}
                        </div>
                        {record.job_role && (
                          <div className="salary-record-role">{record.job_role}</div>
                        )}
                        {record.company && (
                          <div className="salary-record-company">🏢 {getCompanyName(record.company)}</div>
                        )}
                        {record.location && (
                          <div className="salary-record-location">📍 {record.location}</div>
                        )}
                        {record.employment_type && (
                          <div className="salary-record-employment">
                            💼 {record.employment_type.charAt(0).toUpperCase() + record.employment_type.slice(1)}
                          </div>
                        )}
                      </div>
                      
                      {((record.bonus || 0) > 0 || (record.equity_value || 0) > 0) && (
                        <div className="salary-record-breakdown">
                          <div className="salary-breakdown-title">Compensation Breakdown:</div>
                          <div className="salary-breakdown-items">
                            <div className="salary-breakdown-item">
                              <span className="salary-breakdown-label">Base Salary:</span>
                              <span className="salary-breakdown-value">{formatCurrency(record.salary_amount)}</span>
                            </div>
                            {record.bonus > 0 && (
                              <div className="salary-breakdown-item">
                                <span className="salary-breakdown-label">Annual Bonus:</span>
                                <span className="salary-breakdown-value">{formatCurrency(record.bonus)}</span>
                              </div>
                            )}
                            {record.equity_value > 0 && (
                              <div className="salary-breakdown-item">
                                <span className="salary-breakdown-label">Equity Value:</span>
                                <span className="salary-breakdown-value">{formatCurrency(record.equity_value)}</span>
                              </div>
                            )}
                            <div className="salary-breakdown-item salary-breakdown-total">
                              <span className="salary-breakdown-label">Total Compensation:</span>
                              <span className="salary-breakdown-value">{formatCurrency(totalComp)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {record.notes && (
                        <div className="salary-record-notes">
                          <strong>Notes:</strong> {record.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Salary Modal */}
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