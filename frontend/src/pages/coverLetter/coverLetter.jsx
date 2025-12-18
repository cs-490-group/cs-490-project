import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { renderTemplate } from "./renderTemplate";
import { useFlash } from "../../context/flashContext";
import UserAPI from "../../api/user";
import CoverLetterAPI from "../../api/coverLetters";
import CoverLetterAnalytics from './CoverLetterAnalytics';
import JobsAPI from "../../api/jobs";
import CoverLetterForm from "./CoverLetterForm";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Upload, Briefcase } from "lucide-react";
import posthog from "posthog-js";



// CSS Module for better performance (move to separate .css file)
const styles = `
  .cover-letter-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .letter-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 16px;
    width: calc(33% - 10px);
    display: flex;
    flex-direction: column;
    background: #eaf0ff;
  }

  .letter-card.uploaded {
    background: #e8f5e9;
  }

  .letter-iframe {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 6px;
    display: block;
  }

  .letter-buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .letter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .letter-title {
    margin: 0;
    flex: 1;
    min-width: 150px;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-title {
    margin: 0 0 16px 0;
    color: #333;
  }

  .modal-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .modal-button {
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
    background: #f9f9f9;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
  }

  .modal-button:hover,
  .modal-button:focus {
    background-color: #e8e8e8;
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }

  .modal-cancel {
    margin-top: 16px;
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.2s;
  }

  .modal-cancel:hover,
  .modal-cancel:focus {
    background-color: #d32f2f;
    outline: 2px solid #fff;
  }

  @media (max-width: 1024px) {
    .letter-card {
      width: calc(50% - 10px);
    }
  }

  @media (max-width: 640px) {
    .letter-card {
      width: 100%;
    }
  }
`;

const styleConstant = ["formal", "creative", "technical", "modern", "casual"];
const industriesConstant = [
  "Software Development",
  "Cybersecurity",
  "Healthcare",
  "Education",
  "Marketing",
  "Non-specific",
];

function populateTemplate(template, data) {
  if (!template || !data) return template || "";
  const { profile = {}, education = [], skills = [], employment = [], certifications = [] } = data;
  const topEducation = education[0] || {};
  const latestEmployment = employment[0] || {};

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return template
    .replace(/\{\{name\}\}/g, profile?.full_name || profile?.username || "Your name here")
    .replace(/\{\{username\}\}/g, profile?.username || "username")
    .replace(/\{\{email\}\}/g, profile?.email || "email")
    .replace(/\{\{phone\}\}/g, profile?.phone_number || "phone number")
    .replace(/\{\{address\}\}/g, profile?.address || "address")
    .replace(/\{\{title\}\}/g, profile?.title || "title")
    .replace(/\{\{biography\}\}/g, profile?.biography || "Here is where details about you would go.")
    .replace(/\{\{industry\}\}/g, profile?.industry || "industry")
    .replace(/\{\{experience_level\}\}/g, profile?.experience_level || "")
    .replace(/\{\{skills\}\}/g, skills?.filter(s => s && s.name && s.name.trim() !== "").slice(0, 3).map(s => s.name).join(", ") || "")
    .replace(/\{\{latest_title\}\}/g, latestEmployment?.title || "title")
    .replace(/\{\{latest_company\}\}/g, latestEmployment?.company || "company")
    .replace(/\{\{latest_location\}\}/g, latestEmployment?.location || "location")
    .replace(/\{\{top_degree\}\}/g, topEducation?.degree || "degree")
    .replace(/\{\{top_field\}\}/g, topEducation?.field_of_study || "field")
    .replace(/\{\{top_institution\}\}/g, topEducation?.institution_name || "institution")
    .replace(/\{\{date\}\}/g, formattedDate || "Today's date")
    .replace(/\{\{certifications\}\}/g, certifications?.map((c) => c.name).join(", ") || "certifications");
}

