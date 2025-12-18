import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import MockInterviewAPI from "../../api/mockInterview";
import { useFlash } from "../../context/flashContext";
import "../../styles/mockInterview.css";

function MockInterviewStart() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();

  // State for interview setup
  const [industries, setIndustries] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("mid");

  // State for question type preferences
  const [includeBehavioral, setIncludeBehavioral] = useState(true);
  const [includeTechnical, setIncludeTechnical] = useState(true);
  const [includeSituational, setIncludeSituational] = useState(true);

  // State for loading
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadIndustries();
  }, []);

  // Load industries on component mount
  const loadIndustries = async () => {
    try {
      const response = await QuestionBankAPI.getAllIndustries();
      const data = response.data || response || [];
      setIndustries(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedIndustry(data[0].uuid);
        loadRoles(data[0].uuid);
      }
    } catch (error) {
      console.error("Failed to load industries:", error);
      showFlash("Failed to load industries", "error");
      setIndustries([]);
    } finally {
      setLoading(false);
    }
  };

  // Load roles when industry is selected
  const loadRoles = async (industryId) => {
    try {
      const response = await QuestionBankAPI.getRolesByIndustry(industryId);
      const data = response.data || response || [];
      setRoles(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedRole(data[0].uuid);
      } else {
        setSelectedRole("");
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
      showFlash("Failed to load roles for this industry", "error");
      setRoles([]);
    }
  };

  // Handle industry change
  const handleIndustryChange = (e) => {
    const industryId = e.target.value;
    setSelectedIndustry(industryId);
    loadRoles(industryId);
  };

  // Start the mock interview
  const handleStartInterview = async () => {
    if (!selectedRole) {
      showFlash("Please select a role", "error");
      return;
    }

    if (!includeBehavioral && !includeTechnical && !includeSituational) {
      showFlash("Please select at least one question type", "error");
      return;
    }

    setStarting(true);
    try {
      const startData = {
        role_uuid: selectedRole,
        industry_uuid: selectedIndustry,
        difficulty_level: selectedDifficulty,
        include_behavioral: includeBehavioral,
        include_technical: includeTechnical,
        include_situational: includeSituational
      };

      const response = await MockInterviewAPI.startMockInterview(startData);

      if (response.data) {
        const sessionId = response.data.session_id;
        showFlash("Mock interview started!", "success");
        navigate(`/interview/mock-interview/${sessionId}`);
      } else {
        showFlash("Failed to start interview", "error");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      showFlash(
        error.response?.data?.detail || "Failed to start interview",
        "error"
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="mock-interview-start-loading">
        <p>Loading interview setup...</p>
      </div>
    );
  }

  return (
    <div className="mock-interview-start-container">
      <div className="mock-interview-start-content">
        {/* Header */}
        <div className="mock-interview-start-header">
          <h1>Start a Mock Interview</h1>
          <p>
            Practice with a realistic interview experience tailored to your target role
          </p>
        </div>

        {/* Main Form */}
        <div className="mock-interview-start-form">
          {/* Industry Selection */}
          <div className="form-section">
            <label htmlFor="industry-select" className="form-label">
              Select Industry
            </label>
            <select
              id="industry-select"
              value={selectedIndustry}
              onChange={handleIndustryChange}
              className="form-control"
              aria-label="Select industry"
            >
              <option value="">-- Choose an industry --</option>
              {industries.map((industry) => (
                <option key={industry.uuid} value={industry.uuid}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <div className="form-section">
            <label htmlFor="role-select" className="form-label">
              Select Target Role
            </label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-control"
              aria-label="Select target role"
            >
              <option value="">-- Choose a role --</option>
              {roles.map((role) => (
                <option key={role.uuid} value={role.uuid}>
                  {role.name}
                </option>
              ))}
            </select>
            {selectedRole && (
              <p className="role-description">
                Preparing interview questions for this role based on your selected difficulty level.
              </p>
            )}
          </div>

          {/* Difficulty Level */}
          <div className="form-section">
            <label className="form-label">Difficulty Level</label>
            <div className="difficulty-options">
              {[
                { value: "entry", label: "Entry Level", icon: "📍" },
                { value: "mid", label: "Mid Level", icon: "📊" },
                { value: "senior", label: "Senior Level", icon: "⭐" }
              ].map((option) => (
                <label key={option.value} className="difficulty-option">
                  <input
                    type="radio"
                    name="difficulty"
                    value={option.value}
                    checked={selectedDifficulty === option.value}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                  />
                  <span className="difficulty-icon">{option.icon}</span>
                  <span className="difficulty-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div className="form-section">
            <label className="form-label">Interview Question Types</label>
            <div className="question-types">
              <label className="question-type-option">
                <input
                  type="checkbox"
                  checked={includeBehavioral}
                  onChange={(e) => setIncludeBehavioral(e.target.checked)}
                />
                <span className="checkbox-label">
                  <strong>Behavioral Questions</strong>
                  <span className="description">
                    Understand your approach and experiences
                  </span>
                </span>
              </label>

              <label className="question-type-option">
                <input
                  type="checkbox"
                  checked={includeTechnical}
                  onChange={(e) => setIncludeTechnical(e.target.checked)}
                />
                <span className="checkbox-label">
                  <strong>Technical Questions</strong>
                  <span className="description">
                    Test your technical knowledge and skills
                  </span>
                </span>
              </label>

              <label className="question-type-option">
                <input
                  type="checkbox"
                  checked={includeSituational}
                  onChange={(e) => setIncludeSituational(e.target.checked)}
                />
                <span className="checkbox-label">
                  <strong>Situational Questions</strong>
                  <span className="description">
                    Assess problem-solving approach
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Tips */}
          <div className="interview-tips">
            <h3>Interview Tips</h3>
            <ul>
              <li>Find a quiet, distraction-free environment</li>
              <li>Have a notepad ready for technical questions</li>
              <li>Speak clearly and take your time with responses</li>
              <li>The interview will track your response time and word count</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mock-interview-start-actions">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={starting}
          >
            Cancel
          </button>
          <button
            onClick={handleStartInterview}
            className="btn btn-primary"
            disabled={starting || !selectedRole}
          >
            {starting ? "Starting..." : "Start Mock Interview"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MockInterviewStart;
