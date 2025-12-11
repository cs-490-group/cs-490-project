import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import JobSelectionModal from "./JobSelectionModal";
import ContactSelectionModal from "./ContactSelectionModal";
import jobsAPI from "../../api/jobs";
import referralMessagesAPI from "../../api/referralMessages";
import userAPI from "../../api/user";
import profilesAPI from "../../api/profiles";
import skillsAPI from "../../api/skills";
import experienceAPI from "../../api/employment";
import educationAPI from "../../api/education";

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
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [messageError, setMessageError] = useState(null);
    const [aiMessageData, setAiMessageData] = useState(null);
    const [datesWereAutoSet, setDatesWereAutoSet] = useState(false);

    const formatToYMD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getOptimalReferralTiming = (deadline) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!deadline) {
            const request = new Date(today);
            const followUp = new Date(today);
            followUp.setDate(followUp.getDate() + 5);

            return {
                requestDate: formatToYMD(request),
                followUpDate: formatToYMD(followUp)
            };
        }

        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            return {
                requestDate: formData.request_date,
                followUpDate: formData.follow_up_date
            };
        }

        const request = new Date(deadlineDate);
        request.setDate(request.getDate() - 10);

        const followUp = new Date(deadlineDate);
        followUp.setDate(followUp.getDate() - 3);

        if (request < today) {
            request.setTime(today.getTime());
        }

        if (followUp <= request) {
            const adjustedFollowUp = new Date(request);
            adjustedFollowUp.setDate(adjustedFollowUp.getDate() + 3);
            return {
                requestDate: formatToYMD(request),
                followUpDate: formatToYMD(adjustedFollowUp)
            };
        }

        return {
            requestDate: formatToYMD(request),
            followUpDate: formatToYMD(followUp)
        };
    };

    useEffect(() => {
        if (showModal && formData.job_id) {
            fetchJobDetails(formData.job_id);
        } else if (!showModal) {
            setSelectedJob(null);
            setSelectedContact(null);
            setAiMessageData(null);
            setMessageError(null);
        }
    }, [showModal, formData.job_id]);

    useEffect(() => {
        if (showModal && formData.contact_id && contacts.length > 0) {
            const contact = contacts.find(c => c._id === formData.contact_id);
            setSelectedContact(contact || null);
        }
    }, [showModal, formData.contact_id, contacts]);

    useEffect(() => {
        if (!selectedJob || editing) {
            return;
        }
        if (formData.follow_up_date) {
            return;
        }
        const { requestDate, followUpDate } = getOptimalReferralTiming(selectedJob.deadline);
        setFormData(prev => ({
            ...prev,
            request_date: requestDate,
            follow_up_date: followUpDate
        }));
        setDatesWereAutoSet(true);
    }, [selectedJob, editing, formData.follow_up_date, setFormData]);

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
        setSelectedContact(null);
        setDatesWereAutoSet(false);
    };

    const handleJobSelect = (job) => {
        setSelectedJob(job);

        let updatedFields = {
            job_id: job.id || job._id,
            company: job.company,
            position: job.title
        };

        if (!editing) {
            const { requestDate, followUpDate } = getOptimalReferralTiming(job.deadline);
            updatedFields = {
                ...updatedFields,
                request_date: requestDate,
                follow_up_date: followUpDate
            };
        }

        setFormData({
            ...formData,
            ...updatedFields
        });
        setDatesWereAutoSet(!editing);
    };

    const handleRequestDateChange = (e) => {
        setFormData({ ...formData, request_date: e.target.value });
        setDatesWereAutoSet(false);
    };

    const handleFollowUpDateChange = (e) => {
        setFormData({ ...formData, follow_up_date: e.target.value });
        setDatesWereAutoSet(false);
    };

    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        setFormData({
            ...formData,
            contact_id: contact._id
        });
    };

    const handleClearContact = () => {
        setSelectedContact(null);
        setFormData({
            ...formData,
            contact_id: ""
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

    const handleGenerateAIMessage = async () => {
        if (!selectedJob || !selectedContact) {
            setMessageError("Please select both a job and contact before generating a message.");
            return;
        }

        setIsGeneratingMessage(true);
        setMessageError(null);

        try {
            // Get comprehensive user profile data from multiple sources
            const userProfile = await getUserProfile();

            const result = await referralMessagesAPI.generateMessage({
                user_profile: userProfile,
                job_details: selectedJob,
                contact_info: selectedContact,
                relationship_context: selectedContact.relationship_type || 'professional',
                tone: 'professional'
            });

            if (result.success) {
                const aiData = result.data;
                setFormData({
                    ...formData,
                    message: aiData.message
                });
                setAiMessageData(aiData);
            } else {
                setMessageError(result.error || 'Failed to generate message');
            }
        } catch (error) {
            console.error('Error generating AI message:', error);
            setMessageError('Failed to generate message. Please try again.');
        } finally {
            setIsGeneratingMessage(false);
        }
    };

    const getUserProfile = async () => {
        try {
            // Get all user data from the main endpoint
            const userData = await userAPI.getAllData();

            // Extract user's name from profile
            const userName = userData.profile?.full_name || userData.profile?.username || 'User';

            // Extract and structure profile data for AI
            return {
                contact: { name: userName },
                skills: userData.skills || [],
                experience: userData.employment || [],
                education: userData.education || [],
                summary: userData.profile?.biography || '',
                profile: userData.profile || {}
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Return basic profile data as fallback
            return {
                contact: { name: 'User' },
                skills: [],
                experience: [],
                education: [],
                summary: '',
                profile: {}
            };
        }
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
                                            {selectedJob.deadline && (
                                                <p className="mb-1 small">
                                                    <strong>Application deadline:</strong> {new Date(selectedJob.deadline).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 small text-muted">
                                        {(() => {
                                            const { requestDate, followUpDate } = getOptimalReferralTiming(selectedJob.deadline);
                                            return (
                                                <>
                                                    <div>
                                                        <strong>Suggested request date:</strong> {requestDate}
                                                        {!selectedJob.deadline && (
                                                            <span className="text-muted"> (no deadline, based on today)</span>
                                                        )}
                                                    </div>
                                                    <div><strong>Suggested follow-up date:</strong> {followUpDate}</div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </div>

                    <Row>
                        <Col md={6}>
                            {/* Contact Selection Section */}
                            <div className="mb-4">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowContactModal(true)}
                                    className="me-3"
                                >
                                    {selectedContact ? "Choose Different Contact" : "Choose Contact"}
                                </Button>
                                {selectedContact && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearContact}
                                        size="sm"
                                    >
                                        Clear Contact
                                    </Button>
                                )}

                                {selectedContact && (
                                    <Card className="bg-light border-info">
                                        <Card.Body className="py-3">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold mb-1">{selectedContact.name}</h6>
                                                    <p className="mb-1 text-muted">{selectedContact.email}</p>
                                                </div>
                                                <div className="col-md-6">
                                                    {selectedContact.employment?.company && (
                                                        <p className="mb-1 small"><strong>Company:</strong> {selectedContact.employment.company}</p>
                                                    )}
                                                    {selectedContact.employment?.position && (
                                                        <p className="mb-1 small"><strong>Position:</strong> {selectedContact.employment.position}</p>
                                                    )}
                                                    {selectedContact.relationship_type && (
                                                        <p className="mb-1 small"><strong>Relationship:</strong> {selectedContact.relationship_type}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </div>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                                {datesWereAutoSet && (
                                    <div className="mb-1 small text-muted">
                                        {datesWereAutoSet ? "Auto-filled from optimal timing" : "Manually edited"}
                                    </div>
                                )}
                                <Form.Label>Request Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.request_date}
                                    onChange={handleRequestDateChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Follow-up Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.follow_up_date}
                                    onChange={handleFollowUpDateChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Message</Form.Label>
                        <div className="mb-2">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleGenerateAIMessage}
                                disabled={isGeneratingMessage || !selectedJob || !selectedContact}
                                className="me-2"
                            >
                                {isGeneratingMessage ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                        <span className="ms-2">Generating AI Message...</span>
                                    </>
                                ) : (
                                    <>
                                        🤖 Generate AI Message
                                    </>
                                )}
                            </Button>
                            <small className="text-muted">
                                Requires selected job and contact
                            </small>
                        </div>

                        {messageError && (
                            <Alert variant="danger" className="mb-2" dismissible onClose={() => setMessageError(null)}>
                                {messageError}
                            </Alert>
                        )}

                        {aiMessageData && (
                            <Alert variant="success" className="mb-2">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>✨ AI Message Generated!</strong>
                                        <div className="mt-1">
                                            <small className="text-muted">
                                                Personalization Score: {aiMessageData.personalization_score}/100 |
                                                Word Count: {aiMessageData.word_count} |
                                                Tone: {aiMessageData.tone_analysis}
                                            </small>
                                        </div>
                                        {aiMessageData.key_points_used && aiMessageData.key_points_used.length > 0 && (
                                            <div className="mt-2">
                                                <small><strong>Key Points Used:</strong></small>
                                                <ul className="mb-0 mt-1">
                                                    {aiMessageData.key_points_used.map((point, index) => (
                                                        <li key={index} className="small">{point}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Alert>
                        )}

                        <Form.Control
                            as="textarea"
                            rows={5}
                            value={formData.message || formData.personalized_message || ''}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Write your referral request message..."
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

            <ContactSelectionModal
                showModal={showContactModal}
                setShowModal={setShowContactModal}
                onContactSelect={handleContactSelect}
                selectedContactId={selectedContact?._id}
                contacts={contacts}
                jobDetails={selectedJob}
            />
        </Modal>
    );
}
