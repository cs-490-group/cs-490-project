import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Mail, Edit2, Trash2, TrendingUp, CheckCircle, AlertCircle, MessageSquare, Users, Target, Zap, CreditCard, Settings, ArrowRight } from "lucide-react";
import teamsAPI from "../api/teams";
import UserProfile from "./otherProfile";
import TeamReports from "./teams/TeamReports";
import GoalTracker from "./teams/GoalTracker";
import ProgressSharingHub from "./teams/ProgressSharingHub";
import MilestoneCelebration from "./teams/MilestoneCelebration";
import CoachingDashboard from "../components/coaching/CoachingDashboard";
import ReviewImpactWidget from "../components/ReviewImpactWidget";
import { Container, Row, Col, Card, Button, Nav, ProgressBar, Badge, Spinner } from 'react-bootstrap';
import '../styles/resumes.css'; // For dashboard-gradient and hover effects

function TeamsDashboard() {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [newInvite, setNewInvite] = useState({ email: "", role: "candidate" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentUserUuid, setCurrentUserUuid] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  
  // Billing state
  const [feedback, setFeedback] = useState(""); // For mentor feedback
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    const userUuid = localStorage.getItem("uuid"); 
    setCurrentUserUuid(userUuid);
    fetchTeamData();
    fetchTeamProgress();
    fetchTeamReports();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      let teamId = localStorage.getItem("teamId");

      if (!teamId || teamId === "TEAM_ID") {
         return; 
      }

      const teamData = await teamsAPI.getTeam(teamId);
      setTeam(teamData);
      setMembers(teamData.members || []);
      setSelectedPlan(teamData.billing?.plan || "basic");
      setError(null);
    } catch (err) {
      console.error("Failed to fetch team data", err);
      localStorage.removeItem("teamId");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamProgress = async () => {
    try {
      const teamId = localStorage.getItem("teamId");
      if(!teamId) return;
      const progressData = await teamsAPI.getTeamProgress(teamId);
      setProgress(progressData);
    } catch (err) {
      console.error("Failed to fetch team progress", err);
    }
  };

  const fetchTeamReports = async () => {
    try {
      const teamId = localStorage.getItem("teamId");
      if(!teamId) return;
      const reportsData = await teamsAPI.getTeamReports(teamId);
      setReports(reportsData);
    } catch (err) {
      console.error("Failed to fetch team reports", err);
    }
  };

  const getMemberProgressData = (memberUuid) => {
    return progress?.memberProgress?.find(m => m.uuid === memberUuid);
  };

  const extractGoalsData = (memberProgressData) => {
    if (memberProgressData?.goals && Array.isArray(memberProgressData.goals)) {
      const completed = memberProgressData.goals.filter(g => g.completed).length;
      const total = memberProgressData.goals.length;
      return { completed, total, pending: total - completed };
    }
    return {
      completed: memberProgressData?.completedGoals || 0,
      total: memberProgressData?.totalGoals || 0,
      pending: memberProgressData?.pendingGoals || 0
    };
  };

  const filteredMembers = members.filter((m) => {
    const roleMatch = filterRole === "all" || m.role === filterRole;
    const textMatch = m.name?.toLowerCase().includes(search.toLowerCase()) || 
                      m.email?.toLowerCase().includes(search.toLowerCase());
    return roleMatch && textMatch;
  });

  const getUserRole = () => {
    const currentUserUuid = localStorage.getItem("uuid");
    if (members && members.length > 0) {
      const member = members.find(m => m.uuid === currentUserUuid);
      if (member && member.role) return member.role;
    }
    return null;
  };

  const isAdmin = () => getUserRole() === "admin";
  const isMentor = () => getUserRole() === "mentor";
  const isCandidate = () => getUserRole() === "candidate";

  const canViewMemberDetails = (memberUuid) => {
    if (isAdmin() || isMentor()) return true;
    if (isCandidate()) return memberUuid === currentUserUuid;
    return false;
  };



  const renderOverview = () => (
    <>
      {team && (
        <Row className="g-4 mb-4">
          {/* KPI Cards */}
          {[
            { label: "Total Members", value: team.memberCount || 0, icon: <Users size={24} className="text-primary"/> },
            { label: "Admins", value: team.admins || 0, icon: <Settings size={24} className="text-secondary"/> },
            { label: "Mentors", value: team.mentors || 0, icon: <Zap size={24} className="text-warning"/> },
            { label: "Candidates", value: team.candidates || 0, icon: <Target size={24} className="text-success"/> }
          ].map((item, idx) => (
            <Col md={3} key={idx}>
              <Card className="border-0 shadow-sm h-100 hover-scale transition-all">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span className="text-muted small text-uppercase fw-bold">{item.label}</span>
                      <h2 className="fw-bold text-dark mb-0 mt-1">{item.value}</h2>
                    </div>
                    <div className="bg-light p-2 rounded-circle">
                      {item.icon}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}

          {/* Team Goals */}
          <Col md={12}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-0 pt-4 px-4">
                <h4 className="fw-bold text-dark">Team Goals</h4>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                <Row className="g-4 text-center">
                    {[
                        { label: "Progress", value: `${progress?.overallProgress || 0}%`, color: "text-primary" },
                        { label: "Goals Completed", value: `${progress?.completedGoals || 0}/${progress?.totalGoals || 0}`, color: "text-success" },
                        { label: "Applications Sent", value: progress?.totalApplications || 0, color: "text-info" },
                        { label: "Avg Engagement", value: `${reports?.averageEngagement || 0}%`, color: "text-warning" },
                    ].map((stat, i) => (
                        <Col key={i} xs={6} md={3}>
                            <div className="p-3 rounded-3 bg-light">
                                <div className={`display-6 fw-bold ${stat.color}`}>{stat.value}</div>
                                <small className="text-muted fw-bold">{stat.label}</small>
                            </div>
                        </Col>
                    ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Team Performance List */}
          {progress && (
            <Col md={12}>
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-white border-0 pt-4 px-4">
                    <h4 className="fw-bold text-dark">Team Performance</h4>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex flex-column gap-3">
                    {progress.memberProgress?.map((member) => (
                      <div key={member.uuid} className="p-3 border rounded-3 hover-bg-light transition-all">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">{member.name}</h6>
                            <small className="text-muted text-capitalize">{member.role}</small>
                          </div>
                          <span className="fw-bold text-primary">{member.progress}%</span>
                        </div>
                        <ProgressBar now={member.progress} variant="primary" style={{height: '6px'}} className="mb-3" />
                        
                        <Row className="g-2">
                            <Col><Badge bg="success" className="w-100 py-2 fw-normal">Success: {member.applications.successRate}%</Badge></Col>
                            <Col><Badge bg="primary" className="w-100 py-2 fw-normal">Interview: {member.applications.interviewRate}%</Badge></Col>
                            <Col><Badge bg="info" className="w-100 py-2 fw-normal">Response: {member.applications.responseRate}%</Badge></Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
    </>
  );

  const renderMembers = () => (
    <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Team Members</h3>
                {isAdmin() && (
                    <div className="d-flex gap-2">
                        <input 
                            className="form-control form-control-sm" 
                            placeholder="Email to invite..." 
                            value={newInvite.email}
                            onChange={e => setNewInvite({...newInvite, email: e.target.value})}
                        />
                        <select 
                            className="form-select form-select-sm"
                            value={newInvite.role}
                            onChange={e => setNewInvite({...newInvite, role: e.target.value})}
                            style={{width: '120px'}}
                        >
                            <option value="candidate">Candidate</option>
                            <option value="mentor">Mentor</option>
                            <option value="admin">Admin</option>
                        </select>
                        <Button 
                            size="sm" 
                            onClick={async () => {
                                try { await teamsAPI.inviteMember(team.id, newInvite); alert("Invite sent!"); fetchTeamData(); }
                                catch(e) { alert("Failed to invite"); }
                            }}
                        >
                            Invite
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters */}
            {!isCandidate() && (
                <div className="d-flex gap-3 mb-4">
                    <input 
                        className="form-control" 
                        placeholder="Search members..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select className="form-select" style={{width: '200px'}} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        <option value="all">All Roles</option>
                        <option value="candidate">Candidates</option>
                        <option value="mentor">Mentors</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            )}

            {/* Member Grid */}
            <Row className="g-3">
                {filteredMembers.map(member => {
                    const canView = canViewMemberDetails(member.uuid);
                    const progressData = getMemberProgressData(member.uuid);
                    const isMe = member.uuid === currentUserUuid;

                    return (
                        <Col md={6} lg={4} key={member.uuid}>
                            <Card className={`h-100 border ${isMe ? 'border-primary' : 'border-light'} shadow-sm`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-3">
                                        <div>
                                            <h5 className="fw-bold mb-1">{member.name} {isMe && "(You)"}</h5>
                                            <Badge bg="secondary" className="text-uppercase">{member.role}</Badge>
                                        </div>
                                        {canView && (
                                            <Button variant="light" size="sm" onClick={() => setViewingUserProfile(member.uuid)}>
                                                Profile
                                            </Button>
                                        )}
                                    </div>

                                    {progressData && (
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between small text-muted mb-1">
                                                <span>Progress</span>
                                                <span>{progressData.progress}%</span>
                                            </div>
                                            <ProgressBar now={progressData.progress} variant="success" style={{height: '6px'}} />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="d-grid gap-2">
                                        {canView && (member.role === 'candidate' || isMe) && (
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                onClick={() => setSelectedMember(member)}
                                            >
                                                🎯 View Goals & Feedback
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* Selected Member Modal / Section */}
            {selectedMember && (
                <div className="mt-4 p-4 border rounded-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0">Managing: {selectedMember.name}</h3>
                        <Button variant="outline-secondary" onClick={() => setSelectedMember(null)}>Close</Button>
                    </div>
                    
                    <GoalTracker 
                        teamId={team.id} 
                        member={selectedMember} 
                        currentUserRole={getUserRole()} 
                        onGoalsUpdate={() => { fetchTeamData(); }}
                    />
                    
                    {/* Feedback Section */}
                    <div className="mt-4">
                        <h5 className="fw-bold">Feedback History</h5>
                        <div className="list-group mb-3">
                            {selectedMember.feedback?.map((fb, i) => (
                                <div key={i} className="list-group-item">
                                    <p className="mb-1">{fb.feedback}</p>
                                    <small className="text-muted">{new Date(fb.created_at).toLocaleDateString()}</small>
                                </div>
                            ))}
                            {!selectedMember.feedback?.length && <p className="text-muted">No feedback yet.</p>}
                        </div>
                        
                        {isMentor() && (
                            <div className="d-flex gap-2">
                                <input 
                                    className="form-control" 
                                    placeholder="Write feedback..." 
                                    value={feedback} 
                                    onChange={e => setFeedback(e.target.value)}
                                />
                                <Button onClick={async () => {
                                    await teamsAPI.sendFeedback(team.id, selectedMember.uuid, { mentorId: currentUserUuid, feedback });
                                    setFeedback("");
                                    fetchTeamData();
                                    alert("Sent!");
                                }}>Send</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card.Body>
    </Card>
  );

  const renderReports = () => (
    <>
      <div className="mb-4">
        <ReviewImpactWidget />
      </div>
      <TeamReports />
    </>
  );

  const renderSharing = () => {
    const userId = localStorage.getItem("uuid");
    const userName = members.find(m => m.uuid === userId)?.name || "User";
    
    return (
      <ProgressSharingHub 
        teamId={team.id}
        memberId={userId}
        memberName={userName}
      />
    );
  };

  const renderCoaching = () => <CoachingDashboard />;

  const renderBilling = () => {
    // Simplified billing render for brevity, wrapped in card
    return (
        <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4 text-center">
                <CreditCard size={48} className="text-primary mb-3" />
                <h3 className="fw-bold">Billing Management</h3>
                <p className="text-muted">Current Plan: <Badge bg="success" className="text-uppercase">{team?.billing?.plan}</Badge></p>
                {/* Add full billing controls here if needed */}
            </Card.Body>
        </Card>
    );
  };

  if (loading) return (
    <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="light" />
    </div>
  );
  
  if (error) return (
    <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center">
        <div className="bg-white p-5 rounded-4 text-center text-danger">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
        </div>
    </div>
  );

  return (
    <div className="dashboard-gradient min-vh-100 py-5" style={{ paddingTop: "100px" }}>
      <Container>
        
        {/* Header */}
        <div className="text-white mb-4">
            <h1 className="fw-bold display-4 mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                {team?.name}
            </h1>
            <p className="opacity-75">Team Dashboard</p>
        </div>

        {/* Navigation Tabs - Styled as Card */}
        <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <Card.Header className="bg-white border-0 pt-3 px-2">
                <Nav variant="tabs" className="border-0 justify-content-center">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'members', label: 'Members' },
                        { id: 'reports', label: 'Reports' },
                        { id: 'coaching', label: 'Coaching' },
                        ...(isCandidate() ? [{ id: 'sharing', label: 'Sharing' }] : []),
                        ...(isAdmin() ? [{ id: 'billing', label: 'Billing' }] : [])
                    ].map(tab => (
                        <Nav.Item key={tab.id}>
                            <Nav.Link 
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 fw-bold border-0 ${activeTab === tab.id ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'}`}
                                style={{ background: 'transparent' }}
                            >
                                {tab.label}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </Card.Header>
        </Card>

        {/* Content Area */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "members" && renderMembers()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "coaching" && renderCoaching()}
        {activeTab === "sharing" && renderSharing()}
        {activeTab === "billing" && renderBilling()}

      </Container>

      {viewingUserProfile && (
        <UserProfile 
          userId={viewingUserProfile}
          onClose={() => setViewingUserProfile(null)} 
        />
      )}
    </div>
  );
}

export default TeamsDashboard;