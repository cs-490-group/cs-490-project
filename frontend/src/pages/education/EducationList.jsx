import React, { useEffect, useState } from "react";
import EducationForm from "./EducationForm";
import EducationAPI from "../../api/education";
import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

const degreeEmojis = {
  "High School Degree": "🏫",
  "Associate Degree": "📘",
  "Bachelor's Degree": "🎓",
  "Master's Degree": "📚",
  "PhD/Doctorate": "🔬",
};

const degreeColors = {
  "High School Degree": "#9e9e9e",
  "Associate Degree": "#2196f3",
  "Bachelor's Degree": "#4caf50",
  "Master's Degree": "#ff9800",
  "PhD/Doctorate": "#af52de",
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const normalizeEntry = (entry) => {
  return {
    id: entry._id || entry.id,
    degree: entry.degree,
    institution: entry.institution || entry.institution_name,
    institution_name: entry.institution || entry.institution_name,
    field_of_study: entry.field_of_study,
    graduation_date: entry.graduation_date,
    gpa: entry.gpa,
    gpa_private: entry.gpa_private || false,
    achievements: entry.achievements,
    currently_enrolled: !entry.graduation_date
  };
};

export default function EducationList() {
  const [entries, setEntries] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  
  useEffect(() => {
    if (location.state?.showForm) {
      setShowForm(true);
    }
  }, [location.state]);

  useEffect(() => {
    loadEducation();
  }, []);

  const loadEducation = async () => {
    try {
      setLoading(true);
      const response = await EducationAPI.getAll();
      const data = response.data;
      
      const transformedEntries = (data || []).map(normalizeEntry);
      
      setEntries(transformedEntries);
    } catch (error) {
      console.error("Failed to load education:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry) => {
    try {
      const response = await EducationAPI.add(entry);

      if (response.data && response.data.education_id) {
        const newEntry = normalizeEntry({ 
          ...entry, 
          id: response.data.education_id,
          _id: response.data.education_id
        });
        setEntries([newEntry, ...entries]);
      }
      setShowForm(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to add education. Please try again.");
    }
  };

  const submitEdit = async (updatedEntry) => {
    try {
      await EducationAPI.update(updatedEntry.id, updatedEntry);

      const normalizedEntry = normalizeEntry(updatedEntry);
      setEntries(entries.map((e) => (e.id === normalizedEntry.id ? normalizedEntry : e)));
      setEditEntry(null);
      setShowForm(false);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update education. Please try again.");
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this education entry?")) return;
    
    try {
      await EducationAPI.delete(id);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to delete education. Please try again.");
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.currently_enrolled && !b.currently_enrolled) return -1;
    if (!a.currently_enrolled && b.currently_enrolled) return 1;
    if (!a.graduation_date) return 1;
    if (!b.graduation_date) return -1;
    const dateA = parseLocalDate(a.graduation_date);
    const dateB = parseLocalDate(b.graduation_date);
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 py-4">
        <Container>
          <h1 className="text-center text-white fw-bold mb-5 display-4">
            Education History
          </h1>
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="light" className="mb-3" />
            <p className="text-white fs-5">Loading Education History data...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #005e9e, #00c28a)",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 20px",
        boxSizing: "border-box",
        }}
    >

    <div style={{ width: "100%", maxWidth: "1200px", }}>

    <div
      style={{
        display: "flex",
        flexDirection: "column", // ✅ stacks title & button vertically on small screens
        alignItems: "center",
        flexWrap: "wrap",
        textAlign: "center",
        gap: "15px", // adds clean spacing
        marginBottom: "30px",
      }}
    >
      
    {/* Wrap title + underline together */}
    <div style={{ display: "inline-block" }}>
      <h1
        style={{
          margin: 0,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          fontFamily: '"Playfair Display", serif',
          WebkitTextFillColor: "#ffffff", // ensures true white text
        }}
      >
        🎓 Education History
      </h1>

      {/* Gradient underline centered under text */}
      <div
        style={{
          width: "120px", // you can tweak this 
          height: "4px",
          margin: "6px auto 0",
          borderRadius: "2px",
          background: "linear-gradient(90deg, #00c28a, #005e9e)", 
        }}
      />
    </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditEntry(null);
          }}
          style={{
            padding: "12px 24px",
            background: "#4f8ef7",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {showForm ? "← Cancel" : "+ Add Education"}
        </button>
      </div>

      {showForm && (
        <EducationForm
          addEntry={addEntry}
          editEntry={editEntry ? { ...editEntry, submit: submitEdit } : null}
          cancelEdit={() => {
            setEditEntry(null);
            setShowForm(false);
          }}
        />
      )}

      {!showForm && (
        <>
          {sortedEntries.length === 0 ? (
            <div
              style={{
                background: "#f9f9f9",
                padding: "40px",
                borderRadius: "8px",
                textAlign: "center",
                color: "#999"
              }}
            >
              <p style={{ fontSize: "16px" }}>No education entries yet. Add your first one!</p>
            </div>
          ) : (
            <div style={{ position: "relative", marginTop: "40px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "30px",
                  top: "8px",
                  bottom: 0,
                  width: "3px",
                  background: "linear-gradient(to bottom, #4f8ef7, #e0e0e0)",
                  zIndex: 0
                }}
              />

              {sortedEntries.map((entry, index) => {
                const yearLabel = entry.currently_enrolled
                  ? "Present"
                  : entry.graduation_date
                  ? parseLocalDate(entry.graduation_date).getFullYear()
                  : "N/A";

                const emoji = degreeEmojis[entry.degree] || "🎓";
                const color = degreeColors[entry.degree] || "#4f8ef7";

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "30px",
                      position: "relative",
                      zIndex: 1
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        display: "flex",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          border: "3px solid white",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px"
                        }}
                      />
                    </div>

                    <div
                      style={{
                        width: "80px",
                        textAlign: "right",
                        marginRight: "20px",
                        fontSize: "14px",
                        fontWeight: "700",
                        marginTop: "6px",
                        color: entry.currently_enrolled ? "#4f8ef7" : "#666",
                        flexShrink: 0
                      }}
                    >
                      {yearLabel}
                    </div>

                    <div
                      style={{
                        border: "2px solid #ddd",
                        borderRadius: "8px",
                        padding: "16px",
                        background: entry.currently_enrolled
                          ? "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)"
                          : "white",
                        flex: 1,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        borderLeft: `4px solid ${color}`
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "12px"
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px"
                            }}
                          >
                            <span style={{ fontSize: "24px" }}>{emoji}</span>
                            <h3
                              style={{
                                margin: 0,
                                color: "#333",
                                fontSize: "18px"
                              }}
                            >
                              {entry.degree}
                            </h3>
                          </div>
                          <p
                            style={{
                              margin: "4px 0",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#4f8ef7"
                            }}
                          >
                            {entry.institution}
                          </p>
                          <p
                            style={{
                              margin: "4px 0",
                              fontSize: "14px",
                              color: "#666"
                            }}
                          >
                            📚 {entry.field_of_study}
                          </p>
                        </div>

                        {entry.currently_enrolled && (
                          <span
                            style={{
                              background: "#4f8ef7",
                              color: "white",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              whiteSpace: "nowrap"
                            }}
                          >
                            In Progress
                          </span>
                        )}
                      </div>

                      {!entry.gpa_private && entry.gpa && (
                        <div
                          style={{
                            marginBottom: "8px",
                            padding: "8px 12px",
                            background: "#f0f7ff",
                            borderRadius: "4px",
                            display: "inline-block"
                          }}
                        >
                          <strong style={{ color: "#333" }}>GPA:</strong>{" "}
                          <span
                            style={{
                              color: "#4f8ef7",
                              fontWeight: "600",
                              fontSize: "15px"
                            }}
                          >
                            {entry.gpa}
                          </span>
                        </div>
                      )}

                      {entry.achievements && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            background: "#fffbea",
                            borderRadius: "6px",
                            borderLeft: "3px solid #ffc107"
                          }}
                        >
                          <strong style={{ color: "#333", fontSize: "14px" }}>
                            🏆 Achievements:
                          </strong>
                          <p
                            style={{
                              margin: "6px 0 0 0",
                              color: "#555",
                              fontSize: "13px",
                              lineHeight: "1.6"
                            }}
                          >
                            {entry.achievements}
                          </p>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "16px",
                          paddingTop: "12px",
                          borderTop: "1px solid #eee"
                        }}
                      >
                        <button
                          onClick={() => {
                            setEditEntry(entry);
                            setShowForm(true);
                          }}
                          style={{
                            padding: "8px 16px",
                            background: "#34c759",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600"
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          style={{
                            padding: "8px 16px",
                            background: "#ff3b30",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}