import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationsAPI from '../api/organizations';
import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar, Form, Nav, Spinner } from 'react-bootstrap';
import { Building, Users, TrendingUp, ShieldCheck, Upload, Settings, Download, FileText, Briefcase, Trash2, LogOut } from 'lucide-react';
import '../styles/resumes.css'; 

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importFile, setImportFile] = useState(null);
  const [cohortName, setCohortName] = useState("");
  const [cohorts, setCohorts] = useState([]);
  const [insights, setInsights] = useState(null);
  const navigate = useNavigate();
  const [members, setMembers] = useState([]); 
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const res = await OrganizationsAPI.getDashboard();
      setData(res.data || res);

      try {
        const cohortsRes = await OrganizationsAPI.getCohorts();
        setCohorts(cohortsRes.data || cohortsRes || []);
      } catch (e) { setCohorts([]); }

      try {
        const insightRes = await OrganizationsAPI.getInsights();
        setInsights(insightRes.data || insightRes);
      } catch (e) { console.warn("Failed to load insights", e); }

      try {
        const membersRes = await OrganizationsAPI.getMembers();
        setMembers(membersRes.data || membersRes || []);
      } catch (e) { console.warn("Failed to load members"); }

    } catch (err) {
      console.error("Failed to load enterprise data", err);
      if (err.response && err.response.status === 403) {
         window.location.href = "/setup-org";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrg = async () => {
      const confirmName = prompt(`Type "${data.organization.name}" to confirm deletion. This cannot be undone.`);
      if (confirmName !== data.organization.name) return;
      
      try {
          // FIX: Handle both _id and id formats
          const orgId = data.organization._id || data.organization.id;
          await OrganizationsAPI.delete(orgId); 
          alert("Organization deleted.");
          window.location.href = "/setup-org";
      } catch (err) {
          alert("Failed to delete organization: " + (err.response?.data?.detail || err.message));
      }
  };
  
  const handleLeaveOrg = async () => {
    if (!window.confirm("Are you sure you want to leave this organization?")) return;
    try {
        await OrganizationsAPI.leave();
        window.location.href = "/setup-org";
    } catch (err) {
        alert(err.response?.data?.detail || "Failed to leave organization");
    }
  };

  const handleExport = async () => {
      try {
          const response = await OrganizationsAPI.exportROI();
          const url = window.URL.createObjectURL(new Blob([response.data || response]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `ROI_Report_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (err) {
          alert("Failed to export report");
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
      fetchDashboardData();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };

  const primaryColor = data?.organization?.branding?.primary_color || "#0f172a"; 
  const logoUrl = data?.organization?.branding?.logo_url;

  const filteredMembers = members.filter(m => 
      m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || 
      m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.cohort_name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (loading) return <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center"><Spinner animation="border" variant="light" /></div>;
  if (!data) return <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center"><div className="bg-white p-5 rounded-4 text-center text-danger"><h3>Access Denied</h3></div></div>;

  const { analytics, organization } = data;

  return (
    <div className="dashboard-gradient min-vh-100 py-5" style={{ paddingTop: "100px" }}>
      <Container>
        
        {/* HEADER */}
        <Card className="border-0 shadow-lg rounded-4 mb-4 overflow-hidden">
            <div style={{ backgroundColor: primaryColor }} className="p-4 p-md-5 text-white">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-4">
                        <div className="bg-white p-3 rounded-3 shadow-sm">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" style={{ height: "40px", objectFit: "contain" }} />
                            ) : (
                                <Building size={32} className="text-dark" />
                            )}
                        </div>
                        <div>
                            <h1 className="fw-bold mb-1 text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                                {organization.name}
                            </h1>
                            <p className="mb-0 opacity-75">Enterprise Portal</p>
                        </div>
                    </div>
                    <div className="d-flex gap-3">
                         <Button 
                            variant="light" 
                            className="d-flex align-items-center gap-2 fw-bold text-dark border-0 shadow-sm"
                            onClick={handleExport}
                         >
                            <Download size={18}/> ROI Report
                         </Button>
                         <Button 
                            variant="outline-light" 
                            className="d-flex align-items-center gap-2"
                            onClick={() => setActiveTab('settings')}
                         >
                            <Settings size={18}/> Settings
                         </Button>
                         <Button 
                            variant="outline-light" 
                            className="d-flex align-items-center gap-2"
                            onClick={handleLeaveOrg}
                            title="Leave Organization"
                         >
                            <LogOut size={18}/>
                         </Button>
                    </div>
                </div>
            </div>
            
            <Card.Header className="bg-white border-0 pt-3 px-2">
                <Nav variant="tabs" className="border-0 justify-content-center">
                    {['overview', 'cohorts', 'onboarding', 'settings'].map(key => (
                        <Nav.Item key={key}>
                            <Nav.Link 
                                active={activeTab === key}
                                onClick={() => setActiveTab(key)}
                                className={`px-4 py-3 fw-bold border-0 ${activeTab === key ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'}`}
                                style={{ background: 'transparent', fontSize: '15px', textTransform: 'capitalize' }}
                            >
                                {key === 'onboarding' ? 'Bulk Onboarding' : key}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </Card.Header>
        </Card>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <>
                <Row className="g-4 mb-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 hover-scale transition-all">
                            <Card.Body className="p-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Total Enrollment</h6>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h2 className="fw-bold text-dark mb-0">{analytics.enrollment.total}</h2>
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Users size={20}/></div>
                                </div>
                                <small className="text-success d-block mt-2">{analytics.enrollment.active} Active Students</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 hover-scale transition-all">
                            <Card.Body className="p-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Placement Rate</h6>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h2 className="fw-bold text-primary mb-0">{analytics.outcomes.placement_rate}%</h2>
                                    <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success"><Briefcase size={20}/></div>
                                </div>
                                <ProgressBar now={analytics.outcomes.placement_rate} variant="success" className="mt-3" style={{height: "6px"}} />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 hover-scale transition-all">
                            <Card.Body className="p-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Interviews Secured</h6>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h2 className="fw-bold text-warning mb-0">{analytics.outcomes.interviews}</h2>
                                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning"><TrendingUp size={20}/></div>
                                </div>
                                <small className="text-muted d-block mt-2">Across all cohorts</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 hover-scale transition-all">
                            <Card.Body className="p-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Total Applications</h6>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h2 className="fw-bold text-info mb-0">{analytics.activity_volume.total_applications}</h2>
                                    <div className="bg-info bg-opacity-10 p-2 rounded-circle text-info"><FileText size={20}/></div>
                                </div>
                                <small className="text-info d-block mt-2">High Volume Activity</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="p-4 border-bottom bg-light">
                        <h5 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
                            <ShieldCheck className="text-success" size={20}/> Program Health & Insights
                        </h5>
                    </div>
                    <Card.Body className="p-4 p-md-5">
                        {insights ? (
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <h5 className="text-dark fw-bold mb-3">Analysis</h5>
                                    <p className="text-secondary fs-5 mb-4">{insights.insight}</p>
                                    <div className="d-flex gap-3 align-items-start bg-info bg-opacity-10 p-4 rounded-3 border border-info">
                                        <div className="bg-white p-2 rounded-circle shadow-sm text-info"><TrendingUp size={24} /></div>
                                        <div>
                                            <h6 className="fw-bold text-info text-uppercase small mb-1">Recommended Strategy</h6>
                                            <p className="mb-0 fw-medium text-dark">{insights.action}</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4} className="text-center border-start">
                                    <div className="p-3">
                                        <div className="display-1 fw-bold text-primary mb-2">{analytics.outcomes.placement_rate}%</div>
                                        <p className="text-muted">Current Placement Rate</p>
                                    </div>
                                </Col>
                            </Row>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center py-5 text-muted">
                                <Spinner size="sm" animation="border" className="me-2" /> Generating AI analysis...
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </>
        )}

        {/* TAB 2: COHORTS */}
        {activeTab === 'cohorts' && (
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-0">
                    {cohorts.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <Users size={48} className="mb-3 opacity-25"/>
                            <h5>No cohorts found</h5>
                            <p>Use "Bulk Onboarding" to create your first cohort.</p>
                        </div>
                    ) : (
                        <Table hover responsive className="align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-muted small text-uppercase">Cohort Name</th>
                                    <th className="py-3 text-muted small text-uppercase">Students</th>
                                    <th className="py-3 text-muted small text-uppercase">Activity</th>
                                    <th className="py-3 text-muted small text-uppercase">Placement</th>
                                    <th className="py-3 text-muted small text-uppercase">Status</th>
                                    <th className="px-4 py-3 text-end text-muted small text-uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((cohort) => (
                                    <tr key={cohort.id} style={{ cursor: 'pointer' }}>
                                        <td className="px-4 py-3 fw-bold text-primary">{cohort.name}</td>
                                        <td className="py-3">{cohort.students}</td>
                                        <td className="py-3"><Badge bg={cohort.activity_score === 'High' ? 'success' : 'warning'} className="fw-normal px-3 py-2">{cohort.activity_score}</Badge></td>
                                        <td className="py-3 fw-bold">{cohort.placement_rate}%</td>
                                        <td className="py-3"><Badge bg="light" text="dark" className="border">Active</Badge></td>
                                        <td className="px-4 py-3 text-end"><Button size="sm" variant="outline-secondary">Manage</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        )}

        {/* TAB 2.5: MEMBERS*/}
        {activeTab === 'members' && (
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold m-0">Organization Members ({members.length})</h5>
                        <div className="d-flex gap-2" style={{width: "300px"}}>
                             <Form.Control 
                                placeholder="Search students..." 
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                             />
                        </div>
                    </div>
                    
                    <Table hover responsive className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">Name</th>
                                <th>Email</th>
                                <th>Cohort</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((m, i) => (
                                <tr key={i}>
                                    <td className="ps-4 fw-bold">{m.name}</td>
                                    <td className="text-muted">{m.email}</td>
                                    <td><Badge bg="info" className="fw-normal">{m.cohort_name}</Badge></td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <ProgressBar now={m.progress || 0} style={{width: "60px", height: "6px"}} />
                                            <span className="small text-muted">{m.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        {m.status === 'active' ? 
                                            <Badge bg="success" className="fw-normal">Active</Badge> : 
                                            <Badge bg="warning" text="dark" className="fw-normal">Invited</Badge>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        )}

        {/* TAB 3: ONBOARDING */}
        {activeTab === 'onboarding' && (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="border-0 shadow-lg rounded-4">
                        <Card.Body className="p-5 text-center">
                            <div className="mb-4 text-primary bg-primary bg-opacity-10 p-4 rounded-circle d-inline-block"><Upload size={48}/></div>
                            <h3 className="fw-bold mb-2">Bulk User Import</h3>
                            <p className="text-muted mb-4">Upload a CSV file to invite hundreds of students at once.</p>
                            <p className="text-muted mb-4">format: email,first_name,last_name</p>
                            <Form onSubmit={handleBulkImport} className="text-start">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold text-secondary small text-uppercase">Cohort Name</Form.Label>
                                    <Form.Control size="lg" type="text" placeholder="e.g. Fall 2025" value={cohortName} onChange={e => setCohortName(e.target.value)} required className="bg-light border-0"/>
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-secondary small text-uppercase">CSV File</Form.Label>
                                    <Form.Control type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])} required className="bg-light border-0"/>
                                </Form.Group>
                                <Button type="submit" size="lg" className="w-100 fw-bold shadow-sm" style={{backgroundColor: primaryColor, border: "none"}}>Start Import</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
             <div className="mx-auto" style={{maxWidth: "600px"}}>
                 <Card className="border-danger shadow-sm rounded-4">
                    <Card.Header className="bg-danger bg-opacity-10 border-0 pt-4 px-4">
                        <h5 className="fw-bold text-danger d-flex align-items-center gap-2">
                            <Trash2 size={20}/> Danger Zone
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                        <p className="text-muted mb-3">
                            Permanently delete this organization and all associated data. 
                            This action cannot be undone.
                        </p>
                        <Button variant="danger" className="w-100 fw-bold" onClick={handleDeleteOrg}>
                            Delete Organization
                        </Button>
                    </Card.Body>
                 </Card>
             </div>
        )}

      </Container>
    </div>
  );
}