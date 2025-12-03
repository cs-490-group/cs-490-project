import React, { useState } from 'react';
import { Smile, Meh, Frown, Shield, Heart, Coffee, MessageCircle } from 'lucide-react';
// 👇 ENSURE THIS IMPORT IS CORRECT (Default Import)
import progressAPI from '../../api/progressSharing'; 

export default function SupportControlCenter({ teamId, memberId }) {
  const [mood, setMood] = useState(7);
  const [boundary, setBoundary] = useState('green'); 
  const [needs, setNeeds] = useState([]);
  const [saving, setSaving] = useState(false);

  const needsOptions = [
    { id: 'encouragement', label: 'Encouragement', icon: <Heart size={14} /> },
    { id: 'distraction', label: 'Distraction', icon: <Coffee size={14} /> },
    { id: 'advice', label: 'Advice', icon: <MessageCircle size={14} /> },
    { id: 'space', label: 'Space', icon: <Shield size={14} /> },
  ];

  const handleToggleNeed = (id) => {
    setNeeds(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    console.log("🖱️ Button Clicked!"); // Debug log
    
    if (!progressAPI || !progressAPI.logWellbeing) {
      console.error("❌ API Error: progressAPI.logWellbeing is not defined");
      alert("System Error: API Client not configured correctly.");
      return;
    }

    setSaving(true);
    try {
      console.log("📤 Sending data to backend...");
      
      await progressAPI.logWellbeing(teamId, memberId, {
        mood_score: mood,
        boundary_level: boundary,
        needs: needs,
        status_message: boundary === 'red' ? 'In deep focus mode' : boundary === 'yellow' ? 'Taking it slow' : 'Feeling good'
      });
      
      console.log("✅ Success!");
      alert("✅ Status updated successfully!");
      
    } catch (err) {
      console.error("❌ Failed to update status:", err);
      alert("Failed to update status. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)" }}>
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
        <h4 className="fw-bold text-primary d-flex align-items-center">
          <Heart className="me-2 text-danger" /> Support Control Center
        </h4>
        <p className="text-muted small">Control what your family sees and how they can help.</p>
      </div>
      
      <div className="card-body p-4">
        {/* Mood Selection */}
        <div className="mb-4">
          <label className="fw-bold text-secondary text-uppercase small mb-2">How are you feeling?</label>
          <div className="d-flex gap-2">
            {[
              { id: 'green', label: 'Great', color: '#4caf50', icon: <Smile size={32} /> },
              { id: 'yellow', label: 'Okay', color: '#ff9800', icon: <Meh size={32} /> },
              { id: 'red', label: 'Struggling', color: '#f44336', icon: <Frown size={32} /> }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setBoundary(option.id)}
                className="btn flex-grow-1 d-flex flex-column align-items-center justify-content-center py-3 rounded-4 border-0 transition-all"
                style={{
                  backgroundColor: boundary === option.id ? option.color : '#f8f9fa',
                  color: boundary === option.id ? 'white' : '#ccc',
                  transform: boundary === option.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: boundary === option.id ? '0 8px 20px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <div className="mb-2">{option.icon}</div>
                <small className="fw-bold">{option.label}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="fw-bold text-secondary text-uppercase small mb-2">What do you need today?</label>
          <div className="d-flex flex-wrap gap-2">
            {needsOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleToggleNeed(opt.id)}
                className="btn btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2"
                style={{
                  border: needs.includes(opt.id) ? '2px solid #2196f3' : '1px solid #dee2e6',
                  backgroundColor: needs.includes(opt.id) ? '#e3f2fd' : 'white',
                  color: needs.includes(opt.id) ? '#1976d2' : '#666',
                  cursor: 'pointer'
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm"
          style={{ cursor: saving ? 'wait' : 'pointer' }}
        >
          {saving ? "Updating..." : "Update Family Dashboard"}
        </button>
      </div>
    </div>
  );
}