import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, Card } from "react-bootstrap";
import JobSelectionModal from "./JobSelectionModal";
import jobsAPI from "../../api/jobs";

export default function ReferralManagementForm({
    showModal,
    setShowModal,
    editing,
    formData,
    setFormData,
    contacts,
    handleAddOrUpdate,
    resetForm
}) {
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        // When modal opens, if there's a job_id (either editing or creating with prefill), fetch the job details
        if (showModal && formData.job_id) {
            fetchJobDetails(formData.job_id);
        } else if (!showModal) {
            // Clear selected job when modal is closed
            setSelectedJob(null);
        }
    }, [showModal, formData.job_id]);

    const fetchJobDetails = async (jobId) => {
        try {
            const response = await jobsAPI.get(jobId);
            const jobData = response.data;
            if (jobData && (jobData.id === jobId || jobData._id === jobId)) {
                setSelectedJob(jobData);
            }
        } catch (error) {
            console.error("Failed to fetch job details:", error);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        resetForm();
        setSelectedJob(null);
    };

    const handleJobSelect = (job) => {
        setSelectedJob(job);
        setFormData({
            ...formData,
            job_id: job.id || job._id,
            company: job.company,
            position: job.title
        });
    };

    const handleClearJob = () => {
        setSelectedJob(null);
        setFormData({
            ...formData,
            job_id: null,
            company: '',
            position: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAddOrUpdate();
    };

    return (
        <Modal show={showModal} onHide={handleClose} size="lg" centered contentClassName="modal-centered-content">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editing ? "Edit Referral Request" : "New Referral Request"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Job Selection Section */}
                    <div className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <Button 
                                variant="outline-primary" 
                                onClick={() => setShowJobModal(true)}
                                className="me-3"
                            >
                                {selectedJob ? "Choose Different Job" : "Choose Job"}
                            </Button>
                            {selectedJob && (
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={handleClearJob}
                                    size="sm"
                                >
                                    Clear Job
                                </Button>
                            )}
                        </div>
                        
                        {selectedJob && (
                            <Card className="bg-light border-info">
                                <Card.Body className="py-3">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6 className="fw-bold mb-1">{selectedJob.title}</h6>
                                            <p className="mb-1 text-muted">{selectedJob.company}</p>
                                        </div>
                                        <div className="col-md-6">
                                            {selectedJob.industry && (
                                                <p className="mb-1 small"><strong>Industry:</strong> {selectedJob.industry}</p>
                                            )}
                                            {selectedJob.location && (
                                                <p className="mb-1 small"><strong>Location:</strong> {selectedJob.location}</p>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                    
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact</Form.Label>
                                <Form.Select
                                    value={formData.contact_id}
                                    onChange={(e) => setFormData({...formData, contact_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a contact</option>
                                    {contacts.map(contact => (
                                        <option key={contact._id} value={contact._id}>
                                            {contact.name} - {contact.email}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="requested">Requested</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="declined">Declined</option>
                                    <option value="completed">Completed</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Company</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                                    required
                                    disabled={!!selectedJob}
                                    placeholder={selectedJob ? "Auto-filled from selected job" : "Enter company name"}
                                />
                                {selectedJob && (
                                    <Form.Text className="text-muted">
                                        Auto-filled from selected job
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Position</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    required
                                    disabled={!!selectedJob}
                                    placeholder={selectedJob ? "Auto-filled from selected job" : "Enter position"}
                                />
                                {selectedJob && (
                                    <Form.Text className="text-muted">
                                        Auto-filled from selected job
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Request Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.request_date}
                                    onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Follow-up Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.follow_up_date}
                                    onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Request Template</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.request_template}
                            onChange={(e) => setFormData({...formData, request_template: e.target.value})}
                            placeholder="Template for referral request..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Personalized Message</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={formData.personalized_message}
                            onChange={(e) => setFormData({...formData, personalized_message: e.target.value})}
                            placeholder="Personalized message to send..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Additional notes..."
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAddOrUpdate}>
                    {editing ? "Update" : "Create"} Referral Request
                </Button>
            </Modal.Footer>
            
            <JobSelectionModal 
                showModal={showJobModal}
                setShowModal={setShowJobModal}
                onJobSelect={handleJobSelect}
                selectedJobId={selectedJob?.id || selectedJob?._id}
            />
        </Modal>
    );
}
