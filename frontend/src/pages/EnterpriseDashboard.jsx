import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationsAPI from '../api/organizations';
import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar, Form, Nav, Spinner } from 'react-bootstrap';
import { Building, Users, TrendingUp, Briefcase, Upload, Settings, Download, ShieldCheck } from 'lucide-react';
import '../styles/resumes.css'; // Reuse dashboard styles

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importFile, setImportFile] = useState(null);
  const [cohortName, setCohortName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await OrganizationsAPI.getDashboard();
      setData(res.data || res);
    } catch (err) {
      console.error("Failed to load enterprise data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile || !cohortName) return;

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("cohort_name", cohortName);

    try {
      await OrganizationsAPI.bulkImportUsers(formData);
      alert("Bulk import started! Users will receive invitation emails shortly.");
      setImportFile(null);
      setCohortName("");
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };

  // --- BRANDING ---
  // Apply custom colors if they exist in the response
  const primaryColor = data?.organization?.branding?.primary_color || "#0f172a"; // Default slate-900
  const logoUrl = data?.organization?.branding?.logo_url;

  if (loading) return <div className="p-5 text-center">Loading Enterprise Portal...</div>;
  if (!data) return <div className="p-5 text-center text-danger">Access Denied. You are not an Organization Admin.</div>;

  const { analytics, organization } = data;

  return (
    <div className="min-vh-100 bg-light">
      {/* 1. WHITE-LABEL HEADER */}
      <div style={{ backgroundColor: primaryColor }} className="text-white py-4 shadow-sm">
        <Container className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
             {logoUrl ? (
                 <img src={logoUrl} alt="Logo" style={{ height: "40px", background: "white", padding: "4px", borderRadius: "4px" }} />
             ) : (
                 <Building size={32} />
             )}
             <div>
                 <h2 className="m-0 fw-bold" style={{ fontSize: "1.5rem" }}>{organization.name}</h2>
                 <p className="m-0 opacity-75 small">Career Services Administration</p>
             </div>
          </div>
          <div className="d-flex gap-3">
             <Button variant="outline-light" size="sm" className="d-flex align-items-center gap-2">
                <Download size={16}/> Export ROI Report
             </Button>
             <Button variant="outline-light" size="sm" className="d-flex align-items-center gap-2">
                <Settings size={16}/> Settings
             </Button>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {/* NAVIGATION */}
        <Nav variant="tabs" className="mb-4">
            <Nav.Item>
                <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className="text-dark fw-bold">
                    Program Overview
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link active={activeTab === 'cohorts'} onClick={() => setActiveTab('cohorts')} className="text-dark fw-bold">
                    Manage Cohorts
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link active={activeTab === 'onboarding'} onClick={() => setActiveTab('onboarding')} className="text-dark fw-bold">
                    Bulk Onboarding
                </Nav.Link>
            </Nav.Item>
        </Nav>

        {/* TAB 1: ROI DASHBOARD */}
        {activeTab === 'overview' && (
            <>
                {/* High Level KPIs */}
                <Row className="g-4 mb-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <h6 className="text-muted text-uppercase small fw-bold">Total Enrollment</h6>
                                <h2 className="fw-bold text-dark display-6 mb-0">{analytics.enrollment.total}</h2>
                                <div className="text-success small mt-1">
                                    <Users size={14} className="me-1"/>
                                    {analytics.enrollment.active} Active Students
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <h6 className="text-muted text-uppercase small fw-bold">Placement Rate</h6>
                                <h2 className="fw-bold text-primary display-6 mb-0">{analytics.outcomes.placement_rate}%</h2>
                                <ProgressBar now={analytics.outcomes.placement_rate} variant="primary" className="mt-2" style={{height: "6px"}} />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <h6 className="text-muted text-uppercase small fw-bold">Interviews Secured</h6>
                                <h2 className="fw-bold text-warning display-6 mb-0">{analytics.outcomes.interviews}</h2>
                                <div className="text-muted small mt-1">
                                    Across {analytics.enrollment.cohort_count} cohorts
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <h6 className="text-muted text-uppercase small fw-bold">Total Applications</h6>
                                <h2 className="fw-bold text-info display-6 mb-0">{analytics.activity_volume.total_applications}</h2>
                                <div className="text-info small mt-1">
                                    <TrendingUp size={14} className="me-1"/>
                                    High Activity Volume
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Insights Section */}
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 pt-4 px-4">
                        <h5 className="fw-bold d-flex align-items-center gap-2">
                            <ShieldCheck className="text-success" size={20}/> Program Health & Compliance
                        </h5>
                    </Card.Header>
                    <Card.Body className="px-4 pb-4">
                        <p className="text-muted">
                            Based on aggregate data, your Computer Science 2025 cohort is outperforming benchmarks, 
                            while the Design cohort requires additional interview support resources.
                        </p>
                        <div className="alert alert-info mb-0 border-0 bg-light">
                            <strong>💡 Optimization Tip:</strong> 
                            Students who use the "Mock Interview" tool are 2.5x more likely to secure an offer. 
                            Consider enabling this feature for all cohorts.
                        </div>
                    </Card.Body>
                </Card>
            </>
        )}

        {/* TAB 2: COHORTS */}
        {activeTab === 'cohorts' && (
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <h5 className="fw-bold mb-4">Active Cohorts</h5>
                    <Table hover responsive className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>Cohort Name</th>
                                <th>Students</th>
                                <th>Activity Score</th>
                                <th>Placement %</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="fw-bold">Class of 2025 - CS</td>
                                <td>142</td>
                                <td><span className="text-success">High</span></td>
                                <td>68%</td>
                                <td><Badge bg="success">Active</Badge></td>
                                <td><Button size="sm" variant="outline-dark">Manage</Button></td>
                            </tr>
                            <tr>
                                <td className="fw-bold">Spring Bootcamp 2024</td>
                                <td>45</td>
                                <td><span className="text-warning">Moderate</span></td>
                                <td>42%</td>
                                <td><Badge bg="success">Active</Badge></td>
                                <td><Button size="sm" variant="outline-dark">Manage</Button></td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        )}

        {/* TAB 3: ONBOARDING */}
        {activeTab === 'onboarding' && (
            <div className="mx-auto" style={{maxWidth: "600px"}}>
                <Card className="border-0 shadow-lg rounded-4">
                    <Card.Body className="p-5 text-center">
                        <div className="mb-4 text-primary bg-primary bg-opacity-10 p-4 rounded-circle d-inline-block">
                            <Upload size={48}/>
                        </div>
                        <h3 className="fw-bold">Bulk User Import</h3>
                        <p className="text-muted mb-4">
                            Upload a CSV file to invite hundreds of students at once. 
                            They will be automatically assigned to the specified cohort.
                        </p>
                        
                        <Form onSubmit={handleBulkImport}>
                            <Form.Group className="mb-3 text-start">
                                <Form.Label className="fw-bold">Cohort Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="e.g. Fall 2025 Graduates"
                                    value={cohortName}
                                    onChange={e => setCohortName(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4 text-start">
                                <Form.Label className="fw-bold">CSV File</Form.Label>
                                <Form.Control 
                                    type="file" 
                                    accept=".csv"
                                    onChange={e => setImportFile(e.target.files[0])}
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Format: email, first_name, last_name
                                </Form.Text>
                            </Form.Group>

                            <Button type="submit" size="lg" className="w-100 fw-bold" style={{backgroundColor: primaryColor, border: "none"}}>
                                Start Import
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        )}

      </Container>
    </div>
  );
}