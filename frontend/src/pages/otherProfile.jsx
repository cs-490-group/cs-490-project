import { useState, useEffect } from "react";
import ProfilesAPI from "../api/profiles";
import "../styles/userProfile.css";

export default function UserProfile({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Fetch user profile by ID
        const userRes = await ProfilesAPI.getById(userId);
        const userData = userRes.data;
        setUser({
          username: userData.username ?? "",
          email: userData.email ?? "",
          full_name: userData.full_name ?? "",
          phone_number: userData.phone_number ?? "",
          address: userData.address ?? "",
          title: userData.title ?? "",
          biography: userData.biography ?? "",
          industry: userData.industry ?? "",
          experience_level: userData.experience_level ?? "",
          role: userData.role ?? "",
        });

        // Load avatar
        try {
          const res = await ProfilesAPI.getAvatarById(userId);
          const blob = res.data;
          const url = URL.createObjectURL(blob);
          if (url) {
            setAvatarUrl(url);
          }
        } catch (e) {
          // Avatar might not exist, that's ok tho
        }
      } catch (e) {
        setError("Failed to load user profile: " + (e.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  if (loading) {
    return (
      <div className="user-profile-modal">
        <div className="user-profile-overlay" onClick={onClose} />
        <div className="user-profile-card">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-modal">
        <div className="user-profile-overlay" onClick={onClose} />
        <div className="user-profile-card">
          <div style={{ color: "#d32f2f", marginBottom: "16px" }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-modal">
      <div className="user-profile-overlay" onClick={onClose} />
      <div className="user-profile-card">
        <button
          onClick={onClose}
          className="close-btn"
        >
          ✕
        </button>

        <h1 className="user-profile-title">{user?.full_name || user?.username}</h1>

        {/* Profile Picture */}
        <div className="user-profile-photo">
          <img
            src={avatarUrl || "/default.png"}
            alt="Profile"
            className="user-avatar"
          />
        </div>

        {/* Profile Info */}
        <div className="user-profile-content">
          <div className="profile-section">
            <h2>Contact Information</h2>
            <div className="profile-field">
              <span className="profile-label">👤 Username</span>
              <span className="profile-value">{user?.username || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">📧 Email</span>
              <span className="profile-value">{user?.email || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">📞 Phone</span>
              <span className="profile-value">{user?.phone_number || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">📍 Address</span>
              <span className="profile-value">{user?.address || "—"}</span>
            </div>
          </div>

          <div className="profile-section">
            <h2>Professional Information</h2>
            <div className="profile-field">
              <span className="profile-label">💼 Headline</span>
              <span className="profile-value">{user?.title || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">🏢 Industry</span>
              <span className="profile-value">{user?.industry || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">📈 Experience Level</span>
              <span className="profile-value">{user?.experience_level || "—"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">👥 Role</span>
              <span className="profile-value" style={{ textTransform: "capitalize" }}>{user?.role || "—"}</span>
            </div>
          </div>

          {user?.biography && (
            <div className="profile-section">
              <h2>Biography</h2>
              <p className="profile-bio">{user.biography}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}