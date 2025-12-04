import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlash } from "../../context/flashContext";
import OrganizationsAPI from "../../api/organizations";
import { Container, Card, Button, Form, Row, Col } from 'react-bootstrap';
import { Building, UserPlus, Plus, ArrowLeft } from 'lucide-react';
import '../../styles/resumes.css';

export default function SetupOrganization() {
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  const [mode, setMode] = useState(null); 
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    try {
      const uuid = localStorage.getItem("uuid");
      await OrganizationsAPI.register({
        name: orgName,
        domain_restriction: domain,
        admin_ids: [uuid],
        branding: {
            institution_name: orgName,
            primary_color: "#0f172a"
        }
      });
      showFlash("Organization created!", "success");
      navigate("/enterprise");
    } catch (err) {
      showFlash(err.response?.data?.detail || "Failed to create organization", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      await OrganizationsAPI.join(inviteCode.trim());
      showFlash("Joined organization!", "success");
      navigate("/enterprise");
    } catch (err) {
      showFlash(err.response?.data?.detail || "Failed to join. Check the code.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-gradient min-vh-100 py-5" style={{ paddingTop: "100px" }}>
      <Container style={{ maxWidth: "900px" }}>
        
        {!mode && (
          <div className="text-center text-white mb-5">
            <h1 className="fw-bold display-4 mb-3" style={{ fontFamily: '"Playfair Display", serif' }}>
                Enterprise Setup
            </h1>
            <p className="lead opacity-75">Manage cohorts, track outcomes, and support your students at scale.</p>
          </div>
        )}

        {!mode && (
          <Row className="g-4 justify-content-center">
            <Col md={5}>
              <Card className="h-100 border-0 shadow-lg hover-scale cursor-pointer" onClick={() => setMode('create')}>
                <Card.Body className="p-5 text-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3 text-primary">
                    <Plus size={32} />
                  </div>
                  <h3 className="fw-bold mb-2">Create Organization</h3>
                  <p className="text-muted">Register a new institution or career services department.</p>
                  <Button variant="primary" className="fw-bold mt-3 w-100">Get Started</Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={5}>
              <Card className="h-100 border-0 shadow-lg hover-scale cursor-pointer" onClick={() => setMode('join')}>
                <Card.Body className="p-5 text-center">
                  <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-3 text-success">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="fw-bold mb-2">Join Existing</h3>
                  <p className="text-muted">Enter an invite code to join your team's organization.</p>
                  <Button variant="success" className="fw-bold mt-3 w-100">Join Now</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {mode === 'create' && (
          <Card className="border-0 shadow-lg rounded-4 mx-auto" style={{ maxWidth: '500px' }}>
            <Card.Body className="p-5">
              <div className="d-flex align-items-center mb-4">
                 <Button variant="link" className="p-0 me-3 text-secondary text-decoration-none" onClick={() => setMode(null)}>
                    <ArrowLeft size={20}/>
                 </Button>
                 <h3 className="fw-bold m-0">Create Organization</h3>
              </div>
              <Form onSubmit={handleCreate}>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-uppercase text-secondary">Organization Name</Form.Label>
                    <Form.Control 
                        size="lg" 
                        placeholder="e.g. Tech University"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        required
                        className="bg-light border-0"
                    />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small text-uppercase text-secondary">Email Domain (Optional)</Form.Label>
                    <Form.Control 
                        placeholder="e.g. @tech.edu"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        className="bg-light border-0"
                    />
                </Form.Group>
                <Button type="submit" size="lg" variant="primary" className="w-100 fw-bold" disabled={loading}>
                    {loading ? "Creating..." : "Create & Continue"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}

        {mode === 'join' && (
          <Card className="border-0 shadow-lg rounded-4 mx-auto" style={{ maxWidth: '500px' }}>
            <Card.Body className="p-5">
              <div className="d-flex align-items-center mb-4">
                 <Button variant="link" className="p-0 me-3 text-secondary text-decoration-none" onClick={() => setMode(null)}>
                    <ArrowLeft size={20}/>
                 </Button>
                 <h3 className="fw-bold m-0">Join Organization</h3>
              </div>
              <Form onSubmit={handleJoin}>
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small text-uppercase text-secondary">Invite Code / ID</Form.Label>
                    <Form.Control 
                        size="lg" 
                        placeholder="Paste code here..."
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value)}
                        required
                        style={{ fontFamily: 'monospace' }}
                        className="bg-light border-0"
                    />
                </Form.Group>
                <Button type="submit" size="lg" variant="success" className="w-100 fw-bold" disabled={loading}>
                    {loading ? "Joining..." : "Join Organization"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}

      </Container>
    </div>
  );
}