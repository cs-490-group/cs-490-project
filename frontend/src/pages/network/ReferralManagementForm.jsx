import { Modal, Form, Button, Row, Col } from "react-bootstrap";

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
                    {editing ? "Edit Referral Request" : "New Referral Request"}
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
                                    onChange={(e) => setFormData({...formData, contact_id: e.target.value})}
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
                                />
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
                                />
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
        </Modal>
    );
}
