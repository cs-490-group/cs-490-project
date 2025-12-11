import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ResumesAPI from '../../api/resumes';
import api from '../../api/base';
import ResumePreview from '../../components/resumes/ResumePreview';
import '../../styles/resumes.css';

/**
 * PublicSharePage Component
 * View publicly shared resumes and provide feedback
 * Public endpoint - no authentication required
 */
export default function PublicSharePage() {
  const { token } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareSettings, setShareSettings] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');

  // Fetch shared resume
  useEffect(() => {
    const fetchSharedResume = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ResumesAPI.getSharedResume(token);
        const resumeData = response.data || response;
        setResume(resumeData);
        setShareSettings(resumeData.share_settings || {});
      } catch (err) {
        setError(err.message || 'Invalid or expired share link');
        console.error('Error loading shared resume:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedResume();
  }, [token]);

  const handleStatusChange = async (newStatus) => {
    try {
      await ResumesAPI.updatePublicStatus(token, newStatus);
      setResume({ ...resume, approval_status: newStatus });
      alert(`Marked as ${newStatus.replace("_", " ").toUpperCase()}`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }
    if (!reviewerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!reviewerEmail.trim()) {
      alert('Please enter your email');
      return;
    }

    try {
      // Add feedback using the public endpoint (no auth required)
      const response = await api.post(`/resumes/public/${token}/feedback`, {
        comment: newComment,
        reviewer: reviewerName || "Guest",
        email: reviewerEmail,
      });

      const comment = {
        _id: response.data?.feedback_id || response.feedback_id,
        reviewer: reviewerName,
        email: reviewerEmail,
        date: new Date().toISOString(),
        comment: newComment,
        resolved: false,
      };
      setFeedback([...feedback, {
         comment: newComment, 
         reviewer: reviewerName || "Guest", 
         date: new Date().toISOString() 
      }]);
      setNewComment('');
      alert('Thank you! Your feedback has been submitted.');
    } catch (err) {
      alert('Failed to submit feedback: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <h2>Loading resume...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Unable to Load Resume</h4>
          <p>{error}</p>
          <p>The share link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">Resume not found</div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="public-share-header">
        <h1>{resume.name}</h1>
        <p className="text-muted">This resume has been shared with you for review.</p>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Review Status</h5>
            <span className={`badge ${
              resume.approval_status === 'approved' ? 'bg-success' : 
              resume.approval_status === 'changes_requested' ? 'bg-warning text-dark' : 
              'bg-secondary'
            }`}>
              {(resume.approval_status || 'Pending').replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          {shareSettings.can_comment && (
            <div className="btn-group">
              <button 
                className="btn btn-outline-warning"
                onClick={() => handleStatusChange('changes_requested')}
              >
               Request Changes
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleStatusChange('approved')}
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="public-share-layout">
        {/* Resume Preview */}
        <div className="shared-resume-preview">
          <div className="preview-section">
            <h3>Resume Preview</h3>
            <ResumePreview resume={resume} />
          </div>
        </div>

        {/* Feedback Section */}
        {shareSettings.can_comment && (
          <div className="shared-feedback-section">
            <h3>Provide Feedback</h3>

            {/* Reviewer Info Form */}
            <div className="feedback-form">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Your Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Your Feedback</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Share your feedback or suggestions..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>

              <button onClick={handleAddComment} className="btn btn-primary">
                Submit Feedback
              </button>
            </div>

            {/* Display Feedback Comments */}
            {feedback.length > 0 && (
              <div className="feedback-comments mt-4">
                <h4>Comments</h4>
                {feedback.map((comment) => (
                  <div key={comment._id} className="feedback-comment-item">
                    <div className="comment-header">
                      <strong>{comment.reviewer}</strong>
                      <small className="text-muted ms-2">
                        {comment.email}
                      </small>
                      <small className="text-muted ms-2">
                        {new Date(comment.date).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="comment-body">{comment.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!shareSettings.can_comment && (
          <div className="alert alert-info">
            Comments are disabled for this shared resume.
          </div>
        )}
      </div>

    </div>
  );
}
