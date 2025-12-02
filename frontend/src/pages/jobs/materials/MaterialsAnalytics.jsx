import React, { useState, useEffect } from "react";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";
import JobsAPI from "../../../api/jobs";
import api from "../../../api/base";

export default function MaterialsAnalytics() {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ v1: null, v2: null });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all materials
      const resumesResponse = await ResumesAPI.getAll();
      const resumesData = resumesResponse?.data || [];
      
      const coverLettersResponse = await CoverLetterAPI.getAll();
      const coverLettersData = coverLettersResponse?.data || [];
      
      // Load all jobs to count usage
      const jobsResponse = await JobsAPI.getAll();
      const jobsData = jobsResponse?.data || [];
      
      console.log('📊 Analytics - Loaded data:', {
        resumes: resumesData.length,
        coverLetters: coverLettersData.length,
        jobs: jobsData.length
      });

      setResumes(resumesData);
      setCoverLetters(coverLettersData);
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to load materials analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get material ID consistently
  const getMaterialId = (material) => {
    return material._id || material.id || material.resume_id || material.cover_letter_id;
  };

  // Calculate usage count for a specific resume
  const getResumeUsageCount = (resumeId) => {
    const count = jobs.filter(job => 
      job.materials?.resume_id === resumeId
    ).length;
    return count;
  };

  // Calculate usage count for a specific cover letter
  const getCoverLetterUsageCount = (coverLetterId) => {
    const count = jobs.filter(job => 
      job.materials?.cover_letter_id === coverLetterId
    ).length;
    return count;
  };

  // Handle viewing materials
  const handleView = (material, type) => {
    const materialId = getMaterialId(material);
    if (type === 'resume') {
      window.open(`/resumes/preview/${materialId}`, '_blank');
    } else {
      window.open(`/cover-letter/edit/${materialId}`, '_blank');
    }
  };

  // Handle deleting materials (copied from MaterialsModal)
  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      if (type === 'resume') {
        await ResumesAPI.delete(id);
        setResumes(resumes.filter(r => getMaterialId(r) !== id));
      } else {
        await CoverLetterAPI.delete(id);
        setCoverLetters(coverLetters.filter(c => getMaterialId(c) !== id));
      }
      alert('✅ Document deleted successfully!');
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  // Handle downloading materials
  const handleDownload = async (material, type) => {
    const materialId = getMaterialId(material);
    setDownloading(`${type}-${materialId}`);
    
    try {
      if (type === 'resume') {
        console.log('📥 Downloading resume PDF for ID:', materialId);
        
        // Call the resume export API endpoint
        const response = await api.post(
          `/resumes/${materialId}/export-pdf`,
          {},
          { responseType: 'blob' }
        );
        
        const blob = response.data;
        
        if (!blob || blob.size === 0) {
          throw new Error('Failed to generate resume PDF');
        }

        // Download the file
        const fileName = material.name || material.title || 'resume';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ Resume PDF downloaded successfully!');
      } else {
        // For cover letters, generate PDF from HTML content using html2canvas + jsPDF
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;
        
        // Create a temporary container to render the HTML
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm'; // A4 width
        tempContainer.innerHTML = material.content;
        document.body.appendChild(tempContainer);
        
        try {
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff',
            windowHeight: tempContainer.scrollHeight
          });

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const imgWidth = 210; 
          const pageHeight = 295; 
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`${material.title || material.name || 'cover_letter'}.pdf`);
          alert('✅ Cover letter PDF downloaded successfully!');
        } finally {
          // Clean up temporary container
          document.body.removeChild(tempContainer);
        }
      }
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Failed to download ${type} PDF: ${errorMessage}`);
    } finally {
      setDownloading(null);
    }
  };

  // Handle setting default material
  const handleSetDefault = async (material, type) => {
    const materialId = getMaterialId(material);
    try {
      if (type === 'resume') {
        await ResumesAPI.setDefault(materialId);
      } else {
        await CoverLetterAPI.setDefault(materialId);
      }
      // Reload data to get updated default status
      await loadAllData();
      alert('✅ Default material set successfully!');
    } catch (error) {
      console.error("Error setting default:", error);
      alert("Failed to set default. Please try again.");
    }
  };

  // Handle adding material to comparison
  /* COMMENTED OUT - Compare functionality
  const handleCompare = (material, type) => {
    setCompareVersions(prev => ({
      ...prev,
      [prev.v1 ? 'v2' : 'v1']: { material, type }
    }));
    setShowComparison(true);
  };
  */

  if (loading) {
    return (
      <div style={{ background: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", color: "#666" }}>Loading materials analytics...</div>
      </div>
    );
  }

  const totalResumes = resumes.length;
  const totalCoverLetters = coverLetters.length;
  
  // Calculate total usage by counting jobs with materials
  const totalUsage = jobs.filter(job => 
    job.materials?.resume_id || job.materials?.cover_letter_id
  ).length;

  console.log('📊 Analytics Summary:', {
    totalResumes,
    totalCoverLetters,
    totalUsage,
    jobsWithMaterials: jobs.filter(j => j.materials).length
  });

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

      {/* COMMENTED OUT - Comparison Panel
      {showComparison && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "#fff3e0", borderRadius: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", color: "#333" }}>🔄 Version Comparison</h4>
            <button
              onClick={() => {
                setShowComparison(false);
                setCompareVersions({ v1: null, v2: null });
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
              ✕ Close
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Version 1</div>
              {compareVersions.v1 ? (
                <div style={{ padding: "8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                  <div><strong>{compareVersions.v1.material.name || compareVersions.v1.material.title || 'Unnamed'}</strong></div>
                  <div style={{ color: "#666" }}>Type: {compareVersions.v1.type}</div>
                  {compareVersions.v1.material.file_size && (
                    <div style={{ color: "#666" }}>Size: {(compareVersions.v1.material.file_size / 1024).toFixed(1)} KB</div>
                  )}
                  <div style={{ color: "#666" }}>
                    Used: {compareVersions.v1.type === 'resume' 
                      ? getResumeUsageCount(getMaterialId(compareVersions.v1.material))
                      : getCoverLetterUsageCount(getMaterialId(compareVersions.v1.material))} times
                  </div>
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
                  <div><strong>{compareVersions.v2.material.name || compareVersions.v2.material.title || 'Unnamed'}</strong></div>
                  <div style={{ color: "#666" }}>Type: {compareVersions.v2.type}</div>
                  {compareVersions.v2.material.file_size && (
                    <div style={{ color: "#666" }}>Size: {(compareVersions.v2.material.file_size / 1024).toFixed(1)} KB</div>
                  )}
                  <div style={{ color: "#666" }}>
                    Used: {compareVersions.v2.type === 'resume' 
                      ? getResumeUsageCount(getMaterialId(compareVersions.v2.material))
                      : getCoverLetterUsageCount(getMaterialId(compareVersions.v2.material))} times
                  </div>
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
      */}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Resume Versions ({resumes.length})</h4>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {resumes.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "13px" }}>
                No resumes yet
              </div>
            ) : (
              resumes.map(resume => {
                const resumeId = getMaterialId(resume);
                const usageCount = getResumeUsageCount(resumeId);
                const displayName = resume.name || resume.file_name || resume.version_name || 'Unnamed Version';
                const isDownloading = downloading === `resume-${resumeId}`;
                
                return (
                  <div key={resumeId} style={{ 
                    padding: "12px", 
                    background: usageCount > 0 ? "#f0f7ff" : "#f9f9f9", 
                    borderRadius: "6px", 
                    marginBottom: "8px",
                    borderLeft: usageCount > 0 ? "3px solid #1976d2" : "none"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                          {displayName}
                          {resume.default_resume && (
                            <span style={{ 
                              marginLeft: "8px",
                              fontSize: "10px", 
                              padding: "2px 6px",
                              background: "#4caf50", 
                              color: "white",
                              borderRadius: "3px",
                              fontWeight: "600"
                            }}>
                              ⭐ DEFAULT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: usageCount > 0 ? "#1976d2" : "#999" }}>
                          Used for: {usageCount} application(s)
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexDirection: "column", marginLeft: "8px" }}>
                        <button
                          onClick={() => handleView(resume, 'resume')}
                          style={{
                            padding: "4px 8px",
                            background: "#2196f3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          👁 View
                        </button>
                        <button
                          onClick={() => handleSetDefault(resume, 'resume')}
                          disabled={resume.default_resume}
                          style={{
                            padding: "4px 8px",
                            background: resume.default_resume ? "#9e9e9e" : "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: resume.default_resume ? "not-allowed" : "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          ⭐ {resume.default_resume ? 'Default' : 'Set Default'}
                        </button>
                        {/* COMMENTED OUT - Compare button
                        <button
                          onClick={() => handleCompare(resume, 'resume')}
                          style={{
                            padding: "4px 8px",
                            background: "#ff9800",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🔄 Compare
                        </button>
                        */}
                        <button
                          onClick={() => handleDownload(resume, 'resume')}
                          disabled={isDownloading}
                          style={{
                            padding: "4px 8px",
                            background: isDownloading ? "#ccc" : "#9c27b0",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isDownloading ? "not-allowed" : "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {isDownloading ? "⏳" : "📥"} Download
                        </button>
                        <button
                          onClick={() => handleDelete(resumeId, 'resume')}
                          style={{
                            padding: "4px 8px",
                            background: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Cover Letter Versions ({coverLetters.length})</h4>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {coverLetters.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "13px" }}>
                No cover letters yet
              </div>
            ) : (
              coverLetters.map(letter => {
                const letterId = getMaterialId(letter);
                const usageCount = getCoverLetterUsageCount(letterId);
                const displayName = letter.title || letter.name || letter.version_name || 'Unnamed Version';
                const isDownloading = downloading === `coverLetter-${letterId}`;
                
                return (
                  <div key={letterId} style={{ 
                    padding: "12px", 
                    background: usageCount > 0 ? "#fce4ec" : "#f9f9f9", 
                    borderRadius: "6px", 
                    marginBottom: "8px",
                    borderLeft: usageCount > 0 ? "3px solid #7b1fa2" : "none"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                          {displayName}
                          {letter.default_cover_letter && (
                            <span style={{ 
                              marginLeft: "8px",
                              fontSize: "10px", 
                              padding: "2px 6px",
                              background: "#4caf50", 
                              color: "white",
                              borderRadius: "3px",
                              fontWeight: "600"
                            }}>
                              ⭐ DEFAULT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: usageCount > 0 ? "#7b1fa2" : "#999" }}>
                          Used for: {usageCount} application(s)
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexDirection: "column", marginLeft: "8px" }}>
                        <button
                          onClick={() => handleView(letter, 'coverLetter')}
                          style={{
                            padding: "4px 8px",
                            background: "#2196f3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          👁 View
                        </button>
                        <button
                          onClick={() => handleSetDefault(letter, 'coverLetter')}
                          disabled={letter.default_cover_letter}
                          style={{
                            padding: "4px 8px",
                            background: letter.default_cover_letter ? "#9e9e9e" : "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: letter.default_cover_letter ? "not-allowed" : "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          ⭐ {letter.default_cover_letter ? 'Default' : 'Set Default'}
                        </button>
                        {/* COMMENTED OUT - Compare button
                        <button
                          onClick={() => handleCompare(letter, 'coverLetter')}
                          style={{
                            padding: "4px 8px",
                            background: "#ff9800",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🔄 Compare
                        </button>
                        */}
                        <button
                          onClick={() => handleDownload(letter, 'coverLetter')}
                          disabled={isDownloading}
                          style={{
                            padding: "4px 8px",
                            background: isDownloading ? "#ccc" : "#9c27b0",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isDownloading ? "not-allowed" : "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {isDownloading ? "⏳" : "📥"} Download
                        </button>
                        <button
                          onClick={() => handleDelete(letterId, 'coverLetter')}
                          style={{
                            padding: "4px 8px",
                            background: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Additional insights */}
      <div style={{ marginTop: "20px", padding: "12px", background: "#fffbea", borderRadius: "6px" }}>
        <div style={{ fontSize: "13px", color: "#666" }}>
          💡 <strong>Tip:</strong> Track which resume and cover letter versions perform best by linking them to your job applications.
        </div>
      </div>
    </div>
  );
}