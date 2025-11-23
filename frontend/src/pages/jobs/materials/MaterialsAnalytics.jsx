import React, { useState, useEffect } from "react";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";
import JobsAPI from "../../../api/jobs";

export default function MaterialsAnalytics() {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

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

  // Handle downloading materials
  const handleDownload = async (material, type) => {
    const materialId = getMaterialId(material);
    setDownloading(`${type}-${materialId}`);
    
    try {
      let blob;
      if (type === 'resume') {
        blob = await ResumesAPI.exportPDF(materialId);
      } else {
        // For cover letters, use the download endpoint from CoverLetterAPI
        const response = await CoverLetterAPI.get(materialId);
        // Generate PDF from cover letter content
        // This assumes you have a download PDF method - you may need to add one
        alert('Cover letter download: Please use the view button to open and download from the edit page');
        setDownloading(null);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${material.name || material.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
      alert(`Failed to download ${type}. Please try again.`);
    } finally {
      setDownloading(null);
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
                          onClick={() => handleDownload(resume, 'resume')}
                          disabled={isDownloading}
                          style={{
                            padding: "4px 8px",
                            background: isDownloading ? "#ccc" : "#4caf50",
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
                          onClick={() => handleDownload(letter, 'coverLetter')}
                          disabled={isDownloading}
                          style={{
                            padding: "4px 8px",
                            background: isDownloading ? "#ccc" : "#4caf50",
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