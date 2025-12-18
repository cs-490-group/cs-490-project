import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import technicalPrepAPI from "../../api/technicalPrep";
import "../../styles/technicalPrep.css";

const CaseStudyChallenges = () => {
  const navigate = useNavigate();
  const uuid = localStorage.getItem("uuid");
  const [challenges, setChallenges] = useState([]);
  const [industry, setIndustry] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const res = await technicalPrepAPI.getChallenges(0, 15, "case_study");
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
      const res = await technicalPrepAPI.generateCaseStudy(uuid, industry === "all" ? null : industry);
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
        <h1>Case Study Challenges</h1>
        <p>Excel at consulting interviews with strategic problem solving</p>
      </div>

      {/* Overview */}
      <div className="overview-section">
        <div className="overview-card">
          <h3>What to Expect</h3>
          <ul>
            <li>Real business scenarios and market analysis</li>
            <li>Structured problem-solving frameworks</li>
            <li>Quantitative and qualitative reasoning</li>
            <li>Clear communication and presentation</li>
          </ul>
        </div>
        <div className="overview-card">
          <h3>Industries Covered</h3>
          <ul>
            <li>Technology & SaaS</li>
            <li>Financial Services</li>
            <li>E-commerce & Retail</li>
            <li>Media & Entertainment</li>
          </ul>
        </div>
      </div>

      {/* Generate Button */}
      <div className="generate-section">
        <h3>Generate New Case Study</h3>
        <div className="generate-form">
          <label>Industry Focus:</label>
          <select value={industry} aria-label="Filter by Industry" onChange={(e) => setIndustry(e.target.value)}>
            <option value="all">Any Industry</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="ecommerce">E-commerce</option>
            <option value="healthcare">Healthcare</option>
          </select>
          <button
            className="btn-primary"
            onClick={handleGenerateChallenge}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Case Study"}
          </button>
        </div>
      </div>

      {/* Challenges List */}
      <div className="challenges-section">
        <h2>Available Case Studies</h2>
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
                  {challenge.case_study?.industry && (
                    <div className="item-meta">
                      <span className="skills-badge">
                        Industry: {challenge.case_study.industry}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  className="btn-start"
                  onClick={() => navigate(`/technical-prep/challenge/${challenge._id}`)}
                >
                  Start Case Study →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-challenges">
            <p>No case studies available yet</p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="overview-section" style={{ marginTop: "40px" }}>
        <div className="overview-card">
          <h3>📊 Quantitative Tips</h3>
          <ul>
            <li>Break down large numbers into manageable parts</li>
            <li>Use industry benchmarks when available</li>
            <li>Show your calculation logic clearly</li>
            <li>Challenge assumptions appropriately</li>
          </ul>
        </div>
        <div className="overview-card">
          <h3>💬 Communication Tips</h3>
          <ul>
            <li>Structure: Situation → Complication → Question</li>
            <li>Be clear about your assumptions upfront</li>
            <li>Use frameworks (MECE principle)</li>
            <li>Listen and adapt to interviewer feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyChallenges;
