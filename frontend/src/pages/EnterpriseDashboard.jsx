import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationsAPI from '../api/organizations';
import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar, Form, Nav, Spinner } from 'react-bootstrap';
import { Briefcase, Building, Users, TrendingUp, ShieldCheck, Upload, Settings, Download, FileText } from 'lucide-react';
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
      } catch (e) { console.warn("Failed to load insights"); }

    } catch (err) {
      console.error("Failed to load enterprise data", err);
      if (err.response && err.response.status === 403) {
         window.location.href = "/setup-org";
      }
    } finally {
      setLoading(false);
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

  if (loading) return <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center"><Spinner animation="border" variant="light" /></div>;
  
  if (!data) return <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center"><div className="bg-white p-5 rounded-4 text-center text-danger"><h3>Access Denied</h3></div></div>;

  const { analytics, organization } = data;

  return (
    <div className="dashboard-gradient min-vh-100 py-5" style={{ paddingTop: "100px" }}>
      <Container>
        
        {/* HEADER CARD (Branded) */}
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
                            <Download size={18}/> Export ROI Report
                         </Button>
                         <Button variant="outline-light" className="d-flex align-items-center gap-2">
                            <Settings size={18}/> Settings
                         </Button>
                    </div>
                </div>
            </div>
            
            {/* Navigation Tabs */}
            <Card.Header className="bg-white border-0 pt-3 px-2">
                <Nav variant="tabs" className="border-0 justify-content-center">
                    {[
                        { id: 'overview', label: 'Program Overview' },
                        { id: 'cohorts', label: 'Manage Cohorts' },
                        { id: 'onboarding', label: 'Bulk Onboarding' }
                    ].map(tab => (
                        <Nav.Item key={tab.id}>
                            <Nav.Link 
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 fw-bold border-0 ${activeTab === tab.id ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'}`}
                                style={{ background: 'transparent', fontSize: '15px' }}
                            >
                                {tab.label}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </Card.Header>
        </Card>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
            <>
                <Row className="g-4 mb-4">
                    {[
                        { label: "Total Enrollment", value: analytics.enrollment.total, sub: `${analytics.enrollment.active} Active Students`, icon: <Users size={24} className="text-primary"/> },
                        { label: "Placement Rate", value: `${analytics.outcomes.placement_rate}%`, sub: "Across all cohorts", icon: <Briefcase size={24} className="text-success"/> },
                        { label: "Interviews Secured", value: analytics.outcomes.interviews, sub: "Total interviews", icon: <TrendingUp size={24} className="text-warning"/> },
                        { label: "Total Applications", value: analytics.activity_volume.total_applications, sub: "High Activity Volume", icon: <FileText size={24} className="text-info"/> }
                    ].map((item, idx) => (
                        <Col md={3} key={idx}>
                            <Card className="border-0 shadow-sm h-100 hover-scale transition-all">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h6 className="text-muted text-uppercase small fw-bold mb-0">{item.label}</h6>
                                        <div className="bg-light p-2 rounded-circle">{item.icon}</div>
                                    </div>
                                    <h2 className="fw-bold text-dark mb-1">{item.value}</h2>
                                    <small className="text-muted">{item.sub}</small>
                                    {item.label === "Placement Rate" && (
                                        <ProgressBar now={parseFloat(item.value)} variant="success" className="mt-3" style={{height: "6px"}} />
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
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
                                        <div className="bg-white p-2 rounded-circle shadow-sm text-info">
                                            <TrendingUp size={24} />
                                        </div>
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
                                    <tr key={cohort.id} style={{ cursor: 'pointer' }} onClick={() => alert(`Manage ${cohort.name}`)}>
                                        <td className="px-4 py-3 fw-bold text-primary">{cohort.name}</td>
                                        <td className="py-3">{cohort.students}</td>
                                        <td className="py-3">
                                            <Badge bg={cohort.activity_score === 'High' ? 'success' : cohort.activity_score === 'Moderate' ? 'warning' : 'danger'} className="fw-normal px-3 py-2">
                                                {cohort.activity_score}
                                            </Badge>
                                        </td>
                                        <td className="py-3 fw-bold">{cohort.placement_rate}%</td>
                                        <td className="py-3"><Badge bg="light" text="dark" className="border">Active</Badge></td>
                                        <td className="px-4 py-3 text-end">
                                            <Button size="sm" variant="outline-secondary">Manage</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        )}

        {/* TAB 3: ONBOARDING */}
        {activeTab === 'onboarding' && (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="border-0 shadow-lg rounded-4">
                        <Card.Body className="p-5 text-center">
                            <div className="mb-4 text-primary bg-primary bg-opacity-10 p-4 rounded-circle d-inline-block">
                                <Upload size={48}/>
                            </div>
                            <h3 className="fw-bold mb-2">Bulk User Import</h3>
                            <p className="text-muted mb-4">
                                Upload a CSV file to invite hundreds of students at once. 
                            </p>
                            
                            <Form onSubmit={handleBulkImport} className="text-start">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold text-secondary small text-uppercase">Cohort Name</Form.Label>
                                    <Form.Control 
                                        size="lg"
                                        type="text" 
                                        placeholder="e.g. Fall 2025 Graduates"
                                        value={cohortName}
                                        onChange={e => setCohortName(e.target.value)}
                                        required
                                        className="bg-light border-0"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-secondary small text-uppercase">CSV File</Form.Label>
                                    <Form.Control 
                                        type="file" 
                                        accept=".csv"
                                        onChange={e => setImportFile(e.target.files[0])}
                                        required
                                        className="bg-light border-0"
                                    />
                                    <Form.Text className="text-muted">
                                        Required columns: <code>email</code>, <code>first_name</code>, <code>last_name</code>
                                    </Form.Text>
                                </Form.Group>

                                <Button type="submit" size="lg" className="w-100 fw-bold shadow-sm" style={{backgroundColor: primaryColor, border: "none"}}>
                                    Start Import Process
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        )}

      </Container>
    </div>
  );
}