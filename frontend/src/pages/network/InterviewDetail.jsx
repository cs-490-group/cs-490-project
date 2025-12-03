import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Card, Button, Alert, Spinner, Row, Col, Badge, Modal, Form } from "react-bootstrap";
import InformationalInterviewsAPI from "../../api/informationalInterviews";
import NetworksAPI from "../../api/network";
import { formatLocalDate, formatLocalDateTime } from "../../utils/dateUtils";
import "./network.css";

export default function InterviewDetail() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const [interview, setInterview] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [rawTopicsInput, setRawTopicsInput] = useState("");
    const [rawQuestionsInput, setRawQuestionsInput] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadInterviewData();
    }, [interviewId]);

    const loadInterviewData = async () => {
        try {
            const [interviewRes, contactsRes] = await Promise.all([
                InformationalInterviewsAPI.get(interviewId),
                NetworksAPI.getAll()
            ]);
            
            setInterview(interviewRes.data);
            setContacts(contactsRes.data || []);
            
            // Set form data for editing
            if (interviewRes.data) {
                setFormData(interviewRes.data);
                setRawTopicsInput(interviewRes.data.topics_to_cover?.join(", ") || "");
                setRawQuestionsInput(interviewRes.data.questions_prepared?.join(", ") || "");
            }
        } catch (error) {
            console.error("Error loading interview:", error);
        } finally {
            setLoading(false);
        }
    };

    const getContactName = (contactId) => {
        const contact = contacts.find(c => c._id === contactId);
        return contact ? contact.name : "Unknown Contact";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "requested": return "primary";
            case "scheduled": return "info";
            case "confirmed": return "success";
            case "completed": return "secondary";
            case "cancelled": return "danger";
            default: return "light";
        }
    };

    const getFormatColor = (format) => {
        switch (format) {
            case "phone": return "primary";
            case "video": return "success";
            case "in_person": return "info";
            default: return "secondary";
        }
    };

    const handleDelete = async () => {
        try {
            await InformationalInterviewsAPI.delete(interviewId);
            window.scrollTo(0, 0);
            navigate("/network/interviews");
        } catch (error) {
            console.error("Failed to delete interview:", error);
        }
    };

    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            // Process topics and questions
            const topics = rawTopicsInput.split(",").map(t => t.trim()).filter(t => t);
            const questions = rawQuestionsInput.split(",").map(q => q.trim()).filter(q => q);
            
            const updatedData = {
                ...formData,
                topics_to_cover: topics,
                questions_prepared: questions
            };

            await InformationalInterviewsAPI.update(interviewId, updatedData);
            await loadInterviewData();
            setShowEditModal(false);
        } catch (error) {
            console.error("Failed to update interview:", error);
        }
    };

    if (loading) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading interview details...</p>
                </div>
            </Container>
        );
    }

    if (!interview) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <Alert variant="danger">Interview not found.</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <div className="mb-4">
                <Button variant="secondary" onClick={() => navigate(-1)} className="me-2">
                    ← Back
                </Button>
                <Button variant="primary" onClick={handleEdit} className="me-2">
                    ✏️ Edit
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                    🗑️ Delete
                </Button>
            </div>

            <Row>
                <Col md={8}>
                    <Card className="mb-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h1 className="mb-2">{interview.company}</h1>
                                    <h4 className="text-muted mb-3">{interview.industry}</h4>
                                    <p className="mb-2"><strong>Contact:</strong> {getContactName(interview.contact_id)}</p>
                                </div>
                                <div className="d-flex flex-column gap-2">
                                    <Badge bg={getStatusColor(interview.status)}>
                                        {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                                    </Badge>
                                    <Badge bg={getFormatColor(interview.interview_format)}>
                                        {interview.interview_format}
                                    </Badge>
                                </div>
                            </div>

                            <Row className="mb-4">
                                <Col md={4}>
                                    <h6 className="text-muted">Requested Date</h6>
                                    <p>{interview.request_date || "—"}</p>
                                </Col>
                                <Col md={4}>
                                    <h6 className="text-muted">Scheduled Date</h6>
                                    <p>{interview.scheduled_date || "—"}</p>
                                </Col>
                                <Col md={4}>
                                    <h6 className="text-muted">Duration</h6>
                                    <p>{interview.duration_minutes || 30} minutes</p>
                                </Col>
                            </Row>

                            {interview.personalized_request && (
                                <div className="mb-4">
                                    <h5>Personalized Request</h5>
                                    <p>{interview.personalized_request}</p>
                                </div>
                            )}

                            {interview.preparation_framework && (
                                <div className="mb-4">
                                    <h5>Preparation Framework</h5>
                                    <p>{interview.preparation_framework}</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {interview.status === "completed" && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h5 className="mb-3">Interview Results</h5>
                                <Row>
                                    {interview.interview_notes && (
                                        <Col md={6}>
                                            <h6>Interview Notes</h6>
                                            <p>{interview.interview_notes}</p>
                                        </Col>
                                    )}
                                    {interview.key_insights && (
                                        <Col md={6}>
                                            <h6>Key Insights</h6>
                                            <p>{interview.key_insights}</p>
                                        </Col>
                                    )}
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Topics to Cover</h5>
                            <div className="d-flex flex-wrap gap-2">
                                {interview.topics_to_cover?.map((topic, i) => (
                                    <Badge key={i} bg="light" text="dark">
                                        {topic}
                                    </Badge>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Questions Prepared</h5>
                            <div className="d-flex flex-wrap gap-2">
                                {interview.questions_prepared?.map((question, i) => (
                                    <Badge key={i} bg="primary" text="white">
                                        {question}
                                    </Badge>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Interview</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="requested">Requested</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Interview Format</Form.Label>
                                    <Form.Select
                                        value={formData.interview_format}
                                        onChange={(e) => setFormData({ ...formData, interview_format: e.target.value })}
                                    >
                                        <option value="phone">Phone</option>
                                        <option value="video">Video Call</option>
                                        <option value="in_person">In Person</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Topics to Cover (comma-separated)</Form.Label>
                            <Form.Control
                                type="text"
                                value={rawTopicsInput}
                                onChange={(e) => setRawTopicsInput(e.target.value)}
                                placeholder="Career path, company culture, industry trends..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Questions Prepared (comma-separated)</Form.Label>
                            <Form.Control
                                type="text"
                                value={rawQuestionsInput}
                                onChange={(e) => setRawQuestionsInput(e.target.value)}
                                placeholder="What skills are most valuable, biggest challenges, career advice..."
                            />
                        </Form.Group>

                        {formData.status === "completed" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Interview Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.interview_notes}
                                        onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Key Insights</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.key_insights}
                                        onChange={(e) => setFormData({ ...formData, key_insights: e.target.value })}
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this interview? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
