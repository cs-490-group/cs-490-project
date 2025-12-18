import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Navbar, Nav as BootstrapNav, Container, NavDropdown } from "react-bootstrap";
import { useFlash } from "../context/flashContext";
import AuthAPI from "../api/authentication";
import ProfilesAPI from "../api/profiles";

// Your actual Metamorphosis logo - now loads instantly!
const Logo = React.memo(() => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 512 512" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: "10px", display: "block" }}
  >
    {/* Background Circle */}
    <circle cx="256" cy="256" r="240" fill="#064e3b" />
    
    {/* Inner Black Circle */}
    <circle cx="256" cy="256" r="180" fill="#000000" />
    
    {/* Circular Arrow Track (Green) */}
    <path 
      d="M256,40c119.3,0,216,96.7,216,216s-96.7,216-216,216S40,375.3,40,256S136.7,40,256,40z" 
      fill="none" 
      stroke="#10b981" 
      strokeWidth="40" 
      strokeDasharray="340 100"
    />

    {/* The "M" */}
    <text 
      x="50%" 
      y="55%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fill="#3b82f6" 
      fontSize="220" 
      fontWeight="bold"
      fontFamily="Georgia, serif"
      style={{ filter: 'drop-shadow(2px 2px 2px rgba(255,255,255,0.5))' }}
    >
      M
    </text>

    {/* Arrowhead Details */}
    <polygon points="256,10 290,60 222,60" fill="#6ee7b7" transform="rotate(45 256 256)" />
    <polygon points="256,10 290,60 222,60" fill="#047857" transform="rotate(225 256 256)" />
  </svg>
));

