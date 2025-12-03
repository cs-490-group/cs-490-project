import { Modal, Form, Button, Row, Col } from "react-bootstrap";

export default function LinkedInIntegrationForm({
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
                <Modal.Title>
                    {editing ? "Edit LinkedIn Contact" : "Add LinkedIn Contact"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Connection Level</Form.Label>
                                <Form.Select
                                    value={formData.connection_level}
                                    onChange={(e) => setFormData({...formData, connection_level: e.target.value})}
                                >
                                    <option value="first">1st Degree</option>
                                    <option value="second">2nd Degree</option>
                                    <option value="third">3rd Degree</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>LinkedIn URL</Form.Label>
                        <Form.Control
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                            placeholder="https://linkedin.com/in/username"
                        />
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Company</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
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
                                <Form.Label>Last Interaction</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.last_interaction}
                                    onChange={(e) => setFormData({...formData, last_interaction: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Skills (comma-separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.skills.join(", ")}
                            onChange={(e) => setFormData({...formData, skills: e.target.value.split(",").map(s => s.trim()).filter(s => s)})}
                            placeholder="React, JavaScript, Project Management..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Profile Summary</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.profile_summary}
                            onChange={(e) => setFormData({...formData, profile_summary: e.target.value})}
                            placeholder="Brief summary from LinkedIn profile..."
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Personal notes about this connection..."
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAddOrUpdate}>
                    {editing ? "Update" : "Add"} LinkedIn Contact
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
