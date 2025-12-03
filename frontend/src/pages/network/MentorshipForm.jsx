import { Modal, Form, Button, Row, Col } from "react-bootstrap";

export default function MentorshipForm({
    showModal,
    setShowModal,
    editing,
    formData,
    setFormData,
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
                <Modal.Title>{editing ? "Edit Mentorship" : "Add New Mentorship"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mentor ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.mentor_id}
                                    onChange={(e) => setFormData({...formData, mentor_id: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mentee ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.mentee_id}
                                    onChange={(e) => setFormData({...formData, mentee_id: e.target.value})}
                                    required
                                />
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
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="paused">Paused</option>
                                    <option value="cancelled">Cancelled</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mentorship Type</Form.Label>
                                <Form.Select
                                    value={formData.mentorship_type}
                                    onChange={(e) => setFormData({...formData, mentorship_type: e.target.value})}
                                >
                                    <option value="career">Career</option>
                                    <option value="skill">Skill Development</option>
                                    <option value="leadership">Leadership</option>
                                    <option value="academic">Academic</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Meeting Frequency</Form.Label>
                                <Form.Select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Meeting Format</Form.Label>
                                <Form.Select
                                    value={formData.meeting_format}
                                    onChange={(e) => setFormData({...formData, meeting_format: e.target.value})}
                                >
                                    <option value="virtual">Virtual</option>
                                    <option value="in-person">In-person</option>
                                    <option value="hybrid">Hybrid</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Goals</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.goals}
                            onChange={(e) => setFormData({...formData, goals: e.target.value})}
                            placeholder="What are the goals for this mentorship relationship?"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
