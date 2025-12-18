import { useState, useEffect, useRef } from "react";
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

const styles = ["formal", "creative", "technical", "modern", "casual"];
const industries = [
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

// Helper function to sort letters
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

// Helper function to safely get company name
const getCompanyName = (job) => {
  if (!job) return "Company";
  
  // If company is a string, return it
  if (typeof job.company === 'string') {
    return job.company || "Company";
  }
  
  // If company is an object, it might have a name property
  if (typeof job.company === 'object' && job.company !== null) {
    return job.company.name || "Company";
  }
  
  // Check company_data as fallback
  if (job.company_data) {
    if (typeof job.company_data === 'string') {
      return job.company_data;
    }
    if (typeof job.company_data === 'object' && job.company_data.name) {
      return job.company_data.name;
    }
  }
  
  return "Company";
};

// Job Selection Modal Component
function JobSelectionModal({ letterId, onClose, onSelect, showFlash }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await JobsAPI.getAll();
        setJobs(res.data || []);
      } catch (err) {
        console.error("Failed to load jobs:", err);
        showFlash("Failed to load jobs", "error");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const handleModalJobSelect = (jobId) => {
    onSelect(jobId);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 16px 0", color: "#333" }}>Select a Job</h2>

        {loading ? (
          <p style={{ color: "#666" }}>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: "#666" }}>No jobs found</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {jobs.map(job => {
            // Handle company name object vs string
            const companyName = typeof job.company === 'object' && job.company !== null 
                ? (job.company.name || "Unknown Company") 
                : job.company;

           
            const validJobId = job.id || job._id; 

            return (
                <button 
                key={validJobId} // Use the valid ID for key
                onClick={() => handleModalJobSelect(validJobId)} // Use valid ID for selection
                style={{
                    padding: "10px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    background: "#f9f9f9",
                    cursor: "pointer",
                    textAlign: "left"
                }}
                >
                <strong>{job.title}</strong> - {companyName}
                </button>
            );
            })}
        </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
          }}
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
  const { showFlash } = useFlash();
  const iframeRefs = useRef({});
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  const handleFileUpload = async (event) => {
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
      } else {
        console.error("No letter object in response");
        showFlash("Upload completed but letter format unexpected", "warning");
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
  };

  const handleDownloadPDF = async (letterId, letterTitle) => {
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
  };

  // UPDATED: Now calls the backend to generate and serve the DOCX file
  const handleDownloadDOCX = async (letterId, letterTitle) => {
    try {
      showFlash("Generating DOCX...", "info");
      
      // Call API (Ensure downloadDOCX is added to your API file, see note below)
      const res = await CoverLetterAPI.downloadDOCX(letterId);
      
      // Create a blob link to download the file
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
      showFlash("Failed to download DOCX. Ensure the backend is running.", "error");
    }
  };

  const handleDownloadHTML = (letterId, letterTitle) => {
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
  };

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
        for (let style of styles) {
          for (let industry of industries) {
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

        setSampleLetters(groupedSamples);

        const uuid = localStorage.getItem("uuid");
        const res = await CoverLetterAPI.getAll(uuid);
        setUserLetters(res.data || []);
      } catch (err) {
        console.error("Failed to load letters:", err);
      }
    };

    loadLetters();
  }, [filterStyle, filterIndustry]);

  const handleAddSample = async (sample) => {
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
  };

  const handleDelete = async (id) => {
    try {
      await CoverLetterAPI.delete(id);
      setUserLetters((prev) => prev.filter((l) => l.id !== id));
      showFlash("Cover letter deleted.", "success");
    } catch (err) {
      console.error("Failed to delete letter:", err);
      showFlash("Failed to delete cover letter.", "error");
    }
  };

  const handleEdit = (letter) => {
    setEditingLetter(letter);
  };

  const handleJobAdd = (letterId) => {
    setJobLetter(letterId);
  };

  const handleJobSelect = async (jobId) => {
    try {
      await CoverLetterAPI.addToJob(jobLetter, jobId);
      
      // Update local state to reflect change immediately
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
  };

  const handleSave = async (letter) => {
    try {
      if (letter.id) {
        await CoverLetterAPI.update(letter.id, {
          title: letter.title,
          company: letter.company,
          position: letter.position,
          content: letter.content,
        });
        setUserLetters((prev) => prev.map((l) => (l.id === letter.id ? letter : l)));
        showFlash("Cover letter updated!", "success");
      } else {
        const res = await CoverLetterAPI.add(letter);
        setUserLetters((prev) => [...prev, { ...letter, id: res.data.coverletter_id, usage_count: 0 }]);
        showFlash("Cover letter added!", "success");
      }
      setEditingLetter(null);
    } catch (err) {
      console.error("Failed to save letter:", err);
      showFlash("Failed to save cover letter.", "error");
    }
  };

  const autoResizeIframe = (el) => {
    if (!el) return;
    try {
      const doc = el.contentDocument || el.contentWindow.document;
      el.style.height = doc.body.scrollHeight + "px";
    } catch {}
  };

  return (
    <div>
      <h1 className="visually-hidden">Cover Letters</h1>
      {editingLetter && (
        <CoverLetterForm
          editEntry={editingLetter}
          onAdded={handleSave}
          cancelEdit={() => setEditingLetter(null)}
        />
      )}

      {jobLetter && (
        <JobSelectionModal
          letterId={jobLetter}
          onClose={() => setJobLetter(null)}
          onSelect={handleJobSelect}
          showFlash={showFlash}
        />
      )}

      {/* NEW: Header with Toggle */}
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
            >
               List View
            </button>
            <button
               onClick={() => setViewMode("analytics")}
               className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${viewMode === 'analytics' ? 'bg-primary text-white' : 'text-muted'}`}
            >
               Performance 📊
            </button>
        </div>
      </div>

      {viewMode === "analytics" ? (
          // ANALYTICS VIEW
          <CoverLetterAnalytics />
      ) : (
          // LIST VIEW (Original Content)
          <>
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,text/html"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ display: "inline-block", flexShrink: 0 }}>
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
                      whiteSpace: "nowrap",
                      width: "fit-content",
                      flexShrink: 0,
                    }}
                >
                  <Upload size={18} />
                  {uploading ? "Uploading..." : "Upload HTML Template"}
                </div>
              </label>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {sortLetters(userLetters, sortOrder).map((letter) => (
                <div
                  key={letter.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "16px",
                    background: letter.uploadedFile ? "#e8f5e9" : "#eaf0ff",
                    width: "calc(33% - 10px)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, flex: 1, minWidth: "150px" }}>{letter.title}</h3>
                    {letter.uploadedFile && (
                            <span className="badge bg-success ms-2">
                              UPLOADED
                            </span>
                          )}

                          {letter.usage_count > 0 && (
                            <span className="badge bg-primary ms-2">
                              Used {letter.usage_count}x
                            </span>
                          )}

                          {letter.job_id && (
                            <span className="badge bg-info text-white ms-2 d-inline-flex align-items-center gap-1">
                              <Briefcase size={10} /> Linked to Job
                            </span>
                          )}
                  </div>
                  <iframe
                    ref={(el) => (iframeRefs.current[letter.id] = el)}
                    title={`user-${letter.id}`}
                    srcDoc={letter.content ? letter.content : "<html><body></body></html>"}
                    style={{ width: "100%", border: "1px solid #ccc", borderRadius: "6px", minHeight: "200px" }}
                    onLoad={(e) => autoResizeIframe(e.target)}
                  />
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigate(`/cover-letter/edit/${letter.id}`)}
                      className="btn btn-warning text-white"
                        >
                      Edit
                    </button>
                    {/* Add to Job Button */}
                    <button
                        onClick={() => handleJobAdd(letter.id)}
                        className="btn btn-success"
                        title="Link to a Job"
                    >
                        {letter.job_id ? "Change Job Link" : "Link to Job"}
                    </button>
                    <button
                      onClick={() => handleDelete(letter.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(letter.id, letter.title)}
                      className="btn btn-success"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadDOCX(letter.id, letter.title)}
                      className="btn btn-info text-white"
                    >
                      Download DOCX
                    </button>
                    <button
                      onClick={() => handleDownloadHTML(letter.id, letter.title)}
                      className="btn btn-primary"
                      title="Download as HTML (can be re-uploaded)"
                    >
                      Download HTML
                    </button>

                    <button
                      onClick={() => navigate(`/cover-letter/feedback/${letter.id}`)}
                      className="btn btn-info text-white"
                    >
                      Share & Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: "48px" }}>
              <span style={{ color: "white" }}>SAMPLE COVER LETTERS</span>
            </h2>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <label
                  style={{
                    fontWeight: "500",
                    marginBottom: "6px",
                    color: "#333",
                  }}
                >
                  Style
                </label>
                <select
                  value={filterStyle}
                  onChange={(e) => setFilterStyle(e.target.value)}
                  style={{
                    display: "inline-block",
                    width: "fit-content",
                    minWidth: "180px",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    color: "#333",
                    fontSize: "14px",
                    cursor: "pointer",
                    flexShrink: 0,
                    appearance: "none",
                    textAlign: "center",
                  }}
                  aria-label="Filter by Style"
                >
                  <option value="">All</option>
                  {styles.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <label
                  style={{
                    fontWeight: "500",
                    marginBottom: "6px",
                    color: "#333",
                  }}
                >
                  Industry
                </label>
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  style={{
                    display: "inline-block",
                    width: "fit-content",
                    minWidth: "180px",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    color: "#333",
                    fontSize: "14px",
                    cursor: "pointer",
                    flexShrink: 0,
                    appearance: "none",
                    textAlign: "center",
                  }}
                  aria-label="Filter by Industry"
                >
                  <option value="">All</option>
                  {industries.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <label
                  style={{
                    fontWeight: "500",
                    marginBottom: "6px",
                    color: "#333",
                  }}
                >
                  Sort by Usage
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    display: "inline-block",
                    width: "fit-content",
                    minWidth: "180px",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    color: "#333",
                    fontSize: "14px",
                    cursor: "pointer",
                    flexShrink: 0,
                    appearance: "none",
                    textAlign: "center",
                  }}
                  aria-label="Sort by Usage"
                >
                  <option value="">None</option>
                  <option value="most">Most Used</option>
                  <option value="least">Least Used</option>
                </select>
              </div>
            </div>

            {sampleLetters.map((group) => {
              let sortedLetters = sortLetters(group.letters, sortOrder);

              return (
                <div key={group.style || group.industry} style={{ color: "black", marginBottom: "30px" }}>
                  <h2 style={{ textTransform: "capitalize", color: "white" }}>{group.style || group.industry}</h2>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      alignItems: "stretch",
                    }}
                  >
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                          <h3 style={{ margin: 0 }}>{sample.title}</h3>
                          {sample.usage_count > 0 && (
                            <span className="badge bg-warning text-dark">
                              {sample.usage_count}x used
                            </span>
                          )}
                        </div>
                        <iframe
                          ref={(el) => (iframeRefs.current[sample.id] = el)}
                          title={`sample-${sample.id}`}
                          srcDoc={sample.content ? sample.content : "<html><body></body></html>"}
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            flexGrow: 1,
                            minHeight: "150px",
                          }}
                          onLoad={(e) => autoResizeIframe(e.target)}
                        />
                        <button
                          onClick={() => handleAddSample(sample)}
                          className="btn btn-primary"
                        >
                          Use this sample
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
      )}
    </div>
  );
}