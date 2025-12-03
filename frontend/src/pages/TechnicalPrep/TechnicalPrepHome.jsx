import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import technicalPrepAPI from "../../api/technicalPrep";
import "../../styles/technicalPrep.css";

const TechnicalPrepHome = () => {
  const navigate = useNavigate();
  const uuid = localStorage.getItem("uuid");
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [challengesRes, statsRes] = await Promise.all([
        technicalPrepAPI.getChallenges(0, 20),
        uuid ? technicalPrepAPI.getUserStatistics(uuid) : Promise.resolve({ data: { statistics: {} } })
      ]);

      setChallenges(challengesRes.data.challenges || []);
      setStats(statsRes.data.statistics);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterChallenges = () => {
    let filtered = challenges;

    if (selectedType !== "all") {
      filtered = filtered.filter(c => c.challenge_type === selectedType);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(c => c.difficulty === selectedDifficulty);
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "#10b981",
      medium: "#f59e0b",
      hard: "#ef4444",
      junior: "#10b981",
      senior: "#ef4444",
      architect: "#8b5cf6"
    };
    return colors[difficulty] || "#6b7280";
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      junior: "Junior",
      senior: "Senior",
      architect: "Architect"
    };
    return badges[difficulty] || difficulty;
  };

  if (loading) {
    return (
      <div className="technical-prep-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading challenges...</p>
        </div>
      </div>
    );
  }

  const filteredChallenges = filterChallenges();

  return (
    <div className="technical-prep-container">
      {/* Header Section */}
      <div className="prep-header">
        <h1>Technical Interview Preparation</h1>
        <p>Master coding, system design, and case studies to ace your interviews</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_attempts || 0}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(stats.average_score || 0)}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed_attempts || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_time_spent_minutes || 0}</div>
            <div className="stat-label">Minutes Spent</div>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="quick-actions">
        <div className="action-card" onClick={() => navigate("/technical-prep/coding")}>
          <div className="action-icon">💻</div>
          <h3>Coding Challenges</h3>
          <p>Sharpen your programming skills with real interview questions</p>
          <button className="action-btn">Start Coding</button>
        </div>

        <div className="action-card" onClick={() => navigate("/technical-prep/system-design")}>
          <div className="action-icon">🏗️</div>
          <h3>System Design</h3>
          <p>Design scalable systems like real senior engineers</p>
          <button className="action-btn">Start Design</button>
        </div>

        <div className="action-card" onClick={() => navigate("/technical-prep/case-study")}>
          <div className="action-icon">📊</div>
          <h3>Case Studies</h3>
          <p>Ace consulting interviews with strategic thinking</p>
          <button className="action-btn">Start Case Study</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Challenge Type:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="coding">Coding</option>
            <option value="system_design">System Design</option>
            <option value="case_study">Case Study</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Difficulty:</label>
          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Challenges List */}
      <div className="challenges-section">
        <h2>Available Challenges</h2>
        <div className="challenges-grid">
          {filteredChallenges.length > 0 ? (
            filteredChallenges.map((challenge) => (
              <div key={challenge._id} className="challenge-card">
                <div className="challenge-header">
                  <h3>{challenge.title}</h3>
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
                  >
                    {getDifficultyBadge(challenge.difficulty)}
                  </span>
                </div>

                <p className="challenge-desc">{challenge.description}</p>

                <div className="challenge-meta">
                  <span className="type-badge">{challenge.challenge_type?.replace(/_/g, " ")}</span>
                  {challenge.time_limit_minutes && (
                    <span className="time-badge">⏱️ {challenge.time_limit_minutes} min</span>
                  )}
                </div>

                {challenge.required_skills && challenge.required_skills.length > 0 && (
                  <div className="skills-list">
                    {challenge.required_skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                    {challenge.required_skills.length > 3 && (
                      <span className="skill-tag">+{challenge.required_skills.length - 3}</span>
                    )}
                  </div>
                )}

                <button
                  className="start-challenge-btn"
                  onClick={() => navigate(`/technical-prep/challenge/${challenge._id}`)}
                >
                  Start Challenge →
                </button>
              </div>
            ))
          ) : (
            <div className="no-challenges">
              <p>No challenges found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalPrepHome;
