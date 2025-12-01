import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Navbar, Nav as BootstrapNav, Container, NavDropdown } from "react-bootstrap";
import { useFlash } from "../context/flashContext";
import AuthAPI from "../api/authentication";
import ProfilesAPI from "../api/profiles";


const Nav = () => {
  console.log("NAV RELOADING")
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showFlash } = useFlash();
  const token = localStorage.getItem("session");
  
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [showInterviewDropdown, setShowInterviewDropdown] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(localStorage.getItem("avatarUrl") || null);
  const [username, setUsername] = React.useState(localStorage.getItem("username") || "");
  const hasValidated = React.useRef(false);

  console.log(token)
  React.useEffect(() => {
    const excludedPaths = ["/login", "/register", "/forgotPassword", "/resetPassword"];

    const shouldSkip = excludedPaths.some(prefix =>
      location.pathname.startsWith(prefix)
    );

    console.log("ENTERING EFFECT")
    
    // Skip validation if already validated
    if (hasValidated.current) {
      return;
    }
    
    const validateSession = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        localStorage.removeItem("uuid");
        localStorage.removeItem("session");
        localStorage.removeItem("username");
        setIsAuthenticated(false);
        hasValidated.current = true;
        
        if (shouldSkip) {
          return;
        }
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" }); 
        return;
      }

      try {
        const response = await AuthAPI.validateSession();
        
        if (response.status === 200) {
          setIsAuthenticated(true);
          
          // Check if we have cached username
          const cachedUsername = localStorage.getItem("username");
          
          if (cachedUsername) {
            setUsername(cachedUsername);
          }
          
          // Always fetch avatar since blob URLs don't persist
          try {
            if (!cachedUsername) {
              // First time - also fetch username
              const profileRes = await ProfilesAPI.get();
              const newUsername = profileRes.data.username || "User";
              setUsername(newUsername);
              localStorage.setItem("username", newUsername);
            }
            
            // Always fetch avatar
            const avatarRes = await ProfilesAPI.getAvatar();
            const blob = avatarRes.data;
            const url = URL.createObjectURL(blob);
            if (url) {
              setAvatarUrl(url);
            } else {
              setAvatarUrl("/default.png");
            }
          } catch (error) {
            console.error("Failed to load profile data:", error);
            // Set defaults if profile loading fails
            setAvatarUrl("/default.png");
            if (!cachedUsername) {
              const defaultUsername = "User";
              setUsername(defaultUsername);
              localStorage.setItem("username", defaultUsername);
            }
          }
        } else {
          localStorage.removeItem("uuid");
          localStorage.removeItem("session");
          localStorage.removeItem("username");
          setIsAuthenticated(false);
          if (shouldSkip) {
            return;
          }
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" }); 
        }
      } catch (error) {
        console.error("Session validation failed:", error);
        localStorage.removeItem("uuid");
        localStorage.removeItem("session");
        localStorage.removeItem("username");
        setIsAuthenticated(false);
        if (shouldSkip) {
          return;
        }
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" }); 
      } finally {
        setIsLoading(false);
        hasValidated.current = true;
      }
    };

    validateSession();
    
    return () => {
      // Only revoke blob URLs created in this session, not cached ones
      if (avatarUrl?.startsWith("blob:") && avatarUrl !== localStorage.getItem("avatarUrl")) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [token, navigate]);

  // Listen for profile updates from the Profile page
  React.useEffect(() => {
    const handleProfileUpdate = async () => {
      const newUsername = localStorage.getItem("username");
      
      if (newUsername) setUsername(newUsername);
      
      // Fetch fresh avatar
      try {
        const avatarRes = await ProfilesAPI.getAvatar();
        const blob = avatarRes.data;
        const url = URL.createObjectURL(blob);
        if (url) {
          // Revoke old blob URL
          const oldUrl = avatarUrl;
          if (oldUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(oldUrl);
          }
          setAvatarUrl(url);
        } else {
          setAvatarUrl("/default.png");
        }
      } catch (error) {
        console.error("Failed to reload avatar:", error);
        setAvatarUrl("/default.png");
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  const logout = async () => {
    const uuid = localStorage.getItem("uuid");

    try {
      await AuthAPI.logout();
      showFlash("Successfully Logged out", "success");
    } catch (error) {
      showFlash(error.detail, "error");
      console.error("Logout failed:", error);
    }

    // Revoke blob URL if it exists
    const cachedAvatarUrl = localStorage.getItem("avatarUrl");
    if (cachedAvatarUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(cachedAvatarUrl);
    }

    localStorage.removeItem("uuid");
    localStorage.removeItem("session");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
    setAvatarUrl(null);
    setUsername("");
    hasValidated.current = false;
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  // Optional: Show loading state while validating
  if (isLoading) {
    return (
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="d-flex align-items-center">
            <img 
              src="/image.png" 
              alt="Metamorphosis logo"
              style={{ height: "50px", marginRight: "10px" }}
            />
            Metamorphosis
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="d-flex align-items-center">
          <img 
            src="/image.png" 
            alt="Metamorphosis logo"
            style={{ height: "50px", marginRight: "10px" }}
          />
          Metamorphosis
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <BootstrapNav className="ms-auto gap-3 align-items-center">
            {isAuthenticated ? (
              <>
                <NavDropdown
                  title={
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate("/dashboard");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      Dashboard
                    </span>
                  }
                  id="dashboard-dropdown"
                  className="mx-3"
                  show={showDropdown}
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <NavDropdown.Item as={NavLink} to="/employment-history">
                    Employment
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/skills">
                    Skills
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/education">
                    Education
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/certifications">
                    Certifications
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/projects">
                    Projects
                  </NavDropdown.Item>
                </NavDropdown>

                <BootstrapNav.Link as={NavLink} to="/jobs" className="mx-3">
                  Jobs
                </BootstrapNav.Link>

                <BootstrapNav.Link as={NavLink} to="/resumes" className="mx-3">
                  Resumes
                </BootstrapNav.Link>

                 <BootstrapNav.Link as={NavLink} to="/cover-letter" className="mx-3">
                  Cover Letters
                </BootstrapNav.Link>

                <NavDropdown
                  title={
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate("/interview/question-library");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      Interview Prep
                    </span>
                  }
                  id="interview-dropdown"
                  className="mx-3"
                  show={showInterviewDropdown}
                  onMouseEnter={() => setShowInterviewDropdown(true)}
                  onMouseLeave={() => setShowInterviewDropdown(false)}
                >
                  <NavDropdown.Item as={NavLink} to="/interview/question-library">
                    Question Library
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/my-practice">
                    My Practice
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/progress">
                    Progress
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/calendar">
                    Interview Calendar
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/performance">
                    Performance Analytics
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/writing-practice">
                    Writing Practice
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/success-probability">
                    Success Predictor
                  </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/interview/follow-up">
                    Follow Up
                  </NavDropdown.Item>
                </NavDropdown>

                <NavDropdown
                  title={
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate("/profile");
                      }}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <img
                        src={avatarUrl || "/default.png"}
                        alt="Profile"
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          marginRight: "8px",
                          border: "2px solid #fff"
                        }}
                      />
                      {username}
                    </span>
                  }
                  id="profile-dropdown"
                  className="mx-3"
                  align="end"
                  show={showProfileDropdown}
                  onMouseEnter={() => setShowProfileDropdown(true)}
                  onMouseLeave={() => setShowProfileDropdown(false)}
                >
                  <NavDropdown.Item as={NavLink} to="/profile">
                    <i className="fas fa-user" style={{ marginRight: "8px" }}></i>
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={logout}>
                    <i className="fas fa-sign-out-alt" style={{ marginRight: "8px" }}></i>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <BootstrapNav.Link as={NavLink} to="/login" className="mx-3">
                  Login
                </BootstrapNav.Link>
                <BootstrapNav.Link as={NavLink} to="/register" className="mx-3">
                  Register
                </BootstrapNav.Link>
              </>
            )}
          </BootstrapNav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Nav;