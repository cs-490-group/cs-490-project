import { useState, useEffect } from "react";
import { Container, Card, Button, Alert, Spinner, Row, Col, Modal, Form, Badge } from "react-bootstrap";
import NetworksAPI from "../../api/network";
import "./network.css";

export default function LinkedInIntegration() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);
    const [filterText, setFilterText] = useState({
        name: "",
        company: "",
        industry: "",
        connection_level: ""
    });
    const [formData, setFormData] = useState({
        name: "",
        linkedin_url: "",
        company: "",
        position: "",
        industry: "",
        connection_level: "first",
        last_interaction: "",
        notes: "",
        mutual_connections: [],
        skills: [],
        profile_summary: ""
    });

    useEffect(() => {
        fetchLinkedInContacts();
    }, []);

    const fetchLinkedInContacts = async () => {
        try {
            // For now, we'll use the existing contacts API
            // In the future, this would integrate with LinkedIn API
            const res = await NetworksAPI.getAll();
            const linkedInContacts = (res.data || []).filter(contact => 
                contact.websites?.linkedin || contact.linkedin
            );
            setContacts(linkedInContacts);
        } catch (error) {
            console.error("Failed to fetch LinkedIn contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterContacts = (contactsToFilter) => {
        return contactsToFilter.filter(contact => {
            if (filterText.name && !contact.name?.toLowerCase().includes(filterText.name.toLowerCase())) {
                return false;
            }
            if (filterText.company && !contact.employment?.company?.toLowerCase().includes(filterText.company.toLowerCase())) {
                return false;
            }
            if (filterText.industry && !contact.industry?.toLowerCase().includes(filterText.industry.toLowerCase())) {
                return false;
            }
            if (filterText.connection_level && contact.connection_level !== filterText.connection_level) {
                return false;
            }
            return true;
        });
    };

    const getConnectionLevelColor = (level) => {
        switch (level) {
            case "first": return "success";
            case "second": return "info";
            case "third": return "warning";
            default: return "secondary";
        }
    };

    const handleAddOrUpdate = async () => {
        try {
            // For now, this would add/update a contact with LinkedIn information
            // In the future, this would integrate with LinkedIn API
            const contactData = {
                name: formData.name,
                websites: {
                    linkedin: formData.linkedin_url
                },
                employment: {
                    company: formData.company,
                    position: formData.position
                },
                industry: formData.industry,
                notes: formData.notes,
                professional_interests: formData.skills.join(", "),
                linkedin_data: {
                    connection_level: formData.connection_level,
                    last_interaction: formData.last_interaction,
                    mutual_connections: formData.mutual_connections,
                    profile_summary: formData.profile_summary
                }
            };

            if (editing && editingContactId) {
                await NetworksAPI.update(editingContactId, contactData);
            } else {
                await NetworksAPI.add(contactData);
            }
            await fetchLinkedInContacts();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving LinkedIn contact:", error);
        }
    };

    const handleEdit = (contact) => {
        setEditing(true);
        setEditingContactId(contact._id);
        setFormData({
            name: contact.name || "",
            linkedin_url: contact.websites?.linkedin || contact.linkedin || "",
            company: contact.employment?.company || "",
            position: contact.employment?.position || "",
            industry: contact.industry || "",
            connection_level: contact.linkedin_data?.connection_level || "first",
            last_interaction: contact.linkedin_data?.last_interaction || "",
            notes: contact.notes || "",
            mutual_connections: contact.linkedin_data?.mutual_connections || [],
            skills: contact.professional_interests?.split(", ").filter(s => s) || [],
            profile_summary: contact.linkedin_data?.profile_summary || ""
        });
        setShowModal(true);
    };

    const handleDelete = async (contact) => {
        if (window.confirm("Are you sure you want to remove this LinkedIn contact?")) {
            try {
                await NetworksAPI.delete(contact._id);
                await fetchLinkedInContacts();
            } catch (error) {
                console.error("Failed to delete LinkedIn contact:", error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            linkedin_url: "",
            company: "",
            position: "",
            industry: "",
            connection_level: "first",
            last_interaction: "",
            notes: "",
            mutual_connections: [],
            skills: [],
            profile_summary: ""
        });
        setEditing(false);
        setEditingContactId(null);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilterText(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilterText({
            name: "",
            company: "",
            industry: "",
            connection_level: ""
        });
    };

    const handleLinkedInConnect = () => {
        // Placeholder for LinkedIn OAuth integration
        alert("LinkedIn OAuth integration coming soon! For now, you can manually add LinkedIn contacts.");
        setShowModal(true);
    };

    if (loading) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading LinkedIn contacts...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <h1 className="text-center text-white fw-bold mb-5 display-4">
                LinkedIn Profile Integration
            </h1>

            <Row>
                <Col xs={12} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <Button onClick={handleLinkedInConnect} className="linkedin-connect-btn">
                            🔗 Connect LinkedIn Account
                        </Button>
                        <Button onClick={() => { setShowModal(true); resetForm(); }}>
                            + Add LinkedIn Contact
                        </Button>
                    </div>
                </Col>
            </Row>

            <Alert variant="info" className="mb-4">
                <Alert.Heading>LinkedIn Integration Status</Alert.Heading>
                <p>
                    Currently, you can manually add LinkedIn contacts. Full OAuth integration with automatic profile sync is coming soon!
                </p>
                <hr />
                <p className="mb-0">
                    Features planned: Profile import, connection sync, message integration, and automated relationship tracking.
                </p>
            </Alert>

            <Row className="py-4">
                <Col xs={12} className="mb-4">
                    <div className="filter-section">
                        <h5 className="text-white mb-3">Filter LinkedIn Contacts</h5>
                        <div className="filter-controls">
                            <div className="filter-group">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    name="name"
                                    value={filterText.name}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                            </div>
                            <div className="filter-group">
                                <input
                                    type="text"
                                    placeholder="Search by company..."
                                    name="company"
                                    value={filterText.company}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                            </div>
                            <div className="filter-group">
                                <Form.Select
                                    name="industry"
                                    value={filterText.industry}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                >
                                    <option value="">All Industries</option>
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
                            </div>
                            <div className="filter-group">
                                <Form.Select
                                    name="connection_level"
                                    value={filterText.connection_level}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                >
                                    <option value="">All Levels</option>
                                    <option value="first">1st Degree</option>
                                    <option value="second">2nd Degree</option>
                                    <option value="third">3rd Degree</option>
                                </Form.Select>
                            </div>
                            {Object.values(filterText).some(val => val !== "") && (
                                <Button className="filter-clear-btn" onClick={clearFilters}>Clear Filters</Button>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            <Row className="py-4">
                <Col>
                    {filterContacts(contacts).length === 0 ? (
                        <p className="text-white">
                            {Object.values(filterText).some(val => val !== "") 
                                ? "No LinkedIn contacts match your search." 
                                : "No LinkedIn contacts found. Connect your LinkedIn account or add contacts manually!"}
                        </p>
                    ) : (
                        <div className="contact-display">
                            {filterContacts(contacts).map(contact => (
                                <Card key={contact._id} className="contact-card linkedin-card">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Card.Title as="h3">{contact.name}</Card.Title>
                                            <Badge bg={getConnectionLevelColor(contact.linkedin_data?.connection_level)}>
                                                {contact.linkedin_data?.connection_level || "1st"} Degree
                                            </Badge>
                                        </div>

                                        {contact.employment?.company && (
                                            <Card.Subtitle as="h5" className="mb-3">
                                                {contact.employment.position} at {contact.employment.company}
                                            </Card.Subtitle>
                                        )}

                                        <div className="contact-section">
                                            <h6 className="section-title">LinkedIn Profile</h6>
                                            {contact.websites?.linkedin || contact.linkedin ? (
                                                <a 
                                                    href={contact.websites?.linkedin || contact.linkedin} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-white"
                                                >
                                                    View LinkedIn Profile →
                                                </a>
                                            ) : (
                                                <p className="mb-0">No LinkedIn URL linked</p>
                                            )}
                                        </div>

                                        {contact.industry && (
                                            <div className="contact-section">
                                                <h6 className="section-title">Industry</h6>
                                                <p className="mb-0">{contact.industry}</p>
                                            </div>
                                        )}

                                        {contact.linkedin_data?.last_interaction && (
                                            <div className="contact-section">
                                                <h6 className="section-title">Last Interaction</h6>
                                                <p className="mb-0">{contact.linkedin_data.last_interaction}</p>
                                            </div>
                                        )}

                                        {contact.linkedin_data?.mutual_connections && contact.linkedin_data.mutual_connections.length > 0 && (
                                            <div className="contact-section">
                                                <h6 className="section-title">Mutual Connections</h6>
                                                <p className="mb-0">{contact.linkedin_data.mutual_connections.length} mutual connections</p>
                                            </div>
                                        )}

                                        {contact.professional_interests && (
                                            <div className="contact-section">
                                                <h6 className="section-title">Skills</h6>
                                                <div className="mt-1">
                                                    {contact.professional_interests.split(", ").map((skill, i) => (
                                                        <Badge key={i} bg="light" text="dark" className="me-1">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {contact.linkedin_data?.profile_summary && (
                                            <div className="contact-section">
                                                <h6 className="section-title">Profile Summary</h6>
                                                <p className="mb-0">{contact.linkedin_data.profile_summary.substring(0, 150)}...</p>
                                            </div>
                                        )}

                                        {contact.notes && (
                                            <div className="contact-section">
                                                <h6 className="section-title">Notes</h6>
                                                <p className="mb-0">{contact.notes}</p>
                                            </div>
                                        )}

                                        <div className="card-actions">
                                            <Button className="action-button delete-btn" onClick={() => handleDelete(contact._id)}>
                                                🗑️ Delete
                                            </Button>
                                            <Button className="action-button edit-btn" onClick={() => handleEdit(contact)}>
                                                ✏️ Edit
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editing ? "Edit LinkedIn Contact" : "Add LinkedIn Contact"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
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
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddOrUpdate}>
                        {editing ? "Update" : "Add"} LinkedIn Contact
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
