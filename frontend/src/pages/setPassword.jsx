import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFlash } from "../context/flashContext";
import AuthAPI from "../api/authentication";
import "../styles/register.css";
import posthog from 'posthog-js';

export default function SetPassword() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) {
      showFlash("Please fill out both fields.", "error");
      return;
    }
    if (password.length < 8) {
      showFlash("Password must be at least 8 characters.", "error");
      return;
    }
    if (password !== confirm) {
      showFlash("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("uuid"); // current UUID

      const res = await AuthAPI.updatePassword({
        token: token,
        password: password,
        old_token: "GodIHopeNoOneChecksThis",
      });

      // ✅ store new session info
      localStorage.setItem("uuid", res.data.uuid);
      localStorage.setItem("session", res.data.session_token);

      showFlash(
        "Password set successfully! You can now manage your account normally.",
        "success"
      );
      posthog.capture('password_set', { user_id: res.data.uuid });

      setPassword("");
      setConfirm("");

      // Check if user should go to setup-team or profile
      const teamId = localStorage.getItem("teamId");
      if (teamId) {
        navigate("/teams");
      } else {
        navigate("/setup-team");
      }
    } catch (error) {
      console.error(error);
      showFlash(
        error?.response?.data?.detail || "Failed to set password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card shadow">
        <div className="login-logo mb-3">
          <img
                src="/logo.svg.webp" 
                alt="Metamorphosis logo"
                className="hero-logo mb-3"
                fetchPriority="high"
                width="200" 
                height="200"
                crossOrigin="anonymous"
                />
        </div>

        <h1 className="fw-bold mb-2">Set Your Password</h1>
        <p className="text-muted mb-4">
          Please create a password to manage your account securely.
        </p>

        <form className="Register" onSubmit={onSubmit}>
          <input
            type="password"
            minLength="8"
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password"
            aria-label="New Password"
            title="Password must be minimum 8 characters with at least 1 uppercase, 1 lowercase, and 1 number."
            className="form-control mb-3"
            required
          />

          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            className="form-control mb-3"
            required
          />

          <input
            type="submit"
            className="btn btn-success w-100 fw-semibold"
            value={loading ? "Saving..." : "Set Password"}
            disabled={loading}
          />
        </form>
      </div>
    </div>
  );
}