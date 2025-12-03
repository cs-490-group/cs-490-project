import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Navbar, Nav as BootstrapNav, Container, NavDropdown } from "react-bootstrap";
import { useFlash } from "../context/flashContext";
import AuthAPI from "../api/authentication";
import ProfilesAPI from "../api/profiles";


const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showFlash } = useFlash();
  const token = localStorage.getItem("session");
  const teamId = localStorage.getItem("teamId");
  
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [showInterviewDropdown, setShowInterviewDropdown] = React.useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(null);
  const [username, setUsername] = React.useState(localStorage.getItem("username") || "");
  const hasValidated = React.useRef(false);
  React.useEffect(() => {
    const excludedPaths = ["/login", "/register", "/forgotPassword", "/resetPassword","/shared-progress"];

    const shouldSkip = excludedPaths.some(prefix =>
      location.pathname.startsWith(prefix)
    );
    
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
          
          const cachedUsername = localStorage.getItem("username");
          
          if (cachedUsername) {
            setUsername(cachedUsername);
          }
          
          // Always fetch fresh profile data including avatar
          try {
            const profileRes = await ProfilesAPI.get();
            const newUsername = profileRes.data.username || "User";
            setUsername(newUsername);
            localStorage.setItem("username", newUsername);
            
            // Try to get avatar, but don't fail if it doesn't exist
            try {
              const avatarRes = await ProfilesAPI.getAvatar();
              const blob = avatarRes.data;
              const url = URL.createObjectURL(blob);
              if (url) {
                setAvatarUrl(url);
              } else {
                setAvatarUrl("/default.png");
              }
            } catch (avatarError) {
              console.log("No avatar found, using default:", avatarError);
              setAvatarUrl("/default.png");
            }
          } catch (error) {
            console.error("Failed to load profile data:", error);
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
      if (avatarUrl?.startsWith("blob:") && avatarUrl !== localStorage.getItem("avatarUrl")) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [token, navigate]);

  React.useEffect(() => {
    const handleProfileUpdate = async () => {
      const newUsername = localStorage.getItem("username");
      
      if (newUsername) setUsername(newUsername);
      
      // Only fetch new avatar if it's different from cached
      try {
        const avatarRes = await ProfilesAPI.getAvatar();
        const blob = avatarRes.data;
        const url = URL.createObjectURL(blob);
        if (url) {
          const oldUrl = avatarUrl;
          if (oldUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(oldUrl);
          }
          setAvatarUrl(url);
          localStorage.setItem("avatarUrl", url);
        } else {
          setAvatarUrl("/default.png");
          localStorage.setItem("avatarUrl", "/default.png");
        }
      } catch (error) {
        console.log("No avatar found, using default");
        setAvatarUrl("/default.png");
        localStorage.setItem("avatarUrl", "/default.png");
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  const logout = async () => {
    const uuid = localStorage.getItem("uuid");

    const handleLogout = async () => {
      try {
        await AuthAPI.logout();
      } catch (error) {
        showFlash(error.detail, "error");
        console.error("Logout failed:", error);
      }

      // Clean up blob URL if exists
      if (avatarUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarUrl);
      }

      localStorage.removeItem("uuid");
      localStorage.removeItem("session");
      localStorage.removeItem("username");
      localStorage.removeItem("teamId");
      setIsAuthenticated(false);
      setAvatarUrl(null);
      setUsername("");
      hasValidated.current = false;
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" }); 
    };

    try {
      await AuthAPI.logout();
      showFlash("Successfully Logged out", "success");
    } catch (error) {
      showFlash(error.detail, "error");
      console.error("Logout failed:", error);
    }

    handleLogout();
    localStorage.removeItem("teamId");
    setIsAuthenticated(false);
    setAvatarUrl(null);
    setUsername("");
    hasValidated.current = false;
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

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
                
                <BootstrapNav.Link as={NavLink} to="/pipeline-management" className="mx-3">
                  App Pipeline
                </BootstrapNav.Link>
                
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
                        navigate("/network");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      Network
                    </span>
                  }
                  id="network-dropdown"
                  className="mx-3"
                  show={showNetworkDropdown}
                  onMouseEnter={() => setShowNetworkDropdown(true)}
                  onMouseLeave={() => setShowNetworkDropdown(false)}
                >
                  <NavDropdown.Item as={NavLink} to="/network/referrals">
                    Referrals
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/events">
                    Events
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/interviews">
                    Interviews
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/mentorship">
                    Mentorship
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/discovery">
                    Discovery
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/analytics">
                    Performance & Analytics
                  </NavDropdown.Item>
                </NavDropdown>

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
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/technical-prep">
                    Technical Interview Prep
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/offers">
                    Offers
                  </NavDropdown.Item>
                </NavDropdown>

                {teamId && (
                  <BootstrapNav.Link as={NavLink} to="/teams" className="mx-3">
                    Teams
                  </BootstrapNav.Link>
                )}

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
                        src={avatarUrl}
                        alt="Profile"
                        onError={(e) => {
                          console.log("Avatar failed to load, falling back to default");
                          e.target.src = "/default.png";
                        }}
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