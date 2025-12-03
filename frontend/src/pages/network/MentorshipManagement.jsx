import React from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import MentorshipAPI from "../../api/mentorship";
import MentorshipForm from "./MentorshipForm";

const MentorshipManagement = () => {
    const [mentorships, setMentorships] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [viewMode, setViewMode] = React.useState("active"); // active, mentors, mentees, all

    const [formData, setFormData] = React.useState({
        mentor_id: "",
        mentee_id: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        status: "active",
        mentorship_type: "career",
        goals: "",
        frequency: "weekly",
        meeting_format: "virtual",
        notes: ""
    });

    React.useEffect(() => {
        fetchMentorships();
    }, []);

    const fetchMentorships = async () => {
        try {
            setLoading(true);
            let response;
            
            switch(viewMode) {
                case "active":
                    response = await MentorshipAPI.getActive();
                    break;
                case "mentors":
                    response = await MentorshipAPI.getMentors();
                    break;
                case "mentees":
                    response = await MentorshipAPI.getMentees();
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
            mentor_id: mentorship.mentor_id || "",
            mentee_id: mentorship.mentee_id || "",
            start_date: mentorship.start_date || new Date().toISOString().split('T')[0],
            end_date: mentorship.end_date || "",
            status: mentorship.status || "active",
            mentorship_type: mentorship.mentorship_type || "career",
            goals: mentorship.goals || "",
            frequency: mentorship.frequency || "weekly",
            meeting_format: mentorship.meeting_format || "virtual",
            notes: mentorship.notes || ""
        });
        setShowModal(true);
    };

    const handleDelete = async (mentorship) => {
        if (window.confirm("Are you sure you want to delete this mentorship relationship?")) {
            try {
                await MentorshipAPI.delete(mentorship._id);
                await fetchMentorships();
                setSuccess("Mentorship relationship deleted successfully");
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
            mentor_id: "",
            mentee_id: "",
            start_date: new Date().toISOString().split('T')[0],
            end_date: "",
            status: "active",
            mentorship_type: "career",
            goals: "",
            frequency: "weekly",
            meeting_format: "virtual",
            notes: ""
        });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "active": return "success";
            case "completed": return "primary";
            case "paused": return "warning";
            case "cancelled": return "danger";
            default: return "secondary";
        }
    };

    const getTypeColor = (type) => {
        switch(type) {
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

            <Row>
                <Col xs={12} className="mb-4">
                    <div className="d-flex justify-content-center align-items-center gap-3">
                        <Button onClick={handleAdd}>
                            + Add Mentorship
                        </Button>
                        <Button 
                            variant={viewMode === "active" ? "primary" : "secondary"}
                            onClick={() => setViewMode("active")}
                        >
                            Active
                        </Button>
                        <Button 
                            variant={viewMode === "mentors" ? "primary" : "secondary"}
                            onClick={() => setViewMode("mentors")}
                        >
                            Mentors
                        </Button>
                        <Button 
                            variant={viewMode === "mentees" ? "primary" : "secondary"}
                            onClick={() => setViewMode("mentees")}
                        >
                            Mentees
                        </Button>
                        <Button 
                            variant={viewMode === "all" ? "primary" : "secondary"}
                            onClick={() => setViewMode("all")}
                        >
                            All
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row className="py-4">
                <Col xs={12}>
                    {mentorships.length === 0 ? (
                        <p className="text-white text-center">
                            {loading ? "Loading..." : "No mentorship relationships found."}
                        </p>
                    ) : (
                        <div className="contact-display">
                            {mentorships.map(mentorship => (
                                <Card key={mentorship._id} className="contact-card compact-contact">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <Card.Title as="h5" className="mb-1">
                                                    {mentorship.mentor_name || "Mentor"} → {mentorship.mentee_name || "Mentee"}
                                                </Card.Title>
                                                <Card.Subtitle className="text-white mb-2">
                                                    {mentorship.start_date && new Date(mentorship.start_date).toLocaleDateString()}
                                                    {mentorship.end_date && ` - ${new Date(mentorship.end_date).toLocaleDateString()}`}
                                                </Card.Subtitle>
                                            </div>
                                            <div>
                                                <Badge bg={getStatusColor(mentorship.status)} className="me-2">
                                                    {mentorship.status}
                                                </Badge>
                                                <Badge bg={getTypeColor(mentorship.mentorship_type)}>
                                                    {mentorship.mentorship_type}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="contact-details">
                                            {mentorship.goals && (
                                                <div className="contact-info-row">
                                                    <strong>Goals:</strong> {mentorship.goals}
                                                </div>
                                            )}
                                            {mentorship.frequency && (
                                                <div className="contact-info-row">
                                                    <strong>Frequency:</strong> {mentorship.frequency}
                                                </div>
                                            )}
                                            {mentorship.meeting_format && (
                                                <div className="contact-info-row">
                                                    <strong>Format:</strong> {mentorship.meeting_format}
                                                </div>
                                            )}
                                            {mentorship.notes && (
                                                <div className="contact-info-row">
                                                    <strong>Notes:</strong> {mentorship.notes.substring(0, 150)}{mentorship.notes.length > 150 ? "..." : ""}
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
                handleSubmit={handleSubmit}
            />
        </Container>
    );
};

export default MentorshipManagement;
