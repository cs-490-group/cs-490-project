import { Modal, Form, Button, Row, Col } from "react-bootstrap";

export default function ContactForm({
    showModal,
    setShowModal,
    editing,
    formData,
    setFormData,
    handleAddOrUpdate
}) {
    const handleClose = () => {
        setShowModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAddOrUpdate();
    };

    return (
        <Modal show={showModal} onHide={handleClose} size="lg" centered contentClassName="modal-centered-content">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editing ? "Edit Contact" : "Add New Contact"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Basic Information Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Basic Information</h6>
                        <Row>
                            <Col md={12}>
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
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Employment Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Employment</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Position</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.employment.position}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            employment: {...formData.employment, position: e.target.value}
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.employment.company}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            employment: {...formData.employment, company: e.target.value}
                                        })}
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
                                        value={formData.employment.location}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            employment: {...formData.employment, location: e.target.value}
                                        })}
                                    />
                                </Form.Group>
                            </Col>
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
                        </Row>
                    </div>

                    {/* Relationship Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Relationship</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Relationship Type</Form.Label>
                                    <Form.Select
                                        value={formData.relationship_type}
                                        onChange={(e) => setFormData({...formData, relationship_type: e.target.value})}
                                    >
                                        <option value="colleague">Colleague</option>
                                        <option value="mentor">Mentor</option>
                                        <option value="mentee">Mentee</option>
                                        <option value="friend">Friend</option>
                                        <option value="client">Client</option>
                                        <option value="recruiter">Recruiter</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Relationship Strength</Form.Label>
                                    <Form.Select
                                        value={formData.relationship_strength}
                                        onChange={(e) => setFormData({...formData, relationship_strength: e.target.value})}
                                    >
                                        <option value="strong">Strong</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="weak">Weak</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Reminder Frequency</Form.Label>
                                    <Form.Select
                                        value={formData.reminder_frequency}
                                        onChange={(e) => setFormData({...formData, reminder_frequency: e.target.value})}
                                    >
                                        <option value="none">None</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Contact Details Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Contact Details</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>LinkedIn</Form.Label>
                                    <Form.Control
                                        type="url"
                                        value={formData.websites.linkedin}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            websites: {...formData.websites, linkedin: e.target.value}
                                        })}
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Other Website</Form.Label>
                                    <Form.Control
                                        type="url"
                                        value={formData.websites.other}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            websites: {...formData.websites, other: e.target.value}
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Work Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone_numbers.work}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            phone_numbers: {...formData.phone_numbers, work: e.target.value}
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mobile Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone_numbers.mobile}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            phone_numbers: {...formData.phone_numbers, mobile: e.target.value}
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Home Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone_numbers.home}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            phone_numbers: {...formData.phone_numbers, home: e.target.value}
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Primary Phone</Form.Label>
                                    <Form.Select
                                        value={formData.phone_numbers.primary || 'home'}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            phone_numbers: {...formData.phone_numbers, primary: e.target.value}
                                        })}
                                    >
                                        <option value="home">Home</option>
                                        <option value="work">Work</option>
                                        <option value="mobile">Mobile</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Next Reminder Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.next_reminder_date}
                                        onChange={(e) => setFormData({...formData, next_reminder_date: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Interests Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Interests</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Professional Interests</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.professional_interests}
                                        onChange={(e) => setFormData({...formData, professional_interests: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Personal Interests</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.personal_interests}
                                        onChange={(e) => setFormData({...formData, personal_interests: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Notes Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Notes</h6>
                        <Form.Group className="mb-3">
                            <Form.Label>Personal Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="Personal notes about this contact..."
                            />
                        </Form.Group>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    {editing ? "Update" : "Add"} Contact
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
