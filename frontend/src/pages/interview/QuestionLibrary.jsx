import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import "../../styles/questionLibrary.css";

// Dummy data - until backend is wired
const dummyIndustries = [
  {
    uuid: "ind-001",
    name: "Software Engineering",
    icon: "💻",
    description: "Engineering & Technology roles",
    roles: [
      { uuid: "role-001", name: "Software Engineer" },
      { uuid: "role-002", name: "Senior Software Engineer" },
      { uuid: "role-003", name: "Full-Stack Developer" },
      { uuid: "role-004", name: "Frontend Engineer" },
      { uuid: "role-005", name: "Backend Engineer" },
    ],
  },
  {
    uuid: "ind-002",
    name: "Data Science",
    icon: "📊",
    description: "Data & Analytics roles",
    roles: [
      { uuid: "role-006", name: "Data Scientist" },
      { uuid: "role-007", name: "Data Engineer" },
      { uuid: "role-008", name: "ML Engineer" },
      { uuid: "role-009", name: "Analytics Engineer" },
    ],
  },
  {
    uuid: "ind-003",
    name: "Product & Design",
    icon: "🎨",
    description: "Product Management & UX Design",
    roles: [
      { uuid: "role-010", name: "Product Manager" },
      { uuid: "role-011", name: "UX Designer" },
      { uuid: "role-012", name: "UI Designer" },
    ],
  },
  {
    uuid: "ind-004",
    name: "Finance",
    icon: "💰",
    description: "Financial Services & Accounting",
    roles: [
      { uuid: "role-013", name: "Financial Analyst" },
      { uuid: "role-014", name: "Investment Banker" },
      { uuid: "role-015", name: "Accountant" },
    ],
  },
  {
    uuid: "ind-005",
    name: "Sales & Marketing",
    icon: "📈",
    description: "Sales, Marketing & Business Development",
    roles: [
      { uuid: "role-016", name: "Sales Executive" },
      { uuid: "role-017", name: "Marketing Manager" },
      { uuid: "role-018", name: "Business Development" },
    ],
  },
  {
    uuid: "ind-006",
    name: "Healthcare",
    icon: "🏥",
    description: "Healthcare & Medical Professions",
    roles: [
      { uuid: "role-019", name: "Nurse" },
      { uuid: "role-020", name: "Medical Doctor" },
      { uuid: "role-021", name: "Healthcare Administrator" },
    ],
  },
  {
    uuid: "ind-007",
    name: "Education",
    icon: "🎓",
    description: "Education & Training",
    roles: [
      { uuid: "role-022", name: "Teacher" },
      { uuid: "role-023", name: "Curriculum Developer" },
      { uuid: "role-024", name: "Education Coordinator" },
    ],
  },
  {
    uuid: "ind-008",
    name: "Operations",
    icon: "⚙️",
    description: "Operations & Supply Chain",
    roles: [
      { uuid: "role-025", name: "Operations Manager" },
      { uuid: "role-026", name: "Supply Chain Analyst" },
      { uuid: "role-027", name: "Logistics Coordinator" },
    ],
  },
  {
    uuid: "ind-009",
    name: "Human Resources",
    icon: "👥",
    description: "HR & Talent Management",
    roles: [
      { uuid: "role-028", name: "HR Manager" },
      { uuid: "role-029", name: "Recruiter" },
      { uuid: "role-030", name: "Talent Acquisition Specialist" },
    ],
  },
  {
    uuid: "ind-010",
    name: "Legal",
    icon: "⚖️",
    description: "Legal Services & Compliance",
    roles: [
      { uuid: "role-031", name: "Lawyer" },
      { uuid: "role-032", name: "Compliance Officer" },
      { uuid: "role-033", name: "Legal Analyst" },
    ],
  },
  {
    uuid: "ind-011",
    name: "DevOps & Infrastructure",
    icon: "🔧",
    description: "Cloud & Infrastructure Management",
    roles: [
      { uuid: "role-034", name: "DevOps Engineer" },
      { uuid: "role-035", name: "Cloud Architect" },
      { uuid: "role-036", name: "Systems Administrator" },
    ],
  },
  {
    uuid: "ind-012",
    name: "Consulting",
    icon: "💼",
    description: "Management & Business Consulting",
    roles: [
      { uuid: "role-037", name: "Consultant" },
      { uuid: "role-038", name: "Senior Consultant" },
      { uuid: "role-039", name: "Strategy Analyst" },
    ],
  },
];

function QuestionLibrary() {
  const navigate = useNavigate();
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadIndustries();
  }, []);

  const loadIndustries = async () => {
    try {
      // Try to load from API first
      const response = await QuestionBankAPI.getAllIndustries();
      setIndustries(response.data || response);
    } catch (error) {
      console.log("Using dummy data for industries");
      // Fall back to dummy data
      setIndustries(dummyIndustries);
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(
    (industry) =>
      industry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      industry.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="question-library-loading">
        <p>Loading question library...</p>
      </div>
    );
  }

  return (
    <div className="question-library-container">
      {/* Header Section */}
      <div className="question-library-header">
        <h1>Interview Question Library</h1>
        <p>Prepare for your interview with curated questions by industry and role</p>
      </div>

      {/* Search Bar */}
      <div className="question-library-search">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search industries..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* Sidebar + Grid */}
      <div className="question-library-content">
        {/* Left Sidebar - Categories */}
        <aside className="question-library-sidebar">
          <h3>Browse by Category</h3>
          <ul className="category-list">
            <li className="category-item active">
              <span>All Industries</span>
              <span className="count">{industries.length}</span>
            </li>
            <li className="category-item">
              <span>Technology</span>
              <span className="count">3</span>
            </li>
            <li className="category-item">
              <span>Finance & Accounting</span>
              <span className="count">1</span>
            </li>
            <li className="category-item">
              <span>Sales & Marketing</span>
              <span className="count">1</span>
            </li>
            <li className="category-item">
              <span>Healthcare</span>
              <span className="count">1</span>
            </li>
            <li className="category-item">
              <span>Education</span>
              <span className="count">1</span>
            </li>
            <li className="category-item">
              <span>Government</span>
              <span className="count">0</span>
            </li>
            <li className="category-item">
              <span>Consulting</span>
              <span className="count">1</span>
            </li>
          </ul>
        </aside>

        {/* Main Grid */}
        <main className="question-library-grid">
          <div className="industries-grid">
            {filteredIndustries.map((industry) => (
              <div
                key={industry.uuid}
                className="industry-card"
                onClick={() => navigate(`/interview/industry/${industry.uuid}`)}
              >
                <div className="industry-icon">{industry.icon}</div>
                <h3 className="industry-name">{industry.name}</h3>
                <p className="industry-description">{industry.description}</p>
                <div className="industry-footer">
                  <span className="role-count">
                    {industry.roles?.length || 0} roles
                  </span>
                  <span className="explore-arrow">→</span>
                </div>
              </div>
            ))}
          </div>

          {filteredIndustries.length === 0 && (
            <div className="no-results">
              <p>No industries found matching "{searchQuery}"</p>
              <button
                className="reset-search-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default QuestionLibrary;