const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showFlash } = useFlash();
  const token = localStorage.getItem("session");
  
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [avatarUrl, setAvatarUrl] = React.useState(null);
  const [username, setUsername] = React.useState(localStorage.getItem("username") || "");
  const hasValidated = React.useRef(false);

  React.useEffect(() => {
    const excludedPaths = ["/login", "/register", "/forgotPassword", "/resetPassword","/shared-progress","/advisor-portal","/resumes/public","/cover-letter/public"];
    const shouldSkip = excludedPaths.some(prefix => location.pathname.startsWith(prefix));

    if (hasValidated.current) return;

    const validateSession = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        localStorage.removeItem("uuid");
        localStorage.removeItem("session");
        localStorage.removeItem("teamId");
        localStorage.removeItem("username");
        hasValidated.current = true;
        if (shouldSkip) return;
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" }); 
        return;
      }

      try {
        const response = await AuthAPI.validateSession();
        if (response.status === 200) {
          setIsAuthenticated(true);
          const cachedUsername = localStorage.getItem("username");
          if (cachedUsername) setUsername(cachedUsername);
          
          try {
            setAvatarUrl("/default.png");
            const profileRes = await ProfilesAPI.get();
            const newUsername = profileRes.data.username || "User";
            setUsername(newUsername);
            localStorage.setItem("username", newUsername);

            ProfilesAPI.getAvatar().then(avatarRes => {
                const blob = avatarRes.data;
                const url = URL.createObjectURL(blob);
                setAvatarUrl(url);
              });
          } catch (error) {
            console.error("Failed to load profile data:", error);
            setAvatarUrl("/default.png");
          }
        } else {
            localStorage.clear();
            setIsAuthenticated(false);
            if (!shouldSkip) navigate("/");
        }
      } catch (error) {
        localStorage.clear();
        setIsAuthenticated(false);
        if (!shouldSkip) navigate("/");
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
  }, [token, navigate, location.pathname]);

  React.useEffect(() => {
    const handleProfileUpdate = async () => {
      const newUsername = localStorage.getItem("username");
      if (newUsername) setUsername(newUsername);
      try {
        const avatarRes = await ProfilesAPI.getAvatar();
        const blob = avatarRes.data;
        const url = URL.createObjectURL(blob);
        if (url) {
          const oldUrl = avatarUrl;
          if (oldUrl?.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
          setAvatarUrl(url);
          localStorage.setItem("avatarUrl", url);
        }
      } catch (error) {
        console.log("No avatar found, using default");
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [avatarUrl]);

  const logout = async () => {
    try {
      await AuthAPI.logout();
      showFlash("Successfully Logged out", "success");
    } catch (error) {
      console.error("Logout failed:", error);
    }
    if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
    localStorage.clear();
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
          <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center">
            <Logo />
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
          <Logo />
          Metamorphosis
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <BootstrapNav className={`${isAuthenticated ? "ms-auto authenticated-nav" : "ms-auto unauthenticated-nav"} gap-3 align-items-center`}>
            {isAuthenticated ? (
              <>
                {/* --- DASHBOARD DROPDOWN --- */}
                <NavDropdown title="Dashboard" id="dashboard-dropdown" className="mx-3">
                  <NavDropdown.Item as={NavLink} to="/dashboard">
                    <strong>Dashboard Overview</strong>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/employment-history">Employment</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/skills">Skills</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/education">Education</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/certifications">Certifications</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/projects">Projects</NavDropdown.Item>
                </NavDropdown>
                
                <BootstrapNav.Link as={NavLink} to="/pipeline-management" className="mx-3">
                  App Pipeline
                </BootstrapNav.Link>
                
                <BootstrapNav.Link as={NavLink} to="/jobs" className="mx-3">
                  Jobs
                </BootstrapNav.Link>

                {/* --- RESUMES DROPDOWN --- */}
                <NavDropdown title="Resumes" id="resumes-dropdown" className="mx-3">
                  <NavDropdown.Item as={NavLink} to="/resumes">
                    <strong>My Resumes</strong>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/resumes/templates">Resume Templates</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/materials/comparison">Compare Materials</NavDropdown.Item>
                </NavDropdown>

                <BootstrapNav.Link as={NavLink} to="/cover-letter" className="mx-3">
                  Cover Letters
                </BootstrapNav.Link>

                {/* --- NETWORK DROPDOWN --- */}
                <NavDropdown title="Network" id="network-dropdown" className="mx-3">
                  <NavDropdown.Item as={NavLink} to="/network">
                    <strong>Network Overview</strong>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/network/referrals">Referrals</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/events">Events</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/interviews">Interviews</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/mentorship">Mentorship</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/discovery">Discovery</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/network/analytics">Performance & Analytics</NavDropdown.Item>
                </NavDropdown>

                {/* --- INTERVIEW DROPDOWN --- */}
                <NavDropdown title="Interview Prep" id="interview-dropdown" className="mx-3">
                  <NavDropdown.Item as={NavLink} to="/interview/question-library">
                    <strong>Question Library</strong>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/interview/my-practice">My Practice</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/progress">Progress</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/interview/calendar">My Interviews</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/follow-up">Follow Up</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/success-probability">Success Predictor</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/technical-prep">Technical Interview Prep</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/interview/performance">Performance Analytics</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/offers">Offers</NavDropdown.Item>
                </NavDropdown>

                {/* --- SOCIAL DROPDOWN --- */}
                <NavDropdown title="Social" id="social-dropdown" className="mx-3">
                  <NavDropdown.Item as={NavLink} to="/setup-team">Teams</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/newGroup">Groups</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/enterprise">Enterprise Portal</NavDropdown.Item>
                </NavDropdown>

                {/* --- ADMIN DROPDOWN --- */}
                <NavDropdown title="Admin" id="admin-dropdown" className="mx-3">
                  <NavDropdown.Item as={NavLink} to="/api-metrics">
                    <i className="fas fa-chart-bar" style={{ marginRight: "8px" }}></i>
                    API Metrics
                  </NavDropdown.Item>
                </NavDropdown>

                {/* --- PROFILE DROPDOWN --- */}
                <NavDropdown
                  title={
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <img
                        src={avatarUrl || "/default.png"}
                        alt="Profile"
                        onError={(e) => { e.target.src = "/default.png"; }}
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
                >
                  <NavDropdown.Item as={NavLink} to="/profile">
                    <i className="fas fa-user" style={{ marginRight: "8px" }}></i>
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/analytics">
                    <i className="fas fa-chart-line" style={{ marginRight: "8px" }}></i>
                    Analytics
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={logout}>
                    <i className="fas fa-sign-out-alt" style={{ marginRight: "8px" }}></i>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <BootstrapNav.Link as={NavLink} to="/login" className="mx-3">Login</BootstrapNav.Link>
                <BootstrapNav.Link as={NavLink} to="/register" className="mx-3">Register</BootstrapNav.Link>
              </>
            )}
          </BootstrapNav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Nav;