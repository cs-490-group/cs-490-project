import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Form, ProgressBar, Badge } from "react-bootstrap";
import { FaChartLine, FaPlay, FaTrash, FaEye, FaDollarSign, FaTrophy, FaChartBar, FaBrain, FaBalanceScale, FaLightbulb, FaInfoCircle, FaBriefcase, FaUsers, FaGraduationCap, FaRocket } from "react-icons/fa";
import CareerSimulationAPI from "../api/career_simulation";
import "./CareerSimulation.css";

const CareerSimulation = ({ offerId, offerDetails }) => {
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [selectedSimulation, setSelectedSimulation] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    
    // Simulation form state
    const [simulationForm, setSimulationForm] = useState({
        simulationYears: 5,
        personalGrowthRate: 0.5,
        riskTolerance: 0.5,
        jobChangeFrequency: 2.5,
        geographicFlexibility: true,
        industrySwitchWillingness: false,
        success_criteria: [
            { criteria_type: 'salary', weight: 0.4, target_value: 150000, importance: 'high', description: 'Competitive salary growth' },
            { criteria_type: 'work_life_balance', weight: 0.3, target_value: 8, importance: 'high', description: 'Good work-life balance' },
            { criteria_type: 'learning_opportunities', weight: 0.2, target_value: 8, importance: 'medium', description: 'Continuous learning and growth' },
            { criteria_type: 'impact', weight: 0.1, target_value: 7, importance: 'medium', description: 'Meaningful work and impact' }
        ]
    });

    useEffect(() => {
        if (offerId) {
            fetchSimulations();
        }
    }, [offerId]);

    const fetchSimulations = async () => {
        try {
            setLoading(true);
            const data = await CareerSimulationAPI.getSimulationsForOffer(offerId);
            setSimulations(data);
        } catch (err) {
            setError('Failed to fetch career simulations');
            console.error('Error fetching simulations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSimulation = async () => {
        try {
            setLoading(true);
            const request = CareerSimulationAPI.createSimulationRequest(offerId, simulationForm);
            const response = await CareerSimulationAPI.createSimulation(request);
            
            // Refresh simulations list
            await fetchSimulations();
            setShowSimulationModal(false);
            
            // Show the new simulation details
            if (response.simulation_id) {
                const simulation = await CareerSimulationAPI.getSimulation(response.simulation_id);
                setSelectedSimulation(simulation);
                setShowDetailsModal(true);
            }
        } catch (err) {
            setError('Failed to create career simulation');
            console.error('Error creating simulation:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSimulation = async (simulationId) => {
        try {
            setLoading(true);
            const simulation = await CareerSimulationAPI.getSimulation(simulationId);
            setSelectedSimulation(simulation);
            setShowDetailsModal(true);
        } catch (err) {
            setError('Failed to load simulation details');
            console.error('Error loading simulation:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSimulation = async (simulationId) => {
        if (!window.confirm('Are you sure you want to delete this simulation?')) {
            return;
        }

        try {
            await CareerSimulationAPI.deleteSimulation(simulationId);
            await fetchSimulations();
        } catch (err) {
            setError('Failed to delete simulation');
            console.error('Error deleting simulation:', err);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getSimulationStatusBadge = (status) => {
        const variants = {
            pending: 'secondary',
            running: 'info',
            completed: 'success',
            failed: 'danger'
        };
        return variants[status] || 'secondary';
    };

    const renderSimulationCard = (simulation) => {
        const formatted = CareerSimulationAPI.formatSimulationForDisplay(simulation);
        const metrics = CareerSimulationAPI.extractKeyMetrics(simulation);
        
        return (
            <Col key={simulation.simulation_id} md={6} lg={4} className="mb-3">
                <Card className="h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Career Simulation</span>
                        <Badge bg={getSimulationStatusBadge(simulation.status)}>
                            {simulation.status}
                        </Badge>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <small className="text-muted">5-Year Earnings</small>
                            <div className="h5 mb-0 text-success">
                                {metrics ? formatCurrency(metrics.totalEarnings5yr) : 'N/A'}
                            </div>
                        </div>
                        
                        <div className="mb-3">
                            <small className="text-muted">Career Growth Rate</small>
                            <div className="h6 mb-0">
                                {metrics ? `${(metrics.careerGrowthRate * 100).toFixed(1)}%` : 'N/A'}
                            </div>
                        </div>

                        <div className="mb-3">
                            <small className="text-muted">Overall Score</small>
                            <ProgressBar 
                                now={metrics?.overallScore || 0} 
                                label={`${metrics?.overallScore || 0}/100`}
                                variant={metrics?.overallScore > 70 ? 'success' : metrics?.overallScore > 50 ? 'warning' : 'danger'}
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleViewSimulation(simulation.simulation_id)}
                                disabled={simulation.status !== 'completed'}
                            >
                                <FaChartLine className="me-1" />
                                View Details
                            </Button>
                            <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteSimulation(simulation.simulation_id)}
                            >
                                <FaTrash />
                            </Button>
                        </div>
                    </Card.Body>
                    <Card.Footer className="text-muted small">
                        Created: {new Date(simulation.created_at).toLocaleDateString()}
                    </Card.Footer>
                </Card>
            </Col>
        );
    };

    const renderSimulationDetails = () => {
        if (!selectedSimulation) return null;

        const formatted = CareerSimulationAPI.formatSimulationForDisplay(selectedSimulation);
        const metrics = CareerSimulationAPI.extractKeyMetrics(selectedSimulation);

        return (
            <Modal size="xl" show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaChartLine className="me-2" />
                        Career Simulation Results
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formatted && metrics ? (
                        <div>
                            {/* Key Metrics */}
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <FaDollarSign className="text-success mb-2" size={24} />
                                            <h5>{formatCurrency(metrics.totalEarnings5yr)}</h5>
                                            <small className="text-muted">5-Year Earnings</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <FaTrophy className="text-warning mb-2" size={24} />
                                            <h5>{formatCurrency(metrics.peakSalary)}</h5>
                                            <small className="text-muted">Peak Salary</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <FaChartBar className="text-info mb-2" size={24} />
                                            <h5>{(metrics.careerGrowthRate * 100).toFixed(1)}%</h5>
                                            <small className="text-muted">Growth Rate</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <FaBrain className="text-primary mb-2" size={24} />
                                            <h5>{metrics.overallScore}/100</h5>
                                            <small className="text-muted">Overall Score</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Component Scores */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FaBalanceScale className="me-2" />
                                        Success Criteria Scores
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span>Salary</span>
                                                    <span>{metrics.salaryScore}/100</span>
                                                </div>
                                                <ProgressBar now={metrics.salaryScore} variant="success" />
                                            </div>
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span>Work-Life Balance</span>
                                                    <span>{metrics.workLifeBalanceScore}/100</span>
                                                </div>
                                                <ProgressBar now={metrics.workLifeBalanceScore} variant="info" />
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span>Learning Opportunities</span>
                                                    <span>{metrics.learningScore}/100</span>
                                                </div>
                                                <ProgressBar now={metrics.learningScore} variant="warning" />
                                            </div>
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span>Impact</span>
                                                    <span>{metrics.impactScore}/100</span>
                                                </div>
                                                <ProgressBar now={metrics.impactScore} variant="primary" />
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Recommendations */}
                            {formatted.nextStepRecommendation && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <FaLightbulb className="me-2" />
                                            Recommendations
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Alert variant="info">
                                            <strong>Next Step:</strong> {formatted.nextStepRecommendation}
                                        </Alert>
                                        {formatted.longTermStrategy && (
                                            <Alert variant="success">
                                                <strong>Long-term Strategy:</strong> {formatted.longTermStrategy}
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Career Progression */}
                            {metrics.titleProgression && metrics.titleProgression.length > 0 && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <FaBriefcase className="me-2" />
                                            Career Progression
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex flex-wrap gap-2">
                                            {metrics.titleProgression.map((title, index) => (
                                                <Badge key={index} bg="primary" className="p-2">
                                                    Year {index + 1}: {title}
                                                </Badge>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Alert variant="warning">
                            Simulation results are not available yet. This might be because the simulation is still running or failed to complete.
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };

    if (loading && simulations.length === 0) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Loading career simulations...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">
                                <FaChartLine className="me-2" />
                                Career Path Simulation
                            </h4>
                            <Button 
                                variant="primary"
                                onClick={() => setShowSimulationModal(true)}
                                className="career-simulation-btn"
                                style={{ width: 'auto', minWidth: '150px' }}        
                            >
                                <FaPlay className="me-2" />
                                Run Simulation
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Alert variant="info">
                                <FaInfoCircle className="me-2" />
                                Simulate different career outcomes based on this job offer to make strategic decisions aligned with your long-term goals.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {simulations.length > 0 ? (
                <Row>
                    {simulations.map(renderSimulationCard)}
                </Row>
            ) : (
                <Card className="text-center py-5">
                    <Card.Body>
                        <FaChartLine size={48} className="text-muted mb-3" />
                        <h5>No Career Simulations Yet</h5>
                        <p className="text-muted">
                            Create your first career simulation to explore potential outcomes and make informed decisions.
                        </p>
                        <Button 
                            variant="primary"
                            onClick={() => setShowSimulationModal(true)}
                        >
                            <FaPlay className="me-2" />
                            Create Simulation
                        </Button>
                    </Card.Body>
                </Card>
            )}

            {/* Simulation Creation Modal */}
            <Modal show={showSimulationModal} onHide={() => setShowSimulationModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaBrain className="me-2" />
                        Create Career Simulation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Simulation Years</Form.Label>
                                    <Form.Select 
                                        value={simulationForm.simulationYears}
                                        onChange={(e) => setSimulationForm({...simulationForm, simulationYears: parseInt(e.target.value)})}
                                    >
                                        <option value={5}>5 Years</option>
                                        <option value={10}>10 Years</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Risk Tolerance</Form.Label>
                                    <Form.Range 
                                        min="0" 
                                        max="1" 
                                        step="0.1"
                                        value={simulationForm.riskTolerance}
                                        onChange={(e) => setSimulationForm({...simulationForm, riskTolerance: parseFloat(e.target.value)})}
                                    />
                                    <small className="text-muted">
                                        {simulationForm.riskTolerance < 0.3 ? 'Conservative' : 
                                         simulationForm.riskTolerance < 0.7 ? 'Moderate' : 'Aggressive'}
                                    </small>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Personal Growth Rate</Form.Label>
                                    <Form.Range 
                                        min="0" 
                                        max="1" 
                                        step="0.1"
                                        value={simulationForm.personalGrowthRate}
                                        onChange={(e) => setSimulationForm({...simulationForm, personalGrowthRate: parseFloat(e.target.value)})}
                                    />
                                    <small className="text-muted">
                                        {simulationForm.personalGrowthRate < 0.3 ? 'Steady' : 
                                         simulationForm.personalGrowthRate < 0.7 ? 'Moderate' : 'Fast'}
                                    </small>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Job Change Frequency (years)</Form.Label>
                                    <Form.Range 
                                        min="1" 
                                        max="10" 
                                        step="0.5"
                                        value={simulationForm.jobChangeFrequency}
                                        onChange={(e) => setSimulationForm({...simulationForm, jobChangeFrequency: parseFloat(e.target.value)})}
                                    />
                                    <small className="text-muted">
                                        Every {simulationForm.jobChangeFrequency} years
                                    </small>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Check 
                                    type="checkbox"
                                    label="Geographic Flexibility"
                                    checked={simulationForm.geographicFlexibility}
                                    onChange={(e) => setSimulationForm({...simulationForm, geographicFlexibility: e.target.checked})}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Check 
                                    type="checkbox"
                                    label="Industry Switch Willingness"
                                    checked={simulationForm.industrySwitchWillingness}
                                    onChange={(e) => setSimulationForm({...simulationForm, industrySwitchWillingness: e.target.checked})}
                                />
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSimulationModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateSimulation} disabled={loading} className="career-simulation-btn" style={{ width: 'auto', minWidth: '150px' }}>
                        {loading ? <Spinner size="sm" className="me-2" /> : <FaPlay className="me-2" />}
                        Run Simulation
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Simulation Details Modal */}
            {renderSimulationDetails()}
        </Container>
    );
};

export default CareerSimulation;
