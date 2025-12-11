import { useState, useEffect } from "react";

export default function EmploymentForm({ onAdded, editEntry, cancelEdit }) {
  const [f, setF] = useState({
    title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [ongoing, setOngoing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (editEntry) {
      setF({
        title: editEntry.title || "",
        company: editEntry.company || "",
        location: editEntry.location || "",
        start_date: editEntry.start_date || "",
        end_date: editEntry.end_date || "",
        description: editEntry.description || "",
      });
      setOngoing(!editEntry.end_date);
    }
  }, [editEntry]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setF((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setF({
      title: "",
      company: "",
      location: "",
      start_date: "",
      end_date: "",
      description: "",
    });
    setOngoing(false);
    setErr("");
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!f.title.trim()) return setErr("Title is required.");
    if (!f.start_date) return setErr("Start date is required.");
    
    // Check if end date is before start date
    if (f.end_date && new Date(f.end_date) < new Date(f.start_date)) {
      return setErr("End date cannot be before start date.");
    }

    setSaving(true);
    
    const employmentData = {
      id: editEntry?.id,
      title: f.title.trim(),
      company: f.company || "",
      location: f.location || "",
      start_date: f.start_date,
      end_date: ongoing ? null : f.end_date || "",
      description: f.description || "",
    };

    onAdded?.(employmentData);

    resetForm();
    setSaving(false);
    cancelEdit && cancelEdit();
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
        {editEntry ? "✏️ Edit Employment" : "💼 Add Employment"}
      </h2>

      <form onSubmit={submit}>
        {/* Basic Information */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📋 Position Details
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Job Title *</label>
              <input
                style={inputStyle}
                name="title"
                placeholder="e.g., Software Engineer"
                value={f.title}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input
                style={inputStyle}
                name="company"
                placeholder="e.g., Tech Corp Inc."
                value={f.company}
                onChange={onChange}
              />
            </div>
          </div>

          <label style={labelStyle}>Location</label>
          <input
            style={inputStyle}
            name="location"
            placeholder="e.g., New York, NY or Remote"
            value={f.location}
            onChange={onChange}
          />
        </div>

        {/* Timeline */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📅 Employment Timeline
          </h3>

          <label style={labelStyle}>Start Date *</label>
          <input
            style={inputStyle}
            type="date"
            name="start_date"
            value={f.start_date}
            onChange={onChange}
            required
          />

          {!ongoing && (
            <>
              <label style={labelStyle}>End Date</label>
              <input
                style={inputStyle}
                type="date"
                name="end_date"
                value={f.end_date}
                onChange={onChange}
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
              checked={ongoing}
              onChange={(e) => {
                setOngoing(e.target.checked);
                if (e.target.checked) {
                  setF(prev => ({ ...prev, end_date: "" }));
                }
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Currently Working Here
          </label>
        </div>

        {/* Description */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📝 Job Description
          </h3>

          <label style={labelStyle}>Responsibilities & Achievements</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: "120px",
              resize: "vertical",
              fontFamily: "inherit"
            }}
            name="description"
            placeholder="Describe your key responsibilities, achievements, and impact..."
            value={f.description}
            onChange={onChange}
          />
        </div>

        {err && (
          <div style={{
            color: "#ff3b30",
            background: "#ffebee",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            {err}
          </div>
        )}

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
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? "Saving..." : editEntry ? "💾 Save Changes" : "➕ Add Employment"}
          </button>
        </div>
      </form>
    </div>
  );
}
