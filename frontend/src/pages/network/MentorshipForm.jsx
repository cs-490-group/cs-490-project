import { Modal, Form, Button, Row, Col } from "react-bootstrap";

export default function MentorshipForm({
    showModal,
    setShowModal,
    editing,
    formData,
    setFormData,
    handleAddOrUpdate,
    resetForm,
    contacts
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
                <Modal.Title>{editing ? "Edit Mentorship" : "Add New Mentorship"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Select Contact</Form.Label>
                                <Form.Select
                                    value={formData.contact_id}
                                    onChange={(e) => setFormData({...formData, contact_id: e.target.value})}
                                    required
                                >
                                    <option value="">Choose a contact...</option>
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
                                <Form.Label>Relationship Type</Form.Label>
                                <Form.Select
                                    value={formData.relationship_type}
                                    onChange={(e) => setFormData({...formData, relationship_type: e.target.value})}
                                    required
                                >
                                    <option value="mentor">Mentor</option>
                                    <option value="career_coach">Career Coach</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.end_date || ""}
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value || null})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    aria-label="select status"
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="paused">Paused</option>
                                    <option value="cancelled">Cancelled</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Meeting Frequency</Form.Label>
                                <Form.Select
                                    value={formData.meeting_frequency}
                                    onChange={(e) => setFormData({...formData, meeting_frequency: e.target.value})}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="as_needed">As Needed</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Mentorship Goals</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={Array.isArray(formData.mentorship_goals) ? formData.mentorship_goals.join(', ') : (formData.mentorship_goals || "")}
                            onChange={(e) => {
                                const goalsText = e.target.value;
                                const goalsArray = goalsText ? goalsText.split(',').map(g => g.trim()).filter(g => g) : null;
                                setFormData({...formData, mentorship_goals: goalsArray});
                            }}
                            placeholder="Enter goals separated by commas (e.g., Career growth, Skill development, Networking)"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Mentor Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.mentor_notes || ""}
                            onChange={(e) => setFormData({...formData, mentor_notes: e.target.value || null})}
                            placeholder="Additional notes about this mentorship relationship"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAddOrUpdate}>
                    {editing ? "Update" : "Create"} Mentorship
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
