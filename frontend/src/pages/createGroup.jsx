import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlash } from "../context/flashContext";
import groupAPI from "../api/groups";
import { Container, Row, Col, Card, Button, Form, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { Users, Plus, Search, ArrowRight, LogOut } from 'lucide-react';
import '../styles/resumes.css'; // Reusing your resume styles for consistency

function CreateGroup() {
  const [activeTab, setActiveTab] = useState('my-groups');
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState('Software Development');
  const [maxMembers, setMaxMembers] = useState('10');
  const [allGroups, setAllGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showFlash } = useFlash();
  const navigate = useNavigate();
  const uuid = localStorage.getItem('uuid');

  useEffect(() => {
    if (activeTab === 'join') fetchAllGroups();
    if (activeTab === 'my-groups') fetchMyGroups();
  }, [activeTab]);

  const fetchAllGroups = async () => {
    setLoading(true);
    try {
      const data = await groupAPI.getAllGroups();
      setAllGroups(data);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const data = await groupAPI.getAllUserGroups(uuid);
      setMyGroups(data);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setLoading(true);
    try {
      const data = await groupAPI.createGroup({
        name: groupName,
        category: category,
        maxMembers: parseInt(maxMembers),
        uuid: uuid,
      });
      showFlash(`Group "${data.name}" created!`, "success");
      navigate(`/group/${data.id}`);
    } catch (error) {
      showFlash(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupAPI.joinGroup({ groupId, uuid });
      showFlash("Joined group!", "success");
      fetchAllGroups();
    } catch (error) {
      showFlash(error.message, "error");
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if(!window.confirm("Leave this group?")) return;
    try {
      await groupAPI.leaveGroup({ groupId, uuid });
      showFlash("Left group", "success");
      if (activeTab === 'join') fetchAllGroups();
      if (activeTab === 'my-groups') fetchMyGroups();
    } catch (error) {
      showFlash(error.message, "error");
    }
  };

  const isUserInGroup = (group) => group.members && group.members.some(m => m.uuid === uuid);

  return (
    
    <div className="dashboard-gradient min-vh-100 py-5" style={{ paddingTop: "100px" }}>
      <Container>
        {/* HEADER */}
        <div className="text-center mb-5 text-white">
          <h1 className="fw-bold display-4 mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            Community Groups
          </h1>
          <p className="lead opacity-75">Connect, collaborate, and grow together.</p>
        </div>

        {/* TABS */}
        <div className="d-flex justify-content-center mb-4">
          <div className="bg-white p-1 rounded-pill shadow-sm d-inline-flex">
            {[
              { id: 'my-groups', label: 'My Groups', icon: <Users size={18} /> },
              { id: 'join', label: 'Browse All', icon: <Search size={18} /> },
              { id: 'create', label: 'Create New', icon: <Plus size={18} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 border-0 transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow' : 'text-muted bg-transparent'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
          <Card.Body className="p-4 p-md-5" style={{ minHeight: '400px' }}>
            
            {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>}

            {/* MY GROUPS */}
            {!loading && activeTab === 'my-groups' && (
              <Row className="g-4">
                {myGroups.length === 0 ? (
                  <div className="text-center py-5">
                    <h2 className="text-muted mb-3">You haven't joined any groups yet.</h2>
                    <Button variant="outline-primary" onClick={() => setActiveTab('join')}>Browse Groups</Button>
                  </div>
                ) : (
                  myGroups.map(group => (
                    <Col md={6} lg={4} key={group.id}>
                      <Card className="h-100 border-0 shadow-sm hover-scale bg-light">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <Badge bg="info" className="text-uppercase">{group.category}</Badge>
                            <small className="text-muted">{group.memberCount} members</small>
                          </div>
                          <h2 className="fw-bold mb-3 text-dark text-truncate">{group.name}</h2>
                          <div className="d-flex gap-2">
                            <Button 
                                variant="primary" 
                                className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                                onClick={() => navigate(`/group/${group.id}`)}
                            >
                                Enter Group <ArrowRight size={16}/>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              onClick={() => handleLeaveGroup(group.id)}
                              aria-label="Leave group"
                            >
                              <LogOut size={16}/>
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            )}

            {/* BROWSE GROUPS */}
            {!loading && activeTab === 'join' && (
               <div className="d-flex flex-column gap-3">
                 {allGroups.map(group => (
                   <div key={group.id} className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white hover-bg-light">
                     <div>
                       <h5 className="fw-bold mb-1 text-dark">{group.name}</h5>
                       <div className="d-flex gap-3 text-muted small align-items-center">
                         <Badge bg="secondary" className="fw-normal">{group.category}</Badge>
                         <span>•</span>
                         <span>{group.memberCount} / {group.maxMembers} members</span>
                       </div>
                     </div>
                     {isUserInGroup(group) ? (
                       <Button variant="outline-secondary" disabled>Joined</Button>
                     ) : (
                       <Button variant="success" onClick={() => handleJoinGroup(group.id)}>+ Join</Button>
                     )}
                   </div>
                 ))}
                 {allGroups.length === 0 && <p className="text-center text-muted">No groups found.</p>}
               </div>
            )}

            {/* CREATE GROUP */}
            {!loading && activeTab === 'create' && (
              <div className="mx-auto" style={{ maxWidth: '500px' }}>
                <div className="text-center mb-4">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                        <Users className="text-primary" size={32} />
                    </div>
                    <h3>Start a New Community</h3>
                    <p className="text-muted">Create a space for people to share and learn.</p>
                </div>
                <Form onSubmit={handleCreateSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-secondary">Group Name</Form.Label>
                    <Form.Control 
                      size="lg"
                      type="text" 
                      placeholder="e.g. React Developers NYC" 
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-secondary">Category</Form.Label>
                    <Form.Select size="lg" value={category} onChange={e => setCategory(e.target.value)}>
                      <option>Software Development</option>
                      <option>Marketing</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Cybersecurity</option>
                      <option>Other</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-secondary">Max Members</Form.Label>
                    <Form.Control size="lg" type="number" min="2" max="50" value={maxMembers} onChange={e => setMaxMembers(e.target.value)} />
                  </Form.Group>

                  <Button type="submit" variant="primary" size="lg" className="w-100 fw-bold shadow-sm">
                    Create Group
                  </Button>
                </Form>
              </div>
            )}

          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default CreateGroup;