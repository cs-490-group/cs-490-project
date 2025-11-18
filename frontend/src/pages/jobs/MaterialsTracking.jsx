import React, { useState, useEffect } from "react";

// Materials Management Modal
export function MaterialsModal({ job, onClose, onSave }) {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [selectedResume, setSelectedResume] = useState(job?.materials?.resume_id || "");
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(job?.materials?.cover_letter_id || "");
  const [uploadType, setUploadType] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      // Load from localStorage for now (can be replaced with API calls)
      const savedResumes = JSON.parse(localStorage.getItem('resumes') || '[]');
      const savedCoverLetters = JSON.parse(localStorage.getItem('coverLetters') || '[]');
      setResumes(savedResumes);
      setCoverLetters(savedCoverLetters);
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf' && !file.type.includes('word')) {
      alert("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        const newMaterial = {
          id: Date.now().toString(),
          name: file.name,
          version: prompt("Enter version name (e.g., 'Tech Companies v2', 'General'):", "Version 1"),
          uploadDate: new Date().toISOString(),
          fileData: base64Data,
          fileType: file.type,
          fileSize: file.size,
          usedFor: []
        };

        if (type === 'resume') {
          const updated = [...resumes, newMaterial];
          setResumes(updated);
          localStorage.setItem('resumes', JSON.stringify(updated));
          setSelectedResume(newMaterial.id);
        } else {
          const updated = [...coverLetters, newMaterial];
          setCoverLetters(updated);
          localStorage.setItem('coverLetters', JSON.stringify(updated));
          setSelectedCoverLetter(newMaterial.id);
        }
        
        setUploadType(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (material) => {
    try {
      const link = document.createElement('a');
      link.href = `data:${material.fileType};base64,${material.fileData}`;
      link.download = material.name;
      link.click();
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const handleDelete = (id, type) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    if (type === 'resume') {
      const updated = resumes.filter(r => r.id !== id);
      setResumes(updated);
      localStorage.setItem('resumes', JSON.stringify(updated));
      if (selectedResume === id) setSelectedResume("");
    } else {
      const updated = coverLetters.filter(c => c.id !== id);
      setCoverLetters(updated);
      localStorage.setItem('coverLetters', JSON.stringify(updated));
      if (selectedCoverLetter === id) setSelectedCoverLetter("");
    }
  };

  const handleSave = () => {
    const selectedResumeObj = resumes.find(r => r.id === selectedResume);
    const selectedCoverLetterObj = coverLetters.find(c => c.id === selectedCoverLetter);

    // Update usage tracking
    if (selectedResumeObj) {
      selectedResumeObj.usedFor = [...(selectedResumeObj.usedFor || []), {
        jobTitle: job.title,
        company: job.company,
        date: new Date().toISOString()
      }];
      localStorage.setItem('resumes', JSON.stringify(resumes));
    }

    if (selectedCoverLetterObj) {
      selectedCoverLetterObj.usedFor = [...(selectedCoverLetterObj.usedFor || []), {
        jobTitle: job.title,
        company: job.company,
        date: new Date().toISOString()
      }];
      localStorage.setItem('coverLetters', JSON.stringify(coverLetters));
    }

    const materials = {
      resume_id: selectedResume || null,
      resume_name: selectedResumeObj?.name || null,
      resume_version: selectedResumeObj?.version || null,
      cover_letter_id: selectedCoverLetter || null,
      cover_letter_name: selectedCoverLetterObj?.name || null,
      cover_letter_version: selectedCoverLetterObj?.version || null,
      linked_date: new Date().toISOString()
    };

    onSave({ ...job, materials });
    onClose();
  };

  const MaterialCard = ({ material, type, selected, onSelect }) => (
    <div style={{
      padding: "12px",
      border: selected ? "2px solid #4f8ef7" : "1px solid #ddd",
      borderRadius: "6px",
      marginBottom: "8px",
      background: selected ? "#e3f2fd" : "white",
      cursor: "pointer"
    }}
    onClick={() => onSelect(material.id)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
            {material.name}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Version: {material.version}
          </div>
          <div style={{ fontSize: "11px", color: "#999" }}>
            Uploaded: {new Date(material.uploadDate).toLocaleDateString()}
          </div>
          <div style={{ fontSize: "11px", color: "#999" }}>
            Size: {(material.fileSize / 1024).toFixed(1)} KB
          </div>
          {material.usedFor && material.usedFor.length > 0 && (
            <div style={{ fontSize: "11px", color: "#2196f3", marginTop: "4px" }}>
              Used for {material.usedFor.length} application(s)
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(material);
            }}
            style={{
              padding: "4px 8px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px"
            }}
          >
            📥 Download
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(material.id, type);
            }}
            style={{
              padding: "4px 8px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px"
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "8px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "24px"
        }}
      >
        <h2 style={{ marginTop: 0, color: "#333" }}>
          📄 Application Materials - {job.title}
        </h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          at {job.company}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Resumes Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>📝 Resumes</h3>
              <button
                onClick={() => setUploadType('resume')}
                style={{
                  padding: "6px 12px",
                  background: "#34c759",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                + Upload Resume
              </button>
            </div>

            {uploadType === 'resume' && (
              <div style={{ marginBottom: "12px", padding: "12px", background: "#f0f7ff", borderRadius: "6px" }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'resume')}
                  disabled={uploading}
                  style={{ fontSize: "13px" }}
                />
                <button
                  onClick={() => setUploadType(null)}
                  style={{
                    marginLeft: "8px",
                    padding: "4px 8px",
                    background: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {resumes.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px", border: "2px dashed #ddd", borderRadius: "6px" }}>
                  No resumes uploaded yet
                </div>
              ) : (
                resumes.map(resume => (
                  <MaterialCard
                    key={resume.id}
                    material={resume}
                    type="resume"
                    selected={selectedResume === resume.id}
                    onSelect={setSelectedResume}
                  />
                ))
              )}
            </div>
          </div>

          {/* Cover Letters Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>✉️ Cover Letters</h3>
              <button
                onClick={() => setUploadType('coverLetter')}
                style={{
                  padding: "6px 12px",
                  background: "#34c759",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                + Upload Cover Letter
              </button>
            </div>

            {uploadType === 'coverLetter' && (
              <div style={{ marginBottom: "12px", padding: "12px", background: "#f0f7ff", borderRadius: "6px" }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'coverLetter')}
                  disabled={uploading}
                  style={{ fontSize: "13px" }}
                />
                <button
                  onClick={() => setUploadType(null)}
                  style={{
                    marginLeft: "8px",
                    padding: "4px 8px",
                    background: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {coverLetters.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px", border: "2px dashed #ddd", borderRadius: "6px" }}>
                  No cover letters uploaded yet
                </div>
              ) : (
                coverLetters.map(letter => (
                  <MaterialCard
                    key={letter.id}
                    material={letter}
                    type="coverLetter"
                    selected={selectedCoverLetter === letter.id}
                    onSelect={setSelectedCoverLetter}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px", padding: "16px", background: "#fffbea", borderRadius: "6px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Selected Materials:
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Resume: {resumes.find(r => r.id === selectedResume)?.version || "None selected"}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Cover Letter: {coverLetters.find(c => c.id === selectedCoverLetter)?.version || "None selected"}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
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
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            💾 Save Materials
          </button>
        </div>
      </div>
    </div>
  );
}

// Materials Analytics Component
export function MaterialsAnalytics() {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = () => {
    try {
      const savedResumes = JSON.parse(localStorage.getItem('resumes') || '[]');
      const savedCoverLetters = JSON.parse(localStorage.getItem('coverLetters') || '[]');
      setResumes(savedResumes);
      setCoverLetters(savedCoverLetters);
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, color: "#333" }}>📊 Materials Usage Analytics</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Resume Versions</h4>
          {resumes.map(resume => (
            <div key={resume.id} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px", marginBottom: "8px" }}>
              <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                {resume.version}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                Used for: {resume.usedFor?.length || 0} applications
              </div>
              {resume.usedFor && resume.usedFor.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  {resume.usedFor.slice(0, 3).map((usage, idx) => (
                    <div key={idx} style={{ color: "#555", marginBottom: "2px" }}>
                      • {usage.jobTitle} at {usage.company}
                    </div>
                  ))}
                  {resume.usedFor.length > 3 && (
                    <div style={{ color: "#999", fontStyle: "italic" }}>
                      + {resume.usedFor.length - 3} more...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {resumes.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
              No resumes tracked yet
            </div>
          )}
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Cover Letter Versions</h4>
          {coverLetters.map(letter => (
            <div key={letter.id} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px", marginBottom: "8px" }}>
              <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                {letter.version}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                Used for: {letter.usedFor?.length || 0} applications
              </div>
              {letter.usedFor && letter.usedFor.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  {letter.usedFor.slice(0, 3).map((usage, idx) => (
                    <div key={idx} style={{ color: "#555", marginBottom: "2px" }}>
                      • {usage.jobTitle} at {usage.company}
                    </div>
                  ))}
                  {letter.usedFor.length > 3 && (
                    <div style={{ color: "#999", fontStyle: "italic" }}>
                      + {letter.usedFor.length - 3} more...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {coverLetters.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
              No cover letters tracked yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}