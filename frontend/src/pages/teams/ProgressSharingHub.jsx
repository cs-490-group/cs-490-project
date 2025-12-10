import React, { useState, useEffect } from "react";
import {
  Share2, Users, Trophy, TrendingUp, Heart, MessageSquare,
  Settings, Trash2, Eye, EyeOff, Check, X, Copy, Plus,
  Zap, Target, AlertCircle, ChevronDown, Calendar, Globe 
} from "lucide-react";
import progressSharingAPI from "../../api/progressSharing";
import SupportControlCenter from "../../components/teams/SupportControlCenter";
import MilestoneCelebration from "./MilestoneCelebration"; 

export default function ProgressSharingHub({ teamId, memberId, memberName }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sharedWith, setSharedWith] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [creatingPublic, setCreatingPublic] = useState(false); 

  const [shareForm, setShareForm] = useState({
    email: "",
    name: "",
    relationship: "accountability_partner"
  });

  const [privacySettings, setPrivacySettings] = useState({
    can_see_goals: true,
    can_see_applications: true,
    can_see_engagement: true,
    can_see_full_progress: false,
    can_see_milestones: true,
    can_see_feedback: false,
    hide_sensitive: false 
  });

  useEffect(() => {
    if (teamId && memberId) {
      fetchData();
    }
  }, [teamId, memberId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shared with list
      const sharedRes = await progressSharingAPI.getSharedWithList(teamId, memberId);
      setSharedWith(sharedRes.data.sharedWith || []);

      // Fetch impact data
      const impactRes = await progressSharingAPI.getAccountabilityImpact(teamId, memberId);
      setImpact(impactRes.data);
    } catch (err) {
      console.error("Failed to fetch progress data:", err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shareForm.email) {
      alert("Please enter an email");
      return;
    }
    try {
      setLoading(true);
      await progressSharingAPI.shareProgress(teamId, memberId, {
        email: shareForm.email,
        name: shareForm.name || shareForm.email.split("@")[0],
        relationship: shareForm.relationship,
        privacy_settings: privacySettings
      });
      
      alert(`Progress shared successfully! An email has been sent to ${shareForm.email}`);
      setShareForm({ email: "", name: "", relationship: "accountability_partner" });
      setShowShareModal(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      alert("Failed to share progress: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await progressSharingAPI.updatePrivacySettings(teamId, memberId, privacySettings);
      alert("Privacy settings updated for all shared links!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (email) => {
    if (!window.confirm(`Revoke access for ${email}?`)) return;
    try {
      setRevoking(email);
      await progressSharingAPI.revokeShare(teamId, memberId, email);
      alert("Access revoked");
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      alert("Failed to revoke access: " + msg);
    } finally {
      setRevoking(null);
    }
  };


  const handleCreatePublicLink = async () => {
    setCreatingPublic(true);
    try {
        // Create a special "guest" share
        await progressSharingAPI.shareProgress(teamId, memberId, {
            email: "guest@public.share",
            name: "Public View",
            relationship: "friend", 
            privacy_settings: {
                ...privacySettings,
                hide_sensitive: true, // Enforce hiding sensitive info for public
                can_see_feedback: false
            }
        });
        await fetchData();
        alert("Public link active! You can copy it below.");
    } catch (err) {
        alert("Failed to create public link");
    } finally {
        setCreatingPublic(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRelationshipIcon = (rel) => {
    const icons = {
      mentor: "🎓",
      family: "👨‍👩‍👧",
      friend: "🤝",
      accountability_partner: "👥"
    };
    return icons[rel] || "👤";
  };

  // Helper to find if public link exists
  const publicShare = sharedWith.find(s => s.email === "guest@public.share");
  const publicLink = publicShare 
    ? `${window.location.origin}/shared-progress/${teamId}/${memberId}/guest%40public.share`
    : null;

  const renderOverview = () => (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <SupportControlCenter teamId={teamId} memberId={memberId} />
      
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
          📊 Accountability Impact
        </h2>
        {impact && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#e8f5e9", padding: "20px", borderRadius: "8px", border: "1px solid #c8e6c9" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Active Partners</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2e7d32", marginBottom: "4px" }}>
                {impact.accountabilityPartners || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>Supporting your success</div>
            </div>

            <div style={{ background: "#fff3e0", padding: "20px", borderRadius: "8px", border: "1px solid #ffe0b2" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Activity Increase</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#f57f17", marginBottom: "4px" }}>
                {impact.activityIncreasePercent > 0 ? "+" : ""}
                {Math.max(0, impact.activityIncreasePercent || 0)}%
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>Since starting accountability</div>
            </div>

            <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", border: "1px solid #bbdefb" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Applications Sent</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1565c0" }}>
                {impact.applicationsAfterAccountability || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Total since sharing
              </div>
            </div>

            <div style={{ background: "#f3e5f5", padding: "20px", borderRadius: "8px", border: "1px solid #e1bee7" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Impact Score</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#6a1b9a", marginBottom: "4px" }}>
                {impact.impactScore || 0}
              </div>
              <div style={{
                height: "4px",
                background: "#e1bee7",
                borderRadius: "2px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  background: "#6a1b9a",
                  width: `${impact.impactScore || 0}%`
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "32px" }}>
        <MilestoneCelebration teamId={teamId} memberId={memberId} memberName={memberName} currentUserId={memberId} />
      </div>
    </div>
  );

  const renderSharing = () => (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#1a1a1a" }}>
          🔗 Share Your Progress
        </h2>
        <button
          onClick={() => setShowShareModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px",
            background: "#2196f3", color: "white", border: "none", borderRadius: "6px",
            cursor: "pointer", fontSize: "14px", fontWeight: "bold"
          }}
        >
          <Plus size={18} /> Invite Someone
        </button>
      </div>


      <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Globe size={20} className="text-success"/> Public Guest Link
                </h3>
                <p style={{ color: "#666", fontSize: "14px", marginTop: "4px", maxWidth: "600px" }}>
                    Create a universal link that anyone can view without an email invitation. 
                    Great for sharing with extended family or friends.
                </p>
            </div>
            {!publicLink && (
                <button 
                    onClick={handleCreatePublicLink}
                    disabled={creatingPublic}
                    style={{
                        background: "#4caf50", color: "white", border: "none", padding: "8px 16px",
                        borderRadius: "6px", fontWeight: "bold", cursor: "pointer"
                    }}
                >
                    {creatingPublic ? "Creating..." : "Enable Public Link"}
                </button>
            )}
            {publicLink && (
                <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ padding: "8px 12px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                        Active
                    </span>
                </div>
            )}
        </div>

        {publicLink && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f9f9f9", padding: "12px", borderRadius: "6px", border: "1px solid #eee" }}>
                <input
                    type="text"
                    value={publicLink}
                    readOnly
                    style={{ flex: 1, border: "none", background: "transparent", fontFamily: "monospace", fontSize: "13px", color: "#333" }}
                />
                <button
                    onClick={() => copyToClipboard(publicLink)}
                    style={{
                        background: "white", border: "1px solid #ddd", borderRadius: "4px",
                        padding: "6px 12px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", color: "#333"
                    }}
                >
                    {copied ? "Copied!" : "Copy Link"}
                </button>
                <button
                    onClick={() => handleRevoke("guest@public.share")}
                    style={{
                        background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: "4px",
                        padding: "6px 12px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", color: "#c62828"
                    }}
                >
                    Disable
                </button>
            </div>
        )}
      </div>

      {/* Private Invites List */}
      <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
        Private Invites ({sharedWith.filter(s => s.email !== "guest@public.share").length})
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {sharedWith.filter(s => s.email !== "guest@public.share").map((share, idx) => (
          <div key={idx} style={{
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "16px",
            position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>
                  {getRelationshipIcon(share.relationship)} {share.name}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {share.email}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#999", marginBottom: "12px" }}>
              Shared {share.sharedDate ? new Date(share.sharedDate).toLocaleDateString() : "recently"}
            </div>
            
            {/* Specific Copy Link Button */}
            <button
                onClick={() => {
                  const link = `${window.location.origin}/shared-progress/${teamId}/${memberId}/${encodeURIComponent(share.email)}`;
                  copyToClipboard(link);
                }}
                style={{
                  width: "100%",
                  marginBottom: "8px",
                  padding: "8px",
                  background: "#e3f2fd",
                  color: "#1565c0",
                  border: "1px solid #bbdefb",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
            >
                <Copy size={14} /> Copy Link
            </button>

            <button
              onClick={() => handleRevoke(share.email)}
              disabled={revoking === share.email}
              style={{
                width: "100%",
                padding: "8px",
                background: "#ffebee",
                color: "#c62828",
                border: "1px solid #ffcdd2",
                borderRadius: "4px",
                cursor: revoking === share.email ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                opacity: revoking === share.email ? 0.6 : 1
              }}
            >
              <Trash2 size={14} style={{ marginRight: "4px", display: "inline" }} />
              {revoking === share.email ? "Revoking..." : "Revoke Access"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", color: "#1a1a1a" }}>
        ⚙️ Privacy Settings
      </h2>

      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e0e0e0", padding: "24px" }}>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Control what information people can see when you share your progress with them.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          {[
            { key: "can_see_goals", label: "📋 Goals", desc: "Allow viewing goal targets and progress" },
            { key: "can_see_applications", label: "📝 Applications", desc: "Allow viewing job applications and their status" },
            { key: "can_see_engagement", label: "📊 Engagement", desc: "Allow viewing activity and engagement score" },
            { key: "can_see_milestones", label: "🏆 Milestones", desc: "Allow viewing achievements and milestones" },
            { key: "can_see_feedback", label: "💬 Feedback", desc: "Allow viewing mentor feedback (very private)" },
            { key: "can_see_full_progress", label: "📈 Full Progress", desc: "Allow viewing detailed progress analytics" },
            { key: "hide_sensitive", label: "🔒 Hide Sensitive Info", desc: "Hide personal details like name and email" }
          ].map((item) => (
            <div key={item.key} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              background: "#f9f9f9",
              borderRadius: "6px",
              border: "1px solid #e0e0e0"
            }}>
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#1a1a1a" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {item.desc}
                </div>
              </div>
              <button
                onClick={() => setPrivacySettings({
                  ...privacySettings,
                  [item.key]: !privacySettings[item.key]
                })}
                style={{
                  width: "50px",
                  height: "28px",
                  border: "none",
                  borderRadius: "14px",
                  background: privacySettings[item.key] ? "#4caf50" : "#ddd",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: privacySettings[item.key] ? "flex-end" : "flex-start",
                  padding: "2px",
                  transition: "all 0.3s"
                }}
              >
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "12px",
                  background: "white",
                  transition: "all 0.3s"
                }} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={loading}
          style={{
            marginTop: "24px",
            padding: "12px 24px",
            background: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "wait" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            width: "100%",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Saving..." : "Save Privacy Settings"}
        </button>
      </div>
    </div>
  );

  if (loading && !impact) {
    return <div style={{ padding: "24px", textAlign: "center", color: "#666" }}>Loading...</div>;
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ padding: "0 24px", display: "flex", gap: "24px", maxWidth: "1400px", margin: "0 auto" }}>
          {[
            { id: "overview", label: "📊 Impact" },
            { id: "sharing", label: "🔗 Sharing" },
            { id: "settings", label: "⚙️ Settings" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "16px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #2196f3" : "3px solid transparent",
                color: activeTab === tab.id ? "#2196f3" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "sharing" && renderSharing()}
        {activeTab === "settings" && renderSettings()}
      </div>

      {showShareModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setShowShareModal(false)}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 20px 0", color: "#1a1a1a" }}>
              📤 Share Your Progress
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#1a1a1a" }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={shareForm.email}
                onChange={(e) => setShareForm({ ...shareForm, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#1a1a1a" }}>
                Name (optional)
              </label>
              <input
                type="text"
                placeholder="John Smith"
                value={shareForm.name}
                onChange={(e) => setShareForm({ ...shareForm, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#1a1a1a" }}>
                Relationship
              </label>
              <select
                value={shareForm.relationship}
                onChange={(e) => setShareForm({ ...shareForm, relationship: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              >
                <option value="mentor">🎓 Mentor</option>
                <option value="accountability_partner">👥 Accountability Partner</option>
                <option value="family">👨‍👩‍👧 Family Member</option>
                <option value="friend">🤝 Friend</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  background: "#2196f3",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}