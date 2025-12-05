import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationsAPI from '../api/organizations';
import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar, Form, Nav, Spinner, InputGroup } from 'react-bootstrap';
import { Building, Users, TrendingUp, ShieldCheck, Upload, Settings, Download, FileText, Briefcase, Trash2, LogOut, Search } from 'lucide-react';
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
        const res = await OrganizationsAPI.bulkImportUsers(formData);
        alert(res.data?.message || "Import complete!");
        setImportFile(null);
        setCohortName("");
        fetchDashboardData();
      } catch (err) { alert("Import failed: " + err.message); }
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
      <Container fluid="lg">
        
        {/* HEADER */}
        <Card className="border-0 shadow-lg rounded-4 mb-4 overflow-hidden">
            <div style={{ backgroundColor: primaryColor }} className="p-4 text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-white p-2 rounded-3 shadow-sm">
                            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: "32px" }} /> : <Building size={32} className="text-dark" />}
                        </div>
                        <div>
                            <h2 className="fw-bold mb-0 text-white" style={{ fontFamily: '"Playfair Display", serif' }}>{organization.name}</h2>
                            <p className="mb-0 opacity-75 small">Enterprise Portal</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                         <Button variant="light" size="sm" onClick={handleExport}><Download size={14}/> ROI Report</Button>
                         <Button variant="outline-light" size="sm" onClick={handleLeaveOrg}><LogOut size={14}/></Button>
                    </div>
                </div>
            </div>
        </Card>

        <Row className="g-4">
            {/* SIDEBAR NAVIGATION & MEMBER LIST */}
            <Col lg={3}>
                <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <Card.Body className="p-2">
                        <Nav className="flex-column gap-1 nav-pills">
                            {['overview', 'cohorts', 'onboarding', 'settings'].map(key => (
                                <Nav.Link 
                                    key={key}
                                    active={activeTab === key}
                                    onClick={() => setActiveTab(key)}
                                    className={`px-3 py-2 rounded-3 fw-bold text-capitalize ${activeTab === key ? 'bg-primary text-white' : 'text-secondary hover-bg-light'}`}
                                >
                                    {key}
                                </Nav.Link>
                            ))}
                        </Nav>
                    </Card.Body>
                </Card>
                
                {/* MEMBER SIDEBAR WIDGET */}
                <Card className="border-0 shadow-sm rounded-4" style={{maxHeight: '500px', display: 'flex', flexDirection: 'column'}}>
                    <div className="p-3 border-bottom bg-light">
                        <h6 className="fw-bold text-muted mb-2 small text-uppercase">Member Directory</h6>
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-white border-end-0"><Search size={14}/></InputGroup.Text>
                            <Form.Control 
                                placeholder="Find student..." 
                                className="border-start-0" 
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    <div className="overflow-auto p-0">
                        {filteredMembers.length === 0 ? (
                            <p className="text-center text-muted small p-3">No members found</p>
                        ) : (
                            <div className="list-group list-group-flush">
                                {filteredMembers.slice(0, 50).map((m, i) => (
                                    <div key={i} className="list-group-item border-0 px-3 py-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-bold text-dark small">{m.name}</div>
                                                <div className="text-muted" style={{fontSize: '11px'}}>{m.cohort_name}</div>
                                            </div>
                                            <Badge bg={m.status === 'active' ? 'success' : 'light'} text={m.status === 'active' ? 'white' : 'dark'} style={{fontSize: '10px'}}>
                                                {m.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </Col>

            {/* MAIN CONTENT */}
            <Col lg={9}>
                {activeTab === 'overview' && (
                    <>
                        <Row className="g-3 mb-4">
                            {[
                                { label: "Total Students", value: analytics.enrollment.total, color: "primary" },
                                { label: "Active", value: analytics.enrollment.active, color: "success" },
                                { label: "Placements", value: analytics.outcomes.placements, color: "info" },
                                { label: "Interviews", value: analytics.outcomes.interviews, color: "warning" }
                            ].map((stat, idx) => (
                                <Col md={3} key={idx}>
                                    <div className={`p-3 rounded-3 bg-${stat.color} bg-opacity-10 border border-${stat.color} border-opacity-25`}>
                                        <h3 className={`fw-bold text-${stat.color} mb-0`}>{stat.value}</h3>
                                        <small className="text-muted fw-bold">{stat.label}</small>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        
                        {/* AI Insights Card */}
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Header className="bg-white border-0 pt-4 px-4">
                                <h5 className="fw-bold d-flex align-items-center gap-2 text-dark">
                                    <ShieldCheck className="text-success" size={20}/> Program Health & Insights
                                </h5>
                            </Card.Header>
                            <Card.Body className="px-4 pb-4">
                                {insights ? (
                                    <>
                                        <p className="text-secondary mb-3">{insights.insight}</p>
                                        <div className="d-flex gap-3 align-items-start bg-light p-3 rounded-3">
                                            <TrendingUp size={20} className="text-primary mt-1"/>
                                            <div>
                                                <h6 className="fw-bold text-primary small text-uppercase mb-1">Recommended Strategy</h6>
                                                <p className="mb-0 fw-medium text-dark small">{insights.action}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : <p className="text-muted">Generating analysis...</p>}
                            </Card.Body>
                        </Card>
                    </>
                )}

                {activeTab === 'cohorts' && (
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-0">
                            <Table hover className="align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 py-3">Cohort</th>
                                        <th>Students</th>
                                        <th>Placement</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cohorts.map(c => (
                                        <tr key={c.id}>
                                            <td className="ps-4 fw-bold text-primary">{c.name}</td>
                                            <td>{c.students}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <ProgressBar now={c.placement_rate} style={{width: '60px', height: '6px'}} variant="success"/>
                                                    <span className="small">{c.placement_rate}%</span>
                                                </div>
                                            </td>
                                            <td><Badge bg="success" className="fw-normal">Active</Badge></td>
                                            <td className="text-end pe-4"><Button size="sm" variant="outline-secondary">View</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}
                
                {activeTab === 'onboarding' && (
                    <Card className="border-0 shadow-sm rounded-4 p-5 text-center">
                        <div className="mb-4 text-primary bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block"><Upload size={32}/></div>
                        <h3>Bulk User Import</h3>
                        <p className="text-muted mb-4">Upload a CSV to onboard students.</p>
                        <Form onSubmit={handleBulkImport} style={{maxWidth: "400px", margin: "0 auto"}}>
                            <Form.Group className="mb-3 text-start">
                                <Form.Label className="small fw-bold">Cohort Name</Form.Label>
                                <Form.Control value={cohortName} onChange={e => setCohortName(e.target.value)} required />
                            </Form.Group>
                            <Form.Group className="mb-4 text-start">
                                <Form.Control type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])} required />
                            </Form.Group>
                            <Button type="submit" className="w-100 fw-bold">Start Import</Button>
                        </Form>
                    </Card>
                )}

                {activeTab === 'settings' && (
                    <Card className="border-danger shadow-sm rounded-4">
                        <Card.Header className="bg-danger bg-opacity-10 border-0 pt-4 px-4"><h5 className="text-danger fw-bold m-0"><Trash2 size={20} className="me-2"/>Danger Zone</h5></Card.Header>
                        <Card.Body className="p-4">
                            <p className="text-muted">Permanently delete this organization.</p>
                            <Button variant="danger" onClick={handleDeleteOrg}>Delete Organization</Button>
                        </Card.Body>
                    </Card>
                )}
            </Col>
        </Row>
      </Container>
    </div>
  );

}