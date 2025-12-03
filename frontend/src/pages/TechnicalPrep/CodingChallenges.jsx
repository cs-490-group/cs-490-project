import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import technicalPrepAPI from "../../api/technicalPrep";
import "../../styles/technicalPrep.css";

const CodingChallenges = () => {
  const navigate = useNavigate();
  const uuid = localStorage.getItem("uuid");
  const [challenges, setChallenges] = useState([]);
  const [difficulty, setDifficulty] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, [difficulty]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const res = await technicalPrepAPI.getChallenges(
        0,
        15,
        "coding",
        difficulty === "all" ? null : difficulty
      );
      setChallenges(res.data.challenges || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChallenge = async (selectedDifficulty) => {
    try {
      setGenerating(true);
      const res = await technicalPrepAPI.generateCodingChallenge(
        uuid,
        selectedDifficulty
      );
      navigate(`/technical-prep/challenge/${res.data.challenge_id}`);
    } catch (error) {
      console.error("Error generating challenge:", error);
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (diff) => {
    const colors = {
      easy: "#10b981",
      medium: "#f59e0b",
      hard: "#ef4444"
    };
    return colors[diff] || "#6b7280";
  };

  return (
    <div className="technical-prep-container">
      <div className="prep-header">
        <button className="back-btn" onClick={() => navigate("/technical-prep")}>
          ← Back
        </button>
        <h1>Coding Challenges</h1>
        <p>Practice coding problems similar to technical interviews</p>
      </div>

      {/* Quick Generate Buttons */}
      <div className="quick-generate">
        <h3>Quick Generate</h3>
        <div className="generate-buttons">
          <button
            className="gen-btn easy"
            onClick={() => handleGenerateChallenge("easy")}
            disabled={generating}
          >
            🟢 Easy
          </button>
          <button
            className="gen-btn medium"
            onClick={() => handleGenerateChallenge("medium")}
            disabled={generating}
          >
            🟡 Medium
          </button>
          <button
            className="gen-btn hard"
            onClick={() => handleGenerateChallenge("hard")}
            disabled={generating}
          >
            🔴 Hard
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="filters-section">
        <label>Filter by Difficulty:</label>
        <div className="difficulty-buttons">
          {["all", "easy", "medium", "hard"].map(diff => (
            <button
              key={diff}
              className={`difficulty-btn ${difficulty === diff ? "active" : ""}`}
              onClick={() => setDifficulty(diff)}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges List */}
      <div className="challenges-section">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : challenges.length > 0 ? (
          <div className="challenges-list">
            {challenges.map((challenge) => (
              <div key={challenge._id} className="challenge-list-item">
                <div className="item-content">
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                  <div className="item-meta">
                    <span
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
                    >
                      {challenge.difficulty.toUpperCase()}
                    </span>
                    {challenge.time_limit_minutes && (
                      <span className="time-badge">⏱️ {challenge.time_limit_minutes} min</span>
                    )}
                    {challenge.required_skills && (
                      <span className="skills-badge">
                        {challenge.required_skills.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-start"
                  onClick={() => navigate(`/technical-prep/challenge/${challenge._id}`)}
                >
                  Start →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-challenges">
            <p>No challenges found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingChallenges;
