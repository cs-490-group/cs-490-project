import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Smile, Meh, Frown, MessageCircle, Star, Coffee, Heart } from 'lucide-react';
import progressSharingAPI from '../../api/progressSharing';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function FamilySupportView({ report }) {

    const { teamId, memberId } = useParams();
    const [sending, setSending] = useState(false);


  const getStatusConfig = (level) => {
    switch (level) {
      case 'red': return {
        color: '#ffebEE', 
        textColor: '#c62828', 
        icon: <Frown size={64} />, // ☹️
        title: "Having a Tough Day",
        desc: "Energy is low today. The best way to support is to give some space or send a silent hug.",
        action: "Send a silent 'Thinking of you' text"
      };
      case 'yellow': return {
        color: '#fff3e0', 
        textColor: '#ef6c00', 
        icon: <Meh size={64} />, // 😐
        title: "Hanging in There",
        desc: "Making steady progress, but it's a grind. A distraction or something funny would be great!",
        action: "Share a funny meme or non-work topic"
      };
      default: return {
        color: '#e8f5e9', 
        textColor: '#2e7d32', 
        icon: <Smile size={64} />, // 😃
        title: "Feeling Good!",
        desc: "Spirits are high! Open to chatting about the search or anything else.",
        action: "Ask: 'How can I help today?'"
      };
    }
  };

  const handleSendEncouragement = async () => {

    
    setSending(true);
    
    const supportEmojis = ["🚀", "❤️", "💪", "⭐", "👏", "🔥", "🌻", "🎉", "🦁", "✨"];
    
    const randomEmoji = supportEmojis[Math.floor(Math.random() * supportEmojis.length)];

    try {
      await progressSharingAPI.addCelebration(teamId, memberId, {
        id: `enc_${Date.now()}`,
        message: `Family sent a quick boost: You got this! ${randomEmoji}`,
        emoji: randomEmoji,
        created_by: "Family Supporter"
      });
      alert("Encouragement sent! They will see it on their dashboard.");
    } catch (err) {
      alert("Failed to send encouragement.");
    } finally {
      setSending(false);
    }
  };

  const status = getStatusConfig(report.wellbeing?.boundary_level || 'green');

  return (
    <div className="min-vh-100" style={{ background: "#f8f9fa" }}>
     
      <div className="w-100 py-5 text-center text-white" style={{ background: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)" }}>
        <h1 className="display-4 fw-bold mb-2" style={{ fontFamily: '"Playfair Display", serif', textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          {report.memberName || "Candidate"}'s Journey
        </h1>
        <p className="lead opacity-75">Supporter Dashboard</p>
      </div>

      <div className="container" style={{ marginTop: "-40px" }}>
        

        <div className="card border-0 shadow-lg rounded-4 mb-5 overflow-hidden">
          <div className="card-body p-5 text-center" style={{ backgroundColor: status.color }}>
            <div className="mb-3 text-opacity-75" style={{ color: status.textColor }}>{status.icon}</div>
            <h2 className="fw-bold mb-3" style={{ color: status.textColor }}>{status.title}</h2>
            <p className="fs-5 mb-4" style={{ color: status.textColor, opacity: 0.9 }}>
              {status.desc}
            </p>
            <div className="d-inline-block bg-white rounded-pill px-4 py-2 shadow-sm">
              <span className="fw-bold text-uppercase small text-muted me-2">Suggested Action:</span>
              <span className="fw-bold" style={{ color: status.textColor }}>{status.action}</span>
            </div>
          </div>
        </div>

        <div className="row g-4">

          <div className="col-md-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-0 pt-4 px-4">
                <h4 className="fw-bold mb-0">Recent Highlights</h4>
              </div>
              <div className="card-body p-4">
                {report.recentMilestones && report.recentMilestones.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {report.recentMilestones.map((m, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-3 p-3 rounded-3" style={{ backgroundColor: "#fff5f7" }}>
                        <div className="bg-white p-2 rounded-circle shadow-sm text-warning">
                          <Star size={20} fill="#ffc107" />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1 text-dark">{m.title}</h6>
                          <p className="mb-0 small text-muted">
                            {new Date(m.achieved_date).toLocaleDateString()} • This is a big step forward!
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No major updates this week, just steady work!</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-5">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
              <div className="card-header bg-white border-0 pt-4 px-4">
                <h4 className="fw-bold mb-0">How to Support</h4>
              </div>
              <div className="card-body p-4">
                <ul className="list-unstyled d-flex flex-column gap-3">
                  <li className="d-flex gap-3">
                    <div className="mt-1 text-primary"><MessageCircle size={20} /></div>
                    <div>
                      <strong>Ask open questions</strong>
                      <p className="small text-muted m-0">Instead of "Did you get the job?", try "What was the most interesting part of your week?"</p>
                    </div>
                  </li>
                  <li className="d-flex gap-3">
                    <div className="mt-1 text-success"><Coffee size={20} /></div>
                    <div>
                      <strong>Encourage breaks</strong>
                      <p className="small text-muted m-0">Job hunting is a marathon. Remind them to rest without guilt.</p>
                    </div>
                  </li>
                  <li className="d-flex gap-3">
                    <div className="mt-1 text-danger"><Heart size={20} /></div>
                    <div>
                      <strong>Celebrate effort</strong>
                      <p className="small text-muted m-0">Celebrate sending applications just as much as getting interviews.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 mb-5 text-center">
          <p className="text-muted mb-3">Want to send a quick boost?</p>
          <button 
            className="btn btn-lg rounded-pill px-5 py-3 text-white fw-bold shadow-lg hover-scale" 
            style={{ 
              background: "linear-gradient(45deg, #FF512F 0%, #DD2476 100%)", 
              border: "none", 
              transition: "transform 0.2s",
              opacity: sending ? 0.7 : 1
            }}
            onClick={handleSendEncouragement}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send support by clicking here!"}
          </button>
        </div>

      </div>
    </div>
  );
}