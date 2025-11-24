import { useState, useEffect, useRef } from "react";
import { renderTemplate } from "./renderTemplate";
import { useFlash } from "../../context/flashContext";
import UserAPI from "../../api/user";
import CoverLetterAPI from "../../api/coverLetters";
import JobsAPI from "../../api/jobs";
import CoverLetterForm from "./CoverLetterForm";
import CoverLetterJob from "./coverLetterJob";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Upload } from "lucide-react";

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
    console.log("Modal job selected with jobId:", jobId);
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
            {jobs.map((job) => (
              <button
                key={job.id || job._id}
                onClick={() => handleModalJobSelect(job.id || job._id)}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e3f2fd";
                  e.target.style.borderColor = "#2196f3";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.borderColor = "#ddd";
                }}
              >
                <div style={{ fontWeight: "500", color: "#333" }}>
                  {job.title || "Untitled Position"}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  {job.company || "Company"}
                </div>
              </button>
            ))}
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

  const handleDownloadDOCX = async (letterId, letterTitle) => {
    const iframe = iframeRefs.current[letterId];
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      const reader = new FileReader();
      const dataUrl = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(imgBlob);
      });

      const base64Img = dataUrl.split(',')[1];
      
      const pageWidth = 8.5 * 914400;
      const pageHeight = 11 * 914400;
      const margins = 0.75 * 914400;
      const contentWidth = pageWidth - (2 * margins);
      const contentHeight = (canvas.height / canvas.width) * contentWidth;

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

      zip.folder('word/_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`);

      zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
<w:p>
<w:pPr>
<w:pStyle w:val="Normal"/>
<w:jc w:val="center"/>
</w:pPr>
<w:r>
<w:rPr/>
<w:drawing>
<wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<wp:simplePos x="0" y="0"/>
<wp:positionH relativeFrom="column"><wp:align>center</wp:align></wp:positionH>
<wp:positionV relativeFrom="paragraph"><wp:posOffset>0</wp:posOffset></wp:positionV>
<wp:extent cx="${Math.floor(contentWidth)}" cy="${Math.floor(contentHeight)}"/>
<wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:wrapNone/>
<wp:docPr id="1" name="Image 1"/>
<wp:cNvGraphicFramePr/>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:nvPicPr>
<pic:cNvPr id="0" name="image1.png"/>
<pic:cNvPicPr/>
</pic:nvPicPr>
<pic:blipFill>
<a:blip r:embed="rId1"/>
<a:stretch><a:fillRect/></a:stretch>
</pic:blipFill>
<pic:spPr>
<a:xfrm><a:off x="0" y="0"/><a:ext cx="${Math.floor(contentWidth)}" cy="${Math.floor(contentHeight)}"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
</pic:spPr>
</pic:pic>
</a:graphicData>
</a:graphic>
</wp:anchor>
</w:drawing>
</w:r>
</w:p>
</w:body>
</w:document>`);

      zip.folder('word/media').file('image1.png', base64Img, { base64: true });

      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

      const docxBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${letterTitle || "cover_letter"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showFlash("DOCX downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to download DOCX:", err);
      showFlash("Failed to download DOCX", "error");
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
          // When filtering by industry, group by industry only
          groupedSamples = [{ industry: filterIndustry, letters: allSamples }];
        } else {
          // Otherwise group by style
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
      
      // Refetch usage stats to get updated global counts
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
      // Call your API to associate the letter with the job
      await CoverLetterAPI.addToJob(jobLetter, jobId);
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

      <h2 style={{ fontSize: "48px" }}>
        <span style={{ color: "white" }}>YOUR COVER LETTERS</span>
      </h2>
          
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
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 20px",
              background: uploading ? "#ccc" : "#2196f3",
              color: "white",
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <h4 style={{ margin: 0, flex: 1 }}>{letter.title}</h4>
              {letter.uploadedFile && (
                <span style={{ 
                  fontSize: "11px", 
                  padding: "2px 8px", 
                  background: "#4caf50", 
                  color: "white", 
                  borderRadius: "3px" 
                }}>
                  UPLOADED
                </span>
              )}
              {letter.usage_count > 0 && (
                <span style={{ 
                  fontSize: "11px", 
                  padding: "2px 8px", 
                  background: "#2196f3", 
                  color: "white", 
                  borderRadius: "3px" 
                }}>
                  Used {letter.usage_count}x
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
                style={{ padding: "6px 12px", background: "#ffa500", color: "white", border: "none", borderRadius: "4px" }}
              >
                Edit
              </button>
              <button 
                onClick={() => handleJobAdd(letter.id)}
                style={{ padding: "6px 12px", background: "#2196f3", color: "white", border: "none", borderRadius: "4px" }}
              >
                Add to Job
              </button>
              <button
                onClick={() => handleDelete(letter.id)}
                style={{ padding: "6px 12px", background: "#f44336", color: "white", border: "none", borderRadius: "4px" }}
              >
                Delete
              </button>
              <button
                onClick={() => handleDownloadPDF(letter.id, letter.title)}
                style={{ padding: "6px 12px", background: "#34c759", color: "white", border: "none", borderRadius: "4px" }}
              >
                Download PDF
              </button>
              <button
                onClick={() => handleDownloadDOCX(letter.id, letter.title)}
                style={{ padding: "6px 12px", background: "#9c27b0", color: "white", border: "none", borderRadius: "4px" }}
              >
                Download DOCX
              </button>
              <button
                onClick={() => handleDownloadHTML(letter.id, letter.title)}
                style={{ padding: "6px 12px", background: "#007aff", color: "white", border: "none", borderRadius: "4px" }}
                title="Download as HTML (can be re-uploaded)"
              >
                Download HTML
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
            <h3 style={{ textTransform: "capitalize", color: "white" }}>{group.style || group.industry}</h3>
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
                    <h4 style={{ margin: 0 }}>{sample.title}</h4>
                    {sample.usage_count > 0 && (
                      <span style={{ 
                        fontSize: "11px", 
                        padding: "2px 8px", 
                        background: "#ff9800", 
                        color: "white", 
                        borderRadius: "3px",
                        whiteSpace: "nowrap"
                      }}>
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
                    style={{
                      marginTop: "10px",
                      padding: "6px 12px",
                      background: "#4f8ef7",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      alignSelf: "center",
                    }}
                  >
                    Use this sample
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}