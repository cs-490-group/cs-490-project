import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useFlash } from "../context/flashContext";
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from "@azure/msal-react";
import AuthAPI from "../api/authentication"; 
import OrganizationsAPI from "../api/organizations"; // Import this
import "../styles/register.css"; 
import logo from "../logo.svg.png"; 
import { Building, GraduationCap } from "lucide-react"; // Added Icons

function Register() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { showFlash } = useFlash();
  const { instance } = useMsal();
  
  // State for Role Toggle
  const [userType, setUserType] = useState("candidate"); // 'candidate' or 'institution'
  const [setupTeam, setSetupTeam] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = {
      username: data.username,
      password: data.password,
      email: data.email,
      full_name: `${data.firstName} ${data.lastName}`,
    };

    try {

      const res = await AuthAPI.register(payload);
      
      // Store Session
      localStorage.setItem("session", res.data.session_token);
      localStorage.setItem("uuid", res.data.uuid);
      localStorage.setItem("email", data.email);

      showFlash("Account created successfully!", "success");

      // Branch logic based on User Type
      if (userType === "institution") {
        try {
            // Create the Organization immediately
            await OrganizationsAPI.register({
                name: data.orgName,
                domain_restriction: data.orgDomain,
                admin_ids: [res.data.uuid], // Make this user the Admin
                branding: {
                    institution_name: data.orgName,
                    primary_color: "#0f172a" // Default corporate color
                }
            });
            // Redirect to Enterprise Dashboard
            navigate("/enterprise");
            return;
        } catch (orgErr) {
            console.error(orgErr);
            showFlash("Account created, but failed to register Organization.", "warning");
            navigate("/dashboard"); // Fallback
            return;
        }
      }

      // Standard Student Flow
      if (setupTeam) {
        navigate(`/setup-team`);
      } else {
        navigate(`/profile`);
      }
      
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || "Registration failed.";
      showFlash(msg, "error");
    } finally {
        setLoading(false);
    }
  };

 
  const OAuthSubmit = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    try {
      const res = await AuthAPI.loginGoogle({ credential: credentialResponse.credential });
      localStorage.setItem("session", res.data.session_token);
      localStorage.setItem("uuid", res.data.uuid);
      localStorage.setItem("email", res.data.email || "");
      if (!res.data.has_password) { navigate("/set-password"); return; }
      navigate("/dashboard");
    } catch (error) {
      showFlash("Google login failed", "error");
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
    <div className="register-page">
      <div className="register-card shadow" style={{ maxWidth: "500px" }}>
        <div className="login-logo mb-3">
          <img src={logo} alt="Metamorphosis logo" className="login-logo-img" />
        </div>

        <h2 className="fw-bold mb-2 text-center">Create Account</h2>
        <p className="text-muted mb-4 text-center">
          Join <strong>Metamorphosis</strong> today.
        </p>

        {/* ROLE TOGGLE */}
        <div className="d-flex gap-2 mb-4 p-1 bg-light rounded-3 border">
            <button
                type="button"
                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 fw-bold ${userType === 'candidate' ? 'btn-white shadow-sm border' : 'text-muted'}`}
                onClick={() => setUserType('candidate')}
                style={{ background: userType === 'candidate' ? 'white' : 'transparent' }}
            >
                <GraduationCap size={18} /> Student
            </button>
            <button
                type="button"
                className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 fw-bold ${userType === 'institution' ? 'btn-white shadow-sm border' : 'text-muted'}`}
                onClick={() => setUserType('institution')}
                style={{ background: userType === 'institution' ? 'white' : 'transparent' }}
            >
                <Building size={18} /> Institution
            </button>
        </div>

        <form className="Register" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="row g-2">
            <div className="col-6">
                <input
                    type="text"
                    {...register("firstName", { required: true })}
                    placeholder="First Name"
                    className="form-control mb-3"
                />
            </div>
            <div className="col-6">
                <input
                    type="text"
                    {...register("lastName", { required: true })}
                    placeholder="Last Name"
                    className="form-control mb-3"
                />
            </div>
          </div>

          <input
            type="text"
            {...register("username", { required: true })}
            placeholder="Username"
            className="form-control mb-3"
          />

          <input
            type="email"
            {...register("email", { required: true })}
            placeholder="Work/School Email"
            className="form-control mb-3"
          />

          <input
            type="password"
            minLength="8"
            {...register("password", { required: true })}
            placeholder="Password"
            className="form-control mb-3"
          />

          <input
            type="password"
            {...register("confirm", {
              required: true,
              validate: (value, data) => value === data.password || "Passwords must match.",
            })}
            placeholder="Confirm Password"
            className="form-control mb-3"
          />

          {/* CONDITIONAL FIELDS FOR INSTITUTION */}
          {userType === 'institution' && (
            <div className="bg-light p-3 rounded-3 mb-3 border">
                <h6 className="fw-bold text-primary mb-2 flex items-center gap-2">
                    <Building size={16}/> Organization Details
                </h6>
                <input
                    type="text"
                    {...register("orgName", { required: userType === 'institution' })}
                    placeholder="Institution Name (e.g. NJIT)"
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    {...register("orgDomain", { required: false })}
                    placeholder="Email Domain (e.g. @njit.edu) - Optional"
                    className="form-control"
                />
                <div className="form-text small">
                    Users with this email domain can be auto-added to your cohorts.
                </div>
            </div>
          )}

         {userType === 'candidate' && (
            <div className="alert alert-info mt-2 mb-3 py-2">
              <div className="d-flex align-items-center gap-2">
                <input
                    className="form-check-input mt-0"
                    type="checkbox"
                    id="setupTeamCheckbox"
                    checked={setupTeam}
                    onChange={(e) => setSetupTeam(e.target.checked)}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                />
                <label 
                    className="form-check-label small mb-0 text-start" 
                    htmlFor="setupTeamCheckbox" 
                    style={{ cursor: "pointer", flex: 1, whiteSpace: "normal" }}
                >
                    Create a <strong>Peer Accountability Team</strong> after signup?
                </label>
              </div>
            </div>
          )}

          <input
            type="submit"
            className={`btn w-100 fw-bold py-2 ${userType === 'institution' ? 'btn-primary' : 'btn-success'}`}
            value={loading ? "Creating Account..." : (userType === 'institution' ? "Register Organization" : "Join as Student")}
            disabled={loading}
          />
        </form>

        {/* OAuth only for Candidates generally, or shared */}
        {userType === 'candidate' && (
            <div className="oauth-buttons mt-3">
            <div className="google-login mb-2">
                <GoogleLogin
                onSuccess={(credentialResponse) =>
                    OAuthSubmit({ credential: credentialResponse.credential })
                }
                onError={() => console.log("Login Failed")}
                />
            </div>

            <button
                className="btn btn-outline-dark w-100 fw-semibold mb-2"
                onClick={handleMicrosoftLogin}
            >
                <i className="fab fa-microsoft me-2"></i> Login with Microsoft
            </button>

            <button
                className="btn btn-primary w-100 fw-semibold"
                onClick={handleLinkedInLogin}
            >
                <i className="fab fa-linkedin me-2"></i> Login with LinkedIn
            </button>
            </div>
        )}
      </div>
    </div>
  );
}

export default Register;