const sortLetters = (letters, sortOrder) => {
  if (!sortOrder) return letters;
  
  const sorted = [...letters];
  if (sortOrder === "most") {
    sorted.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
  } else if (sortOrder === "least") {
    sorted.sort((a, b) => (a.usage_count || 0) - (b.usage_count || 0));
  }
  return sorted;
};

const getCompanyName = (job) => {
  if (!job) return "Company";
  if (typeof job.company === 'string') return job.company || "Company";
  if (typeof job.company === 'object' && job.company !== null) {
    return job.company.name || "Company";
  }
  if (job.company_data) {
    if (typeof job.company_data === 'string') return job.company_data;
    if (typeof job.company_data === 'object' && job.company_data.name) return job.company_data.name;
  }
  return "Company";
};

// LAZY LOADED IFRAME COMPONENT
function LazyIframe({ content, title, letterId, iframeRef, onLoad }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "50px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight: "200px" }}>
      {isVisible ? (
        <iframe
          ref={iframeRef}
          title={`letter-${letterId}`}
          srcDoc={content || "<html><body></body></html>"}
          className="letter-iframe"
          onLoad={onLoad}
          loading="lazy"
        />
      ) : (
        <div className="letter-iframe" style={{ background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      )}
    </div>
  );
}

// ACCESSIBLE MODAL COMPONENT
function JobSelectionModal({ letterId, onClose, onSelect, showFlash, jobs, loading }) {
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);

  useEffect(() => {
    // Focus trap
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    firstButtonRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleModalJobSelect = (jobId) => {
    onSelect(jobId);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="modal-title">Select a Job</h2>

        {loading ? (
          <p>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p>No jobs found</p>
        ) : (
          <div className="modal-list">
            {jobs.map((job, index) => {
              const companyName = typeof job.company === 'object' && job.company !== null 
                ? (job.company.name || "Unknown Company") 
                : job.company;
              const validJobId = job.id || job._id;

              return (
                <button
                  key={validJobId}
                  ref={index === 0 ? firstButtonRef : null}
                  onClick={() => handleModalJobSelect(validJobId)}
                  className="modal-button"
                  aria-label={`${job.title} at ${companyName}`}
                >
                  <strong>{job.title}</strong> - {companyName}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="modal-cancel"
          aria-label="Close job selection dialog"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function CoverLetterList() {
  const [sampleLetters, setSampleLetters] = useState([]);
  const [userLetters, setUserLetters] = useState([]);
  const [filterStyle, setFilterStyle] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [editingLetter, setEditingLetter] = useState(null);
  const [jobLetter, setJobLetter] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const { showFlash } = useFlash();
  const iframeRefs = useRef({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/html' && !file.name.toLowerCase().endsWith('.html')) {
      showFlash("Please upload an HTML file", "error");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('company', "");
      formData.append('position', "");
      
      const res = await CoverLetterAPI.upload(formData);
      
      if (res.data.letter) {
        setUserLetters((prev) => [...prev, res.data.letter]);
        showFlash("HTML template uploaded successfully!", "success");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Failed to upload file:", err);
      const errorMessage = err.response?.data?.detail || "Failed to upload HTML template";
      showFlash(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  }, [showFlash]);

  const handleDownloadPDF = useCallback(async (letterId, letterTitle) => {
    const iframe = iframeRefs.current[letterId];
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return;

      const canvas = await html2canvas(doc.documentElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#f4f4f9',
        windowHeight: doc.documentElement.scrollHeight
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

      pdf.save(`${letterTitle || "cover_letter"}.pdf`);
      showFlash("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      showFlash("Failed to download PDF", "error");
    }
  }, [showFlash]);

  const handleDownloadDOCX = useCallback(async (letterId, letterTitle) => {
    try {
      showFlash("Generating DOCX...", "info");
      const res = await CoverLetterAPI.downloadDOCX(letterId);
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${letterTitle || "cover_letter"}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showFlash("DOCX downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to download DOCX:", err);
      showFlash("Failed to download DOCX", "error");
    }
  }, [showFlash]);

  const handleDownloadHTML = useCallback((letterId, letterTitle) => {
    const letter = userLetters.find(l => l.id === letterId);
    if (!letter) return;

    const blob = new Blob([letter.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letterTitle || "cover_letter"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showFlash("HTML file downloaded!", "success");
  }, [userLetters, showFlash]);

  useEffect(() => {
    const loadLetters = async () => {
      try {
        const userData = await UserAPI.getAllData();
        
        let usageByType = {};
        try {
          const usageRes = await CoverLetterAPI.getUsageByType();
          usageByType = usageRes.data || {};
        } catch (err) {
          console.warn("Failed to fetch usage stats:", err);
        }

        let allSamples = [];
        for (let style of styleConstant) {
          for (let industry of industriesConstant) {
            const templateFile = `${style}_${industry.replace(/\s/g, "_")}.html`;
            try {
              const rawTemplate = await renderTemplate(templateFile);
              const populatedContent = populateTemplate(rawTemplate, userData);
              const sampleId = `sample_${style}_${industry.replace(/\s/g, "_")}`;
              allSamples.push({
                id: sampleId,
                templateFile: templateFile,
                title: `${style} - ${industry}`,
                content: populatedContent,
                style,
                industry,
                usage_count: usageByType[sampleId] || 0,
              });
            } catch (err) {
              console.error("Failed to load template:", templateFile, err);
            }
          }
        }

        if (filterStyle) allSamples = allSamples.filter((l) => l.style === filterStyle);
        if (filterIndustry) allSamples = allSamples.filter((l) => l.industry === filterIndustry);

        let groupedSamples;
        if (filterIndustry) {
          groupedSamples = [{ industry: filterIndustry, letters: allSamples }];
        } else {
          groupedSamples = allSamples.reduce((acc, letter) => {
            let group = acc.find((g) => g.style === letter.style);
            if (!group) {
              group = { style: letter.style, letters: [] };
              acc.push(group);
            }
            group.letters.push(letter);
            return acc;
          }, []);
        }

        //setSampleLetters(groupedSamples);

        const uuid = localStorage.getItem("uuid");
        const res = await CoverLetterAPI.getAll(uuid);
        setUserLetters(res.data || []);
      } catch (err) {
        console.error("Failed to load letters:", err);
      }
    };

    loadLetters();
  }, [filterStyle, filterIndustry]);

  const handleAddSample = useCallback(async (sample) => {
    try {
      const data = {
        title: sample.title,
        company: sample.company || "",
        position: sample.position || "",
        content: sample.content,
        template_type: sample.id,
        usage_count: 0
      };
      const res = await CoverLetterAPI.add(data);
      setUserLetters((prev) => [...prev, { ...data, id: res.data.coverletter_id }]);
      
      try {
        const usageRes = await CoverLetterAPI.getUsageByType();
        const usageByType = usageRes.data || {};
        
        setSampleLetters((prevGroups) =>
          prevGroups.map((group) => ({
            ...group,
            letters: group.letters.map((letter) => ({
              ...letter,
              usage_count: usageByType[letter.id] || 0,
            })),
          }))
        );
      } catch (err) {
        console.warn("Failed to refresh usage stats:", err);
      }
      
      showFlash("Cover letter added!", "success");
      posthog.capture("sample_cover_letter_added", { template_type: sample.id });
    } catch (err) {
      console.error("Failed to add sample:", err);
      showFlash("Failed to add cover letter.", "error");
    }
  }, [showFlash]);

  const handleDelete = useCallback(async (id) => {
    try {
      await CoverLetterAPI.delete(id);
      setUserLetters((prev) => prev.filter((l) => l.id !== id));
      showFlash("Cover letter deleted.", "success");
    } catch (err) {
      console.error("Failed to delete letter:", err);
      showFlash("Failed to delete cover letter.", "error");
    }
  }, [showFlash]);

  const handleJobAdd = useCallback((letterId) => {
    if (!jobs.length) {
      setJobsLoading(true);
      JobsAPI.getAll()
        .then((res) => {
          setJobs(res.data || []);
          setJobLetter(letterId);
        })
        .catch((err) => {
          console.error("Failed to load jobs:", err);
          showFlash("Failed to load jobs", "error");
        })
        .finally(() => setJobsLoading(false));
    } else {
      setJobLetter(letterId);
    }
  }, [jobs.length, showFlash]);

  const handleJobSelect = useCallback(async (jobId) => {
    try {
      await CoverLetterAPI.addToJob(jobLetter, jobId);
      setUserLetters(prev => prev.map(l => {
        if (l.id === jobLetter) {
          return { ...l, job_id: jobId };
        }
        return l;
      }));
      showFlash("Cover letter added to job!", "success");
    } catch (err) {
      console.error("Failed to add cover letter to job:", err);
      showFlash("Failed to add cover letter to job", "error");
    }
  }, [jobLetter, showFlash]);

  const autoResizeIframe = useCallback((el) => {
    if (!el) return;
    try {
      const doc = el.contentDocument || el.contentWindow.document;
      el.style.height = doc.body.scrollHeight + "px";
    } catch {}
  }, []);

  // Memoize sorted letters
  const sortedUserLetters = useMemo(() => sortLetters(userLetters, sortOrder), [userLetters, sortOrder]);

  return (
    <div>
      <style>{styles}</style>
      <h1 className="visually-hidden">Cover Letters</h1>

      {editingLetter && (
        <CoverLetterForm
          editEntry={editingLetter}
          onAdded={(letter) => {
            setUserLetters((prev) => prev.map((l) => (l.id === letter.id ? letter : l)));
            setEditingLetter(null);
          }}
          cancelEdit={() => setEditingLetter(null)}
        />
      )}

      {jobLetter && (
        <JobSelectionModal
          letterId={jobLetter}
          onClose={() => setJobLetter(null)}
          onSelect={handleJobSelect}
          showFlash={showFlash}
          jobs={jobs}
          loading={jobsLoading}
        />
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: "48px", margin: 0 }}>
            <span style={{ color: "white" }}>YOUR COVER LETTERS</span>
          </h2>
        </div>
        
        <div className="bg-white p-1 rounded-pill shadow-sm d-flex">
          <button
            onClick={() => setViewMode("list")}
            className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted'}`}
            aria-pressed={viewMode === 'list'}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("analytics")}
            className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${viewMode === 'analytics' ? 'bg-primary text-white' : 'text-muted'}`}
            aria-pressed={viewMode === 'analytics'}
          >
            Performance ðŸ"Š
          </button>
        </div>
      </div>

      {viewMode === "analytics" ? (
        <CoverLetterAnalytics />
      ) : (
        <>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,text/html"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              id="file-upload"
              aria-label="Upload HTML cover letter template"
            />
            <label htmlFor="file-upload" style={{ display: "inline-block" }}>
              <div
                className={`btn ${uploading ? "btn-secondary" : "btn-primary"}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <Upload size={18} aria-hidden="true" />
                {uploading ? "Uploading..." : "Upload HTML Template"}
              </div>
            </label>
          </div>

          <div className="cover-letter-container">
            {sortedUserLetters.map((letter) => (
              <div
                key={letter.id}
                className={`letter-card ${letter.uploadedFile ? 'uploaded' : ''}`}
              >
                <div className="letter-header">
                  <h3 className="letter-title">{letter.title}</h3>
                  {letter.uploadedFile && <span className="badge bg-success">UPLOADED</span>}
                  {letter.usage_count > 0 && <span className="badge bg-primary">Used {letter.usage_count}x</span>}
                  {letter.job_id && (
                    <span className="badge bg-info text-white d-inline-flex align-items-center gap-1">
                      <Briefcase size={10} aria-hidden="true" /> Linked
                    </span>
                  )}
                </div>

                <LazyIframe
                  content={letter.content}
                  title={letter.title}
                  letterId={letter.id}
                  iframeRef={(el) => (iframeRefs.current[letter.id] = el)}
                  onLoad={(e) => autoResizeIframe(e.target)}
                />

                <div className="letter-buttons">
                  <button
                    onClick={() => navigate(`/cover-letter/edit/${letter.id}`)}
                    className="btn btn-warning text-white"
                    aria-label={`Edit ${letter.title}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleJobAdd(letter.id)}
                    className="btn btn-success"
                    aria-label={letter.job_id ? `Change job link for ${letter.title}` : `Link ${letter.title} to a job`}
                  >
                    {letter.job_id ? "Change Job" : "Link Job"}
                  </button>
                  <button
                    onClick={() => handleDelete(letter.id)}
                    className="btn btn-danger"
                    aria-label={`Delete ${letter.title}`}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(letter.id, letter.title)}
                    className="btn btn-success"
                    aria-label={`Download ${letter.title} as PDF`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDownloadDOCX(letter.id, letter.title)}
                    className="btn btn-info text-white"
                    aria-label={`Download ${letter.title} as DOCX`}
                  >
                    DOCX
                  </button>
                  <button
                    onClick={() => handleDownloadHTML(letter.id, letter.title)}
                    className="btn btn-primary"
                    aria-label={`Download ${letter.title} as HTML`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => navigate(`/cover-letter/feedback/${letter.id}`)}
                    className="btn btn-info text-white"
                    aria-label={`Share and get feedback on ${letter.title}`}
                  >
                    Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "48px", marginTop: "40px" }}>
            <span style={{ color: "white" }}>SAMPLE COVER LETTERS</span>
          </h2>

          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <label style={{ fontWeight: "500", marginBottom: "6px", color: "#333" }} htmlFor="style-select">
                Style
              </label>
              <select
                id="style-select"
                value={filterStyle}
                onChange={(e) => setFilterStyle(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
                aria-label="Filter cover letters by style"
              >
                <option value="">All</option>
                {styleConstant.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <label style={{ fontWeight: "500", marginBottom: "6px", color: "#333" }} htmlFor="industry-select">
                Industry
              </label>
              <select
                id="industry-select"
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
                aria-label="Filter cover letters by industry"
              >
                <option value="">All</option>
                {industriesConstant.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <label style={{ fontWeight: "500", marginBottom: "6px", color: "#333" }} htmlFor="sort-select">
                Sort
              </label>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
                aria-label="Sort cover letters by usage"
              >
                <option value="">None</option>
                <option value="most">Most Used</option>
                <option value="least">Least Used</option>
              </select>
            </div>
          </div>

          {sampleLetters.map((group) => {
            const sortedLetters = sortLetters(group.letters, sortOrder);

            return (
              <section key={group.style || group.industry}>
                <h3 style={{ textTransform: "capitalize", color: "white" }}>
                  {group.style || group.industry}
                </h3>
                <div className="cover-letter-container">
                  {sortedLetters.map((sample) => (
                    <div
                      key={sample.id}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: "16px",
                        background: "#f9f9f9",
                        width: "calc(33% - 10px)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px", minHeight: "40px" }}>
                        <h4 style={{ margin: 0 }}>{sample.title}</h4>
                        {sample.usage_count > 0 && (
                          <span className="badge bg-warning text-dark">
                            {sample.usage_count}x
                          </span>
                        )}
                      </div>

                      <LazyIframe
                        content={sample.content}
                        title={sample.title}
                        letterId={sample.id}
                        iframeRef={(el) => (iframeRefs.current[sample.id] = el)}
                        onLoad={(e) => autoResizeIframe(e.target)}
                      />

                      <button
                        onClick={() => handleAddSample(sample)}
                        className="btn btn-primary"
                        aria-label={`Use ${sample.title} as cover letter template`}
                        style={{ marginTop: "10px" }}
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}