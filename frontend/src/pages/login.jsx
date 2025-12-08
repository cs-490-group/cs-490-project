import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useFlash } from "../context/flashContext";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useMsal } from "@azure/msal-react";
import AuthAPI from "../api/authentication";
import teamsAPI from "../api/teams";
import "../styles/login.css"; 
import logo from "../logo.svg.png"; 

function Login() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { flash, showFlash } = useFlash();
  const { instance } = useMsal();

  // Helper function to log user login activity
  const logUserLogin = async (teamId, uuid) => {
    
    if (!teamId || !uuid) {
      console.log("⚠️ Missing teamId or uuid, skipping login logging");
      return false;
    }

    try {
      
      const response = await teamsAPI.logMemberLogin(teamId, uuid);
      
      if (response) {
        return true;
      } else {
        console.log("logMemberLogin returned null/falsy");
        return false;
      }
    } catch (error) {
      console.error("Exception in logUserLogin:", error);
      console.error(" Error message:", error.message);
      // Don't fail login if activity logging fails
      return false;
    }
  };

  // Helper function to accept pending invitations
  const acceptPendingInvite = async (teamId, email, uuid) => {
    try {
      if (!teamId || !email) {
        console.log("Missing teamId or email, skipping invite acceptance");
        console.log("  teamId:", teamId, "| email:", email);
        return false;
      }

      console.log("Attempting to accept invite...");
      console.log("  teamId:", teamId);
      console.log("  email:", email);
      console.log("  uuid:", uuid);
      
      const response = await teamsAPI.acceptInvitation(teamId, {
        email: email,
        uuid: uuid
      });
      
      console.log("Invite accepted successfully:", response);
      return true;
    } catch (error) {
      console.error("Failed to accept invite");
      console.error("  Error:", error);
      if (error.response) {
        console.error("  Response status:", error.response.status);
        console.error("  Response data:", error.response.data);
      }
      // Don't fail login if accept-invite fails
      return false;
    }
  };

  // Helper function to load user's team
  const loadUserTeam = async (uuid) => {
    try {
      const userTeam = await teamsAPI.getUserTeams(uuid);
      
      let teamId = null;
      
      if (Array.isArray(userTeam)) {
        if (userTeam.length > 0) {
          teamId = userTeam[0].id;
        }
      } else if (userTeam && userTeam.id) {
        teamId = userTeam.id;
      }
      
      if (teamId) {
        localStorage.setItem("teamId", teamId);
        console.log("Team loaded and stored:", teamId);
        return teamId;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to load user team:", error);
      return null;
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await AuthAPI.login(data);

      localStorage.setItem("session", res.data.session_token);
      localStorage.setItem("uuid", res.data.uuid);
      localStorage.setItem("email", res.data.email || data.email);

      // Load user's team
      const teamId = await loadUserTeam(res.data.uuid);
      
      // Log login activity for engagement tracking
      if (teamId && res.data.uuid) {
        await logUserLogin(teamId, res.data.uuid);
      }
      
      // Accept invite if user has pending invitation
      if (teamId) {
        await acceptPendingInvite(teamId, res.data.email || data.email, res.data.uuid);
      }

      navigate(`/dashboard`);
      return;
    } catch (error) {
      console.log("ERROR", error);
      showFlash("Invalid Email or Password", "error");
      reset();
    }
  };

  const OAuthSubmit = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      showFlash("Google login failed: no credential returned", "error");
      return;
    }

    try {
      const res = await AuthAPI.loginGoogle({
        credential: credentialResponse.credential,
      });

      if (res.status !== 200) {
        showFlash(res.data?.detail || "Google login failed", "error");
        return;
      }

      localStorage.setItem("session", res.data.session_token);
      localStorage.setItem("uuid", res.data.uuid);
      localStorage.setItem("email", res.data.email || "");

      // Load user's team
      const teamId = await loadUserTeam(res.data.uuid);
      
      // Log login activity for engagement tracking
      if (teamId && res.data.uuid) {
        await logUserLogin(teamId, res.data.uuid);
      }
      
      // Accept invite if user has pending invitation
      if (teamId) {
        await acceptPendingInvite(teamId, res.data.email, res.data.uuid);
      }

      if (!res.data.has_password) {
        navigate("/set-password");
        return;
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      showFlash(error?.response?.data?.detail || "Google login failed", "error");
    }
  };

  async function handleMicrosoftLogin() {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["user.read", "openid", "profile", "email"],
        prompt: "select_account",
      });

      if (!loginResponse?.account) {
        showFlash("Microsoft login failed. No account found.", "error");
        return;
      }

      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ["user.read", "openid", "profile", "email"],
        account: loginResponse.account,
      });

      if (!tokenResponse?.idToken) {
        showFlash("Unable to acquire Microsoft token.", "error");
        return;
      }

      const res = await AuthAPI.loginMicrosoft({ token: tokenResponse.idToken });

      if (res.status !== 200) {
        showFlash(res.data.detail, "error");
        return;
      }

      localStorage.setItem("session", res.data.session_token);
      localStorage.setItem("uuid", res.data.uuid);
      localStorage.setItem("email", res.data.email || "");

      // Load user's team
      const teamId = await loadUserTeam(res.data.uuid);
      
      // Log login activity for engagement tracking
      if (teamId && res.data.uuid) {
        await logUserLogin(teamId, res.data.uuid);
      }
      
      // Accept invite if user has pending invitation
      if (teamId) {
        await acceptPendingInvite(teamId, res.data.email, res.data.uuid);
      }

      if (!res.data.has_password) {
        navigate(`/set-password`);
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Microsoft login failed:", err);
      showFlash(err.message, "error");
    }
  }

  async function handleLinkedInLogin() {
    try {
      // LinkedIn OAuth 2.0 flow
      const LINKEDIN_CLIENT_ID = process.env.REACT_APP_LINKEDIN_CLIENT_ID || "your_linkedin_client_id";
      const REDIRECT_URI = `${window.location.origin}/callback/linkedin`;
      const SCOPE = "openid profile email";
      
      // Construct LinkedIn OAuth URL
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;
      
      // Open popup for LinkedIn authorization
      const popup = window.open(authUrl, "linkedinOAuth", "width=600,height=600");
      
      // Listen for message from popup
      let checkPopup;
      let timeout;
      
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === "LINKEDIN_AUTH_SUCCESS") {
          const { code, error } = event.data;
          
          // Clean up event listeners and timers
          clearInterval(checkPopup);
          clearTimeout(timeout);
          window.removeEventListener("message", handleMessage);
          
          if (error) {
            showFlash("LinkedIn login cancelled or failed", "error");
            popup.close();
            return;
          }
          
          if (code) {
            try {
              const res = await AuthAPI.loginLinkedIn({ code });
              
              if (res.status !== 200) {
                showFlash(res.data?.detail || "LinkedIn login failed", "error");
                popup.close();
                return;
              }
              
              localStorage.setItem("session", res.data.session_token);
              localStorage.setItem("uuid", res.data.uuid);
              localStorage.setItem("email", res.data.email || "");
              
              // Load user's team
              const teamId = await loadUserTeam(res.data.uuid);
              
              // Log login activity for engagement tracking
              if (teamId && res.data.uuid) {
                await logUserLogin(teamId, res.data.uuid);
              }
              
              // Accept invite if user has pending invitation
              if (teamId) {
                await acceptPendingInvite(teamId, res.data.email, res.data.uuid);
              }
              
              if (!res.data.has_password) {
                navigate("/set-password");
                popup.close();
                return;
              }
              
              navigate("/dashboard");
              popup.close();
            } catch (error) {
              console.error("LinkedIn login error:", error);
              showFlash(error?.response?.data?.detail || "LinkedIn login failed", "error");
              popup.close();
            }
          }
        }
      };
      
      window.addEventListener("message", handleMessage);
      
      // Check if popup was blocked
      checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          clearTimeout(timeout);
          window.removeEventListener("message", handleMessage);
          showFlash("LinkedIn login was cancelled", "error");
        }
      }, 1000);
      
      // Timeout after 5 minutes in case user doesn't complete auth
      timeout = setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener("message", handleMessage);
        if (!popup.closed) {
          popup.close();
        }
        showFlash("LinkedIn login timed out", "error");
      }, 5 * 60 * 1000); // 5 minutes
      
    } catch (err) {
      console.error("LinkedIn login failed:", err);
      showFlash("LinkedIn login failed", "error");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card shadow">
        <div className="login-logo mb-3">
          <img src={logo} alt="Metamorphosis logo" className="login-logo-img" />
        </div>

        <h2 className="fw-bold mb-3">Welcome Back</h2>
        <p className="text-muted mb-4">
          Sign in to access your <strong>Metamorphosis</strong> dashboard.
        </p>

        <form className="Login" onSubmit={handleSubmit(onSubmit)}>
          <input
            type="email"
            {...register("email", { required: true })}
            placeholder="Email"
            className="form-control mb-3"
          />

          <input
            type="password"
            {...register("password", { required: true })}
            placeholder="Password"
            className="form-control mb-3"
          />

          <input
            type="submit"
            className="btn btn-success w-100 fw-semibold"
            value="Login"
          />
        </form>

        <div className="oauth-buttons mt-3">
          <div className="google-login mb-2">
            <GoogleLogin
              onSuccess={OAuthSubmit}
              onError={() => showFlash("Google login failed", "error")}
            />
          </div>

          <button
            className="btn btn-outline-dark w-100 fw-semibold microsoft-login mb-2"
            onClick={handleMicrosoftLogin}
          >
            <i className="fab fa-microsoft me-2"></i> Login with Microsoft
          </button>

          <button
            className="btn btn-outline-dark w-100 fw-semibold linkedin-login mb-2"
            onClick={handleLinkedInLogin}
          >
            <i className="fab fa-linkedin me-2"></i> Login with LinkedIn
          </button>
        </div>

        <div className="extra-links mt-3">
          <Link to="/register" className="d-block text-success">
            Register
          </Link>
          <Link to="/forgotPassword" className="d-block text-muted">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;