import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Alert, Nav, Tab } from 'react-bootstrap';
import ProgressBar from '../../components/AccessibleProgressBar';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { networkAnalyticsAPI } from '../../api/networkAnalytics';

const NetworkingAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState(30);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await networkAnalyticsAPI.getDashboardData(period);
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load networking analytics. Please try again.');
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const trackROI = async (roiData) => {
    try {
      await networkAnalyticsAPI.trackROIOutcome(roiData);
      loadAnalytics(); // Refresh data
    } catch (err) {
      console.error('ROI tracking error:', err);
    }
  };

  // SAFELY EXTRACT DATA (Use optional chaining ?. so it doesn't crash when null)
  const performanceMetrics = analytics?.performance_metrics || {};
  const relationshipAnalytics = analytics?.relationship_analytics || {};
  const engagementAnalytics = analytics?.engagement_analytics || {};
  const opportunityAnalytics = analytics?.opportunity_analytics || {};
  const roiAnalytics = analytics?.roi_analytics || {};
  const industryBenchmarks = analytics?.industry_benchmarks || {};
  const recommendations = analytics?.improvement_recommendations || [];

  // Prepare chart data
  const relationshipStrengthData = Object.entries(relationshipAnalytics.relationship_strength_distribution || {}).map(([key, value]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    value: value,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'][Object.keys(relationshipAnalytics.relationship_strength_distribution || {}).indexOf(key)] || '#888'
  }));

  const eventTypeROIData = Object.entries(roiAnalytics.event_roi_by_type || {}).map(([key, value]) => ({
    event: key.replace('_', ' ').toUpperCase(),
    roi: value,
    opportunities: opportunityAnalytics.opportunities_by_event_type?.[key] || 0
  }));

  return (
    <div className="networking-analytics p-4">
      {/* --- HEADER SECTION (ALWAYS VISIBLE) --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Networking Analytics</h1>
          <p className="text-muted">Track your networking performance and ROI</p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            style={{ width: '150px' }}
            aria-label="Timeframe"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <Button variant="outline-primary" onClick={loadAnalytics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* --- CONDITIONAL CONTENT --- */}
      
      {/* 1. LOADING STATE */}
      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status" aria-label="Loading Analytics">
            <span className="visually-hidden">Loading networking analytics...</span>
          </div>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Analytics</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadAnalytics}>Retry</Button>
        </Alert>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && !analytics && (
        <Alert variant="info">
          <Alert.Heading>No Analytics Data Available</Alert.Heading>
          <p>Start networking activities to see your analytics here.</p>
        </Alert>
      )}

      {/* 4. MAIN DASHBOARD CONTENT (Only shows if we have data) */}
      {!loading && !error && analytics && (
        <>
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="mt-4" style={{marginBottom:"1rem"}}>
              <Card.Header>
                <h2>Recommendations</h2>
              </Card.Header>
              <Card.Body>
                {recommendations.map((recommendation, index) => (
                  <Alert key={index} variant="info" className="mb-2">
                    {recommendation}
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Key Metrics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary">{performanceMetrics.networking_activities || 0}</h3>
                  <p className="text-muted mb-0">Networking Activities</p>
                  <small className="text-success">
                    {industryBenchmarks.avg_networking_activities_per_month &&
                      `Industry avg: ${industryBenchmarks.avg_networking_activities_per_month}/month`
                    }
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">{roiAnalytics.roi_percentage?.toFixed(1) || 0}%</h3>
                  <p className="text-muted mb-0">Networking ROI</p>
                  <small className="text-info">
                    ${roiAnalytics.total_investment?.toFixed(0) || 0} invested
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-info">{relationshipAnalytics.high_value_relationships || 0}</h3>
                  <p className="text-muted mb-0">High-Value Relationships</p>
                  <small className="text-warning">
                    Trust score 8+
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning">{opportunityAnalytics.offers_from_networking || 0}</h3>
                  <p className="text-muted mb-0">Offers from Network</p>
                  <small className="text-success">
                    {opportunityAnalytics.accepted_offers_from_networking || 0} accepted
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabs */}
          <style jsx>{`
            .nav-tabs .nav-link {
              color: black !important;
              background-color: transparent !important;
              border-color: transparent !important;
            }
            .nav-tabs .nav-link:hover {
              color: black !important;
              background-color: rgba(255, 255, 255, 0.1) !important;
              border-color: rgba(255, 255, 255, 0.1) !important;
            }
            .nav-tabs .nav-link.active {
              color: black !important;
              background-color: white !important;
              border-color: white !important;
            }
          `}</style>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="overview">Overview</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="relationships">Relationships</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="roi">ROI Analysis</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="opportunities">Opportunities</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="engagement">Engagement</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Overview Tab */}
              <Tab.Pane eventKey="overview">
                <Row>
                  <Col md={8}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Performance Overview</h2>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={[
                            { metric: 'Activities', value: performanceMetrics.networking_activities || 0, benchmark: industryBenchmarks.avg_networking_activities_per_month || 8 },
                            { metric: 'Referrals', value: opportunityAnalytics.referrals_generated || 0, benchmark: 2 },
                            { metric: 'Interviews', value: opportunityAnalytics.interviews_from_networking || 0, benchmark: 1 },
                            { metric: 'Offers', value: opportunityAnalytics.offers_from_networking || 0, benchmark: 0.5 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="metric" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" name="Your Performance" />
                            <Line type="monotone" dataKey="benchmark" stroke="#82ca9d" name="Industry Benchmark" />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Quality Metrics</h2>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <label>Conversation Quality</label>
                          <ProgressBar
                            now={(performanceMetrics.quality_conversations_ratio || 0) * 100}
                            label={`${((performanceMetrics.quality_conversations_ratio || 0) * 100).toFixed(1)}%`}
                            variant="info"
                            aria-label="Conversation Quality"
                          />
                        </div>
                        <div className="mb-3">
                          <label>Event Satisfaction</label>
                          <ProgressBar
                            now={(performanceMetrics.average_event_satisfaction || 0) * 10}
                            label={`${(performanceMetrics.average_event_satisfaction || 0).toFixed(1)}/10`}
                            variant="success"
                            aria-label="Event Satisfaction"
                          />
                        </div>
                        <div className="mb-3">
                          <label>Response Rate</label>
                          <ProgressBar
                            now={engagementAnalytics.average_response_rate || 0}
                            label={`${(engagementAnalytics.average_response_rate || 0).toFixed(1)}%`}
                            variant="warning"
                            aria-label="Response Rate"
                          />
                        </div>
                        <div className="mb-3">
                          <label>Follow-up Completion</label>
                          <ProgressBar
                            now={(engagementAnalytics.follow_up_completion_rate || 0) * 100}
                            label={`${((engagementAnalytics.follow_up_completion_rate || 0) * 100).toFixed(1)}%`}
                            variant="primary"
                            aria-label="Follow-up Completion"
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Relationships Tab */}
              <Tab.Pane eventKey="relationships">
                <Row>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Relationship Strength Distribution</h2>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={relationshipStrengthData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {relationshipStrengthData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Relationship Metrics</h2>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <div className="text-center mb-3">
                              <h4 className="text-primary">{relationshipAnalytics.new_relationships || 0}</h4>
                              <p className="text-muted">New Relationships</p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="text-center mb-3">
                              <h4 className="text-success">{relationshipAnalytics.strengthened_relationships || 0}</h4>
                              <p className="text-muted">Strengthened Relationships</p>
                            </div>
                          </Col>
                        </Row>
                        <div className="mb-3">
                          <label>Average Trust Score</label>
                          <ProgressBar
                            now={(relationshipAnalytics.average_trust_score || 0) * 10}
                            label={`${(relationshipAnalytics.average_trust_score || 0).toFixed(1)}/10`}
                            variant="success"
                            aria-label="Average Trust Score"
                          />
                        </div>
                        <div className="mb-3">
                          <label>Industry Benchmark</label>
                          <ProgressBar
                            now={(industryBenchmarks.avg_relationship_strength_score || 0) * 10}
                            label={`${(industryBenchmarks.avg_relationship_strength_score || 0).toFixed(1)}/10`}
                            variant="info"
                            aria-label="Industry Benchmark"
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ROI Tab */}
              <Tab.Pane eventKey="roi">
                <Row>
                  <Col md={8}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>ROI by Event Type</h2>
                      </Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={eventTypeROIData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="event" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
                            <Bar dataKey="opportunities" fill="#82ca9d" name="Opportunities" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>ROI Summary</h2>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <h3>Total Investment</h3>
                          <p className="h4 text-primary">${roiAnalytics.total_investment?.toFixed(0) || 0}</p>
                        </div>
                        <div className="mb-3">
                          <h3>Total Value Generated</h3>
                          <p className="h4 text-success">${roiAnalytics.total_roi_value?.toFixed(0) || 0}</p>
                        </div>
                        <div className="mb-3">
                          <h3>Cost per Opportunity</h3>
                          <p className="h4 text-warning">${roiAnalytics.cost_per_opportunity?.toFixed(0) || 0}</p>
                        </div>
                        <div className="mb-3">
                          <h3>Time to Opportunity</h3>
                          <p className="h4 text-info">{roiAnalytics.time_to_opportunity || 0} days</p>
                        </div>
                      </Card.Body>
                    </Card>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Most Profitable Events</h2>
                      </Card.Header>
                      <Card.Body>
                        {roiAnalytics.most_profitable_event_types?.map((eventType, index) => (
                          <div key={index} className="mb-2">
                            <span className="badge bg-success me-2">{index + 1}</span>
                            {eventType.replace('_', ' ').toUpperCase()}
                          </div>
                        )) || <p className="text-muted">No data available</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Opportunities Tab */}
              <Tab.Pane eventKey="opportunities">
                <Row>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Opportunity Pipeline</h2>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <label>Referrals Generated</label>
                          <h3 className="text-primary">{opportunityAnalytics.referrals_generated || 0}</h3>
                        </div>
                        <div className="mb-3">
                          <label>Interviews from Networking</label>
                          <h3 className="text-info">{opportunityAnalytics.interviews_from_networking || 0}</h3>
                        </div>
                        <div className="mb-3">
                          <label>Offers from Networking</label>
                          <h3 className="text-warning">{opportunityAnalytics.offers_from_networking || 0}</h3>
                        </div>
                        <div className="mb-3">
                          <label>Accepted Offers</label>
                          <h3 className="text-success">{opportunityAnalytics.accepted_offers_from_networking || 0}</h3>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Conversion Funnel</h2>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Referrals</span>
                            <span>{opportunityAnalytics.referrals_generated || 0}</span>
                          </div>
                          <ProgressBar now={100} variant="primary" aria-label="Referral Conversion Rate" />
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Interviews</span>
                            <span>{opportunityAnalytics.interviews_from_networking || 0}</span>
                          </div>
                          <ProgressBar
                            now={opportunityAnalytics.referrals_generated ?
                              (opportunityAnalytics.interviews_from_networking / opportunityAnalytics.referrals_generated) * 100 : 0}
                            variant="info"
                            aria-label="Interview Conversion Rate"
                          />
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Offers</span>
                            <span>{opportunityAnalytics.offers_from_networking || 0}</span>
                          </div>
                          <ProgressBar
                            now={opportunityAnalytics.interviews_from_networking ?
                              (opportunityAnalytics.offers_from_networking / opportunityAnalytics.interviews_from_networking) * 100 : 0}
                            variant="warning"
                            aria-label="Offer Conversion Rate"
                          />
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Accepted</span>
                            <span>{opportunityAnalytics.accepted_offers_from_networking || 0}</span>
                          </div>
                          <ProgressBar
                            now={opportunityAnalytics.offers_from_networking ?
                              (opportunityAnalytics.accepted_offers_from_networking / opportunityAnalytics.offers_from_networking) * 100 : 0}
                            variant="success"
                            aria-label="Accepted Offer Conversion Rate"
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Engagement Tab */}
              <Tab.Pane eventKey="engagement">
                <Row>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Engagement Metrics</h2>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <label>Average Response Rate</label>
                          <ProgressBar
                            now={engagementAnalytics.average_response_rate || 0}
                            label={`${(engagementAnalytics.average_response_rate || 0).toFixed(1)}%`}
                            variant="primary"
                            aria-label="Response Rate"
                          />
                          <small className="text-muted">
                            Industry avg: {industryBenchmarks.avg_response_rate || 45}%
                          </small>
                        </div>
                        <div className="mb-3">
                          <label>Follow-up Completion Rate</label>
                          <ProgressBar
                            now={(engagementAnalytics.follow_up_completion_rate || 0) * 100}
                            label={`${((engagementAnalytics.follow_up_completion_rate || 0) * 100).toFixed(1)}%`}
                            variant="success"
                            aria-label="Follow-up Completion Rate"
                          />
                        </div>
                        <div className="mb-3">
                          <label>Interaction Frequency Trend</label>
                          <div className="text-center">
                            <span className={`badge bg-${engagementAnalytics.interaction_frequency_trend === 'increasing' ? 'success' :
                              engagementAnalytics.interaction_frequency_trend === 'decreasing' ? 'danger' : 'warning'
                              }`}>
                              {engagementAnalytics.interaction_frequency_trend?.toUpperCase() || 'STABLE'}
                            </span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Header>
                        <h2>Best Conversion Channels</h2>
                      </Card.Header>
                      <Card.Body>
                        {roiAnalytics.best_conversion_channels?.map((channel, index) => (
                          <div key={index} className="mb-2">
                            <span className="badge bg-primary me-2">{index + 1}</span>
                            {channel.replace('_', ' ').toUpperCase()}
                          </div>
                        )) || <p className="text-muted">No data available</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </>
      )}
    </div>
  );
};

export default NetworkingAnalytics;