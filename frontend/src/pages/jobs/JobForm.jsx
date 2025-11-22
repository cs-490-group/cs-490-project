import React, { useState, useEffect } from "react";
import JobsAPI from "../../api/jobs";

export default function JobForm({ addJob, editJob, cancelEdit }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [url, setUrl] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [industry, setIndustry] = useState("");
  const [jobType, setJobType] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Interested");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState("");
  const [salaryNotes, setSalaryNotes] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [id, setId] = useState(null);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scrapeSuccess, setScrapeSuccess] = useState("");

  // Company data fields
  const [companySize, setCompanySize] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyImageUrl, setCompanyImageUrl] = useState("");
  const [companyImageBase64, setCompanyImageBase64] = useState("");

  useEffect(() => {
    if (editJob) {
      setTitle(editJob.title || "");
      setCompany(editJob.company || "");
      setLocation(editJob.location || "");
      setSalary(editJob.salary || "");
      setUrl(editJob.url || "");
      setDeadline(editJob.deadline || "");
      setIndustry(editJob.industry || "");
      setJobType(editJob.job_type || editJob.jobType || "");
      setDescription(editJob.description || "");
      setStatus(editJob.status || "Interested");
      setNotes(editJob.notes || "");
      setContacts(editJob.contacts || "");
      setSalaryNotes(editJob.salary_notes || editJob.salaryNotes || "");
      setInterviewNotes(editJob.interview_notes || editJob.interviewNotes || "");
      setId(editJob.id);

      // UPDATED: Handle both URL and base64 image formats
      if (editJob.companyData?.image) {
        if (editJob.companyData.image.startsWith("http")) {
          setCompanyImageUrl(editJob.companyData.image);
          setCompanyImageBase64("");
        } else {
          setCompanyImageBase64(editJob.companyData.image);
          setCompanyImageUrl("");
        }
      }
    }
  }, [editJob]);

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setLocation("");
    setSalary("");
    setUrl("");
    setImportUrl("");
    setDeadline("");
    setIndustry("");
    setJobType("");
    setDescription("");
    setStatus("Interested");
    setNotes("");
    setContacts("");
    setSalaryNotes("");
    setInterviewNotes("");
    setId(null);
    setScrapeError("");
    setScrapeSuccess("");
    setCompanySize("");
    setCompanyIndustry("");
    setCompanyLocation("");
    setCompanyWebsite("");
    setCompanyDescription("");
    setCompanyImageUrl("");
    setCompanyImageBase64("");
  };

  const validateUrl = (urlString) => {
    if (!urlString || urlString.trim() === "") return true;
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const detectPlatform = (url) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('indeed.com')) return 'Indeed';
    if (urlLower.includes('linkedin.com')) return 'LinkedIn';
    if (urlLower.includes('glassdoor.com')) return 'Glassdoor';
    return 'Unknown';
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result.split(',')[1];
        setCompanyImageBase64(base64String);
        setCompanyImageUrl(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading image:", error);
      alert("Failed to upload image");
    }
  };

  const handleScrapeUrl = async () => {
    if (!importUrl.trim()) {
      setScrapeError("Please enter a URL first");
      return;
    }

    if (!validateUrl(importUrl.trim())) {
      setScrapeError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const platform = detectPlatform(importUrl);
    if (platform === 'Unknown') {
      setScrapeError("Unsupported platform. Please use Indeed, LinkedIn, or Glassdoor URLs.");
      return;
    }

    setIsScrapingUrl(true);
    setScrapeError("");
    setScrapeSuccess("");

    try {
      console.log(`🔍 Starting import from ${platform}...`);
      console.log(`📍 URL: ${importUrl.trim()}`);
      
      const response = await JobsAPI.importFromUrl(importUrl.trim());
      const data = response.data;
      
      console.log(`✅ Received data from backend:`, {
        ...data,
        company_data: data.company_data ? {
          ...data.company_data,
          image: data.company_data.image ? `[${data.company_data.image.length} chars]` : null
        } : null
      });

      let jobFields = [];
      let companyFields = [];

      // Set basic job fields
      if (data.title) {
        setTitle(data.title);
        jobFields.push('title');
      }
      if (data.company) {
        setCompany(data.company);
        jobFields.push('company name');
      }
      if (data.location) {
        setLocation(data.location);
        jobFields.push('location');
      }
      if (data.salary) {
        setSalary(data.salary);
        jobFields.push('salary');
      }
      
      // Set job type with normalization
      if (data.job_type) {
        const normalizedType = data.job_type.toLowerCase();
        if (normalizedType.includes("full")) {
          setJobType("Full-Time");
          jobFields.push('type');
        } else if (normalizedType.includes("part")) {
          setJobType("Part-Time");
          jobFields.push('type');
        } else if (normalizedType.includes("intern")) {
          setJobType("Internship");
          jobFields.push('type');
        } else if (normalizedType.includes("contract")) {
          setJobType("Contract");
          jobFields.push('type');
        } else if (normalizedType.includes("freelance")) {
          setJobType("Freelance");
          jobFields.push('type');
        } else {
          setJobType(data.job_type);
          jobFields.push('type');
        }
      }
      
      if (data.description) {
        setDescription(data.description.substring(0, 2000));
        jobFields.push('description');
      }
      
      // Set industry if provided at top level with strict matching
      if (data.industry) {
        const industryMap = {
          'technology': 'Technology',
          'finance': 'Finance',
          'healthcare': 'Healthcare',
          'education': 'Education',
          'marketing': 'Marketing',
          'design': 'Design',
          'consulting': 'Consulting',
          'manufacturing': 'Manufacturing',
          'retail': 'Retail'
        };
        
        const normalizedIndustry = data.industry.toLowerCase().trim();
        
        for (const [key, value] of Object.entries(industryMap)) {
          if (normalizedIndustry === key || normalizedIndustry.includes(key)) {
            setIndustry(value);
            jobFields.push('industry');
            break;
          }
        }
        // Don't set anything if no match found - leave it blank for user to select
      }
      
      // Set company data fields
      if (data.company_data) {
        console.log("🏢 Processing company data...");
        
        // Only set fields that have actual values
        if (data.company_data.size) {
          setCompanySize(data.company_data.size);
          companyFields.push('size');
        }
        
        if (data.company_data.industry) {
          setCompanyIndustry(data.company_data.industry);
          companyFields.push('industry');
          
          // Also set main industry dropdown if not already set
          if (!data.industry) {
            const industryMap = {
              'technology': 'Technology',
              'tech': 'Technology',
              'software': 'Technology',
              'it': 'Technology',
              'information technology': 'Technology',
              'finance': 'Finance',
              'financial': 'Finance',
              'banking': 'Finance',
              'healthcare': 'Healthcare',
              'medical': 'Healthcare',
              'health': 'Healthcare',
              'education': 'Education',
              'marketing': 'Marketing',
              'advertising': 'Marketing',
              'design': 'Design',
              'consulting': 'Consulting',
              'manufacturing': 'Manufacturing',
              'retail': 'Retail',
              'e-commerce': 'Retail'
            };
            
            const normalizedIndustry = data.company_data.industry.toLowerCase();
            for (const [key, value] of Object.entries(industryMap)) {
              if (normalizedIndustry.includes(key)) {
                setIndustry(value);
                jobFields.push('industry');
                break;
              }
            }
            // Don't set anything if no match found - leave it blank for user to select
          }
        }
        
        if (data.company_data.location) {
          setCompanyLocation(data.company_data.location);
          companyFields.push('headquarters');
        }
        
        if (data.company_data.website) {
          setCompanyWebsite(data.company_data.website);
          companyFields.push('website');
        }
        
        if (data.company_data.description) {
          setCompanyDescription(data.company_data.description.substring(0, 1500));
          companyFields.push('description');
        }
        
        // UPDATED: Handle both URL and base64 image formats
        if (data.company_data.image) {
          if (data.company_data.image.startsWith("http")) {
            setCompanyImageUrl(data.company_data.image);
            setCompanyImageBase64("");
          } else {
            setCompanyImageBase64(data.company_data.image);
            setCompanyImageUrl("");
          }
          companyFields.push('logo');
          console.log(`✅ Company logo set (${data.company_data.image.length} chars)`);
        }
        
        console.log(`✅ Company fields set: ${companyFields.join(', ')}`);
      } else {
        console.log(`⚠️ No company_data in response`);
      }
   
      setUrl(importUrl.trim());
      jobFields.push('url');
      
      setScrapeError("");
      
      // Build success message
      let successParts = [];
      if (jobFields.length > 0) {
        successParts.push('Job Data');
      }
      if (companyFields.length > 0) {
        successParts.push('Company Data');
      }
      
      const successMsg = `✅ Successfully imported ${successParts.join(' and ')} from ${platform}!`;
      setScrapeSuccess(successMsg);
      console.log(successMsg);
      console.log(`Job fields: ${jobFields.join(', ')}`);
      console.log(`Company fields: ${companyFields.join(', ')}`);
      
      // Clear success message after 8 seconds
      setTimeout(() => setScrapeSuccess(""), 8000);
      
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to import job posting. Please try again or enter details manually.";
      setScrapeError(errorMessage);
      console.error("❌ Import error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation with scroll to field
    if (!title.trim()) {
      alert("Job title is required");
      document.querySelector('input[placeholder*="Senior Frontend Developer"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!company.trim()) {
      alert("Company name is required");
      document.querySelector('input[placeholder*="TechCorp Inc."]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!location.trim()) {
      alert("Location is required");
      document.querySelector('input[placeholder*="Remote or New York"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!industry || industry === "") {
      alert("Industry is required");
      document.querySelector('select[value="' + industry + '"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!jobType || jobType === "") {
      alert("Job type is required");
      document.querySelector('select').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!deadline) {
      alert("Application deadline is required");
      document.querySelector('input[type="date"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (url.trim() && !validateUrl(url.trim())) {
      alert("Please enter a valid Job Posting URL starting with http:// or https://");
      document.querySelector('input[placeholder*="example.com/job-posting"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (companyWebsite.trim() && !validateUrl(companyWebsite.trim())) {
      alert("Please enter a valid company website URL starting with http:// or https://");
      document.querySelector('input[placeholder*="www.company.com"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const now = new Date().toISOString();

    // UPDATED: Build company data object supporting both base64 and URL images
    const companyData = (companySize || companyIndustry || companyLocation || companyWebsite || companyDescription || companyImageBase64 || companyImageUrl) ? {
      size: companySize.trim() || undefined,
      industry: companyIndustry.trim() || undefined,
      location: companyLocation.trim() || undefined,
      website: companyWebsite.trim() || undefined,
      description: companyDescription.trim() || undefined,
      image: companyImageBase64 || companyImageUrl || undefined  // Support both base64 and URL
    } : undefined;

    const jobData = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      salary: salary.trim() || undefined,
      url: url.trim() || undefined,
      deadline: deadline,
      industry: industry,
      job_type: jobType,
      description: description.trim() || undefined,
      status: status,
      notes: notes.trim() || undefined,
      contacts: contacts.trim() || undefined,
      salary_notes: salaryNotes.trim() || undefined,
      interview_notes: interviewNotes.trim() || undefined,
      company_data: companyData,
    };

    console.log("Submitting job data:", {
      ...jobData,
      company_data: jobData.company_data ? {
        ...jobData.company_data,
        image: jobData.company_data.image ? `[${jobData.company_data.image.length} chars]` : null
      } : null
    });

    try {
      if (editJob) {
        jobData.id = id;
        const statusChanged = editJob.status !== status;
        if (statusChanged) {
          jobData.status_history = [
            ...(editJob.status_history || []),
            [status, now],
          ];
        }
        
        await editJob.submit(jobData);
      } else {
        jobData.status_history = [[status, now]];
        await addJob(jobData);
      }

      resetForm();
      cancelEdit && cancelEdit();
    } catch (error) {
      console.error("Failed to submit job:", error);
      alert(error.response?.data?.detail || "Failed to save job. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333",
  };

  const sectionStyle = {
    marginBottom: "20px",
    padding: "16px",
    background: "#f9f9f9",
    borderRadius: "6px",
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#333" }}>
        {editJob ? "Edit Job" : "Add New Job"}
      </h2>

      {/* URL Import Section */}
      <div
        style={{
          ...sectionStyle,
          background: "#e8f4fd",
          border: "2px dashed #4f8ef7",
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
          🔗 Quick Import from Job Board
        </h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
          Paste a job URL from <strong>Indeed</strong>, <strong>LinkedIn</strong>, or <strong>Glassdoor</strong> to auto-fill the form
        </p>

        <label style={labelStyle}>Job Posting URL</label>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <input
              style={{
                ...inputStyle,
                marginBottom: 0,
                border:
                  importUrl.trim() && !validateUrl(importUrl.trim())
                    ? "2px solid #f44336"
                    : "1px solid #ccc",
              }}
              type="url"
              placeholder="https://www.indeed.com/viewjob?jk=... or LinkedIn/Glassdoor job URL"
              value={importUrl}
              onChange={(e) => {
                setImportUrl(e.target.value);
                setScrapeError("");
                setScrapeSuccess("");
              }}
            />
            {importUrl.trim() && !validateUrl(importUrl.trim()) && (
              <div
                style={{ color: "#f44336", fontSize: "12px", marginTop: "4px" }}
              >
                Please enter a valid URL starting with http:// or https://
              </div>
            )}
            {scrapeError && (
              <div
                style={{ color: "#f44336", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}
              >
                ❌ {scrapeError}
              </div>
            )}
            {scrapeSuccess && (
              <div
                style={{ color: "#00bf72", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}
              >
                {scrapeSuccess}
              </div>
            )}
            {importUrl.trim() && validateUrl(importUrl.trim()) && (
              <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                Platform detected: <strong>{detectPlatform(importUrl)}</strong>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleScrapeUrl}
            disabled={
              isScrapingUrl ||
              !importUrl.trim() ||
              !validateUrl(importUrl.trim())
            }
            style={{
              padding: "10px 20px",
              background: isScrapingUrl ? "#ccc" : "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                isScrapingUrl || !importUrl.trim() ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            {isScrapingUrl ? "⏳ Importing..." : "📥 Import"}
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
          📋 Basic Information
        </h3>

        <label style={labelStyle}>Job Title *</label>
        <input
          style={inputStyle}
          placeholder="e.g., Senior Frontend Developer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label style={labelStyle}>Company Name *</label>
        <input
          style={inputStyle}
          placeholder="e.g., TechCorp Inc."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Location *</label>
            <input
              style={inputStyle}
              placeholder="e.g., Remote or New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Salary Range</label>
            <input
              style={inputStyle}
              placeholder="e.g., $80k-$120k"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>
        </div>

        <label style={labelStyle}>Job Posting URL</label>
        <input
          style={{
            ...inputStyle,
            border:
              url.trim() && !validateUrl(url.trim())
                ? "2px solid #f44336"
                : "1px solid #ccc",
          }}
          type="url"
          placeholder="https://example.com/job-posting"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {url.trim() && !validateUrl(url.trim()) && (
          <div
            style={{
              color: "#f44336",
              fontSize: "12px",
              marginTop: "-8px",
              marginBottom: "12px",
            }}
          >
            Please enter a valid URL starting with http:// or https://
          </div>
        )}
      </div>

      {/* Company Information Section */}
      <div style={{
        ...sectionStyle,
        background: "#f0f7ff",
        border: "2px solid #4f8ef7",
      }}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#1976d2" }}>
          🏢 Company Information (Optional)
        </h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
          Add details about the company. Auto-populated from job imports when available.
        </p>

        {/* Company Logo Upload */}
        <label style={labelStyle}>Company Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{
            ...inputStyle,
            padding: "8px",
          }}
        />
        {(companyImageBase64 || companyImageUrl) && (
          <div style={{ marginBottom: "12px", textAlign: "center" }}>
            <img
              src={
                companyImageBase64
                  ? `data:image/png;base64,${companyImageBase64}`
                  : companyImageUrl.startsWith("http")
                  ? companyImageUrl
                  : `data:image/png;base64,${companyImageUrl}`
              }
              alt="Company logo preview"
              style={{
                maxWidth: "150px",
                maxHeight: "80px",
                objectFit: "contain",
                borderRadius: "4px",
                border: "1px solid #ddd"
              }}
            />
            <button
              type="button"
              onClick={() => {
                setCompanyImageBase64("");
                setCompanyImageUrl("");
              }}
              style={{
                display: "block",
                margin: "8px auto 0",
                padding: "4px 12px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Remove Logo
            </button>
          </div>
        )}


        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Company Size</label>
            <input
              style={inputStyle}
              placeholder="e.g., 1,000-5,000 employees"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Company Industry</label>
            <input
              style={inputStyle}
              placeholder="e.g., Software Development"
              value={companyIndustry}
              onChange={(e) => setCompanyIndustry(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Company Headquarters</label>
            <input
              style={inputStyle}
              placeholder="e.g., San Francisco, CA"
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Company Website</label>
            <input
              style={{
                ...inputStyle,
                border:
                  companyWebsite.trim() && !validateUrl(companyWebsite.trim())
                    ? "2px solid #f44336"
                    : "1px solid #ccc",
              }}
              type="url"
              placeholder="https://www.company.com"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
            {companyWebsite.trim() && !validateUrl(companyWebsite.trim()) && (
              <div style={{ color: "#f44336", fontSize: "12px", marginTop: "-8px" }}>
                Please enter a valid URL
              </div>
            )}
          </div>
        </div>

        <label style={labelStyle}>Company Description</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "80px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Brief description of the company..."
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value.substring(0, 1500))}
          maxLength={1500}
        />
        <div style={{ fontSize: "12px", color: "#666", marginTop: "-8px", marginBottom: "12px" }}>
          {companyDescription.length}/1500 characters
        </div>
      </div>

      {/* Job Details */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
          🔍 Job Details
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Industry *</label>
            <select
              style={inputStyle}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
            >
              <option value="">Select Industry</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Consulting">Consulting</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Job Type *</label>
            <select
              style={inputStyle}
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              required
            >
              <option value="">Select Type</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Interested">Interested</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <label style={labelStyle}>Application Deadline *</label>
        <input
          style={inputStyle}
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />

        <label style={labelStyle}>Job Description (2000 char limit)</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "120px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Paste or type the job description here..."
          value={description}
          onChange={(e) => setDescription(e.target.value.substring(0, 2000))}
          maxLength={2000}
        />
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            marginTop: "-8px",
            marginBottom: "12px",
          }}
        >
          {description.length}/2000 characters
        </div>
      </div>

      {/* Personal Notes */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
          📝 Personal Notes & Tracking
        </h3>

        <label style={labelStyle}>General Notes</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "80px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Your personal observations, thoughts, pros/cons..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <label style={labelStyle}>Contact Information</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "60px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Recruiter name, hiring manager, email, phone..."
          value={contacts}
          onChange={(e) => setContacts(e.target.value)}
        />

        <label style={labelStyle}>Salary Negotiation Notes</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "60px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Salary expectations, negotiation points, benefits..."
          value={salaryNotes}
          onChange={(e) => setSalaryNotes(e.target.value)}
        />

        <label style={labelStyle}>Interview Notes & Feedback</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "80px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          placeholder="Interview questions asked, your answers, feedback received..."
          value={interviewNotes}
          onChange={(e) => setInterviewNotes(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => {
            resetForm();
            cancelEdit && cancelEdit();
          }}
          style={{
            padding: "12px 24px",
            background: "#999",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            padding: "12px 24px",
            background: "#4f8ef7",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {editJob ? "💾 Save Changes" : "➕ Add Job"}
        </button>
      </div>
    </div>
  );
}