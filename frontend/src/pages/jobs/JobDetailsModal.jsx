import React, { useState } from "react";
import MaterialsModal from "./materials/MaterialsModal";
import JobsAPI from "../../api/jobs";
import ResumesAPI from "../../api/resumes";
import CoverLetterAPI from "../../api/coverLetters";
import api from "../../api/base";
import { SingleJobLocation } from "./JobLocationMap";
import ProfilesAPI from "../../api/profiles";
import LinkedEmailsTab from "./LinkedEmailsTab";

export default function JobDetailsModal({
  selectedJob,
  setSelectedJob,
  setReminderJob,
  updateJob,    
  archiveJob,
  restoreJob,
  deleteJob,
  setEditingJob,
  setView,
  readOnly = false
}) {

  console.log("SELECTED JOB:", selectedJob);

  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [activeTab, setActiveTab] = useState("details");


  if (!selectedJob) return null;

  // Check if materials are linked
  const hasMaterials = selectedJob.materials?.resume_id || selectedJob.materials?.cover_letter_id;

  const handleDownloadLinkedPDF = async (type) => {
    try {
      setDownloading(type);
      
      if (type === 'resume') {
        const resumeId = selectedJob.materials?.resume_id;
        
        if (!resumeId) {
          alert('No resume linked to this application');
          setDownloading(null);
          return;
        }

        console.log('📥 Downloading resume PDF for resume ID:', resumeId);
        
        const response = await api.post(
          `/resumes/${resumeId}/export-pdf`,
          {},
          { responseType: 'blob' }
        );
        
        const blob = response.data;
        
        if (!blob || blob.size === 0) {
          throw new Error('Failed to generate resume PDF');
        }

        const fileName = selectedJob.materials?.resume_name || 'resume';
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
        const coverLetterId = selectedJob.materials?.cover_letter_id;
        
        if (!coverLetterId) {
          alert('No cover letter linked to this application');
          setDownloading(null);
          return;
        }

        console.log('📥 Downloading cover letter PDF for ID:', coverLetterId);
        
        const coverLetterResponse = await CoverLetterAPI.get(coverLetterId);
        const coverLetter = coverLetterResponse.data || coverLetterResponse;
        
        if (!coverLetter.content) {
          throw new Error('Cover letter content not found');
        }

        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;
        
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm';
        tempContainer.innerHTML = coverLetter.content;
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

          const fileName = selectedJob.materials?.cover_letter_name || coverLetter.title || 'cover_letter';
          pdf.save(`${fileName}.pdf`);
          
          alert('✅ Cover letter PDF downloaded successfully!');
        } finally {
          document.body.removeChild(tempContainer);
        }
      }
    } catch (error) {
      console.error(`Error downloading ${type} PDF:`, error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Failed to download ${type} PDF: ${errorMessage}`);
    } finally {
      setDownloading(null);
    }
  };

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
        padding: "20px",
      }}
      onClick={() => setSelectedJob(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "8px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "24px",
        }}
      >

        {/* --- HEADER --- */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#333" }}>{selectedJob.title}</h2>
          <button
            onClick={() => setSelectedJob(null)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* ========================= */}
        {/*       TABS NAVIGATION     */}
        {/* ========================= */}
          <div style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "10px"
            }}>
          {[

          { id: "details", label: "Details" },
          { id: "research", label: "Research" },
          { id: "news", label: "News" },
          { id: "location", label: "Location" },
          { id: "materials", label: "Materials" },
          { id: "emails", label: "Emails" },
          { id: "history", label: "History" },
          ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab.id ? "#1565c0" : "transparent",
              color: activeTab === tab.id ? "white" : "#333",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? "600" : "500"
            }}
            >
            {tab.label}
          </button>
          ))}
          </div>

        {/* ---------------- DETAILS TAB ---------------- */}
    {activeTab === "details" && (
          <>

            <div style={{ marginBottom: "16px", color: "#000" }}>
              <strong>Company:</strong> {
                typeof selectedJob.company === 'object' 
                  ? (selectedJob.company.name || "Company Info Available") 
                  : selectedJob.company
              }
            </div>

            {selectedJob.companyData && (
              <div style={{ marginBottom: "16px", background: "#f0f7ff", padding: "16px", borderRadius: "6px", border: "1px solid #d0e4ff" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "16px" }}>🏢 Company Information</h3>
                
                {selectedJob.companyData.image && typeof selectedJob.companyData.image === 'string' && (
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    <img
                      src={selectedJob.companyData.image.startsWith("http") ? selectedJob.companyData.image : `data:image/png;base64,${selectedJob.companyData.image}`}
                      
                      alt={`${
                        typeof selectedJob.company === 'object' 
                          ? (selectedJob.company.name || "Company") 
                          : selectedJob.company
                      }`}
                      style={{ maxWidth: "100%", height: "auto", maxHeight: "150px", borderRadius: "8px", objectFit: "contain" }}
                    />
                  </div>
                )}

        {selectedJob.companyData.size && typeof selectedJob.companyData.size === 'string' && (
          <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
            <strong>👥 Company Size:</strong> {selectedJob.companyData.size}
          </div>
        )}

        {selectedJob.companyData.industry && typeof selectedJob.companyData.industry === 'string' && (
          <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
            <strong>🏭 Industry:</strong> {selectedJob.companyData.industry}
          </div>
        )}

        {selectedJob.companyData.location && typeof selectedJob.companyData.location === 'string' && (
          <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
            <strong>📍 Headquarters:</strong> {selectedJob.companyData.location}
          </div>
        )}

        {selectedJob.companyData.website && typeof selectedJob.companyData.website === 'string' && (
          <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
            <strong>🌐 Website:</strong>{" "}
            <a
              href={selectedJob.companyData.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4f8ef7", textDecoration: "underline" }}
            >
              {selectedJob.companyData.website}
            </a>
          </div>
        )}

        {selectedJob.companyData.description && typeof selectedJob.companyData.description === 'string' && (
          <div style={{ marginTop: "12px", color: "#000", fontSize: "14px" }}>
            <strong>About:</strong>
            <div style={{ marginTop: "6px", color: "#555", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
              {selectedJob.companyData.description}
            </div>
          </div>
        )}
      </div>
    )}

    {/* --- BASIC JOB DETAILS --- */}
    {selectedJob.location && (
      <div style={{ marginBottom: "16px", color: "#000" }}>
        <strong>Location:</strong> {selectedJob.location}
      </div>
    )}

    {selectedJob.salary && (
      <div style={{ marginBottom: "16px", color: "#000" }}>
        <strong>Salary:</strong> {selectedJob.salary}
      </div>
    )}

    {selectedJob.deadline && (
      <div style={{ marginBottom: "16px", color: "#000" }}>
        <strong>Deadline:</strong> {new Date(selectedJob.deadline).toLocaleDateString()}

        {!readOnly && (
      <>
        <button
          onClick={() => setReminderJob(selectedJob)}
          style={{
            marginLeft: "12px",
            padding: "6px 12px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600"
          }}
        >
          ⏰ Set Reminder
        </button>

        <button
          onClick={() => { const newDeadline = prompt("Enter new deadline (YYYY-MM-DD):", selectedJob.deadline);
            if (newDeadline) {
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (dateRegex.test(newDeadline)) {
                updateJob({ ...selectedJob, deadline: newDeadline });
              } else {
                alert("Invalid date format. Please use YYYY-MM-DD");
              }
            }}}
          className="btn btn-primary"
        >
          📅 Extend
        </button>
      </>
    )}
  </div>
    )}

    {selectedJob.url && (
      <div style={{ marginBottom: "16px", color: "#000" }}>
        <strong>Link:</strong>{" "}
        <a
          href={selectedJob.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#4f8ef7", textDecoration: "underline" }}
        >
          View Job Posting →
        </a>
      </div>
    )}

    {selectedJob.description && (
      <div style={{ marginBottom: "16px", color: "#000" }}>
        <strong>Description:</strong>
        <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", marginTop: "8px", whiteSpace: "pre-wrap" }}>
          {selectedJob.description}
        </div>
      </div>
    )}

    {selectedJob.notes && (
      <div style={{ marginBottom: "16px", background: "#fffbea", padding: "12px", borderRadius: "4px", color: "#000" }}>
        <strong>Notes:</strong>
        <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{selectedJob.notes}</div>
      </div>
    )}
  </>
)}


        {/* ---------------- RESEARCH TAB ---------------- */}
        {activeTab === "research" && (
          <div style={{ padding: "15px" }}>

            {/* BASIC INFORMATION */}
            <div style={{
              background: "#eef7ff",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #d4e9ff"
            }}>
              <h2 style={{ color: "#1976d2", marginBottom: "10px" }}>📊 Basic Information</h2>

              <p><strong>Industry:</strong> {selectedJob.company_research?.basic_info?.industry}</p>
              <p><strong>Size:</strong> {selectedJob.company_research?.basic_info?.size}</p>
              <p><strong>Headquarters:</strong> {selectedJob.company_research?.basic_info?.headquarters}</p>
              <p><strong>Founded:</strong> {selectedJob.company_research?.basic_info?.founded}</p>
              <p>
                <strong>Website:</strong>{" "}
                <a href={selectedJob.company_research?.basic_info?.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: "6px" }}>
                  {selectedJob.company_research?.basic_info?.website}
                </a>
              </p>
            </div>


            {/* MISSION & VALUES */}
            <div style={{
              background: "#f0fff4",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #c6f6d5"
            }}>
              <h2 style={{ color: "#2f855a", marginBottom: "10px" }}>🌱 Mission & Values</h2>

              <p><strong>Mission:</strong> {selectedJob.company_research?.mission_values?.mission}</p>

              <p><strong>Values:</strong></p>
              <ul>
                {selectedJob.company_research?.mission_values?.values?.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>

              <p><strong>Culture:</strong> {selectedJob.company_research?.mission_values?.culture}</p>
            </div>


            {/* PRODUCTS & SERVICES */}
            <div style={{
              background: "#fff8e1",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #ffecb3"
            }}>
              <h2 style={{ color: "#ff8f00", marginBottom: "10px" }}>🛠 Products & Services</h2>

              {selectedJob.company_research?.products_services?.map((p, i) => (
                <p key={i}>• {p}</p>
              ))}
            </div>


            {/* LEADERSHIP */}
            <div style={{
              background: "#e9f7ef",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #c8e6c9"
            }}>
              <h2 style={{ color: "#2e7d32", marginBottom: "10px" }}>💼 Leadership Team</h2>

              <p><strong>CEO:</strong> {selectedJob.company_research?.leadership?.ceo}</p>

              <p><strong>Key Executives:</strong></p>
              {selectedJob.company_research?.leadership?.key_executives?.map((exec, i) => (
                <p key={i}>• {exec.name} — {exec.title}</p>
              ))}
            </div>


            {/* COMPETITIVE LANDSCAPE */}
            <div style={{
              background: "#e3f2fd",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #bbdefb"
            }}>
              <h2 style={{ color: "#1565c0", marginBottom: "10px" }}>⚔️ Competitive Landscape</h2>

              <p><strong>Top Competitors:</strong></p>
              {selectedJob.company_research?.competitive_landscape?.top_competitors?.map((c, i) => (
                <p key={i}>• {c}</p>
              ))}
            </div>


            {/* SOCIAL MEDIA */}
            <div style={{
              background: "#e8f4ff",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
              border: "1px solid #b3dbff"
            }}>
              <h2 style={{ color: "#1e88e5", marginBottom: "10px" }}>🧩 Social Media Presence</h2>

              {selectedJob.company_research?.social_media?.map((sm, i) => (
                <p key={i}>
                  <strong>{sm.platform}:</strong>{" "}
                  <a href={sm.url} target="_blank" rel="noreferrer">{sm.url}</a>
                </p>
              ))}
            </div>


            {/* INTERVIEW PREP */}
            <div style={{
              background: "#ffebee",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #ffcdd2"
            }}>
              <h2 style={{ color: "#c62828", marginBottom: "10px" }}>💬 Interview Prep Summary</h2>

              <h4>Strengths:</h4>
              {selectedJob.company_research?.interview_prep?.strengths?.map((s, i) =>
                <p key={i}>• {s}</p>
              )}

              <h4>Challenges:</h4>
              {selectedJob.company_research?.interview_prep?.challenges?.map((c, i) =>
                <p key={i}>• {c}</p>
              )}

              <h4>Questions to Ask:</h4>
              {selectedJob.company_research?.interview_prep?.questions_to_ask?.map((q, i) =>
                <p key={i}>• {q}</p>
              )}
            </div>

          </div>
        )} 

        {/* ---------------- NEWS TAB ---------------- */}
        {activeTab === "news" && (
          <div style={{ padding: "15px" }}>
            <h2 style={{ color: "#1565c0", marginBottom: "20px" }}>
              📰 Latest Company News
            </h2>

            {(!selectedJob.company_news || selectedJob.company_news.length === 0) ? (
              <p>No news available.</p>
            ) : (
              selectedJob.company_news.map((item, i) => (
                <div 
                  key={i}
                  style={{
                    marginBottom: "20px",
                    padding: "18px",
                    borderRadius: "10px",
                    border: "1px solid #d0e2ff",
                    background: "#f7faff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                  }}
                >

                  {/* Title */}
                  <h3 style={{ margin: "0 0 6px", color: "#003f8c" }}>
                    {item.title}
                  </h3>

                  {/* Meta */}
                  <p style={{ fontSize: "13px", color: "#555" }}>
                    <strong>Source:</strong> {item.source}
                    &nbsp;•&nbsp;
                    <strong>Date:</strong> {item.date}
                    &nbsp;•&nbsp;
                    <strong>Category:</strong> {item.category}
                    &nbsp;•&nbsp;
                    <strong>Relevance:</strong> {item.relevance_score}/100
                  </p>

                  {/* Summary */}
                  <p style={{ marginTop: "10px", fontSize: "14px", color: "#333" }}>
                    {item.summary}
                  </p>

                  {/* Key Points */}
                  <div style={{ marginTop: "10px" }}>
                    <strong style={{ fontSize: "14px" }}>Key Points:</strong>
                    <ul style={{ paddingLeft: "20px", marginTop: "6px" }}>
                      {item.key_points?.map((kp, index) => (
                        <li key={index} style={{ marginBottom: "4px" }}>
                          {kp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Link */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      background: "#1565c0",
                      color: "white",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      textDecoration: "none"
                    }}
                  >
                    Read Article →
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "location" && (
          <SingleJobLocation job={selectedJob} ProfilesAPI={ProfilesAPI} />
        )}

        {/* --- BASIC JOB DETAILS --- */}
        {/*selectedJob.location && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Location:</strong> {selectedJob.location}
          </div>
        )}

        {selectedJob.salary && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Salary:</strong> {selectedJob.salary}
          </div>
        )}

        {selectedJob.deadline && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Deadline:</strong> {new Date(selectedJob.deadline).toLocaleDateString()}

            <button
              onClick={() => setReminderJob(selectedJob)}
              style={{
                marginLeft: "12px",
                padding: "6px 12px",
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              ⏰ Set Reminder
            </button>

            <button
              onClick={() => {
                const newDeadline = prompt("Enter new deadline (YYYY-MM-DD):", selectedJob.deadline);
                if (newDeadline) {
                  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                  if (dateRegex.test(newDeadline)) {
                    updateJob({ ...selectedJob, deadline: newDeadline });
                  } else {
                    alert("Invalid date format. Please use YYYY-MM-DD");
                  }
                }
              }}
              className="btn btn-primary"
            >
              📅 Extend Deadline
            </button>
          </div>
        )}

        {selectedJob.url && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Link:</strong>{" "}
            <a
              href={selectedJob.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4f8ef7", textDecoration: "underline" }}
            >
              View Job Posting →
            </a>
          </div>
        )}

        {selectedJob.description && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Description:</strong>
            <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", marginTop: "8px", whiteSpace: "pre-wrap" }}>
              {selectedJob.description}
            </div>
          </div>
        )}

        {selectedJob.notes && (
          <div style={{ marginBottom: "16px", background: "#fffbea", padding: "12px", borderRadius: "4px", color: "#000" }}>
            <strong>Notes:</strong>
            <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{selectedJob.notes}</div>
          </div>
        )*/}

          

        {/* --- APPLICATION MATERIALS SECTION --- */}
        {activeTab === "materials" && selectedJob.materials && (
          <div style={{ marginBottom: "16px", background: "#f3e5f5", padding: "16px", borderRadius: "6px", border: "1px solid #e1bee7" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#7b1fa2", fontSize: "16px" }}>📄 Application Materials</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Resume Section */}
              <div style={{ padding: "12px", background: "white", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
                  📝 Resume
                </div>
                {selectedJob.materials.resume_id ? (
                  <>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      <strong>Version:</strong> {selectedJob.materials.resume_version || 'N/A'}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                      <strong>File:</strong> {selectedJob.materials.resume_name || 'Unnamed'}
                    </div>
                    <button
                      onClick={() => handleDownloadLinkedPDF('resume')}
                      disabled={downloading === 'resume'}
                      style={{
                        padding: "6px 12px",
                        background: downloading === 'resume' ? "#ccc" : "#34c759",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: downloading === 'resume' ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        width: "100%"
                      }}
                    >
                      {downloading === 'resume' ? '⏳ Downloading...' : '📥 Download Resume PDF'}
                    </button>
                    {selectedJob.materials.linked_date && (
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                        Linked: {new Date(selectedJob.materials.linked_date).toLocaleDateString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
                    No resume linked
                  </div>
                )}
              </div>

              {/* Cover Letter Section */}
              <div style={{ padding: "12px", background: "white", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
                  ✉️ Cover Letter
                </div>
                {selectedJob.materials.cover_letter_id ? (
                  <>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      <strong>Version:</strong> {selectedJob.materials.cover_letter_version || 'N/A'}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                      <strong>File:</strong> {selectedJob.materials.cover_letter_name || 'Unnamed'}
                    </div>
                    <button
                      onClick={() => handleDownloadLinkedPDF('coverLetter')}
                      disabled={downloading === 'coverLetter'}
                      style={{
                        padding: "6px 12px",
                        background: downloading === 'coverLetter' ? "#ccc" : "#34c759",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: downloading === 'coverLetter' ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        width: "100%"
                      }}
                    >
                      {downloading === 'coverLetter' ? '⏳ Downloading...' : '📥 Download Cover Letter PDF'}
                    </button>
                    {selectedJob.materials.linked_date && (
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                        Linked: {new Date(selectedJob.materials.linked_date).toLocaleDateString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
                    No cover letter linked
                  </div>
                )}
              </div>
            </div>

            {/* Materials History Section */}
            {selectedJob.materials_history && selectedJob.materials_history.length > 0 && (
              <div style={{ marginTop: "12px", padding: "12px", background: "white", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "8px", cursor: "pointer" }}
                     onClick={() => {
                       const historyDiv = document.getElementById(`history-${selectedJob.id}`);
                       if (historyDiv) {
                         historyDiv.style.display = historyDiv.style.display === 'none' ? 'block' : 'none';
                       }
                     }}>
                  📜 Materials History ({selectedJob.materials_history.length}) 
                  <span style={{ fontSize: "11px", marginLeft: "8px", color: "#999" }}>▼ Click to expand</span>
                </div>
                <div id={`history-${selectedJob.id}`} style={{ display: 'none', marginTop: "8px" }}>
                  {selectedJob.materials_history.slice(-5).reverse().map((entry, idx) => (
                    <div key={idx} style={{ 
                      padding: "8px", 
                      borderLeft: "3px solid #9c27b0", 
                      marginBottom: "6px",
                      paddingLeft: "12px",
                      background: "#fafafa",
                      borderRadius: "4px"
                    }}>
                      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
                        {new Date(entry.date).toLocaleString()} - <strong style={{ color: "#7b1fa2" }}>{entry.action.toUpperCase()}</strong>
                      </div>
                      <div style={{ fontSize: "10px", color: "#999" }}>
                        Resume: {entry.resume_version || 'None'} | Cover Letter: {entry.cover_letter_version || 'None'}
                      </div>
                    </div>
                  ))}
                  {selectedJob.materials_history.length > 5 && (
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "8px", textAlign: "center" }}>
                      Showing latest 5 of {selectedJob.materials_history.length} entries
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- EMAILS TAB ---------------- */}
        {activeTab === "emails" && (
          <LinkedEmailsTab job={selectedJob} />
        )}

        {/* ---------------- STATUS HISTORY SECTION ---------------- */}
        {activeTab === "history" && selectedJob.status_history && selectedJob.status_history.length > 0 && (
          <div style={{ marginBottom: "16px", background: "#e8f5e9", padding: "16px", borderRadius: "6px", border: "1px solid #c8e6c9" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#2e7d32", fontSize: "16px" }}>📋 Status History</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...selectedJob.status_history].reverse().map((entry, idx) => (
                <div key={idx} style={{ 
                  padding: "10px 12px", 
                  background: "white", 
                  borderRadius: "4px",
                  borderLeft: "3px solid #4caf50",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
                      {entry[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {new Date(entry[1]).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- BUTTON ROW --- */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>

          {/* Only show these if NOT readOnly */}
          {!readOnly && (
            <>
              <button
                onClick={() => { setEditingJob(selectedJob); setView("form"); setSelectedJob(null); }}
                style={{ padding: "10px 20px", background: "#34c759", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                ✏️ Edit Job
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setMaterialsOpen(true); }}
                style={{ padding: "10px 20px", background: hasMaterials ? "#7b1fa2" : "#9c27b0", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
              >
                {hasMaterials ? "✓ " : ""} 📦 {hasMaterials ? "Update Materials" : "Set Materials"}
              </button>

              {selectedJob.archived ? (
                <button
                  onClick={() => { restoreJob(selectedJob.id); setSelectedJob(null); }}
                  style={{ padding: "10px 20px", background: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                >
                  ♻️ Restore Job
                </button>
              ) : (
                <button
                  onClick={() => { const reason = prompt("Reason?"); if (reason !== null) archiveJob(selectedJob.id, reason); }}
                  style={{ padding: "10px 20px", background: "#607d8b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                >
                  🗄️ Archive Job
                </button>
              )}

              <button
                onClick={() => { deleteJob(selectedJob.id); }}
                className="btn btn-danger"
              >
                🗑️ Delete Job
              </button>
            </>
          )}
          
          {/* If ReadOnly, maybe just a Close button or nothing (X is at top) */}
          {readOnly && (
            <button
              onClick={() => setSelectedJob(null)}
              style={{ padding: "10px 20px", background: "#666", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
            >
              Close
            </button>
          )}

        </div>

        {/* --- MATERIALS MODAL --- */}
        {materialsOpen && !readOnly && (
          <MaterialsModal 
            job={selectedJob} 
            onClose={() => setMaterialsOpen(false)}
            onSave={async (updatedJob) => {
              console.log('📦 Saving materials from modal:', updatedJob.materials);
              
              await updateJob(updatedJob);
              
              setSelectedJob(prev => ({
                ...prev,
                materials: updatedJob.materials,
                materials_history: updatedJob.materials_history
              }));
              
              setMaterialsOpen(false);
              
              console.log('✅ Materials modal closed, job updated');
            }}
          />
        )}

      </div>
    </div>
  );
}