import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import { useJob } from "../../context/JobContext";
import { matchQuestionsToJob, getRelevanceLevel } from "../../utils/questionMatcher";
import "../../styles/roleQuestions.css";

const roleNames = {
  "role-001": "Software Engineer",
  "role-002": "Senior Software Engineer",
  "role-003": "Full-Stack Developer",
  "role-004": "Frontend Engineer",
  "role-005": "Backend Engineer",
  "role-006": "Data Scientist",
  "role-007": "Data Engineer",
  "role-008": "ML Engineer",
  "role-009": "Analytics Engineer",
  "role-010": "Product Manager",
  "role-011": "UX Designer",
  "role-012": "UI Designer",
};

function RoleQuestions() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const { selectedJob } = useJob();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDifficulty, setActiveDifficulty] = useState("all");
  const [roleName, setRoleName] = useState("");
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [roleId]);

  const loadQuestions = async () => {
    try {
      const response = await QuestionBankAPI.getQuestionsByRole(roleId);
      const data = response.data || response || [];
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load questions:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }

    setRoleName(roleNames[roleId] || "Role");
  };

  const categories = [
    { id: "all", name: "All Questions" },
    { id: "behavioral", name: "Behavioral" },
    { id: "technical", name: "Technical" },
    { id: "situational", name: "Situational" },
    { id: "company", name: "Company-Specific" },
  ];

  const difficulties = [
    { id: "all", name: "All Levels" },
    { id: "entry", name: "Entry Level" },
    { id: "mid", name: "Mid Level" },
    { id: "senior", name: "Senior Level" },
  ];

  let filteredQuestions = questions.filter((q) => {
    const categoryMatch =
      activeCategory === "all" || q.category === activeCategory;
    const difficultyMatch =
      activeDifficulty === "all" || q.difficulty === activeDifficulty;
    return categoryMatch && difficultyMatch;
  });

  // Apply job-based filtering if job is selected
  if (selectedJob) {
    filteredQuestions = matchQuestionsToJob(filteredQuestions, selectedJob);

    // Filter to only highly relevant questions if toggle is on
    if (showOnlyRelevant) {
      filteredQuestions = filteredQuestions.filter(
        q => getRelevanceLevel(q, selectedJob) === 'highly-matched'
      );
    }
  }

  if (loading) {
    return (
      <div className="role-questions-loading">
        <p>Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="role-questions-container">
      {/* Header */}
      <div className="role-questions-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <div className="header-content">
          <h1>{roleName}</h1>
          <p>{filteredQuestions.length} questions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        {/* Category Filter */}
        <div className="filter-group">
          <h4>Category</h4>
          <div className="filter-buttons">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`filter-btn ${
                  activeCategory === cat.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="filter-group">
          <h4>Difficulty Level</h4>
          <div className="filter-buttons">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                className={`filter-btn ${
                  activeDifficulty === diff.id ? "active" : ""
                }`}
                onClick={() => setActiveDifficulty(diff.id)}
              >
                {diff.name}
              </button>
            ))}
          </div>
        </div>

        {/* Job-Based Filter */}
        {selectedJob && (
          <div className="filter-group">
            <h4>Job Relevance</h4>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "14px", color: "#666", margin: "0 0 8px 0" }}>
                Tailoring questions for: <strong>{selectedJob.title}</strong>
              </p>
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${
                  !showOnlyRelevant ? "active" : ""
                }`}
                onClick={() => setShowOnlyRelevant(false)}
              >
                All Questions
              </button>
              <button
                className={`filter-btn ${
                  showOnlyRelevant ? "active" : ""
                }`}
                onClick={() => setShowOnlyRelevant(true)}
              >
                Highly Relevant Only
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question, index) => (
            <div
              key={question.uuid}
              className="question-item"
              onClick={() => navigate(`/interview/questions/practice/${question.uuid}`)}
            >
              <div className="question-number">{index + 1}</div>
              <div className="question-content">
                <h3 className="question-prompt">{question.prompt}</h3>
                <div className="question-meta">
                  <span className={`category-badge ${question.category}`}>
                    {question.category.charAt(0).toUpperCase() +
                      question.category.slice(1)}
                  </span>
                  <span className={`difficulty-badge ${question.difficulty}`}>
                    {question.difficulty.charAt(0).toUpperCase() +
                      question.difficulty.slice(1)}
                  </span>
                  {selectedJob && (
                    <span
                      className={`relevance-badge ${getRelevanceLevel(
                        question,
                        selectedJob
                      )}`}
                    >
                      {getRelevanceLevel(question, selectedJob) === "highly-matched"
                        ? "✓ Highly Relevant"
                        : getRelevanceLevel(question, selectedJob) ===
                          "partially-matched"
                        ? "~ Relevant"
                        : ""}
                    </span>
                  )}
                  {question.expected_skills?.length > 0 && (
                    <div className="skills-preview">
                      {question.expected_skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                      {question.expected_skills.length > 2 && (
                        <span className="skill-more">
                          +{question.expected_skills.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="question-action">
                <button className="practice-btn">Practice →</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-questions">
            <p>No questions found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleQuestions;
