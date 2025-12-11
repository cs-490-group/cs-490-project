import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CoverLetterAPI from '../../api/coverLetters';
import { MessageSquare, FileText, User, CheckCircle, AlertTriangle } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css'; 

export default function PublicCoverLetterPage() {
  const { token } = useParams();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Feedback Form
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await CoverLetterAPI.getSharedCoverLetter(token);
        setLetter(res.data);
      } catch (err) {
        setError("This link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const handleStatusChange = async (newStatus) => {
    try {
      await CoverLetterAPI.updatePublicStatus(token, newStatus);
      setLetter({ ...letter, approval_status: newStatus });
      alert(`Document marked as ${newStatus.replace("_", " ").toUpperCase()}`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      setSubmitting(true);
      await CoverLetterAPI.addPublicFeedback(token, {
        reviewer: reviewerName || "Guest",
        comment: comment,
        resolved: false
      });
      alert("Feedback sent! Thank you.");
      setComment("");
      setReviewerName("");
    } catch (err) {
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 d-flex flex-column align-items-center justify-content-center">
        <div className="spinner-border text-light mb-3" role="status" />
        <h3 className="text-white">Loading document...</h3>
      </div>
    );
  }


  if (error) {
    return (
      <div className="dashboard-gradient min-vh-100 d-flex flex-column align-items-center justify-content-center p-4">
        <div className="bg-white p-5 rounded-4 shadow-lg text-center" style={{ maxWidth: "500px" }}>
          <div className="text-danger mb-3">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 className="fw-bold mb-3">Unable to Load</h2>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-gradient min-vh-100 py-5">
      <div className="container" style={{ maxWidth: "900px" }}>
        
        {/* HEADER SECTION */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-pill px-3 py-1 mb-3 text-white backdrop-blur">
            <User size={16} className="me-2" />
            <small>Shared for Review</small>
          </div>
          <h1 className="text-white fw-bold display-5 mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            {letter.title}
          </h1>

          <div className="card border-0 shadow-lg rounded-4 mb-4">
          <div className="card-body p-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className={`p-3 rounded-circle me-3 ${
                letter.approval_status === 'approved' ? 'bg-success bg-opacity-10' : 
                letter.approval_status === 'changes_requested' ? 'bg-warning bg-opacity-10' : 'bg-secondary bg-opacity-10'
              }`}>
                {letter.approval_status === 'approved' ? <CheckCircle className="text-success" /> : 
                 letter.approval_status === 'changes_requested' ? <AlertTriangle className="text-warning" /> : 
                 <FileText className="text-secondary" />}
              </div>
              <div>
                <h5 className="fw-bold m-0">Review Status</h5>
                <span className={`badge ${
                  letter.approval_status === 'approved' ? 'bg-success' : 
                  letter.approval_status === 'changes_requested' ? 'bg-warning text-dark' : 
                  'bg-secondary'
                }`}>
                  {(letter.approval_status || 'Pending').replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {letter.share_settings?.can_comment && (
              <div className="d-flex gap-2">
                <button 
                  onClick={() => handleStatusChange('changes_requested')}
                  className="btn btn-outline-warning fw-bold"
                >
                  Request Changes
                </button>
                <button 
                  onClick={() => handleStatusChange('approved')}
                  className="btn btn-success fw-bold text-white"
                >
                  Approve Document
                </button>
              </div>
            )}
          </div>
        </div>

          <p className="text-white-50 fs-5">
            Please review the cover letter below and leave your feedback.
          </p>
        </div>

        {/* DOCUMENT CARD */}
        <div className="card border-0 shadow-lg rounded-4 mb-5 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center">
            <FileText className="text-primary me-2" size={20} />
            <span className="fw-bold text-secondary">Document Preview</span>
          </div>
          <div className="card-body p-0">
            <div 
              className="p-5"
              style={{ minHeight: "600px", backgroundColor: "white" }}
            >
              {/* Render HTML Content safely */}
              <div dangerouslySetInnerHTML={{ __html: letter.content }} />
            </div>
          </div>
        </div>

        {/* FEEDBACK SECTION */}
        {letter.share_settings?.can_comment && (
          <div className="card border-0 shadow-lg rounded-4">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <MessageSquare className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="fw-bold m-0">Leave Feedback</h3>
                  <p className="text-muted m-0">Share your suggestions or corrections</p>
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback}>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Your Name (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg bg-light border-0"
                      value={reviewerName}
                      onChange={e => setReviewerName(e.target.value)}
                      placeholder="e.g. Anthony Washington"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Comment / Suggestion</label>
                    <textarea 
                      className="form-control form-control-lg bg-light border-0"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What suggestions do you have for this cover letter?"
                      rows={5}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="btn btn-primary btn-lg w-100 fw-bold py-3 mt-2"
                      style={{ background: "linear-gradient(90deg, #00c28a, #005e9e)", border: "none" }}
                    >
                      {submitting ? (
                        <span>Sending...</span>
                      ) : (
                        <span>Submit Feedback</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}