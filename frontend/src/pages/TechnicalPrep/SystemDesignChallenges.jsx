import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import technicalPrepAPI from "../../api/technicalPrep";
import "../../styles/technicalPrep.css";

const SystemDesignChallenges = () => {
  const navigate = useNavigate();
  const uuid = localStorage.getItem("uuid");
  const [challenges, setChallenges] = useState([]);
  const [seniority, setSeniority] = useState("senior");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const res = await technicalPrepAPI.getChallenges(0, 15, "system_design");
      setChallenges(res.data.challenges || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChallenge = async () => {
    try {
      setGenerating(true);
      const res = await technicalPrepAPI.generateSystemDesignChallenge(uuid, seniority);
      navigate(`/technical-prep/challenge/${res.data.challenge_id}`);
    } catch (error) {
      console.error("Error generating challenge:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="technical-prep-container">
      <div className="prep-header">
        <button className="back-btn" onClick={() => navigate("/technical-prep")}>
          ← Back
        </button>
        <h1>System Design Interview</h1>
        <p>Master distributed systems and architectural thinking</p>
      </div>

      {/* Overview */}
      <div className="overview-section">
        <div className="overview-card">
          <h3>What to Expect</h3>
          <ul>
            <li>Design large-scale systems from scratch</li>
            <li>Discuss tradeoffs and scalability concerns</li>
            <li>Present architecture diagrams and solutions</li>
            <li>Handle follow-up questions about reliability</li>
          </ul>
        </div>
        <div className="overview-card">
          <h3>Topics Covered</h3>
          <ul>
            <li>URL Shortening Services</li>
            <li>Distributed Caching</li>
            <li>Load Balancing & Sharding</li>
            <li>Real-time Analytics</li>
            <li>Payment Systems</li>
          </ul>
        </div>
      </div>

      {/* Generate Button */}
      <div className="generate-section">
        <h3>Generate New Challenge</h3>
        <div className="generate-form">
          <label>Seniority Level:</label>
          <select value={seniority} aria-label="Seniority Level" onChange={(e) => setSeniority(e.target.value)}>
            <option value="junior">Junior (2-5 years)</option>
            <option value="senior">Senior (5+ years)</option>
            <option value="architect">Architect (10+ years)</option>
          </select>
          <button
            className="btn-primary"
            onClick={handleGenerateChallenge}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Challenge"}
          </button>
        </div>
      </div>

      {/* Challenges List */}
      <div className="challenges-section">
        <h2>Available System Design Questions</h2>
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
                  {challenge.system_design?.evaluation_metrics && (
                    <div className="metrics">
                      <strong>Key Metrics:</strong>
                      <div className="metric-list">
                        {Object.entries(challenge.system_design.evaluation_metrics).map(
                          ([key, value]) => (
                            <span key={key} className="metric-tag">
                              {key}: {value}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="btn-start"
                  onClick={() => navigate(`/technical-prep/challenge/${challenge._id}`)}
                >
                  Start Design →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-challenges">
            <p>No system design challenges available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDesignChallenges;
