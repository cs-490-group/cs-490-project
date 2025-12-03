import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResumesAPI from '../../api/resumes';
import AIAPI from '../../api/AI';
import SharingControls from '../../components/resumes/SharingControls';
import '../../styles/resumes.css';

export default function SharingAndFeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    can_comment: true,
    can_download: true,
    expiration_days: 30,
  });
  const [feedback, setFeedback] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // AI Analysis State
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumeResponse = await ResumesAPI.get(id);
        setResume(resumeResponse.data || resumeResponse);

        const feedbackResponse = await ResumesAPI.getFeedback(id);
        setFeedback(feedbackResponse.data || feedbackResponse || []);

        try {
          const shareResponse = await ResumesAPI.getShareLink(id);
          const baseUrl = window.location.origin;
          const token = shareResponse.data?.token || shareResponse.token;
          if (token) {
            setShareLink(`${baseUrl}/resumes/public/${token}`);
            setIsSharing(true);
          }
        } catch (err) {
          setIsSharing(false);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    fetchData();
  }, [id]);

  const handleGenerateShareLink = async () => {
    try {
      const response = await ResumesAPI.createShareLink(id, shareSettings);
      const baseUrl = window.location.origin;
      const token = response.data?.share_link || response.share_link || response.data?.share_data?.token;

      if (!token) {
        alert('Failed to generate share link: No token in response');
        return;
      }

      setShareLink(`${baseUrl}/resumes/public/${token}`);
      setIsSharing(true);
      alert('Share link generated successfully!');
    } catch (err) {
      alert('Failed to generate share link: ' + err.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Share link copied to clipboard!');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const response = await ResumesAPI.addFeedback(id, {
        comment: newComment,
        reviewer: 'Current User',
        email: localStorage.getItem('userEmail') || 'user@example.com',
      });

      const comment = {
        _id: response.data?.feedback_id || response.feedback_id,
        reviewer: 'Current User',
        email: localStorage.getItem('userEmail') || 'user@example.com',
        date: new Date().toISOString(),
        comment: newComment,
        resolved: false,
      };
      setFeedback([...feedback, comment]);
      setNewComment('');
      alert('Comment added successfully!');
    } catch (err) {
      alert('Failed to add comment: ' + err.message);
    }
  };

  const handleResolve = async (feedbackId, currentStatus) => {
    try {
      // Direct API call
      await ResumesAPI.updateFeedback(id, feedbackId, {
        resolved: !currentStatus,
      });

      // Optimistic update
      setFeedback(
        feedback.map((f) =>
          f._id === feedbackId ? { ...f, resolved: !currentStatus } : f
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (feedbackId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await ResumesAPI.deleteFeedback(id, feedbackId);
        setFeedback(feedback.filter((f) => f._id !== feedbackId));
      } catch (err) {
        alert('Failed to delete comment: ' + err.message);
      }
    }
  };

  const handleRevokeShare = async () => {
    if (window.confirm('Revoke sharing? The link will no longer work.')) {
      try {
        await ResumesAPI.revokeShareLink(id);
        setShareLink('');
        setIsSharing(false);
        alert('Share link revoked successfully!');
      } catch (err) {
        alert('Failed to revoke share link: ' + err.message);
      }
    }
  };

  const handleAnalyzeFeedback = async () => {
    if (feedback.length === 0) {
      alert("No feedback to analyze yet!");
      return;
    }

    setAnalyzing(true);
    try {
      const commentsText = feedback
        .map(f => `- ${f.reviewer}: "${f.comment}"`)
        .join("\n");

      const res = await AIAPI.generateText({
        prompt: `
          Analyze the following feedback on a resume and provide a summary report.
          
          Feedback Comments:
          ${commentsText}
          
          Format the output as HTML with these sections (use <h5> for headers):
          1. <h5>Key Themes</h5> (What are multiple people saying?)
          2. <h5>Critical Fixes</h5> (What needs immediate attention?)
          3. <h5>Positive Highlights</h5> (What is working well?)
          
          Keep it concise and actionable. In the output, don't include html elements like '''html.
        `,
        system_message: "You are a career coach analyzing resume feedback."
      });

      const result = res.data.response || res.data.result || res.data.text || "";
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze feedback");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!resume) {
    return <div className="container mt-5"><h2>Loading resume...</h2></div>;
  }

  return (
    <div className="container mt-5">
      <div className="sharing-header">
        <h1>Share & Get Feedback</h1>
        <button onClick={() => navigate(`/resumes/edit/${id}`)} className="btn btn-secondary">
          Back
        </button>
      </div>

      <div className="sharing-layout">
        <div className="sharing-controls-section">
          <h3>Share Your Resume</h3>
          <SharingControls
            isSharing={isSharing}
            shareLink={shareLink}
            shareSettings={shareSettings}
            onGenerateLink={handleGenerateShareLink}
            onCopyLink={handleCopyLink}
            onRevokeShare={handleRevokeShare}
            onSettingsChange={setShareSettings}
          />
        </div>

        <div className="feedback-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Feedback & Comments</h3>
            
            {feedback.length > 0 && (
              <button 
                onClick={handleAnalyzeFeedback}
                disabled={analyzing}
                className="btn btn-outline-primary d-flex align-items-center gap-2"
              >
                {analyzing ? "Analyzing..." : "Analyze Feedback"}
              </button>
            )}
          </div>

          {analysis && (
            <div className="card mb-4 border-info shadow-sm" style={{ backgroundColor: "#f8fdff" }}>
              <div className="card-header bg-transparent border-info text-info fw-bold d-flex align-items-center gap-2">
                AI Feedback Report
              </div>
              <div className="card-body">
                <div dangerouslySetInnerHTML={{ __html: analysis }} />
                <button 
                  className="btn btn-sm btn-link text-muted mt-2 p-0" 
                  onClick={() => setAnalysis(null)}
                >
                  Close Report
                </button>
              </div>
            </div>
          )}

          <div className="add-comment-form mb-4">
            <h5>Add Comment</h5>
            <textarea
              className="form-control mb-2"
              rows="3"
              placeholder="Add your own notes or feedback..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment} className="btn btn-primary">
              Add Comment
            </button>
          </div>

          {/* INLINE FEEDBACK LIST (Replaces FeedbackComments Component) */}
          <div className="feedback-list">
            {feedback.length === 0 ? (
              <div className="alert alert-info">
                No feedback yet. Share your resume to get feedback from others!
              </div>
            ) : (
              <div>
                <h5>{feedback.length} Comment(s)</h5>
                {feedback.map(fb => (
                  <div key={fb._id} className="card mb-3 shadow-sm border-0">
                    <div className={`card-body ${fb.resolved ? 'bg-light opacity-75' : ''}`}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>{fb.reviewer || "User"}</strong>
                          <span className="text-muted ms-2 small">
                            {new Date(fb.date || fb.date_created).toLocaleDateString()}
                          </span>
                        </div>
                        {fb.resolved && <span className="badge bg-success">Resolved</span>}
                      </div>
                      
                      <p className={`card-text ${fb.resolved ? 'text-muted text-decoration-line-through' : ''}`}>
                        {fb.comment}
                      </p>
                      
                      <div className="d-flex gap-2 mt-3">
                        <button 
                          onClick={() => handleResolve(fb._id, fb.resolved)}
                          className={`btn btn-sm ${fb.resolved ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                        >
                          {fb.resolved ? "Mark Unresolved" : "Mark Resolved"}
                        </button>
                        <button 
                          onClick={() => handleDeleteComment(fb._id)}
                          className="btn btn-sm btn-outline-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shared-with-section">
          <h3>Shared With</h3>
          <div className="alert alert-info">
            <p>Share link created. Anyone with the link can view and comment on your resume.</p>
            {isSharing && (
              <div className="mt-2">
                <p><strong>Permissions:</strong></p>
                <ul>
                  <li>Comments: {shareSettings.can_comment ? '✓ Allowed' : '✗ Disabled'}</li>
                  <li>Download: {shareSettings.can_download ? '✓ Allowed' : '✗ Disabled'}</li>
                  <li>Expires in: {shareSettings.expiration_days} days</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}