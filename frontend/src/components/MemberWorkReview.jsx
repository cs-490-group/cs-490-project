import React, { useState, useEffect } from "react";
import { FileText, Briefcase, MessageSquare, Clock, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import teamsAPI from "../api/teams";
import JobDetailsModal from "../pages/jobs/JobDetailsModal"; 

export default function MemberWorkReview({ teamId, member, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("jobs");
  const [data, setData] = useState({ resumes: [], coverLetters: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  
  // State for the Job Detail Modal
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchMemberWork = async () => {
      try {
        setLoading(true);
        const res = await teamsAPI.getMemberWork(teamId, member.uuid);
        
        // Handle response structure directly (res contains the objects, not res.data)
        setData({
          resumes: res.resumes || [],
          coverLetters: res.coverLetters || [],
          jobs: res.jobs || []
        });
      } catch (err) {
        console.error("Failed to load member work", err);
        setData({ resumes: [], coverLetters: [], jobs: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchMemberWork();
  }, [teamId, member.uuid]);

  const handleReviewClick = async (type, id) => {
    // For Jobs, just open the modal (no token needed)
    if (type === 'job') {
      // Logic for job modal is handled via state/render, so we might not need navigation here
      // But if you are using navigation for jobs:
      navigate(`/jobs/${id}`); 
      return;
    }

    // For Docs, get a token and go to the PUBLIC view (which works for Mentors)
    try {
      // Show loading state if possible, or just wait
      const res = await teamsAPI.getReviewToken(teamId, member.uuid, type === 'coverLetter' ? 'cover_letter' : 'resume', id);
      
      if (res.token) {
        if (type === 'resume') {
          navigate(`/resumes/public/${res.token}`);
        } else if (type === 'coverLetter') {
          navigate(`/cover-letter/public/${res.token}`); // Note: check your route path, usually singular 'cover-letter'
        }
      }
    } catch (err) {
      console.error("Failed to get review token", err);
      alert("Could not open document for review. Try asking the candidate to share it explicitly.");
    }
  };

  // --- JOB PIPELINE RENDERING LOGIC ---

  const renderJobCard = (job) => {
    // FIX: Helper to safely get company name string, even if data is an object
    const getCompanyName = (val) => {
        if (!val) return "Unknown Company";
        if (typeof val === 'string') return val;
        if (typeof val === 'object') return val.name || "Company Info Available";
        return "Unknown Company";
    };

    return (
        <div 
            key={job.id || job._id} 
            onClick={() => setSelectedJob(job)}
            style={{
                background: "white",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#333" }}>
                    {job.title}
                </h4>
                {/* Show icon if materials are attached */}
                {(job.materials?.resume_id || job.materials?.cover_letter_id) && (
                    <span title="Materials Attached">📎</span>
                )}
            </div>
            
            {/* FIX: Use safe getter for company to prevent Object crash */}
            <div style={{ color: "#666", fontSize: "13px", marginBottom: "8px", fontWeight: "500" }}>
                {getCompanyName(job.company)}
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#999" }}>
                <span>{typeof job.location === 'string' ? job.location : "Remote"}</span>
                <span>{new Date(job.date_created || job.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    );
  };

  const renderPipeline = () => {
    const stages = ["Interested", "Applied", "Screening", "Interview", "Offer", "Rejected"];
    const jobs = data.jobs || [];

    // Group jobs by status
    const groupedJobs = stages.reduce((acc, stage) => {
        acc[stage] = jobs.filter(j => j.status === stage);
        return acc;
    }, {});

    if (jobs.length === 0) {
        return (
            <div className="text-center p-5 text-muted bg-light rounded-3">
              <Briefcase size={48} className="mb-3 opacity-25" />
              <p>No jobs found for this user.</p>
            </div>
        );
    }

    return (
        <div style={{ 
            display: "flex", 
            gap: "16px", 
            overflowX: "auto", 
            paddingBottom: "20px", 
            height: "100%",
            alignItems: "flex-start" 
        }}>
            {stages.map(stage => (
                <div key={stage} style={{ 
                    minWidth: "260px", 
                    maxWidth: "260px", 
                    background: "#f4f5f7", 
                    borderRadius: "8px", 
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "100%"
                }}>
                    <div style={{ 
                        fontWeight: "bold", 
                        marginBottom: "12px", 
                        color: "#5e6c84", 
                        textTransform: "uppercase", 
                        fontSize: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0 4px"
                    }}>
                        {stage} 
                        <span style={{ background: "#dfe1e6", borderRadius: "10px", padding: "0 8px", color: "#172b4d" }}>
                            {groupedJobs[stage].length}
                        </span>
                    </div>
                    
                    <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                        {groupedJobs[stage].map(job => renderJobCard(job))}
                        {groupedJobs[stage].length === 0 && (
                            <div style={{ padding: "20px", textAlign: "center", color: "#bababa", fontSize: "13px", fontStyle: "italic" }}>
                                No jobs
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  // --- DOCUMENT LIST RENDERING (Resumes/Cover Letters) ---
  const renderDocumentList = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center p-5 text-muted bg-light rounded-3">
          <FileText size={48} className="mb-3 opacity-25" />
          <p>No {type === 'resume' ? 'resumes' : 'cover letters'} found.</p>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column gap-3">
        {items.map((item) => (
          <div key={item.id || item._id} className="card border shadow-sm hover-shadow transition-all">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-1 text-dark">
                  {item.title || item.name || "Untitled Document"}
                </h6>
                <div className="d-flex gap-3 text-muted small">
                  <span className="d-flex align-items-center gap-1">
                    <Clock size={12} /> {new Date(item.updated_at || item.created_at || item.date_created).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleReviewClick(type, item.id || item._id)}
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
              >
                <MessageSquare size={14} /> Review & Feedback
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg w-100" style={{ maxWidth: "1200px", height: "90vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top-4">
          <div>
            <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
              <Briefcase className="text-primary" /> Review Work
            </h4>
            <p className="text-muted m-0 small">Reviewing: <span className="fw-bold text-dark">{member.name}</span></p>
          </div>
          <button onClick={onClose} className="btn btn-close"></button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 border-bottom">
          <ul className="nav nav-tabs border-0">
            <li className="nav-item">
              <button 
                className={`nav-link border-0 fw-bold ${activeTab === 'jobs' ? 'active border-bottom border-primary text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('jobs')}
              >
                Job Tracker ({data.jobs.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link border-0 fw-bold ${activeTab === 'resumes' ? 'active border-bottom border-primary text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('resumes')}
              >
                Resumes ({data.resumes.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link border-0 fw-bold ${activeTab === 'coverLetters' ? 'active border-bottom border-primary text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('coverLetters')}
              >
                Cover Letters ({data.coverLetters.length})
              </button>
            </li>
          </ul>
        </div>

        {/* Content Body */}
        <div className="p-4" style={{ flex: 1, overflow: "hidden", background: activeTab === 'jobs' ? "#fff" : "transparent" }}>
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <div style={{ height: "100%", overflowY: "auto" }}>
                {activeTab === 'jobs' && renderPipeline()}
                {activeTab === 'resumes' && renderDocumentList(data.resumes, 'resume')}
                {activeTab === 'coverLetters' && renderDocumentList(data.coverLetters, 'coverLetter')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-top bg-light rounded-bottom-4 text-end">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>

    {/* Render Job Detail Modal in READ ONLY mode */}
    {selectedJob && (
        <JobDetailsModal
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            setReminderJob={() => {}} // No-op
            updateJob={() => {}}      // No-op
            archiveJob={() => {}}     // No-op
            restoreJob={() => {}}     // No-op
            deleteJob={() => {}}      // No-op
            setEditingJob={() => {}}  // No-op
            setView={() => {}}        // No-op
            readOnly={true}           // <--- Enables Read Only Mode
        />
    )}
    </>
  );
}