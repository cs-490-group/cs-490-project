import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import JobsAPI from "../../api/jobs";
import JobPostingSelector from "../../components/resumes/JobPostingSelector";
import { useJob } from "../../context/JobContext";
import "../../styles/questionLibrary.css";

const categories = [
  { id: "all", name: "All Industries", count: 12 },
  { id: "Technology", name: "Technology", count: 3 },
  { id: "Product Design", name: "Product Design", count: 1 },
  { id: "Finance", name: "Finance", count: 1 },
  { id: "Sales & Marketing", name: "Sales & Marketing", count: 1 },
  { id: "Healthcare", name: "Healthcare", count: 1 },
  { id: "Education", name: "Education", count: 1 },
  { id: "Operations", name: "Operations", count: 1 },
  { id: "HR", name: "HR", count: 1 },
  { id: "Legal", name: "Legal", count: 1 },
  { id: "Consulting", name: "Consulting", count: 1 },
];

function QuestionLibrary() {
  const navigate = useNavigate();
  const { selectedJob, selectJob, clearJob } = useJob();
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showJobSelector, setShowJobSelector] = useState(false);

  useEffect(() => {
    loadIndustries();
  }, []);

  const loadIndustries = async () => {
    try {
      const response = await QuestionBankAPI.getAllIndustries();
      const data = response.data || response;
      setIndustries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load industries:", error);
      setIndustries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter((industry) => {
    const categoryMatch =
      selectedCategory === "all" || industry.category === selectedCategory;
    const searchMatch =
      !searchQuery ||
      industry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      industry.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleIndustryClick = (industryId) => {
    navigate(`/interview/industry/${industryId}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleResetSearch = () => {
    setSearchQuery("");
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleSelectJob = (job) => {
    selectJob(job);
    setShowJobSelector(false);
  };

  const handleClearJob = () => {
    clearJob();
  };

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

      {/* Job Selection Section */}
      <div className="job-selection-banner" style={{
        background: selectedJob ? '#e8f5e9' : '#f5f5f5',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: selectedJob ? '2px solid #4caf50' : '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          {selectedJob ? (
            <div>
              <strong style={{ color: '#2e7d32' }}>✓ Tailoring questions for:</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#1b5e20' }}>
                <strong>{selectedJob.title}</strong> at {selectedJob.company}
              </p>
            </div>
          ) : (
            <div>
              <strong>No job selected</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>
                Select a job application to get interview questions tailored to that role
              </p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowJobSelector(true)}
            style={{
              padding: '8px 16px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {selectedJob ? 'Change Job' : 'Select Job'}
          </button>
          {selectedJob && (
            <button
              onClick={handleClearJob}
              style={{
                padding: '8px 16px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="question-library-search">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search industries..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
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
            {categories.map((cat) => (
              <li
                key={cat.id}
                className={`category-item ${
                  selectedCategory === cat.id ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(cat.id)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCategoryClick(cat.id);
                  }
                }}
                role="button"
                tabIndex="0"
              >
                <span>{cat.name}</span>
                <span className="count">{cat.count}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Grid */}
        <main className="question-library-grid">
          <div className="industries-grid">
            {filteredIndustries.map((industry) => (
              <div
                key={industry.uuid}
                className="industry-card"
                onClick={() => handleIndustryClick(industry.uuid)}
                role="button"
                tabIndex="0"
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleIndustryClick(industry.uuid);
                  }
                }}
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
                onClick={handleResetSearch}
              >
                Clear Search
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Job Posting Selector Modal */}
      {showJobSelector && (
        <JobPostingSelector
          onSelect={handleSelectJob}
          onClose={() => setShowJobSelector(false)}
        />
      )}
    </div>
  );
}

export default QuestionLibrary;
