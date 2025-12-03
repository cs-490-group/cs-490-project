import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SalaryAnalytics = () => {
  // Dummy data structured for easy backend integration
  // Backend would return: { salaryHistory, marketData, stats }
  const salaryData = {
    salaryHistory: [
      { year: "2020", salary: 65000, market: 70000 },
      { year: "2021", salary: 72000, market: 75000 },
      { year: "2022", salary: 80000, market: 82000 },
      { year: "2023", salary: 90000, market: 90000 },
      { year: "2024", salary: 105000, market: 98000 },
    ],
    stats: {
      currentSalary: 105000,
      marketAverage: 98000,
      percentileRank: 65,
      totalGrowth: 61.5,
      yearOverYearGrowth: 16.7,
    },
    marketPosition: "Above Market Average",
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="analyticsDashboard-content">
      <h2>Salary Analytics</h2>
      
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
        <span className="salary-position-indicator positive">↑ Above Average</span>
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
      <div className="salary-insights">
        <h3>Key Insights</h3>
        <ul className="salary-insights-list">
          <li>
            <span className="insight-icon">📊</span>
            Your salary has grown {salaryData.stats.totalGrowth}% over the past {salaryData.salaryHistory.length} years
          </li>
          <li>
            <span className="insight-icon">🎯</span>
            You're currently earning {((salaryData.stats.currentSalary / salaryData.stats.marketAverage - 1) * 100).toFixed(1)}% above market average
          </li>
          <li>
            <span className="insight-icon">📈</span>
            Year-over-year growth of {salaryData.stats.yearOverYearGrowth}% exceeds typical industry rates
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SalaryAnalytics;