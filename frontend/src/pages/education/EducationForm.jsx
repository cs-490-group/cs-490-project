import React, { useState, useEffect } from "react";

export default function EducationForm({ addEntry, editEntry, cancelEdit }) {
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationDate, setGraduationDate] = useState("");
  const [currentlyEnrolled, setCurrentlyEnrolled] = useState(false);
  const [gpa, setGpa] = useState("");
  const [gpaPrivate, setGpaPrivate] = useState(false);
  const [achievements, setAchievements] = useState("");
  const [id, setId] = useState(null);

  const resetForm = () => {
    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setGraduationDate("");
    setCurrentlyEnrolled(false);
    setGpa("");
    setGpaPrivate(false);
    setAchievements("");
    setId(null);
  };

  useEffect(() => {
    if (editEntry) {
      setInstitution(editEntry.institution_name);
      setDegree(editEntry.degree || "");
      setFieldOfStudy(editEntry.field_of_study);
      setGraduationDate(editEntry.graduation_date || "");
      setCurrentlyEnrolled(editEntry.graduation_date === null || editEntry.currently_enrolled);
      setGpa(editEntry.gpa || "");
      setGpaPrivate(editEntry.gpa_private || false);
      setAchievements(editEntry.achievements || "");
      setId(editEntry.id);
    } else {
      resetForm();
    }
  }, [editEntry]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!institution.trim() || !degree.trim() || !fieldOfStudy.trim()) {
      return alert("Please fill in all required fields.");
    }

    if (!currentlyEnrolled && !graduationDate) {
      return alert(
        "Please provide a graduation date or mark as currently enrolled."
      );
    }

    const entryData = {
      id,
      institution_name: institution,
      degree,
      field_of_study: fieldOfStudy,
      graduation_date: currentlyEnrolled ? null : graduationDate,
      gpa: gpa || null,
      gpa_private: gpaPrivate,
      achievements: achievements || null,
    };

    if (editEntry) {
      editEntry.submit(entryData);
    } else {
      addEntry(entryData);
    }

    resetForm();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333"
  };

  const sectionStyle = {
    marginBottom: "20px",
    padding: "16px",
    background: "#f9f9f9",
    borderRadius: "6px"
  };

  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "24px"
    }}>
      <h2 style={{ marginTop: 0, color: "#333" }}>
        {editEntry ? "✏️ Edit Education" : "🎓 Add Education"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📋 Basic Information
          </h3>
          
          <label style={labelStyle}>Institution Name *</label>
          <input
            style={inputStyle}
            placeholder="e.g., University of Technology"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
          />

          <label style={labelStyle}>Degree/Education Level *</label>
          <select
            style={inputStyle}
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            required
          >
            <option value="" disabled>Select Education Level</option>
            <option value="High School Degree">🏫 High School</option>
            <option value="Associate Degree">📘 Associate Degree</option>
            <option value="Bachelor's Degree">🎓 Bachelor's Degree</option>
            <option value="Master's Degree">📚 Master's Degree</option>
            <option value="PhD/Doctorate">🔬 PhD / Doctorate</option>
            <option value="Certificate">📜 Certificate</option>
            <option value="Bootcamp">💻 Bootcamp</option>
          </select>

          <label style={labelStyle}>Field of Study *</label>
          <input
            style={inputStyle}
            placeholder="e.g., Computer Science, Business Administration"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            required
          />
        </div>

        {/* Timeline & Status */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📅 Timeline & Status
          </h3>

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            color: "#333"
          }}>
            <input
              type="checkbox"
              checked={currentlyEnrolled}
              onChange={(e) => setCurrentlyEnrolled(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Currently Enrolled
          </label>

          {!currentlyEnrolled && (
            <>
              <label style={labelStyle}>Graduation Date *</label>
              <input
                style={inputStyle}
                type="date"
                value={graduationDate}
                onChange={(e) => setGraduationDate(e.target.value)}
                required={!currentlyEnrolled}
              />
            </>
          )}
        </div>

        {/* Academic Performance */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📊 Academic Performance
          </h3>

          <label style={labelStyle}>GPA (Optional)</label>
          <input
            style={inputStyle}
            placeholder="e.g., 3.8"
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
          />

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            color: "#333"
          }}>
            <input
              type="checkbox"
              checked={gpaPrivate}
              onChange={(e) => setGpaPrivate(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Keep GPA Private
          </label>

          <label style={labelStyle}>Achievements / Honors (Optional)</label>
          <textarea
            style={{ 
              ...inputStyle, 
              minHeight: "100px", 
              resize: "vertical", 
              fontFamily: "inherit" 
            }}
            placeholder="e.g., Dean's List, Summa Cum Laude, Research Assistant, Published papers..."
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => {
              cancelEdit && cancelEdit();
              resetForm();
            }}
            style={{
              padding: "12px 24px",
              background: "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            {editEntry ? "💾 Save Changes" : "➕ Add Education"}
          </button>
        </div>
      </form>
    </div>
  );
}