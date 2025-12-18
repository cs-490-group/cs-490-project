import React from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import MentorshipAPI from "../../api/mentorship";
import MentorshipForm from "./MentorshipForm";
import NetworksAPI from "../../api/network";
import { formatLocalDate } from "../../utils/dateUtils";
import posthog from 'posthog-js';

const MentorshipManagement = () => {
    const [mentorships, setMentorships] = React.useState([]);
    const [contacts, setContacts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [viewMode, setViewMode] = React.useState("active"); // active, mentors, mentees, all

    const [formData, setFormData] = React.useState({
        contact_id: "",
        relationship_type: "mentor",
        status: "active",
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        access_level: "limited",
        shared_data_types: null,
        mentorship_goals: null,
        focus_areas: null,
        meeting_frequency: "monthly",
        communication_preferences: null,
        progress_sharing_frequency: "monthly",
        feedback_received: null,
        recommendations_implemented: null,
        mentor_notes: null,
        relationship_rating: null,
        achievements: null
    });

    const [searchTerm, setSearchTerm] = React.useState("");

    const [filterText, setFilterText] = React.useState({
        contact_name: "",
        status: "",
        relationship_type: "",
        meeting_frequency: ""
    });

    const getContactName = (contactId) => {
        const contact = contacts.find(c => c._id === contactId);
        return contact ? contact.name : "Unknown Contact";
    };

    const filterMentorships = (mentorshipsToFilter) => {
        return mentorshipsToFilter.filter(mentorship => {
            const contactName = getContactName(mentorship.contact_id);
            if (filterText.contact_name && !contactName.toLowerCase().includes(filterText.contact_name.toLowerCase())) {
                return false;
            }
            if (filterText.status && mentorship.status !== filterText.status) {
                return false;
            }
            if (filterText.relationship_type && mentorship.relationship_type !== filterText.relationship_type) {
                return false;
            }
            if (filterText.meeting_frequency && mentorship.meeting_frequency !== filterText.meeting_frequency) {
                return false;
            }
            return true;
        });
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
            contact_name: "",
            status: "",
            relationship_type: "",
            meeting_frequency: ""
        });
    };

    React.useEffect(() => {
        fetchMentorships();
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await NetworksAPI.getAll();
            setContacts(response.data || []);
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        }
    };

    const fetchMentorships = async () => {
        try {
            setLoading(true);
            let response;

            switch (viewMode) {
                case "active":
                    response = await MentorshipAPI.getActive();
                    break;
                default:
                    response = await MentorshipAPI.getAll();
            }

            setMentorships(response.data || []);
        } catch (error) {
            console.error("Failed to fetch mentorships:", error);
            setError("Failed to load mentorship data");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchMentorships();
    }, [viewMode]);

    const handleAdd = () => {
        setEditing(false);
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (mentorship) => {
        setEditing(true);
        setFormData({
            _id: mentorship._id,  // Add the ID for updates
            contact_id: mentorship.contact_id || "",
            relationship_type: mentorship.relationship_type || "mentor",
            status: mentorship.status || "active",
            start_date: mentorship.start_date || new Date().toISOString().split('T')[0],
            end_date: mentorship.end_date || null,
            access_level: mentorship.access_level || "limited",
            shared_data_types: mentorship.shared_data_types || null,
            mentorship_goals: mentorship.mentorship_goals || null,
            focus_areas: mentorship.focus_areas || null,
            meeting_frequency: mentorship.meeting_frequency || "monthly",
            communication_preferences: mentorship.communication_preferences || null,
            progress_sharing_frequency: mentorship.progress_sharing_frequency || "monthly",
            feedback_received: mentorship.feedback_received || null,
            recommendations_implemented: mentorship.recommendations_implemented || null,
            mentor_notes: mentorship.mentor_notes || null,
            relationship_rating: mentorship.relationship_rating || null,
            achievements: mentorship.achievements || null
        });
        setShowModal(true);
    };

    const handleDelete = async (mentorship) => {
        if (window.confirm("Are you sure you want to delete this mentorship relationship?")) {
            try {
                await MentorshipAPI.delete(mentorship._id);
                await fetchMentorships();
                setSuccess("Mentorship relationship deleted successfully");
                posthog.capture('mentorship_deleted', { mentorship_id: mentorship._id });
                setTimeout(() => setSuccess(""), 3000);
            } catch (error) {
                console.error("Failed to delete mentorship:", error);
                setError("Failed to delete mentorship relationship");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await MentorshipAPI.update(formData._id, formData);
                setSuccess("Mentorship relationship updated successfully");
            } else {
                await MentorshipAPI.add(formData);
                setSuccess("Mentorship relationship created successfully");
            }

            setShowModal(false);
            resetForm();
            await fetchMentorships();
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error("Failed to save mentorship:", error);
            setError("Failed to save mentorship relationship");
        }
    };

    const resetForm = () => {
        setFormData({
            contact_id: "",
            relationship_type: "mentor",
            status: "active",
            start_date: new Date().toISOString().split('T')[0],
            end_date: null,
            access_level: "limited",
            shared_data_types: null,
            mentorship_goals: null,
            focus_areas: null,
            meeting_frequency: "monthly",
            communication_preferences: null,
            progress_sharing_frequency: "monthly",
            feedback_received: null,
            recommendations_implemented: null,
            mentor_notes: null,
            relationship_rating: null,
            achievements: null
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "success";
            case "completed": return "primary";
            case "paused": return "warning";
            case "cancelled": return "danger";
            default: return "secondary";
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "career": return "primary";
            case "skill": return "info";
            case "leadership": return "warning";
            case "academic": return "success";
            default: return "secondary";
        }
    };

    if (loading) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading mentorship relationships...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <h1 className="text-center text-white fw-bold mb-5 display-4">
                Mentorship Management
            </h1>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
            {success && <Alert variant="success" className="mb-3">{success}</Alert>}

            <Row className="justify-content-center g-2">
                <Col xs="auto">
                    <Button onClick={handleAdd}>
                        + Add Mentorship
                    </Button>
                </Col>
                <Col xs="auto">
                    <Button
                        variant={viewMode === "active" ? "primary" : "secondary"}
                        onClick={() => setViewMode("active")}
                    >
                        Active
                    </Button>
                </Col>
                <Col xs="auto">
                    <Button
                        variant={viewMode === "all" ? "primary" : "secondary"}
                        onClick={() => setViewMode("all")}
                    >
                        All
                    </Button>
                </Col>
            </Row>

            <Row className="py-4">
                <Col xs={12} className="mb-4">
                    <div className="filter-section">
                        <h2 className="text-white mb-3">Filter Mentorships</h2>
                        <div className="filter-controls">
                            <div className="filter-group">
                                <input
                                    type="text"
                                    placeholder="Search by contact name..."
                                    name="contact_name"
                                    value={filterText.contact_name}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                            </div>
                            <div className="filter-group">
                                <Form.Select
                                    name="status"
                                    value={filterText.status}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                    aria-label="Filter by Status"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="paused">Paused</option>
                                    <option value="cancelled">Cancelled</option>
                                </Form.Select>
                            </div>
                            <div className="filter-group">
                                <Form.Select
                                    name="relationship_type"
                                    value={filterText.relationship_type}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                    aria-label="Filter by Relationship Type"
                                >
                                    <option value="">All Types</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="career_coach">Career Coach</option>
                                </Form.Select>
                            </div>
                            <div className="filter-group">
                                <Form.Select
                                    name="meeting_frequency"
                                    value={filterText.meeting_frequency}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                    aria-label="Filter by Meeting Frequency"
                                >
                                    <option value="">All Frequencies</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="as_needed">As Needed</option>
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
                <Col xs={12}>
                    {filterMentorships(mentorships).length === 0 ? (
                        <p className="text-white text-center">
                            {loading ? "Loading..." : (Object.values(filterText).some(val => val !== "")
                                ? "No mentorships match your search."
                                : "No mentorship relationships found.")}
                        </p>
                    ) : (
                        <div className="contact-display">
                            {filterMentorships(mentorships).map(mentorship => (
                                <Card key={mentorship._id} className="contact-card compact-contact">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <Card.Title as="h5" className="mb-1">
                                                    {getContactName(mentorship.contact_id)} - {mentorship.relationship_type || "Relationship"}
                                                </Card.Title>
                                                <Card.Subtitle className="text-white mb-2">
                                                    {mentorship.start_date && formatLocalDate(mentorship.start_date)}
                                                    {mentorship.end_date && ` - ${formatLocalDate(mentorship.end_date)}`}
                                                </Card.Subtitle>
                                            </div>
                                            <div>
                                                <Badge bg={getStatusColor(mentorship.status)} className="me-2">
                                                    {mentorship.status}
                                                </Badge>
                                                <Badge bg="info" className="me-2">
                                                    {mentorship.relationship_type}
                                                </Badge>
                                                <Badge bg="secondary">
                                                    {mentorship.meeting_frequency}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="contact-details">
                                            {mentorship.access_level && (
                                                <div className="contact-info-row">
                                                    <strong>Access Level:</strong> {mentorship.access_level}
                                                </div>
                                            )}

                                            {mentorship.mentorship_goals && mentorship.mentorship_goals.length > 0 && (
                                                <div className="contact-info-row">
                                                    <strong>Goals:</strong>
                                                    <div className="mt-1">
                                                        {Array.isArray(mentorship.mentorship_goals)
                                                            ? mentorship.mentorship_goals.join(", ")
                                                            : mentorship.mentorship_goals}
                                                    </div>
                                                </div>
                                            )}

                                            {mentorship.focus_areas && mentorship.focus_areas.length > 0 && (
                                                <div className="contact-info-row">
                                                    <strong>Focus Areas:</strong>
                                                    <div className="mt-1">
                                                        {Array.isArray(mentorship.focus_areas)
                                                            ? mentorship.focus_areas.join(", ")
                                                            : mentorship.focus_areas}
                                                    </div>
                                                </div>
                                            )}

                                            {mentorship.communication_preferences && mentorship.communication_preferences.length > 0 && (
                                                <div className="contact-info-row">
                                                    <strong>Communication:</strong>
                                                    <div className="mt-1">
                                                        {Array.isArray(mentorship.communication_preferences)
                                                            ? mentorship.communication_preferences.join(", ")
                                                            : mentorship.communication_preferences}
                                                    </div>
                                                </div>
                                            )}

                                            {mentorship.progress_sharing_frequency && (
                                                <div className="contact-info-row">
                                                    <strong>Progress Updates:</strong> {mentorship.progress_sharing_frequency}
                                                </div>
                                            )}

                                            {mentorship.mentor_notes && (
                                                <div className="contact-info-row">
                                                    <strong>Notes:</strong>
                                                    <div className="mt-1 text-muted">
                                                        {mentorship.mentor_notes.length > 150
                                                            ? `${mentorship.mentor_notes.substring(0, 150)}...`
                                                            : mentorship.mentor_notes}
                                                    </div>
                                                </div>
                                            )}

                                            {mentorship.relationship_rating && (
                                                <div className="contact-info-row">
                                                    <strong>Rating:</strong>
                                                    <Badge bg="warning" className="ms-1">
                                                        {mentorship.relationship_rating}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-3 border-top">
                                            <div className="d-flex gap-2">
                                                <Button variant="outline-primary" size="sm" onClick={() => handleEdit(mentorship)}>
                                                    Edit
                                                </Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(mentorship)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Col>
            </Row>

            <MentorshipForm
                showModal={showModal}
                setShowModal={setShowModal}
                editing={editing}
                formData={formData}
                setFormData={setFormData}
                handleAddOrUpdate={handleSubmit}
                resetForm={resetForm}
                contacts={contacts}
            />
        </Container>
    );
};

export default MentorshipManagement;
