import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Card, Form } from "react-bootstrap";
import jobsAPI from "../../api/jobs";

export default function JobSelectionModal({ showModal, setShowModal, onJobSelect, selectedJobId }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchCompany, setSearchCompany] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [searchIndustry, setSearchIndustry] = useState("");

    useEffect(() => {
        if (showModal) {
            fetchJobs();
        }
    }, [showModal]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await jobsAPI.getAll();
            setJobs(response.data || []);
            // Reset search when fetching new jobs
            setSearchTerm("");
            setSearchCompany("");
            setSearchLocation("");
            setSearchIndustry("");
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            setError("Failed to load jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesTitle = !searchTerm || 
            (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCompany = !searchCompany || 
            (job.company && job.company.toLowerCase().includes(searchCompany.toLowerCase()));
        const matchesLocation = !searchLocation || 
            (job.location && job.location.toLowerCase().includes(searchLocation.toLowerCase()));
        const matchesIndustry = !searchIndustry || 
            (job.industry && job.industry.toLowerCase().includes(searchIndustry.toLowerCase()));
        
        return matchesTitle && matchesCompany && matchesLocation && matchesIndustry;
    });

    const clearSearch = () => {
        setSearchTerm("");
        setSearchCompany("");
        setSearchLocation("");
        setSearchIndustry("");
    };

    const handleJobSelect = (job) => {
        onJobSelect(job);
        setShowModal(false);
    };

    const handleClose = () => {
        setShowModal(false);
    };

    const isSelected = (job) => {
        return selectedJobId && (job.id === selectedJobId || job._id === selectedJobId);
    };

    return (
        <Modal show={showModal} onHide={handleClose} size="lg" centered contentClassName="modal-centered-content">
            <Modal.Header closeButton>
                <Modal.Title>Select a Job</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Search Section */}
                {!loading && !error && jobs.length > 0 && (
                    <div className="mb-4">
                        <Row className="g-2 mb-2">
                            <Col md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by job title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by company..."
                                    value={searchCompany}
                                    onChange={(e) => setSearchCompany(e.target.value)}
                                />
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by location..."
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by industry..."
                                    value={searchIndustry}
                                    onChange={(e) => setSearchIndustry(e.target.value)}
                                />
                            </Col>
                        </Row>
                        {(searchTerm || searchCompany || searchLocation || searchIndustry) && (
                            <div className="mt-2">
                                <Button variant="outline-secondary" size="sm" onClick={clearSearch}>
                                    Clear Search
                                </Button>
                                <span className="ms-2 text-muted">
                                    {filteredJobs.length} of {jobs.length} jobs found
                                </span>
                            </div>
                        )}
                    </div>
                )}
                
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <p>No jobs found in your profile.</p>
                        <p>Add some jobs first to be able to attach them to referrals.</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <p>No jobs match your search criteria.</p>
                        <Button variant="outline-primary" onClick={clearSearch}>
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <div className="job-selection-grid">
                        <Row xs={1} md={2} className="g-3">
                            {filteredJobs.map((job) => (
                                <Col key={job.id || job._id}>
                                    <Card 
                                        className={`job-card h-100 cursor-pointer ${isSelected(job) ? 'border-primary bg-light' : ''}`}
                                        onClick={() => handleJobSelect(job)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Card.Title as="h6" className="mb-1">
                                                    {job.title}
                                                </Card.Title>
                                                {isSelected(job) && (
                                                    <div className="badge bg-primary">Selected</div>
                                                )}
                                            </div>
                                            <Card.Subtitle as="div" className="mb-2 text-muted">
                                                <strong>{job.company}</strong>
                                            </Card.Subtitle>
                                            
                                            {job.industry && (
                                                <div className="mb-1">
                                                    <small className="text-muted">
                                                        <strong>Industry:</strong> {job.industry}
                                                    </small>
                                                </div>
                                            )}
                                            
                                            {job.location && (
                                                <div className="mb-1">
                                                    <small className="text-muted">
                                                        <strong>Location:</strong> {job.location}
                                                    </small>
                                                </div>
                                            )}
                                            
                                            {job.salary && (
                                                <div className="mb-1">
                                                    <small className="text-muted">
                                                        <strong>Salary:</strong> {job.salary}
                                                    </small>
                                                </div>
                                            )}
                                            
                                            {job.deadline && (
                                                <div className="mb-1">
                                                    <small className="text-muted">
                                                        <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
