import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as APIMetrics from '../api/apiMetrics';
import ProfilesAPI from '../api/profiles';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import ProgressBar from '../components/AccessibleProgressBar';
import { Activity, Download, AlertTriangle, Lock } from 'lucide-react';
import '../styles/analytics.css';

export default function APIMetricsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState(null);
  const [usageStats, setUsageStats] = useState([]);
  const [recentErrors, setRecentErrors] = useState([]);
  const [fallbackEvents, setFallbackEvents] = useState([]);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      setLoading(true);

      // Fetch user profile to check account_tier
      const profileRes = await ProfilesAPI.get();
      const accountTier = profileRes.data?.account_tier || '';

      // Check if user has admin tier
      if (accountTier.toLowerCase() !== 'admin') {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await fetchAPIMetrics();
    } catch (err) {
      console.error("Authorization check failed", err);
      setAuthorized(false);
      setLoading(false);
    }
  };

  const fetchAPIMetrics = async () => {
    try {
      // Fetch all metrics data in parallel
      const [quotaRes, usageRes, errorsRes, fallbacksRes] = await Promise.all([
        APIMetrics.getQuotaStatus(),
        APIMetrics.getUsageStats(null, null), // Last 7 days by default
        APIMetrics.getRecentErrors(20),
        APIMetrics.getFallbackEvents(null, null) // Last 7 days by default
      ]);

      setQuotaStatus(quotaRes.quotas);
      setUsageStats(usageRes.stats || []);
      setRecentErrors(errorsRes.errors || []);
      setFallbackEvents(fallbacksRes.events || []);

    } catch (err) {
      console.error("Failed to load API metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMetricsReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await APIMetrics.exportWeeklyReport(weekAgo, today);
    } catch (err) {
      alert("Failed to export metrics report");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100" style={{ paddingTop: "100px" }}>
        <Container>
          <div className="analyticsDashboard-content text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3">Loading API metrics...</p>
          </div>
        </Container>
      </div>
    );
  }

  // Unauthorized state
  if (!authorized) {
    return (
      <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center">
        <Container>
          <div className="analyticsDashboard-content">
            <Card className="border-0 shadow-lg rounded-4 text-center p-5 dashboardFadeIn" style={{ maxWidth: '600px', margin: '0 auto', background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
              <div className="mb-4" style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
              }}>
                <Lock size={48} color="white" strokeWidth={2.5} />
              </div>
              <h1 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#212529' }}>Access Restricted</h1>
              <p className="text-muted mb-2" style={{ fontSize: '1.1rem' }}>
                This page requires <strong>administrator privileges</strong>
              </p>
              <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                API metrics and usage data are only accessible to admin accounts. If you believe you should have access, please contact your system administrator.
              </p>
              <div className="d-flex gap-3 justify-content-center mt-4">
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2"
                  style={{ borderRadius: '8px' }}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2"
                  style={{ borderRadius: '8px' }}
                >
                  Go Back
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  // Main content
  return (
    <div className="dashboard-gradient min-vh-100" style={{ paddingTop: "100px" }}>
      <Container fluid="lg">
        <div className="analyticsDashboard-content">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="fw-bold d-flex align-items-center gap-2">
                <Activity size={32} className="text-primary"/>
                API Metrics Dashboard
              </h1>
              <p className="text-muted mb-0">Monitor API usage, quotas, and performance</p>
            </div>
            <Button
              variant="primary"
              onClick={handleExportMetricsReport}
              style={{
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Download size={16} className="me-2"/>
              Export Report (PDF)
            </Button>
          </div>

          {/* Quota Alert */}
          {quotaStatus && Object.entries(quotaStatus).some(([_, quota]) => quota.percent_remaining < 15) && (
            <Alert variant="danger" className="d-flex align-items-center mb-4">
              <AlertTriangle size={20} className="me-2"/>
              <div>
                <strong>Warning:</strong> One or more API providers are below 15% quota remaining
              </div>
            </Alert>
          )}

          {/* Quota Overview Cards */}
          <Row className="g-3 mb-4">
            {quotaStatus && Object.entries(quotaStatus).map(([provider, quota]) => (
              <Col md={6} key={provider}>
                <Card
                  className="border-0 shadow-sm rounded-4"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="text-uppercase text-muted fw-bold m-0 small">{provider}</h2>
                      <Badge
                        bg={quota.percent_remaining > 50 ? 'success' : quota.percent_remaining > 15 ? 'warning' : 'danger'}
                        style={{ fontSize: '12px' }}
                      >
                        {quota.limit ? `${quota.percent_remaining.toFixed(1)}% left` : 'No limit'}
                      </Badge>
                    </div>
                    {quota.limit ? (
                      <>
                        <h3 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                          {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} calls
                        </h3>
                        <ProgressBar
                          now={quota.percent_used}
                          variant={quota.percent_used < 50 ? 'success' : quota.percent_used < 85 ? 'warning' : 'danger'}
                          className="mb-2"
                          style={{
                            height: '10px',
                            borderRadius: '10px',
                            transition: 'width 0.5s ease'
                          }}
                          aria-label={`${provider} API Quota Usage`}
                        />
                        <small className="text-muted">{quota.remaining.toLocaleString()} calls remaining this month</small>
                      </>
                    ) : (
                      <h3 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>{quota.used.toLocaleString()} calls</h3>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Usage Stats */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header
              className="border-0 pt-4 px-4"
              style={{
                background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                borderBottom: '2px solid #e0e0e0'
              }}
            >
              <h2 className="fw-bold m-0">Usage by Provider (Last 7 Days)</h2>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th className="py-3 ps-4">Provider</th>
                      <th className="py-3">Key Owner</th>
                      <th className="py-3">Total Calls</th>
                      <th className="py-3">Success Rate</th>
                      <th className="py-3 pe-4">Avg Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageStats.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">No usage data available</td>
                      </tr>
                    ) : (
                      usageStats.map((stat, idx) => {
                        const successRate = (stat.successful_calls / stat.total_calls * 100).toFixed(1);
                        return (
                          <tr key={idx} style={{ transition: 'background 0.2s ease' }}>
                            <td className="fw-bold ps-4">{stat.provider}</td>
                            <td>
                              <Badge bg="secondary" style={{ fontSize: '11px' }}>
                                {stat.key_owner}
                              </Badge>
                            </td>
                            <td>{stat.total_calls.toLocaleString()}</td>
                            <td>
                              <Badge
                                bg={successRate > 95 ? 'success' : successRate > 80 ? 'warning' : 'danger'}
                                style={{ fontSize: '12px' }}
                              >
                                {successRate}%
                              </Badge>
                            </td>
                            <td className="pe-4">{stat.avg_duration_ms.toFixed(0)}ms</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Fallback Events */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header
              className="border-0 pt-4 px-4"
              style={{
                background: 'linear-gradient(135deg, #fff3e0, #ffffff)',
                borderBottom: '2px solid #ffe0b2'
              }}
            >
              <h2 className="fw-bold m-0">Fallback Events</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {fallbackEvents.length === 0 ? (
                <p className="text-muted mb-0">No fallback events in the last 7 days</p>
              ) : (
                <>
                  <p className="text-muted mb-3">
                    Total: <strong>{fallbackEvents.length}</strong> fallback events
                  </p>
                  <div className="table-responsive">
                    <Table size="sm" hover>
                      <thead style={{ background: '#fff3e0' }}>
                        <tr>
                          <th className="py-2">Timestamp</th>
                          <th className="py-2">Fallback Path</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fallbackEvents.slice(0, 10).map((event, idx) => (
                          <tr key={idx}>
                            <td className="small">{new Date(event.timestamp).toLocaleString()}</td>
                            <td className="small">
                              <span className="text-primary fw-bold">{event.primary_provider}</span>
                              {' → '}
                              <span className="text-success fw-bold">{event.fallback_provider}</span>
                            </td>
                            <td>
                              <Badge bg={event.success ? 'success' : 'danger'} style={{ fontSize: '10px' }}>
                                {event.success ? 'Success' : 'Failed'}
                              </Badge>
                            </td>
                            <td className="small text-muted" style={{ maxWidth: '250px' }}>
                              {event.original_error?.substring(0, 50)}{event.original_error?.length > 50 ? '...' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Recent Errors */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header
              className="border-0 pt-4 px-4"
              style={{
                background: 'linear-gradient(135deg, #ffebee, #ffffff)',
                borderBottom: '2px solid #ffcdd2'
              }}
            >
              <h2 className="fw-bold m-0">Recent Errors</h2>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table size="sm" hover className="mb-0">
                  <thead style={{ background: '#ffebee' }}>
                    <tr>
                      <th className="py-3 ps-4">Timestamp</th>
                      <th className="py-3">Provider</th>
                      <th className="py-3">Key Owner</th>
                      <th className="py-3 pe-4">Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentErrors.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          No errors in the last 7 days
                        </td>
                      </tr>
                    ) : (
                      recentErrors.map((error, idx) => (
                        <tr key={idx}>
                          <td className="small ps-4">{new Date(error.timestamp).toLocaleString()}</td>
                          <td>
                            <Badge bg="secondary" style={{ fontSize: '10px' }}>
                              {error.provider}
                            </Badge>
                          </td>
                          <td className="small">{error.key_owner}</td>
                          <td className="small text-danger pe-4" style={{ maxWidth: '300px' }}>
                            {error.error_message?.substring(0, 60)}{error.error_message?.length > 60 ? '...' : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}
