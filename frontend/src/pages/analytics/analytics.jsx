import React, { useState } from "react";
import TimelineAnalytics from "./TimelineAnalytics";
import JobAnalytics from "./JobAnalytics";
import NetworkAnalytics from "../network/NetworkingAnalytics";
import SkillsAnalytics from "./SkillsAnalytics";
import PerformanceAnalytics from "./PerformanceAnalytics";
import SalaryAnalytics from "./SalaryAnalytics";
import GoalTracking from "./GoalTracking";
import TimeTracking from "./TimeTracking";
import PredictiveAnalytics from "./PredictiveAnalytics";
import CompetitiveBenchmarking from"./CompetitiveBenchmarking";

import "../../styles/analytics.css";

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("goals");

  const tabs = [
    { id: "goals", name: "Goal Tracking", icon: "🎯" },
    { id: "salary", name: "Salary Analytics", icon: "💰" },
    { id: "time", name: "Time Tracking", icon: "⏱️" },
    { id: "jobs", name: "Job Analytics", icon: "💼" },
    { id: "timeline", name: "Timeline Analytics", icon: "📈" },
    { id: "network", name: "Network Analytics", icon: "🌐" },
    { id: "skills", name: "Skills Analytics", icon: "🧠" },
    { id: "performance", name: "Performance Analytics", icon: "⚡" },
    { id : "predictive" , name : "Predictive Analytics" , icon : "🔮" } ,
    { id : "competitive" , name : "Competitive Analysis" , icon : "🏆" } ,
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "goals": return <GoalTracking />;
      case "salary": return <SalaryAnalytics />;
      case "time": return <TimeTracking />;
      case "jobs": return <JobAnalytics />;
      case "timeline": return <TimelineAnalytics />;
      case "network": return <NetworkAnalytics />;
      case "skills": return <SkillsAnalytics />;
      case "performance": return <PerformanceAnalytics />;
      case "predictive": return <PredictiveAnalytics/>;
      case "competitive": return <CompetitiveBenchmarking/>;
      default: return <GoalTracking />;
    }
  };

  return (
    <div className="analyticsDashboard">
      <header className="analyticsDashboard-header">
        <h1 className="analyticsDashboard-title">Analytics Dashboard</h1>
        <p className="analyticsDashboard-subtitle">
          Track your progress and gain insights into your career development
        </p>
      </header>

      <div className="analyticsDashboard-layout">
        {/* Sidebar */}
        <aside className="analyticsDashboard-sidebar">
          <ul className="analyticsDashboard-navList">
            {tabs.map((tab) => (
              <li className="analyticsDashboard-navItem" key={tab.id}>
                <button
                  className={
                    "analyticsDashboard-navButton" +
                    (activeTab === tab.id ? " active" : "")
                  }
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="analyticsDashboard-navIcon">{tab.icon}</span>
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <div className="analyticsDashboard-main">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;