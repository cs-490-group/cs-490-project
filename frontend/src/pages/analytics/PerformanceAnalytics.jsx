import React, { useState } from "react";
import "../../styles/analytics.css";
import CompetitiveAnalysis from "../../components/analytics/CompetitiveAnalysis";
import PerformancePrediction from "../../components/analytics/PerformancePrediction";

const PerformanceAnalytics = () => {
  const [activeView, setActiveView] = useState("competitive");

  const renderContent = () => {
    switch (activeView) {
      case "competitive":
        return <CompetitiveAnalysis />;
      case "prediction":
        return <PerformancePrediction />;
      default:
        return <CompetitiveAnalysis />;
    }
  };

  return (
    <div className="analyticsDashboard-content">
      <div className="performance-analytics-header">
        <h2>Performance Analytics</h2>
        <p>Analyze your competitive position and predict future outcomes</p>
        
        <div className="performance-view-toggle">
          <button
            className={`view-toggle-btn ${activeView === "competitive" ? "active" : ""}`}
            onClick={() => setActiveView("competitive")}
          >
            Competitive Analysis
          </button>
          <button
            className={`view-toggle-btn ${activeView === "prediction" ? "active" : ""}`}
            onClick={() => setActiveView("prediction")}
          >
            Performance Prediction
          </button>
        </div>
      </div>

      <div className="performance-analytics-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default PerformanceAnalytics;