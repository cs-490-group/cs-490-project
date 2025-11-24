import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuestionBankAPI from "../../api/questionBank";
import "../../styles/myPractice.css";

function MyPractice() {
  const navigate = useNavigate();
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, practiced, saved
  const [sortBy, setSortBy] = useState("recent"); // recent, oldest, role

  useEffect(() => {
    loadPracticeHistory();
  }, []);

  const loadPracticeHistory = async () => {
    try {
      // Try to load from API first
      const response = await QuestionBankAPI.getPracticedQuestions();
      const questions = response.data || response || [];
      setPracticeHistory(Array.isArray(questions) ? questions : []);
    } catch (error) {
      console.log("No practice history available yet");
      setPracticeHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = practiceHistory;

    if (filterStatus === "practiced") {
      filtered = filtered.filter((q) => q.is_marked_practiced);
    } else if (filterStatus === "saved") {
      filtered = filtered.filter((q) => !q.is_marked_practiced && q.response_html);
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.last_practiced || b.date_created) -
          new Date(a.last_practiced || a.date_created)
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.last_practiced || a.date_created) -
          new Date(b.last_practiced || b.date_created)
      );
    }

    return filtered;
  };

  const filteredQuestions = filterQuestions();

  if (loading) {
    return (
      <div className="my-practice-loading">
        <p>Loading your practice history...</p>
      </div>
    );
  }

  return (
    <div className="my-practice-container">
      {/* Header */}
      <div className="my-practice-header">
        <h1>My Practice History</h1>
        <p>Review your practice sessions and track your progress</p>
      </div>

      {/* Controls */}
      <div className="my-practice-controls">
        {/* Filter */}
        <div className="filter-group">
          <label>Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Questions ({practiceHistory.length})</option>
            <option value="practiced">
              Marked as Practiced (
              {practiceHistory.filter((q) => q.is_marked_practiced).length})
            </option>
            <option value="saved">
              Saved Responses (
              {practiceHistory.filter((q) => !q.is_marked_practiced && q.response_html)
                .length}
              )
            </option>
          </select>
        </div>

        {/* Sort */}
        <div className="sort-group">
          <label>Sort:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Practice History List */}
      <div className="practice-history">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((item) => (
            <div key={item.uuid || item._id} className="practice-item">
              <div className="practice-item-header">
                <div className="practice-item-info">
                  <h3>{item.question_prompt || "Question"}</h3>
                  <div className="practice-item-meta">
                    {item.is_marked_practiced && (
                      <span className="badge badge-success">✓ Practiced</span>
                    )}
                    {item.response_html && !item.is_marked_practiced && (
                      <span className="badge badge-info">💾 Saved</span>
                    )}
                    {item.practice_count && (
                      <span className="meta-text">
                        Practiced {item.practice_count} time
                        {item.practice_count > 1 ? "s" : ""}
                      </span>
                    )}
                    {item.last_practiced && (
                      <span className="meta-text">
                        Last: {new Date(item.last_practiced).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="practice-item-actions">
                <button
                  className="btn-review"
                  onClick={() =>
                    navigate(
                      `/interview/questions/practice/${item.question_uuid || item.question_id}`
                    )
                  }
                >
                  Review →
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-practice">
            <p>📚 No practice history yet</p>
            <p>Start practicing questions to build your interview skills!</p>
            <button
              className="btn-start"
              onClick={() => navigate("/interview/question-library")}
            >
              Go to Question Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPractice;
