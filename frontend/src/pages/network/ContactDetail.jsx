import { useState, useEffect } from "react";
import { Container, Card, Button, Badge, Spinner, Alert, Row, Col, Modal, Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NetworksAPI from "../../api/network";
import { formatLocalDate } from "../../utils/dateUtils";
import "./network.css";

export default function ContactDetail() {
    const { contactId } = useParams();
    const navigate = useNavigate();
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showInteractionModal, setShowInteractionModal] = useState(false);
    const [editingInteraction, setEditingInteraction] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

    const [interactionFormData, setInteractionFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: "meeting",
        notes: ""
    });

    useEffect(() => {
        fetchContact();
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
    }, [contactId]);

    const fetchContact = async () => {
        try {
            const response = await NetworksAPI.get(contactId);
            setContact(response.data.contact);

            // Fetch avatar
            try {
                const avatarResponse = await NetworksAPI.getAvatar(contactId);
                const url = URL.createObjectURL(avatarResponse.data);
                setAvatarUrl(url);
            } catch (avatarError) {
                setAvatarUrl("./default.png");
            }
        } catch (error) {
            console.error("Failed to fetch contact:", error);
            setError("Failed to load contact details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddInteraction = () => {
        setEditingInteraction(null);
        setInteractionFormData({
            date: new Date().toISOString().split('T')[0],
            type: "meeting",
            notes: ""
        });
        setShowInteractionModal(true);
    };

    const handleEditInteraction = (interaction, index) => {
        setEditingInteraction({ ...interaction, index });
        setInteractionFormData({
            date: interaction.date || new Date().toISOString().split('T')[0],
            type: interaction.type || "meeting",
            notes: interaction.notes || ""
        });
        setShowInteractionModal(true);
    };

    const handleSaveInteraction = () => {
        const updatedContact = { ...contact };
        const interactionData = {
            date: interactionFormData.date,
            type: interactionFormData.type,
            notes: interactionFormData.notes
        };

        if (editingInteraction !== null) {
            // Update existing interaction
            updatedContact.interaction_history = updatedContact.interaction_history || [];
            updatedContact.interaction_history[editingInteraction.index] = interactionData;
        } else {
            // Add new interaction
            updatedContact.interaction_history = updatedContact.interaction_history || [];
            updatedContact.interaction_history.push(interactionData);
        }

        // Update last_interaction_date
        updatedContact.last_interaction_date = interactionData.date;

        // Sort interactions by date (most recent first)
        updatedContact.interaction_history.sort((a, b) => new Date(b.date) - new Date(a.date));

        setContact(updatedContact);
        setShowInteractionModal(false);

        // Save to backend
        saveContact(updatedContact);
    };

    const handleDeleteInteraction = (index) => {
        if (window.confirm("Are you sure you want to delete this interaction?")) {
            const updatedContact = { ...contact };
            updatedContact.interaction_history = updatedContact.interaction_history || [];
            updatedContact.interaction_history.splice(index, 1);

            // Update last_interaction_date if there are still interactions
            if (updatedContact.interaction_history.length > 0) {
                updatedContact.last_interaction_date = updatedContact.interaction_history[0].date;
            } else {
                updatedContact.last_interaction_date = null;
            }

            setContact(updatedContact);
            saveContact(updatedContact);
        }
    };

    const saveContact = async (contactData) => {
        try {
            await NetworksAPI.update(contactId, contactData);
        } catch (error) {
            console.error("Failed to save contact:", error);
            setError("Failed to save changes");
        }
    };

    const getInteractionTypeColor = (type) => {
        switch (type) {
            case "call": return "primary";
            case "email": return "info";
            case "meeting": return "success";
            case "message": return "warning";
            case "event": return "danger";
            case "other": return "secondary";
            default: return "light";
        }
    };

    const getRelationshipColor = (type) => {
        switch (type) {
            case "colleague": return "primary";
            case "mentor": return "success";
            case "mentee": return "info";
            case "friend": return "secondary";
            case "client": return "warning";
            case "recruiter": return "danger";
            default: return "light";
        }
    };

    const getStrengthColor = (strength) => {
        switch (strength) {
            case "strong": return "success";
            case "moderate": return "warning";
            case "weak": return "secondary";
            default: return "light";
        }
    };

    if (loading) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading contact details...</p>
                </div>
            </Container>
        );
    }

    if (!contact) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <Alert variant="danger">Contact not found</Alert>
                <Button onClick={() => navigate("/network")}>Back to Network</Button>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <Row className="mb-4">
                <Col>
                    <Button variant="outline-light" onClick={() => navigate("/network")}>
                        ← Back to Network
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <div style={{width:"fit-content", margin:"0 auto 0 auto"}}>
            <Row>
                <Col>
                    {/* Contact Card */}
                    <Card className="contact-card mb-4">
                        <Card.Body>
                            <div className="d-flex flex-column align-items-center text-center mb-3">
                                <img
                                    src={avatarUrl || "./default.png"}
                                    alt={contact.name}
                                    className="contact-avatar mb-3"
                                />
                                <Card.Title as="h3">{contact.name}</Card.Title>
                                <Card.Subtitle className="mb-2">{contact.email}</Card.Subtitle>

                                {/* Relationship Badges */}
                                <div className="d-flex gap-2 mb-3 flex-wrap justify-content-center">
                                    {contact.relationship_type && (
                                        <Badge bg={getRelationshipColor(contact.relationship_type)}>
                                            {contact.relationship_type}
                                        </Badge>
                                    )}
                                    {contact.relationship_strength && (
                                        <Badge bg={getStrengthColor(contact.relationship_strength)}>
                                            {contact.relationship_strength}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Employment */}
                            {contact.employment && (
                                <div className="contact-section">
                                    <div className="section-header">
                                        <small className="section-title">Employment</small>
                                    </div>
                                    <div className="section-content">
                                        {contact.employment.position && (
                                            <div className="contact-info-row">
                                                <strong>Position:</strong> {contact.employment.position}
                                            </div>
                                        )}
                                        {contact.employment.company && (
                                            <div className="contact-info-row">
                                                <strong>Company:</strong> {contact.employment.company}
                                            </div>
                                        )}
                                        {contact.employment.location && (
                                            <div className="contact-info-row">
                                                <strong>Location:</strong> {contact.employment.location}
                                            </div>
                                        )}
                                        {contact.industry && (
                                            <div className="contact-info-row">
                                                <strong>Industry:</strong> {contact.industry}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {contact.education && (
                                <div className="contact-section">
                                    <div className="section-header">
                                        <small className="section-title">Education</small>
                                    </div>
                                    <div className="section-content">
                                        {contact.education.institution_name && (
                                            <div className="contact-info-row">
                                                <strong>Institution:</strong> {contact.education.institution_name}
                                            </div>
                                        )}
                                        {contact.education.degree && (
                                            <div className="contact-info-row">
                                                <strong>Degree:</strong> {contact.education.degree}
                                            </div>
                                        )}
                                        {contact.education.field_of_study && (
                                            <div className="contact-info-row">
                                                <strong>Field:</strong> {contact.education.field_of_study}
                                            </div>
                                        )}
                                        {contact.education.graduation_date && (
                                            <div className="contact-info-row">
                                                <strong>Graduated:</strong> {contact.education.graduation_date}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Contact Details */}
                            <div className="contact-section">
                                <div className="section-header">
                                    <small className="section-title">Contact Details</small>
                                </div>
                                <div className="section-content">
                                    {contact.phone_numbers?.primary && (
                                        <div className="contact-info-row">
                                            <strong>Phone:</strong> {contact.phone_numbers.primary}
                                        </div>
                                    )}
                                    {contact.websites?.linkedin && (
                                        <div className="contact-info-row">
                                            <strong>LinkedIn: </strong>
                                            <a href={contact.websites.linkedin.startsWith('http') ? contact.websites.linkedin : `https://${contact.websites.linkedin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="external-link">
                                                LinkedIn Profile
                                            </a>
                                        </div>
                                    )}
                                    {contact.websites?.other && (
                                        <div className="contact-info-row">
                                            <strong>Website:</strong>
                                            <a href={contact.websites.other.startsWith('http') ? contact.websites.other : `https://${contact.websites.other}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="external-link">
                                                Visit Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Interests */}
                            {(contact.professional_interests || contact.personal_interests) && (
                                <div className="contact-section">
                                    <div className="section-header">
                                        <small className="section-title">Interests</small>
                                    </div>
                                    <div className="section-content">
                                        {contact.professional_interests && (
                                            <div className="contact-info-row">
                                                <strong>Professional:</strong> {contact.professional_interests}
                                            </div>
                                        )}
                                        {contact.personal_interests && (
                                            <div className="contact-info-row">
                                                <strong>Personal:</strong> {contact.personal_interests}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {contact.notes && (
                                <div className="contact-section">
                                    <div className="section-header">
                                        <small className="section-title">Notes</small>
                                    </div>
                                    <div className="section-content">
                                        <div className="contact-info-row">
                                            {contact.notes}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Maintenance */}
                            {(contact.reminder_frequency || contact.next_reminder_date) && (
                                <div className="contact-section">
                                    <div className="section-header">
                                        <small className="section-title">Relationship Maintenance</small>
                                    </div>
                                    <div className="section-content">
                                        {contact.reminder_frequency && (
                                            <div className="contact-info-row">
                                                <strong>Reminder Frequency:</strong> {contact.reminder_frequency}
                                            </div>
                                        )}
                                        {contact.next_reminder_date && (
                                            <div className="contact-info-row">
                                                <strong>Next Reminder:</strong> {formatLocalDate(contact.next_reminder_date)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col className="d-flex">
                    {/* Interaction History */}
                    <Card style={{ width: "50rem"}}>
                        <Card.Body >
                            <div className="mb-4">
                                <Row>
                                    <Col>
                                        <Card.Title as="h4">Interaction History</Card.Title>
                                    </Col>
                                    <Col>
                                        <Button style={{ width: "fit-content" }} onClick={handleAddInteraction}>
                                            + Add Interaction
                                        </Button>
                                    </Col>  
                                </Row>
                            </div>

                            {contact.last_interaction_date && (
                                <div className="mb-3">
                                    <Badge bg="info">
                                        Last Interaction: {formatLocalDate(contact.last_interaction_date)}
                                    </Badge>
                                </div>
                            )}

                            {!contact.interaction_history || contact.interaction_history.length === 0 ? (
                                <p className="text-muted">No interactions recorded yet.</p>
                            ) : (
                                <div className="timeline-container" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                                    {contact.interaction_history.map((interaction, index) => (
                                        <div key={index} className="timeline-item">
                                            <div className="timeline-marker">
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-date" style={{ color: "black" }}>
                                                    {formatLocalDate(interaction.date)}
                                                </div>
                                            </div>
                                            <div className="timeline-card">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <Badge bg={getInteractionTypeColor(interaction.type)}>
                                                        {interaction.type}
                                                    </Badge>
                                                    <div>
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleEditInteraction(interaction, index)}>
                                                            Edit
                                                        </Button>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteInteraction(index)}>
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                                {interaction.notes && (
                                                    <p className="mb-0">{interaction.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            </div>

            {/* Interaction Modal */}
            <Modal show={showInteractionModal} onHide={() => setShowInteractionModal(false)} centered contentClassName="modal-centered-content">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingInteraction ? "Edit Interaction" : "Add Interaction"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={interactionFormData.date}
                                onChange={(e) => setInteractionFormData({ ...interactionFormData, date: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                value={interactionFormData.type}
                                onChange={(e) => setInteractionFormData({ ...interactionFormData, type: e.target.value })}
                            >
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="meeting">Meeting</option>
                                <option value="message">Message</option>
                                <option value="event">Event</option>
                                <option value="other">Other</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={interactionFormData.notes}
                                onChange={(e) => setInteractionFormData({ ...interactionFormData, notes: e.target.value })}
                                placeholder="Interaction details..."
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowInteractionModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveInteraction}>
                        {editingInteraction ? "Update" : "Add"} Interaction
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}