import { Modal, Form, Button, Row, Col } from "react-bootstrap";

export default function NetworkEventForm({
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
                    {editing ? "Edit Event" : "Add New Event"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Event Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.event_name}
                                    onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Event Type</Form.Label>
                                <Form.Select
                                    value={formData.event_type}
                                    onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                                    style={{ 
                                        color: 'black !important', 
                                        backgroundColor: 'white !important', 
                                        border: '1px solid rgba(0, 0, 0, 0.3) !important'
                                    }}
                                    className="form-select"
                                >
                                    <option value="conference">Conference</option>
                                    <option value="meetup">Meetup</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="webinar">Webinar</option>
                                    <option value="social">Social</option>
                                    <option value="virtual">Virtual</option>
                                    <option value="other">Other</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Event Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.event_date}
                                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Location</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    placeholder="Physical location or leave blank for virtual"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Virtual Link</Form.Label>
                                <Form.Control
                                    type="url"
                                    value={formData.virtual_link}
                                    onChange={(e) => setFormData({...formData, virtual_link: e.target.value})}
                                    placeholder="URL for virtual events"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Industry</Form.Label>
                                <Form.Select
                                    value={formData.industry}
                                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
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
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Cost</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                                    min="0"
                                    step="0.01"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Event description..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Registration Status</Form.Label>
                        <Form.Select
                            value={formData.registration_status}
                            onChange={(e) => setFormData({...formData, registration_status: e.target.value})}
                        >
                            <option value="not_registered">Not Registered</option>
                            <option value="registered">Registered</option>
                            <option value="attended">Attended</option>
                            <option value="cancelled">Cancelled</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Expected Contacts</Form.Label>
                        <Form.Select
                            multiple
                            value={formData.expected_contacts}
                            onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData({...formData, expected_contacts: selectedOptions});
                            }}
                            style={{ height: "120px" }}
                        >
                            {contacts.map(contact => (
                                <option key={contact._id} value={contact._id}>
                                    {contact.name} - {contact.employment?.company || 'No Company'}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Select contacts you expect to meet at this event (hold Ctrl/Cmd to select multiple)
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Pre-Event Preparation</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.pre_event_prep}
                            onChange={(e) => setFormData({...formData, pre_event_prep: e.target.value})}
                            placeholder="Research and preparation notes..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Event Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.event_notes}
                            onChange={(e) => setFormData({...formData, event_notes: e.target.value})}
                            placeholder="Post-event notes and takeaways..."
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAddOrUpdate}>
                    {editing ? "Update" : "Create"} Event
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
