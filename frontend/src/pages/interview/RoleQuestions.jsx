import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import "../../styles/roleQuestions.css";
import { dummyQuestions } from "../../data/dummyQuestions";

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
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDifficulty, setActiveDifficulty] = useState("all");
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    loadQuestions();
  }, [roleId]);

  const loadQuestions = async () => {
    try {
      // Try to load from API first
      const response = await QuestionBankAPI.getQuestionsByRole(roleId);
      setQuestions(response.data || response);
    } catch (error) {
      console.log("Using dummy data for questions");
      // Fall back to dummy data
      const roleQuestions = dummyQuestions.filter((q) => q.role_uuid === roleId);
      setQuestions(roleQuestions);
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

  const filteredQuestions = questions.filter((q) => {
    const categoryMatch =
      activeCategory === "all" || q.category === activeCategory;
    const difficultyMatch =
      activeDifficulty === "all" || q.difficulty === activeDifficulty;
    return categoryMatch && difficultyMatch;
  });

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
