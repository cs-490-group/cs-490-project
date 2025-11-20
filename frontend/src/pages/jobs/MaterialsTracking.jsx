import React, { useState, useEffect } from "react";
import ResumesAPI from "../../api/resumes";
import CoverLetterAPI from "../../api/coverLetters";

// Materials Management Modal
export function MaterialsModal({ job, onClose, onSave }) {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedCoverLetter, setSelectedCoverLetter] = useState("");
  
  const [uploadType, setUploadType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ v1: null, v2: null });
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

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('word')) {
      alert("Please upload a PDF or Word document");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File must be less than 10MB");
      return;
    }

    const versionName = prompt("Enter version name (e.g., 'Tech Companies v2', 'General'):", "Version 1");
    if (!versionName) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('version_name', versionName);
      formData.append('description', `Uploaded for ${job.title} at ${job.company}`);

      console.log(`📤 Uploading ${type}...`);

      if (type === 'resume') {
        const response = await ResumesAPI.add(formData);
        console.log('✅ Resume upload response:', response);
        const newResume = response.data;
        
        const resumeId = newResume._id || newResume.id || newResume.resume_id;
        console.log('📌 New resume ID:', resumeId);
        
        setResumes([...resumes, newResume]);
        setSelectedResume(resumeId);
      } else {
        const response = await CoverLetterAPI.upload(formData);
        console.log('✅ Cover letter upload response:', response);
        const newCoverLetter = response.data;
        
        const coverLetterId = newCoverLetter._id || newCoverLetter.id || newCoverLetter.cover_letter_id;
        console.log('📌 New cover letter ID:', coverLetterId);
        
        setCoverLetters([...coverLetters, newCoverLetter]);
        setSelectedCoverLetter(coverLetterId);
      }
      
      setUploadType(null);
      alert('✅ File uploaded successfully!');
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (material, type) => {
    try {
      const materialId = getMaterialId(material);
      
      let response;
      if (type === 'resume') {
        response = await ResumesAPI.get(materialId);
      } else {
        response = await CoverLetterAPI.get(materialId);
      }

      if (response.data.file_url) {
        window.open(response.data.file_url, '_blank');
      } else if (response.data.file_content) {
        const blob = new Blob([response.data.file_content], { type: material.file_type || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = material.file_name || material.name || `document.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert("Download not available for this file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const handleView = async (material, type) => {
    try {
      const materialId = getMaterialId(material);
      
      let response;
      if (type === 'resume') {
        response = await ResumesAPI.get(materialId);
      } else {
        response = await CoverLetterAPI.get(materialId);
      }

      if (response.data.file_url) {
        window.open(response.data.file_url, '_blank');
      } else if (response.data.file_content) {
        const blob = new Blob([response.data.file_content], { type: material.file_type || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        alert("Preview not available for this file");
      }
    } catch (error) {
      console.error("Error viewing file:", error);
      alert("Failed to view file. Please try again.");
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      if (type === 'resume') {
        await ResumesAPI.delete(id);
        setResumes(resumes.filter(r => getMaterialId(r) !== id));
        if (selectedResume === id) setSelectedResume("");
      } else {
        await CoverLetterAPI.delete(id);
        setCoverLetters(coverLetters.filter(c => getMaterialId(c) !== id));
        if (selectedCoverLetter === id) setSelectedCoverLetter("");
      }
      alert('✅ Document deleted successfully!');
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  const handleSetDefault = async (id, type) => {
    try {
      if (type === 'resume') {
        await ResumesAPI.setDefault(id);
        setResumes(resumes.map(r => ({
          ...r,
          is_default: getMaterialId(r) === id
        })));
      } else {
        await CoverLetterAPI.setDefault(id);
        setCoverLetters(coverLetters.map(c => ({
          ...c,
          is_default: getMaterialId(c) === id
        })));
      }
      alert('✅ Default material set successfully!');
    } catch (error) {
      console.error("Error setting default:", error);
      alert("Failed to set default. Please try again.");
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

    // FIX: Get the actual material objects to extract names
    const selectedResumeObj = resumes.find(r => getMaterialId(r) === resumeId);
    const selectedCoverLetterObj = coverLetters.find(c => getMaterialId(c) === coverLetterId);

    const historyEntry = {
      date: new Date().toISOString(),
      resume_id: resumeId,
      cover_letter_id: coverLetterId,
      // FIX: Include version names in history
      resume_version: selectedResumeObj?.version_name || selectedResumeObj?.name || null,
      cover_letter_version: selectedCoverLetterObj?.version_name || selectedCoverLetterObj?.title || null,
      action: job?.materials ? 'updated' : 'added'
    };

    // FIX: Include material names in the materials object for immediate display
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

    console.log(`MaterialCard - ${type}:`, { materialId, fileName, versionName, selected, usageCount });

    return (
      <div style={{
        padding: "12px",
        border: selected ? "2px solid #4f8ef7" : "1px solid #ddd",
        borderRadius: "6px",
        marginBottom: "8px",
        background: selected ? "#e3f2fd" : "white",
        cursor: "pointer"
      }}
      onClick={() => {
        console.log(`Selected ${type}:`, materialId);
        onSelect(materialId);
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
              {fileName}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
              Version: {versionName}
            </div>
            <div style={{ fontSize: "11px", color: "#999" }}>
              Uploaded: {new Date(uploadDate).toLocaleDateString()}
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
            {material.is_default && (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(material, type);
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
                handleSetDefault(materialId, type);
              }}
              style={{
                padding: "4px 8px",
                background: material.is_default ? "#9e9e9e" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px"
              }}
              disabled={material.is_default}
            >
              ⭐ {material.is_default ? 'Default' : 'Set Default'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCompareVersions(prev => ({
                  ...prev,
                  [prev.v1 ? 'v2' : 'v1']: { material, type }
                }));
              }}
              style={{
                padding: "4px 8px",
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px"
              }}
            >
              🔄 Compare
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(materialId, type);
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
  };

  const selectedResumeObj = resumes.find(r => getMaterialId(r) === selectedResume);
  const selectedCoverLetterObj = coverLetters.find(c => getMaterialId(c) === selectedCoverLetter);

  // FIX: Get display names for debug info
  const selectedResumeName = selectedResumeObj?.name || selectedResumeObj?.file_name || "None selected";
  const selectedCoverLetterName = selectedCoverLetterObj?.title || selectedCoverLetterObj?.name || "None selected";

  console.log('Selected Resume Object:', selectedResumeObj);
  console.log('Selected Cover Letter Object:', selectedCoverLetterObj);

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
          at {job.company}
        </p>

        {/* FIX: Updated Debug Info with names instead of IDs */}
        <div style={{ marginBottom: "16px", padding: "12px", background: "#f0f0f0", borderRadius: "4px", fontSize: "12px" }}>
          <div><strong>Current Selection:</strong></div>
          <div style={{ marginTop: "8px" }}>
            <strong>Resume:</strong> {selectedResumeName}
          </div>
          <div>
            <strong>Cover Letter:</strong> {selectedCoverLetterName}
          </div>
          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #ddd", fontSize: "11px", color: "#666" }}>
            {resumes.length} resume(s) | {coverLetters.length} cover letter(s) loaded
          </div>
        </div>

        {/* Action Buttons */}
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
          <button
            onClick={() => setShowComparison(!showComparison)}
            style={{
              padding: "6px 12px",
              background: showComparison ? "#ff9800" : "#e0e0e0",
              color: showComparison ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            🔄 {showComparison ? 'Hide' : 'Show'} Comparison
          </button>
        </div>

        {/* Materials History */}
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
                  Resume ID: {entry.resume_id || 'None'} | Cover Letter ID: {entry.cover_letter_id || 'None'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Version Comparison */}
        {showComparison && (
          <div style={{ marginBottom: "20px", padding: "16px", background: "#fff3e0", borderRadius: "6px" }}>
            <h3 style={{ fontSize: "16px", marginTop: 0, color: "#333" }}>🔄 Version Comparison</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Version 1</div>
                {compareVersions.v1 ? (
                  <div style={{ padding: "8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                    <div><strong>{compareVersions.v1.material.version_name || 'Unnamed'}</strong></div>
                    <div style={{ color: "#666" }}>Type: {compareVersions.v1.type}</div>
                    {compareVersions.v1.material.file_size && (
                      <div style={{ color: "#666" }}>Size: {(compareVersions.v1.material.file_size / 1024).toFixed(1)} KB</div>
                    )}
                    <button
                      onClick={() => setCompareVersions(prev => ({ ...prev, v1: null }))}
                      style={{
                        marginTop: "4px",
                        padding: "4px 8px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "20px", background: "white", borderRadius: "4px", textAlign: "center", fontSize: "12px", color: "#999" }}>
                    Click "Compare" on a material
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Version 2</div>
                {compareVersions.v2 ? (
                  <div style={{ padding: "8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                    <div><strong>{compareVersions.v2.material.version_name || 'Unnamed'}</strong></div>
                    <div style={{ color: "#666" }}>Type: {compareVersions.v2.type}</div>
                    {compareVersions.v2.material.file_size && (
                      <div style={{ color: "#666" }}>Size: {(compareVersions.v2.material.file_size / 1024).toFixed(1)} KB</div>
                    )}
                    <button
                      onClick={() => setCompareVersions(prev => ({ ...prev, v2: null }))}
                      style={{
                        marginTop: "4px",
                        padding: "4px 8px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "20px", background: "white", borderRadius: "4px", textAlign: "center", fontSize: "12px", color: "#999" }}>
                    Click "Compare" on another material
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Resumes Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>📝 Resumes ({resumes.length})</h3>
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
                {uploading && <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>Uploading...</div>}
              </div>
            )}

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {resumes.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px", border: "2px dashed #ddd", borderRadius: "6px" }}>
                  No resumes uploaded yet
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

          {/* Cover Letters Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>✉️ Cover Letters ({coverLetters.length})</h3>
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
                {uploading && <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>Uploading...</div>}
              </div>
            )}

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {coverLetters.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px", border: "2px dashed #ddd", borderRadius: "6px" }}>
                  No cover letters uploaded yet
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

// Materials Analytics Component
export function MaterialsAnalytics() {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const resumesResponse = await ResumesAPI.getAll();
      setResumes(resumesResponse?.data || []);

      const coverLettersResponse = await CoverLetterAPI.getAll();
      setCoverLetters(coverLettersResponse?.data || []);
    } catch (error) {
      console.error("Failed to load materials:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", color: "#666" }}>Loading materials analytics...</div>
      </div>
    );
  }

  const totalResumes = resumes.length;
  const totalCoverLetters = coverLetters.length;
  
  // FIX: Calculate total usage correctly for both resumes and cover letters
  const totalUsage = resumes.reduce((sum, r) => sum + (r.usage_count || r.used_for?.length || 0), 0) +
                     coverLetters.reduce((sum, c) => sum + (c.usage_count || c.used_for?.length || 0), 0);

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, color: "#333" }}>📊 Materials Usage Analytics</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", background: "#e3f2fd", borderRadius: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1976d2" }}>{totalResumes}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Resume Versions</div>
        </div>
        <div style={{ padding: "16px", background: "#f3e5f5", borderRadius: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#7b1fa2" }}>{totalCoverLetters}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Cover Letter Versions</div>
        </div>
        <div style={{ padding: "16px", background: "#e8f5e9", borderRadius: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#388e3c" }}>{totalUsage}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Total Applications</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Resume Versions ({resumes.length})</h4>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {resumes.map(resume => {
              // FIX: Check both usage_count and used_for array
              const usageCount = resume.usage_count || resume.used_for?.length || 0;
              return (
                <div key={resume._id || resume.id} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px", marginBottom: "8px" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                    {resume.name || resume.file_name || 'Unnamed Version'}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    Used for: {usageCount} application(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Cover Letter Versions ({coverLetters.length})</h4>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {coverLetters.map(letter => {
              const usageCount = letter.usage_count || letter.used_for?.length || 0;
              return (
                <div key={letter._id || letter.id} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px", marginBottom: "8px" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                    {letter.title || letter.name || 'Unnamed Version'}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    Used for: {usageCount} application(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}