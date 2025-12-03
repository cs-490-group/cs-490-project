import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoverLetterAPI from '../../api/coverLetters';
import AIAPI from "../../api/AI";
import { Copy, Trash2, ExternalLink, ArrowLeft } from 'lucide-react';

export default function CoverLetterSharingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Settings
  const [canComment, setCanComment] = useState(true);
  const [canDownload, setCanDownload] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get Letter Data
      const res = await CoverLetterAPI.get(id);
      setLetter(res.data);

      // 2. Get Feedback
      const fbRes = await CoverLetterAPI.getFeedback(id);
      setFeedback(fbRes.data || []);

      // 3. Check for existing link
      try {
        const linkRes = await CoverLetterAPI.getShareLink(id);
        if (linkRes.data && linkRes.data.token) {
          const baseUrl = window.location.origin;
          setShareLink(`${baseUrl}/cover-letter/public/${linkRes.data.token}`);
          setIsSharing(true);
          setCanComment(linkRes.data.can_comment);
          setCanDownload(linkRes.data.can_download);
        }
      } catch (err) {
        // No active link, ignore error
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load cover letter data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      const res = await CoverLetterAPI.createShareLink(id, {
        can_comment: canComment,
        can_download: canDownload,
        expiration_days: 30
      });
      
      const token = res.data.share_link;
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/cover-letter/public/${token}`);
      setIsSharing(true);
    } catch (err) {
      alert("Failed to create link: " + err.message);
    }
  };

  const handleAnalyzeFeedback = async () => {
    if (feedback.length === 0) return;

    setAnalyzing(true);
    try {
      const commentsText = feedback.map(f => `- "${f.comment}"`).join("\n");

      const res = await AIAPI.generateText({
        prompt: `
          Analyze the following feedback on a cover letter.
          
          Comments:
          ${commentsText}
          
          Provide a summary of:
          1. <h5>Tone & Voice</h5> (Is it professional, too casual, etc?)
          2. <h5>Consensus Improvements</h5> (What do reviewers agree on?)
          3. <h5>Action Items</h5> (Bulleted list of changes to make)
          
          Return as HTML. But do NOT include any HTML tags in the output like '''html.
        `,
        system_message: "You are an expert editor reviewing cover letter feedback."
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

  const handleRevoke = async () => {
    if(!window.confirm("Are you sure? The link will stop working immediately.")) return;
    try {
      await CoverLetterAPI.revokeShareLink(id);
      setShareLink('');
      setIsSharing(false);
    } catch (err) {
      alert("Failed to revoke link");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await CoverLetterAPI.addFeedback(id, {
        comment: newComment,
        reviewer: "Me (Internal Note)",
        resolved: false
      });
      setNewComment("");
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (fbId, currentStatus) => {
    try {
      await CoverLetterAPI.updateFeedback(id, fbId, { resolved: !currentStatus });
      // Optimistic update
      setFeedback(prev => prev.map(f => f._id === fbId ? { ...f, resolved: !currentStatus } : f));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFeedback = async (fbId) => {
    if(!window.confirm("Delete this comment?")) return;
    try {
      await CoverLetterAPI.deleteFeedback(id, fbId);
      setFeedback(prev => prev.filter(f => f._id !== fbId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <button onClick={() => navigate('/cover-letters')} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <h1 style={{ margin: 0 }}>Share: {letter?.title}</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* LEFT COLUMN: Sharing Controls */}
        <div>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "20px" }}>
            <h3 style={{ marginTop: 0 }}>🔗 Share Settings</h3>
            
            {!isSharing ? (
              <div>
                <p style={{ color: "#666" }}>Generate a public link to share this document with mentors or friends.</p>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px" }}>
                    <input type="checkbox" checked={canComment} onChange={e => setCanComment(e.target.checked)} /> Allow Comments
                  </label>
                  <label style={{ display: "block" }}>
                    <input type="checkbox" checked={canDownload} onChange={e => setCanDownload(e.target.checked)} /> Allow Download
                  </label>
                </div>
                <button onClick={handleCreateLink} style={{ background: "#2196f3", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }}>
                  Generate Link
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd", background: "#f9f9f9" }} />
                  <button onClick={() => navigator.clipboard.writeText(shareLink)} style={{ background: "#eee", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", padding: "0 10px" }} title="Copy">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => window.open(shareLink, '_blank')} style={{ background: "#eee", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", padding: "0 10px" }} title="Open">
                    <ExternalLink size={16} />
                  </button>
                </div>
                <button onClick={handleRevoke} style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", fontSize: "14px" }}>
                  Stop Sharing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Feedback */}
        <div>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid #ddd" }}>
            
            {/* Header with Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0 }}>💬 Feedback ({feedback.length})</h3>
                {feedback.length > 0 && (
                    <button 
                        onClick={handleAnalyzeFeedback}
                        disabled={analyzing}
                        style={{
                            background: "none", border: "1px solid #2196f3", color: "#2196f3", 
                            borderRadius: "20px", padding: "5px 15px", cursor: "pointer", 
                            display: "flex", alignItems: "center", gap: "5px", fontSize: "13px"
                        }}
                    >
                        {analyzing ? "Thinking..." : "Summarize"}
                    </button>
                )}
            </div>

            {/* Analysis Result */}
            {analysis && (
                <div style={{ 
                    background: "#e3f2fd", padding: "15px", borderRadius: "8px", 
                    marginBottom: "20px", fontSize: "14px", border: "1px solid #bbdefb" 
                }}>
                    <h4 style={{ marginTop: 0, color: "#1565c0", display: "flex", alignItems: "center", gap: "5px" }}>
                         Insight Report
                    </h4>
                    <div dangerouslySetInnerHTML={{ __html: analysis }} />
                    <button 
                        onClick={() => setAnalysis(null)}
                        style={{ background: "none", border: "none", color: "#666", fontSize: "12px", marginTop: "10px", cursor: "pointer", textDecoration: "underline" }}
                    >
                        Dismiss
                    </button>
                </div>
            )}
            
            <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Add a private note..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <button onClick={handleAddComment} style={{ background: "#2196f3", color: "white", border: "none", borderRadius: "4px", padding: "0 15px", cursor: "pointer" }}>Add</button>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {feedback.length === 0 && <p style={{ color: "#999", textAlign: "center" }}>No feedback yet.</p>}
              
              {feedback.map(fb => (
                <div key={fb._id} style={{ padding: "10px", borderBottom: "1px solid #eee", background: fb.resolved ? "#f0fff4" : "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <strong style={{ fontSize: "14px" }}>{fb.reviewer || "Anonymous"}</strong>
                    <span style={{ fontSize: "12px", color: "#999" }}>{new Date(fb.date_created).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: "0 0 8px 0", color: fb.resolved ? "#666" : "#333", textDecoration: fb.resolved ? "line-through" : "none" }}>
                    {fb.comment}
                  </p>
                  <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                    <button onClick={() => handleResolve(fb._id, fb.resolved)} style={{ border: "none", background: "none", color: fb.resolved ? "#16a34a" : "#ca8a04", cursor: "pointer", padding: 0 }}>
                      {fb.resolved ? "Mark Unresolved" : "Mark Resolved"}
                    </button>
                    <button onClick={() => handleDeleteFeedback(fb._id)} style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", padding: 0 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}