import React, { useState, useEffect } from "react";
import EmailsAPI from "../../api/emails";

export default function EmailSearchModal({ job, onClose, onEmailLinked }) {
  const [searching, setSearching] = useState(false);
  const [emails, setEmails] = useState([]);
  const [searchMode, setSearchMode] = useState("company"); // company, keywords, custom
  const [customQuery, setCustomQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [viewingBody, setViewingBody] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [linkingEmail, setLinkingEmail] = useState(null);

  // Auto-search by company when modal opens
  useEffect(() => {
    if (job.company) {
      handleCompanySearch();
    }
  }, []);

  const handleCompanySearch = async () => {
    try {
      setSearching(true);
      const companyName = typeof job.company === 'string' 
        ? job.company 
        : job.company?.name || "";
      
      const response = await EmailsAPI.searchByCompany(companyName);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error("Error searching emails:", error);
      if (error.response?.status === 401) {
        alert("Gmail not connected. Please connect your Gmail account in settings.");
      } else {
        alert("Failed to search emails. Please try again.");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleKeywordSearch = async () => {
    try {
      setSearching(true);
      const keywords = [job.title, job.company].filter(Boolean);
      
      const response = await EmailsAPI.searchByKeywords(keywords);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error("Error searching emails:", error);
      alert("Failed to search emails. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleCustomSearch = async () => {
    if (!customQuery.trim()) {
      alert("Please enter a search query");
      return;
    }

    try {
      setSearching(true);
      const response = await EmailsAPI.searchCustom(customQuery);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error("Error searching emails:", error);
      alert("Failed to search emails. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleViewEmailBody = async (email) => {
    try {
      setSelectedEmail(email);
      setViewingBody(true);
      setEmailBody("Loading...");
      
      const response = await EmailsAPI.getEmailBody(email.id);
      setEmailBody(response.data.body || "No content available");
    } catch (error) {
      console.error("Error loading email body:", error);
      setEmailBody("Failed to load email content");
    }
  };

  const handleLinkEmail = async (email) => {
    try {
      setLinkingEmail(email.id);
      
      // Extract sender name from "Name <email>" format
      const fromMatch = email.from.match(/^(.*?)\s*<(.+)>$/);
      const fromName = fromMatch ? fromMatch[1].trim() : "";
      const fromEmail = fromMatch ? fromMatch[2].trim() : email.from;
      
      const emailData = {
        job_id: job.id,
        email_id: email.id,
        thread_id: email.thread_id,
        subject: email.subject,
        from_email: fromEmail,
        from_name: fromName,
        date: email.date,
        snippet: email.snippet,
        detected_status: email.detected_status
      };
      
      await EmailsAPI.linkEmail(emailData);
      
      alert("✅ Email linked successfully!");
      
      if (onEmailLinked) {
        onEmailLinked();
      }
    } catch (error) {
      console.error("Error linking email:", error);
      if (error.response?.status === 400) {
        alert("This email is already linked to this job");
      } else {
        alert("Failed to link email. Please try again.");
      }
    } finally {
      setLinkingEmail(null);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const colors = {
      'Interview': '#ff9800',
      'Offer': '#4caf50',
      'Rejected': '#f44336',
      'Screening': '#2196f3'
    };
    
    return (
      <span style={{
        background: colors[status] || '#999',
        color: 'white',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        marginLeft: '8px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "12px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }}>
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: "20px" }}>
              📧 Link Email to Job
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              {job.title} at {typeof job.company === 'string' ? job.company : job.company?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>
        </div>

        {/* Search Modes */}
        <div style={{
          padding: "16px 20px",
          background: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => {
              setSearchMode("company");
              handleCompanySearch();
            }}
            style={{
              padding: "8px 16px",
              background: searchMode === "company" ? "#667eea" : "white",
              color: searchMode === "company" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            🏢 Search by Company
          </button>
          
          <button
            onClick={() => {
              setSearchMode("keywords");
              handleKeywordSearch();
            }}
            style={{
              padding: "8px 16px",
              background: searchMode === "keywords" ? "#667eea" : "white",
              color: searchMode === "keywords" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px"
            }}
          >
            🔍 Search by Keywords
          </button>
          
          <div style={{ display: "flex", gap: "8px", flex: 1, minWidth: "300px" }}>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomSearch()}
              placeholder="Custom Gmail search query..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "13px"
              }}
            />
            <button
              onClick={handleCustomSearch}
              style={{
                padding: "8px 16px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px"
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Email List */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "20px"
        }}>
          {searching ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
              <p>Searching emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>📭</div>
              <p>No emails found</p>
              <p style={{ fontSize: "13px", color: "#999" }}>
                Try a different search or connect your Gmail account
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {emails.map((email) => (
                <div
                  key={email.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    background: "white",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "8px"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#333",
                        marginBottom: "4px"
                      }}>
                        {email.subject}
                        {getStatusBadge(email.detected_status)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                        From: {email.from}
                      </div>
                      <div style={{ fontSize: "11px", color: "#999" }}>
                        {new Date(email.date).toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEmailBody(email);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "#f5f5f5",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#666"
                        }}
                      >
                        👁 View
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkEmail(email);
                        }}
                        disabled={linkingEmail === email.id}
                        style={{
                          padding: "6px 12px",
                          background: linkingEmail === email.id ? "#ccc" : "#667eea",
                          border: "none",
                          borderRadius: "4px",
                          cursor: linkingEmail === email.id ? "not-allowed" : "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "white"
                        }}
                      >
                        {linkingEmail === email.id ? "⏳" : "🔗"} Link
                      </button>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: "13px",
                    color: "#555",
                    lineHeight: "1.4",
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #f0f0f0"
                  }}>
                    {email.snippet}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Body Viewer */}
        {viewingBody && selectedEmail && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 4000,
              padding: "20px"
            }}
            onClick={() => setViewingBody(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "700px",
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto",
                padding: "24px"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "16px"
              }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                    {selectedEmail.subject}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                    From: {selectedEmail.from}
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#999" }}>
                    {new Date(selectedEmail.date).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewingBody(false)}
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
              
              <div style={{
                background: "#f9f9f9",
                padding: "16px",
                borderRadius: "8px",
                fontSize: "13px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                color: "#333"
              }}>
                {emailBody}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}