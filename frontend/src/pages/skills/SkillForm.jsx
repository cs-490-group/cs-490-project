import React, { useState } from "react";

const commonSkillsByCategory = {
  Technical: [
    "Python", "JavaScript", "Java", "C++", "C#", "SQL", "React", "Node.js",
    "Angular", "Vue.js", "TypeScript", "HTML", "CSS", "Docker", "Kubernetes",
    "AWS", "Azure", "GCP", "Git", "Linux", "REST API", "GraphQL", "Machine Learning",
    "Data Analysis", "CI/CD"
  ],
  "Soft Skills": [
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management",
    "Adaptability", "Creativity", "Critical Thinking", "Conflict Resolution", "Decision Making",
    "Empathy", "Networking", "Presentation Skills", "Negotiation", "Collaboration",
    "Mentoring", "Active Listening", "Resilience", "Motivation", "Emotional Intelligence"
  ],
  Languages: [
    "English", "Spanish", "French", "Mandarin", "German", "Japanese", "Korean",
    "Arabic", "Portuguese", "Russian", "Italian", "Hindi", "Bengali", "Turkish",
    "Vietnamese", "Persian", "Dutch", "Swedish", "Norwegian", "Polish"
  ],
  "Industry-Specific": [
    "Project Management", "Finance", "Healthcare", "Quality Assurance", "Regulatory Compliance",
    "Marketing", "Sales", "Operations", "Supply Chain", "Logistics",
    "Human Resources", "Legal", "Risk Management", "Engineering", "Construction",
    "Education", "Research", "Customer Experience", "Data Privacy", "Cybersecurity"
  ]
};

export default function SkillForm({ addSkill, existingSkills }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const allSkills = Object.values(commonSkillsByCategory).flat();

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    if (value.trim()) {
      const filtered = allSkills.filter(skill =>
        skill.toLowerCase().startsWith(value.toLowerCase()) &&
        skill.toLowerCase() !== value.toLowerCase() &&
        !existingSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) return alert("Please enter a skill name");
    if (!category) return alert("Please select a skill category");
    if (!proficiency) return alert("Please select a proficiency level");

    if (existingSkills.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      return alert("Skill already exists");
    }

    addSkill({
      name: trimmedName,
      category,
      proficiency
    });

    setName("");
    setCategory("");
    setProficiency("");
    setSuggestions([]);
  };

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "24px"
    }}>
      <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#333" }}>➕ Add New Skill</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          alignItems: "start",
          justifyContent: "center",
        }}>
          <div style={{ position: "relative" }}>
            <input
              placeholder="Skill name (e.g., JavaScript, Leadership)"
              value={name}
              onChange={handleNameChange}
              style={{ ...inputStyle, width: "100%" }}
              required
            />
            {suggestions.length > 0 && (
              <ul style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                border: "1px solid #ccc",
                borderTop: "none",
                maxHeight: "150px",
                overflowY: "auto",
                margin: 0,
                padding: 0,
                listStyle: "none",
                backgroundColor: "white",
                zIndex: 100,
                borderRadius: "0 0 4px 4px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
              }}>
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#333",
                      borderBottom: i < suggestions.length - 1 ? "1px solid #f0f0f0" : "none"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                    onClick={() => {
                      setName(s);
                      setSuggestions([]);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            style={inputStyle}
            required
          >
            <option value="" disabled>Category</option>
            <option value="Technical">💻 Technical</option>
            <option value="Soft Skills">🗣️ Soft Skills</option>
            <option value="Languages">🌐 Languages</option>
            <option value="Industry-Specific">🏭 Industry</option>
          </select>

          <select 
            value={proficiency} 
            onChange={(e) => setProficiency(e.target.value)} 
            style={inputStyle}
            required
          >
            <option value="" disabled>Proficiency</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          <button 
            type="submit"
            style={{
              padding: "10px 20px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              whiteSpace: "nowrap"
            }}
          >
            Add Skill
          </button>
        </div>
      </form>
    </div>
  );
}
