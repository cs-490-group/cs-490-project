import React, { useState, useRef, useEffect } from "react";

export default function ProjectForm({ addProject, editProject, cancelEdit }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [noEndDate, setNoEndDate] = useState(false);
  const [skills, setSkills] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [details, setDetails] = useState("");
  const [achievements, setAchievements] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [id, setId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editProject) {
      setProjectName(editProject.project_name || "");
      setDescription(editProject.description || "");
      setRole(editProject.role || "");
      setStartDate(editProject.start_date || "");
      setEndDate(editProject.end_date || "");
      setNoEndDate(!editProject.end_date);
      setSkills(Array.isArray(editProject.skills) ? editProject.skills.join(", ") : editProject.skills || "");
      setTeamSize(editProject.team_size || "");
      setDetails(editProject.details || "");
      setAchievements(editProject.achievements || "");
      setIndustry(editProject.industry || "");
      setStatus(editProject.status || "");
      setProjectUrl(editProject.project_url || "");
      setId(editProject.id);
      setMediaFiles([]);
    }
  }, [editProject]);

  const resetForm = () => {
    setProjectName(""); setDescription(""); setRole(""); setStartDate(""); setEndDate(""); setNoEndDate(false);
    setSkills(""); setTeamSize(""); setDetails(""); setAchievements(""); setIndustry(""); setStatus(""); 
    setProjectUrl(""); setMediaFiles([]); setId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!projectName.trim()) return alert("Project Name is required");
    if (!role.trim()) return alert("Role is required");
    if (!startDate) return alert("Start Date is required");
    if (!teamSize || isNaN(teamSize) || parseInt(teamSize) <= 0) return alert("Team Size must be positive");
    if (!status) return alert("Please select a project status");

    // End Date Validation
    if (endDate && new Date(endDate) < new Date(startDate)) {
      return alert("End date cannot be earlier than start date.");
    }

    const projectData = {
      project_name: projectName.trim(),
      description: description.trim() || undefined,
      role: role.trim(),
      start_date: startDate,
      end_date: noEndDate ? undefined : (endDate || undefined),
      skills: skills.trim() ? skills.split(",").map(s => s.trim()) : undefined,
      team_size: parseInt(teamSize),
      details: details.trim() || undefined,
      achievements: achievements.trim() || undefined,
      industry: industry.trim() || undefined,
      status: status,
      project_url: projectUrl.trim() || undefined
    };

    if (editProject) {
      editProject.submit(projectData, mediaFiles);
    } else {
      addProject(projectData, mediaFiles);
    }

    resetForm();
    cancelEdit && cancelEdit();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
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
        {editProject ? "✏️ Edit Project" : "🚀 Add Project"}
      </h2>

      <div>
        {/* Basic Information */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📋 Basic Information
          </h3>
          
          <label style={labelStyle}>Project Name *</label>
          <input
            style={inputStyle}
            placeholder="e.g., E-Commerce Platform Redesign"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            required
          />

          <label style={labelStyle}>Your Role *</label>
          <input
            style={inputStyle}
            placeholder="e.g., Lead Developer, Project Manager"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Industry / Type</label>
              <input
                style={inputStyle}
                placeholder="e.g., Healthcare, FinTech"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Status *</label>
              <select
                style={inputStyle}
                value={status}
                onChange={e => setStatus(e.target.value)}
                required
              >
                <option value="" disabled>Select Status</option>
                <option value="Planned">📅 Planned</option>
                <option value="Ongoing">🔄 Ongoing</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Description</label>
          <textarea
            style={{ 
              ...inputStyle, 
              minHeight: "100px", 
              resize: "vertical", 
              fontFamily: "inherit" 
            }}
            placeholder="Describe the project and its goals..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Timeline & Team */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📅 Timeline & Team
          </h3>

          <label style={labelStyle}>Start Date *</label>
          <input
            style={inputStyle}
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />

          {!noEndDate && (
            <>
              <label style={labelStyle}>End Date</label>
              <input
                style={inputStyle}
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </>
          )}

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
              checked={noEndDate}
              onChange={e => {
                setNoEndDate(e.target.checked);
                if (e.target.checked) {
                  setEndDate("");
                }
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Ongoing / Continuous Project
          </label>

          <label style={labelStyle}>Team Size *</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="e.g., 5"
            value={teamSize}
            onChange={e => setTeamSize(e.target.value)}
            min="1"
            required
          />
        </div>

        {/* Technical Details */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            💻 Technical Details
          </h3>

          <label style={labelStyle}>Skills / Technologies (comma-separated)</label>
          <input
            style={inputStyle}
            placeholder="e.g., React, Python, AWS, Docker"
            value={skills}
            onChange={e => setSkills(e.target.value)}
          />

          <label style={labelStyle}>Project URL / Repository</label>
          <input
            style={inputStyle}
            type="url"
            placeholder="e.g., https://github.com/username/project"
            value={projectUrl}
            onChange={e => setProjectUrl(e.target.value)}
          />

          <label style={labelStyle}>Project Details</label>
          <textarea
            style={{ 
              ...inputStyle, 
              minHeight: "100px", 
              resize: "vertical", 
              fontFamily: "inherit" 
            }}
            placeholder="Additional details about your contributions, technologies used, etc..."
            value={details}
            onChange={e => setDetails(e.target.value)}
          />

          <label style={labelStyle}>Achievements / Outcomes</label>
          <textarea
            style={{ 
              ...inputStyle, 
              minHeight: "80px", 
              resize: "vertical", 
              fontFamily: "inherit" 
            }}
            placeholder="e.g., Increased performance by 40%, Reduced costs by $50k..."
            value={achievements}
            onChange={e => setAchievements(e.target.value)}
          />
        </div>

        {/* Media Upload*/}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📸 Media Files
          </h3>

          <label style={labelStyle}>Upload Screenshots / Documents (Multiple files supported)</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{
              ...inputStyle,
              padding: "8px",
              cursor: "pointer"
            }}
          />
          {mediaFiles.length > 0 && (
            <div style={{ 
              marginTop: "8px", 
              fontSize: "13px", 
              color: "#666" 
            }}>
              {mediaFiles.length} file(s) selected
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => {
              resetForm();
              cancelEdit && cancelEdit();
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
            type="button"
            onClick={handleSubmit}
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
            {editProject ? "💾 Save Changes" : "➕ Add Project"}
          </button>
        </div>
      </div>
    </div>
  );
}