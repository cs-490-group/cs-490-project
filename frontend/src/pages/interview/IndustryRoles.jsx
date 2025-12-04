import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import IndustryIcon from "../../components/IndustryIcon";
import "../../styles/industryRoles.css";

// Dummy roles data
const dummyRolesData = {
  "ind-001": [
    { uuid: "role-001", name: "Software Engineer", questionCount: 45 },
    { uuid: "role-002", name: "Senior Software Engineer", questionCount: 38 },
    { uuid: "role-003", name: "Full-Stack Developer", questionCount: 52 },
    { uuid: "role-004", name: "Frontend Engineer", questionCount: 40 },
    { uuid: "role-005", name: "Backend Engineer", questionCount: 48 },
  ],
  "ind-002": [
    { uuid: "role-006", name: "Data Scientist", questionCount: 44 },
    { uuid: "role-007", name: "Data Engineer", questionCount: 42 },
    { uuid: "role-008", name: "ML Engineer", questionCount: 50 },
    { uuid: "role-009", name: "Analytics Engineer", questionCount: 35 },
  ],
  "ind-003": [
    { uuid: "role-010", name: "Product Manager", questionCount: 48 },
    { uuid: "role-011", name: "UX Designer", questionCount: 40 },
    { uuid: "role-012", name: "UI Designer", questionCount: 36 },
  ],
  "ind-004": [
    { uuid: "role-013", name: "Financial Analyst", questionCount: 42 },
    { uuid: "role-014", name: "Investment Banker", questionCount: 50 },
    { uuid: "role-015", name: "Accountant", questionCount: 38 },
  ],
  "ind-005": [
    { uuid: "role-016", name: "Sales Executive", questionCount: 45 },
    { uuid: "role-017", name: "Marketing Manager", questionCount: 44 },
    { uuid: "role-018", name: "Business Development", questionCount: 40 },
  ],
  "ind-006": [
    { uuid: "role-019", name: "Nurse", questionCount: 38 },
    { uuid: "role-020", name: "Medical Doctor", questionCount: 52 },
    { uuid: "role-021", name: "Healthcare Administrator", questionCount: 40 },
  ],
  "ind-007": [
    { uuid: "role-022", name: "Teacher", questionCount: 42 },
    { uuid: "role-023", name: "Curriculum Developer", questionCount: 36 },
    { uuid: "role-024", name: "Education Coordinator", questionCount: 35 },
  ],
  "ind-008": [
    { uuid: "role-025", name: "Operations Manager", questionCount: 48 },
    { uuid: "role-026", name: "Supply Chain Analyst", questionCount: 40 },
    { uuid: "role-027", name: "Logistics Coordinator", questionCount: 38 },
  ],
  "ind-009": [
    { uuid: "role-028", name: "HR Manager", questionCount: 44 },
    { uuid: "role-029", name: "Recruiter", questionCount: 40 },
    { uuid: "role-030", name: "Talent Acquisition Specialist", questionCount: 36 },
  ],
  "ind-010": [
    { uuid: "role-031", name: "Lawyer", questionCount: 50 },
    { uuid: "role-032", name: "Compliance Officer", questionCount: 42 },
    { uuid: "role-033", name: "Legal Analyst", questionCount: 38 },
  ],
  "ind-011": [
    { uuid: "role-034", name: "DevOps Engineer", questionCount: 46 },
    { uuid: "role-035", name: "Cloud Architect", questionCount: 44 },
    { uuid: "role-036", name: "Systems Administrator", questionCount: 40 },
  ],
  "ind-012": [
    { uuid: "role-037", name: "Consultant", questionCount: 48 },
    { uuid: "role-038", name: "Senior Consultant", questionCount: 50 },
    { uuid: "role-039", name: "Strategy Analyst", questionCount: 42 },
  ],
};

const industryNames = {
  "ind-001": "Software Engineering",
  "ind-002": "Data Science",
  "ind-003": "Product & Design",
  "ind-004": "Finance",
  "ind-005": "Sales & Marketing",
  "ind-006": "Healthcare",
  "ind-007": "Education",
  "ind-008": "Operations",
  "ind-009": "Human Resources",
  "ind-010": "Legal",
  "ind-011": "DevOps & Infrastructure",
  "ind-012": "Consulting",
};

function IndustryRoles() {
  const { industryId } = useParams();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [industryName, setIndustryName] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    loadRoles();
  }, [industryId]);

  const loadRoles = async () => {
    try {
      // Try to load from API first
      const response = await QuestionBankAPI.getRolesByIndustry(industryId);
      const roles = response.data || response;

      // Fetch question counts for each role
      const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
          try {
            const questionsResponse = await QuestionBankAPI.getQuestionsByRole(role.uuid);
            const questions = questionsResponse.data || questionsResponse;
            return {
              ...role,
              questionCount: Array.isArray(questions) ? questions.length : 0
            };
          } catch (error) {
            console.log(`Could not fetch questions for role ${role.uuid}`);
            // If we can't fetch questions, try to use existing questionCount or default to 0
            return {
              ...role,
              questionCount: role.questionCount || 0
            };
          }
        })
      );

      setRoles(rolesWithCounts);
    } catch (error) {
      console.log("Using dummy data for roles");
      // Fall back to dummy data
      setRoles(dummyRolesData[industryId] || []);
    } finally {
      setLoading(false);
    }

    // Set industry metadata
    setIndustryName(industryNames[industryId] || "Industry");
  };

  if (loading) {
    return (
      <div className="industry-roles-loading">
        <p>Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="industry-roles-container">
      {/* Header */}
      <div className="industry-roles-header">
        <button
          className="back-button"
          onClick={() => navigate("/interview/question-library")}
        >
          ← Back
        </button>
        <div className="header-content">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px", height: "50px" }}>
            <IndustryIcon industryId={industryId} className="w-6 h-6" />
          </div>
          <div>
            <h1>{industryName}</h1>
            <p>{roles.length} roles available</p>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="roles-grid">
        {roles.map((role) => (
          <div
            key={role.uuid}
            className="role-card"
            onClick={() => navigate(`/interview/questions/${role.uuid}`)}
          >
            <div className="role-header">
              <h3 className="role-name">{role.name}</h3>
              <span className="difficulty-badge">All Levels</span>
            </div>

            <div className="role-content">
              <div className="stat">
                <span className="stat-label">Questions:</span>
                <span className="stat-value">{role.questionCount || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Categories:</span>
                <span className="stat-value">4</span>
              </div>
            </div>

            <div className="role-footer">
              <button className="start-btn">Start Practicing</button>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="no-roles">
          <p>No roles found for this industry</p>
        </div>
      )}
    </div>
  );
}

export default IndustryRoles;
