import React, { useState, useEffect } from "react";
import EmailsAPI from "../../api/emails";
import EmailSearchModal from "./EmailSearchModal";

export default function LinkedEmailsTab({ job }) {
  const [linkedEmails, setLinkedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [emailBody, setEmailBody] = useState("");
  const [loadingBody, setLoadingBody] = useState(false);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState("");

  useEffect(() => {
    loadLinkedEmails();
  }, [job.id]);

  const loadLinkedEmails = async () => {
    try {
      setLoading(true);
      const response = await EmailsAPI.getJobEmails(job.id);
      setLinkedEmails(response.data.emails || []);
    } catch (error) {
      console.error("Error loading linked emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkEmail = async (linkedEmailId) => {
    if (!window.confirm("Remove this email from the job?")) return;

    try {
      await EmailsAPI.unlinkEmail(linkedEmailId);
      setLinkedEmails(prev => prev.filter(e => e._id !== linkedEmailId));
      alert("✅ Email unlinked successfully");
    } catch (error) {
      console.error("Error unlinking email:", error);
      alert("Failed to unlink email. Please try again.");
    }
  };

  const handleViewEmailBody = async (email) => {
    if (expandedEmail === email._id) {
      setExpandedEmail(null);
      return;
    }

    try {
      setExpandedEmail(email._id);
      setLoadingBody(true);
      setEmailBody("Loading...");

      const response = await EmailsAPI.getEmailBody(email.email_id);
      setEmailBody(response.data.body || "No content available");
    } catch (error) {
      console.error("Error loading email body:", error);
      setEmailBody("Failed to load email content");
    } finally {
      setLoadingBody(false);
    }
  };

  const handleSaveNotes = async (linkedEmailId) => {
    try {
      await EmailsAPI.updateEmailNotes(linkedEmailId, notesText);
      
      setLinkedEmails(prev => prev.map(e => 
        e._id === linkedEmailId ? { ...e, notes: notesText } : e
      ));
      
      setEditingNotes(null);
      setNotesText("");
      
      alert("✅ Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes. Please try again.");
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
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        color: "#666"
      }}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
        <p>Loading emails...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px"
      }}>
        <div>
          <h2 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>
            📧 Linked Emails ({linkedEmails.length})
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            Track all email communications for this job application
          </p>
        </div>

        <button
          onClick={() => setShowSearchModal(true)}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
          }}
        >
          + Link Email
        </button>
      </div>

      {/* Email List */}
      {linkedEmails.length === 0 ? (
        <div style={{
          background: "#f9f9f9",
          border: "2px dashed #ddd",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>
            📭
          </div>
          <h3 style={{ margin: "0 0 8px 0", color: "#666" }}>
            No emails linked yet
          </h3>
          <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#999" }}>
            Connect emails from your Gmail to track communication
          </p>
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              padding: "12px 24px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            Link Your First Email
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {linkedEmails.map((email) => (
            <div
              key={email._id}
              style={{
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "16px",
                transition: "all 0.2s"
              }}
            >
              {/* Email Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "12px"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    {email.subject}
                    {getStatusBadge(email.detected_status)}
                  </div>

                  <div style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "4px"
                  }}>
                    <strong>From:</strong> {email.from_name || email.from_email}
                    {email.from_name && (
                      <span style={{ color: "#999" }}> ({email.from_email})</span>
                    )}
                  </div>

                  <div style={{
                    fontSize: "12px",
                    color: "#999"
                  }}>
                    <strong>Date:</strong> {formatDate(email.date)}
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  gap: "8px",
                  marginLeft: "16px"
                }}>
                  <button
                    onClick={() => handleViewEmailBody(email)}
                    style={{
                      padding: "6px 12px",
                      background: expandedEmail === email._id ? "#ff9800" : "#f5f5f5",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: expandedEmail === email._id ? "white" : "#666"
                    }}
                  >
                    {expandedEmail === email._id ? "▼ Hide" : "👁 View"}
                  </button>

                  <button
                    onClick={() => handleUnlinkEmail(email._id)}
                    style={{
                      padding: "6px 12px",
                      background: "#ffebee",
                      border: "1px solid #ffcdd2",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#c62828"
                    }}
                  >
                    🗑 Unlink
                  </button>
                </div>
              </div>

              {/* Email Snippet */}
              <div style={{
                background: "#f9f9f9",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#555",
                lineHeight: "1.5",
                marginBottom: "12px"
              }}>
                {email.snippet}
              </div>

              {/* Expanded Email Body */}
              {expandedEmail === email._id && (
                <div style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e0e0e0"
                }}>
                  <div style={{
                    background: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    padding: "16px",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    color: "#333",
                    maxHeight: "300px",
                    overflow: "auto"
                  }}>
                    {loadingBody ? "Loading email content..." : emailBody}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #f0f0f0"
              }}>
                {editingNotes === email._id ? (
                  <div>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add notes about this email..."
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        resize: "vertical"
                      }}
                    />
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "8px"
                    }}>
                      <button
                        onClick={() => handleSaveNotes(email._id)}
                        style={{
                          padding: "6px 16px",
                          background: "#4caf50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(null);
                          setNotesText("");
                        }}
                        style={{
                          padding: "6px 16px",
                          background: "#f5f5f5",
                          color: "#666",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {email.notes ? (
                      <div style={{
                        background: "#fffbea",
                        padding: "10px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "#333",
                        marginBottom: "8px"
                      }}>
                        <strong style={{ color: "#f57c00" }}>📝 Notes:</strong>
                        <div style={{ marginTop: "4px" }}>{email.notes}</div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        setEditingNotes(email._id);
                        setNotesText(email.notes || "");
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#f5f5f5",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#666"
                      }}
                    >
                      {email.notes ? "✏ Edit Notes" : "+ Add Notes"}
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Info */}
              <div style={{
                marginTop: "12px",
                fontSize: "11px",
                color: "#999",
                textAlign: "right"
              }}>
                Linked {formatDate(email.linked_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Search Modal */}
      {showSearchModal && (
        <EmailSearchModal
          job={job}
          onClose={() => setShowSearchModal(false)}
          onEmailLinked={() => {
            setShowSearchModal(false);
            loadLinkedEmails();
          }}
        />
      )}
    </div>
  );
}