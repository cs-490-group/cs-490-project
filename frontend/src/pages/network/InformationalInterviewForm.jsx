import { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";

export default function InformationalInterviewForm({
    showModal,
    setShowModal,
    editing,
    formData,
    setFormData,
    contacts,
    rawTopicsInput,
    setRawTopicsInput,
    rawQuestionsInput,
    setRawQuestionsInput,
    handleAddOrUpdate,
    resetForm
}) {
    const handleClose = () => {
        setShowModal(false);
        resetForm();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAddOrUpdate();
    };

    return (
        <Modal show={showModal} onHide={handleClose} size="lg" centered contentClassName="modal-centered-content">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editing ? "Edit Interview" : "Schedule Informational Interview"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact</Form.Label>
                                <Form.Select
                                    value={formData.contact_id}
                                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select a contact</option>
                                    {contacts.map(contact => (
                                        <option key={contact._id} value={contact._id}>
                                            {contact.name}
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
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="requested">Requested</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_response">No Response</option>
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
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Industry</Form.Label>
                                <Form.Select
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                >
                                    <option value="">Select Industry</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Education">Education</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Design">Design</option>
                                    <option value="Consulting">Consulting</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Other">Other</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row style={{justifyContent:"center"}}>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Request Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.request_date}
                                    onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Scheduled Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.scheduled_date}
                                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row style={{justifyContent:"center"}}>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>End Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Interview Format</Form.Label>
                                <Form.Select
                                    value={formData.interview_format}
                                    onChange={(e) => setFormData({ ...formData, interview_format: e.target.value })}
                                >
                                    <option value="phone">Phone</option>
                                    <option value="video">Video Call</option>
                                    <option value="in_person">In Person</option>
                                    <option value="coffee">Coffee Meeting</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Impact on Job Search</Form.Label>
                                <Form.Select
                                    value={formData.impact_on_job_search}
                                    onChange={(e) => setFormData({ ...formData, impact_on_job_search: e.target.value })}
                                >
                                    <option value="none">None</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Request Template</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.request_template}
                            onChange={(e) => setFormData({ ...formData, request_template: e.target.value })}
                            placeholder="Template for interview request..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Personalized Request</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={formData.personalized_request}
                            onChange={(e) => setFormData({ ...formData, personalized_request: e.target.value })}
                            placeholder="Personalized message to send..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Preparation Framework</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.preparation_framework}
                            onChange={(e) => setFormData({ ...formData, preparation_framework: e.target.value })}
                            placeholder="Research and preparation notes..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Topics to Cover (comma-separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={rawTopicsInput}
                            onChange={(e) => setRawTopicsInput(e.target.value)}
                            onBlur={() => {
                                const topics = rawTopicsInput.split(",").map(t => t.trim()).filter(t => t);
                                setFormData({ ...formData, topics_to_cover: topics });
                            }}
                            placeholder="Career path, company culture, industry trends..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Questions Prepared (comma-separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={rawQuestionsInput}
                            onChange={(e) => setRawQuestionsInput(e.target.value)}
                            onBlur={() => {
                                const questions = rawQuestionsInput.split(",").map(q => q.trim()).filter(q => q);
                                setFormData({ ...formData, questions_prepared: questions });
                            }}
                            placeholder="What skills are most valuable, biggest challenges, career advice..."
                        />
                    </Form.Group>
                    {formData.status === "completed" && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Interview Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.interview_notes}
                                    onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })}
                                    placeholder="Notes from the interview..."
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Key Insights</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.key_insights}
                                    onChange={(e) => setFormData({ ...formData, key_insights: e.target.value })}
                                    placeholder="Key takeaways and insights..."
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Industry Intelligence</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.industry_intelligence}
                                    onChange={(e) => setFormData({ ...formData, industry_intelligence: e.target.value })}
                                    placeholder="Industry-specific information learned..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAddOrUpdate}>
                    {editing ? "Update" : "Schedule"} Interview
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
