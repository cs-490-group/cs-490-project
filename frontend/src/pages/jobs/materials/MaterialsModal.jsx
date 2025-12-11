import React, { useState, useEffect } from "react";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";

const getCompanyName = (company) => {
    if (company === null || company === undefined) return "Unknown Company";
    if (typeof company === 'string') return company;
    if (typeof company === 'object') return company.name || "Company Info Available";
    return "Unknown Company";
};

export default function MaterialsModal({ job, onClose, onSave }) {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedCoverLetter, setSelectedCoverLetter] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [materialsHistory, setMaterialsHistory] = useState(job?.materials_history || []);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (resumes.length > 0 && job?.materials?.resume_id) {
      console.log('🔍 Setting selected resume from job.materials:', job.materials.resume_id);
      setSelectedResume(job.materials.resume_id);
    }
  }, [resumes, job?.materials?.resume_id]);

  useEffect(() => {
    if (coverLetters.length > 0 && job?.materials?.cover_letter_id) {
      console.log('🔍 Setting selected cover letter from job.materials:', job.materials.cover_letter_id);
      setSelectedCoverLetter(job.materials.cover_letter_id);
    }
  }, [coverLetters, job?.materials?.cover_letter_id]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const resumesResponse = await ResumesAPI.getAll();
      const resumesData = resumesResponse?.data || [];
      console.log('📝 Loaded resumes:', resumesData);
      setResumes(resumesData);

      const coverLettersResponse = await CoverLetterAPI.getAll();
      const coverLettersData = coverLettersResponse?.data || [];
      console.log('✉️ Loaded cover letters:', coverLettersData);
      setCoverLetters(coverLettersData);
    } catch (error) {
      console.error("Failed to load materials:", error);
      alert("Failed to load materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (material, type) => {
    try {
      const materialId = getMaterialId(material);
      
      if (type === 'resume') {
        // For resumes, navigate to preview page
        window.open(`/resumes/preview/${materialId}`, '_blank');
      } else {
        // For cover letters, navigate to edit page
        window.open(`/cover-letter/edit/${materialId}`, '_blank');
      }
    } catch (error) {
      console.error("Error viewing file:", error);
      alert("Failed to view file. Please try again.");
    }
  };

  const getMaterialId = (material) => {
    return material._id || material.id || material.resume_id || material.cover_letter_id;
  };

  const handleSave = async () => {
    console.log('💾 handleSave called');
    console.log('Selected Resume:', selectedResume);
    console.log('Selected Cover Letter:', selectedCoverLetter);

    const resumeId = selectedResume || null;
    const coverLetterId = selectedCoverLetter || null;

    console.log('Final Resume ID:', resumeId);
    console.log('Final Cover Letter ID:', coverLetterId);

    const selectedResumeObj = resumes.find(r => getMaterialId(r) === resumeId);
    const selectedCoverLetterObj = coverLetters.find(c => getMaterialId(c) === coverLetterId);

    const historyEntry = {
      date: new Date().toISOString(),
      resume_id: resumeId,
      cover_letter_id: coverLetterId,
      resume_version: selectedResumeObj?.version_name || selectedResumeObj?.name || null,
      cover_letter_version: selectedCoverLetterObj?.version_name || selectedCoverLetterObj?.title || null,
      action: job?.materials ? 'updated' : 'added'
    };

    const materials = {
      resume_id: resumeId,
      cover_letter_id: coverLetterId,
      resume_name: selectedResumeObj?.file_name || selectedResumeObj?.name || null,
      resume_version: selectedResumeObj?.version_name || selectedResumeObj?.name || null,
      cover_letter_name: selectedCoverLetterObj?.file_name || selectedCoverLetterObj?.title || selectedCoverLetterObj?.name || null,
      cover_letter_version: selectedCoverLetterObj?.version_name || selectedCoverLetterObj?.title || null,
      linked_date: new Date().toISOString()
    };

    const currentHistory = job?.materials_history || [];
    const updatedMaterialsHistory = [...currentHistory, historyEntry];

    console.log('💾 Saving materials to job:', {
      jobId: job.id,
      materials,
      historyLength: updatedMaterialsHistory.length,
      previousHistoryLength: currentHistory.length
    });

    const updatedJob = { 
      ...job, 
      materials,
      materials_history: updatedMaterialsHistory
    };

    await onSave(updatedJob);
    
    console.log('✅ Materials saved successfully');
  };

  const MaterialCard = ({ material, type, selected, onSelect }) => {
    const materialId = getMaterialId(material);
    const fileName = material.file_name || material.name || material.title || 'Unnamed Document';
    const versionName = material.version_name || material.version || 'Version 1';
    const uploadDate = material.created_at || material.uploadDate || material.date_created || new Date().toISOString();
    const fileSize = material.file_size || 0;
    
    const usageCount = material.usage_count || material.used_for?.length || 0;

    return (
      <div style={{
        padding: "12px",
        border: selected ? "2px solid #4f8ef7" : "1px solid #ddd",
        borderRadius: "6px",
        marginBottom: "8px",
        background: selected ? "#e3f2fd" : "white",
        cursor: "pointer"
      }}
      onClick={() => onSelect(materialId)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
              {fileName}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
              Version: {versionName}
            </div>
            <div style={{ fontSize: "11px", color: "#999" }}>
              Created: {new Date(uploadDate).toLocaleDateString()}
            </div>
            {fileSize > 0 && (
              <div style={{ fontSize: "11px", color: "#999" }}>
                Size: {(fileSize / 1024).toFixed(1)} KB
              </div>
            )}
            {usageCount > 0 && (
              <div style={{ fontSize: "11px", color: "#2196f3", marginTop: "4px" }}>
                Used for {usageCount} application(s)
              </div>
            )}
            {(material.default_resume || material.default_cover_letter) && (
              <div style={{ 
                fontSize: "10px", 
                color: "#4caf50", 
                marginTop: "4px",
                fontWeight: "600"
              }}>
                ⭐ DEFAULT
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleView(material, type);
              }}
              style={{
                padding: "4px 8px",
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px"
              }}
            >
              👁 View
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
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
          zIndex: 2000
        }}
      >
        <div style={{ background: "white", padding: "40px", borderRadius: "8px" }}>
          <div style={{ fontSize: "18px", color: "#333", textAlign: "center" }}>
            Loading materials...
          </div>
        </div>
      </div>
    );
  }

  const selectedResumeObj = resumes.find(r => getMaterialId(r) === selectedResume);
  const selectedCoverLetterObj = coverLetters.find(c => getMaterialId(c) === selectedCoverLetter);

  const selectedResumeName = selectedResumeObj?.name || selectedResumeObj?.file_name || "None selected";
  const selectedCoverLetterName = selectedCoverLetterObj?.title || selectedCoverLetterObj?.name || "None selected";

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
          maxWidth: "1000px",
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
          at {getCompanyName(job.company)}
        </p>

        <div style={{ marginBottom: "16px", padding: "12px", background: "#f0f0f0", borderRadius: "4px", fontSize: "12px" }}>
          <div><strong>Current Selection:</strong></div>
          <div style={{ marginTop: "8px" }}>
            <strong>Resume:</strong> {selectedResumeName}
          </div>
          <div>
            <strong>Cover Letter:</strong> {selectedCoverLetterName}
          </div>
          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #ddd", fontSize: "11px", color: "#666" }}>
            {resumes.length} resume(s) | {coverLetters.length} cover letter(s) available
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: "6px 12px",
              background: showHistory ? "#4f8ef7" : "#e0e0e0",
              color: showHistory ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            📜 {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && materialsHistory.length > 0 && (
          <div style={{ marginBottom: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "6px" }}>
            <h3 style={{ fontSize: "16px", marginTop: 0, color: "#333" }}>📜 Materials History</h3>
            {materialsHistory.map((entry, idx) => (
              <div key={idx} style={{ 
                padding: "8px", 
                borderLeft: "3px solid #4f8ef7", 
                marginBottom: "8px",
                paddingLeft: "12px"
              }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                  {new Date(entry.date).toLocaleString()} - <strong>{entry.action}</strong>
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  Resume: {entry.resume_version || 'None'} | Cover Letter: {entry.cover_letter_version || 'None'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>📝 Resumes ({resumes.length})</h3>
              <a 
                href="/resumes/templates" 
                target="_blank"
                style={{
                  padding: "6px 12px",
                  background: "#34c759",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block"
                }}
              >
                + Create New Resume
              </a>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {resumes.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px", border: "2px dashed #ddd", borderRadius: "6px" }}>
                  No resumes available. <a href="/resumes/templates" target="_blank">Create one</a>
                </div>
              ) : (
                resumes.map((resume, idx) => {
                  const resumeId = getMaterialId(resume);
                  return (
                    <MaterialCard
                      key={resumeId || idx}
                      material={resume}
                      type="resume"
                      selected={selectedResume === resumeId}
                      onSelect={setSelectedResume}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>✉️ Cover Letters ({coverLetters.length})</h3>
              <a 
                href="/cover-letter" 
                target="_blank"
                style={{
                  padding: "6px 12px",
                  background: "#34c759",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block"
                }}
              >
                + Create New Cover Letter
              </a>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {coverLetters.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px", border: "2px dashed #ddd", borderRadius: "6px" }}>
                  No cover letters available. <a href="/cover-letter" target="_blank">Create one</a>
                </div>
              ) : (
                coverLetters.map((letter, idx) => {
                  const letterId = getMaterialId(letter);
                  return (
                    <MaterialCard
                      key={letterId || idx}
                      material={letter}
                      type="coverLetter"
                      selected={selectedCoverLetter === letterId}
                      onSelect={setSelectedCoverLetter}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px", padding: "16px", background: "#fffbea", borderRadius: "6px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Selected Materials:
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Resume: {selectedResumeName}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Cover Letter: {selectedCoverLetterName}
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