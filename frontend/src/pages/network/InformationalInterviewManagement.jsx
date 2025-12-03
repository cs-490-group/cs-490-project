import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import InformationalInterviewsAPI from "../../api/informationalInterviews";
import NetworksAPI from "../../api/network";
import InformationalInterviewForm from "./InformationalInterviewForm";
import "./network.css";

export default function InformationalInterviewManagement() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingInterviewId, setEditingInterviewId] = useState(null);
    const [rawTopicsInput, setRawTopicsInput] = useState("");
    const [rawQuestionsInput, setRawQuestionsInput] = useState("");
    const [filterText, setFilterText] = useState({
        company: "",
        industry: "",
        status: "",
        contact: ""
    });
    const [formData, setFormData] = useState({
        contact_id: "",
        company: "",
        industry: "",
        request_date: new Date().toISOString().split('T')[0],
        scheduled_date: "",
        status: "requested",
        request_template: "",
        personalized_request: "",
        preparation_framework: "",
        interview_format: "video",
        start_time: "",
        end_time: "",
        topics_to_cover: [],
        questions_prepared: [],
        interview_notes: "",
        key_insights: "",
        industry_intelligence: "",
        relationship_outcome: "maintained",
        follow_up_sent: false,
        follow_up_date: "",
        future_opportunities: [],
        impact_on_job_search: "none"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [interviewsRes, contactsRes] = await Promise.all([
                InformationalInterviewsAPI.getAll(),
                NetworksAPI.getAll()
            ]);

            setInterviews(interviewsRes.data || []);
            setContacts(contactsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterInterviews = (interviewsToFilter) => {
        return interviewsToFilter.filter(interview => {
            if (filterText.company && !interview.company?.toLowerCase().includes(filterText.company.toLowerCase())) {
                return false;
            }
            if (filterText.industry && !interview.industry?.toLowerCase().includes(filterText.industry.toLowerCase())) {
                return false;
            }
            if (filterText.status && interview.status !== filterText.status) {
                return false;
            }
            if (filterText.contact) {
                const contact = contacts.find(c => c._id === interview.contact_id);
                if (!contact?.name?.toLowerCase().includes(filterText.contact.toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
    };

    const getContactName = (contactId) => {
        const contact = contacts.find(c => c._id === contactId);
        return contact?.name || "Unknown Contact";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "requested": return "info";
            case "scheduled": return "warning";
            case "confirmed": return "primary";
            case "completed": return "success";
            case "cancelled": return "danger";
            case "no_response": return "secondary";
            default: return "light";
        }
    };

    const getFormatColor = (format) => {
        switch (format) {
            case "phone": return "info";
            case "video": return "primary";
            case "in_person": return "success";
            case "coffee": return "secondary";
            default: return "light";
        }
    };

    const handleAddOrUpdate = async () => {
        try {
            // Ensure arrays are properly formatted
            const dataToSend = {
                ...formData,
                topics_to_cover: formData.topics_to_cover || [],
                questions_prepared: formData.questions_prepared || [],
                future_opportunities: formData.future_opportunities || []
            };

            if (editing && editingInterviewId) {
                await InformationalInterviewsAPI.update(editingInterviewId, dataToSend);
            } else {
                await InformationalInterviewsAPI.add(dataToSend);
            }
            await fetchData();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving interview:", error);
        }
    };

    const handleEdit = (interview) => {
        setEditing(true);
        setEditingInterviewId(interview._id);
        const formData = {
            contact_id: interview.contact_id || "",
            company: interview.company || "",
            industry: interview.industry || "",
            request_date: interview.request_date || new Date().toISOString().split('T')[0],
            scheduled_date: interview.scheduled_date || "",
            status: interview.status || "requested",
            request_template: interview.request_template || "",
            personalized_request: interview.personalized_request || "",
            preparation_framework: interview.preparation_framework || "",
            topics_to_cover: interview.topics_to_cover || [],
            questions_prepared: interview.questions_prepared || [],
            start_time: interview.start_time || "",
            end_time: interview.end_time || "",
            interview_format: interview.interview_format || "video_call",
            interview_notes: interview.interview_notes || "",
            key_insights: interview.key_insights || "",
            follow_up_actions: interview.follow_up_actions || []
        };
        setFormData(formData);
        setRawTopicsInput(formData.topics_to_cover.join(", "));
        setRawQuestionsInput(formData.questions_prepared.join(", "));
        setShowModal(true);
    };

    const handleDelete = async (interviewId) => {
        if (window.confirm("Are you sure you want to delete this informational interview?")) {
            try {
                await InformationalInterviewsAPI.delete(interviewId);
                await fetchData();
            } catch (error) {
                console.error("Failed to delete interview:", error);
            }
        }
    };

    const handleComplete = async (interview) => {
        const completionData = {
            interview_notes: prompt("Interview notes:"),
            key_insights: prompt("Key insights:"),
            industry_intelligence: prompt("Industry intelligence:"),
            relationship_outcome: "maintained",
            future_opportunities: [],
            impact_on_job_search: "none"
        };

        try {
            await InformationalInterviewsAPI.complete(interview._id, completionData);
            await fetchData();
        } catch (error) {
            console.error("Error completing interview:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            contact_id: "",
            company: "",
            industry: "",
            request_date: new Date().toISOString().split('T')[0],
            scheduled_date: "",
            status: "requested",
            request_template: "",
            personalized_request: "",
            preparation_framework: "",
            interview_format: "video",
            start_time: "",
            end_time: "",
            topics_to_cover: [],
            questions_prepared: [],
            interview_notes: "",
            key_insights: "",
            industry_intelligence: "",
            relationship_outcome: "maintained",
            follow_up_sent: false,
            follow_up_date: "",
            future_opportunities: [],
            impact_on_job_search: "none"
        });
        setRawTopicsInput("");
        setRawQuestionsInput("");
        setEditing(false);
        setEditingInterviewId(null);
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
            company: "",
            industry: "",
            status: "",
            contact: ""
        });
    };

    if (loading) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading informational interviews...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <h1 className="text-center text-white fw-bold mb-5 display-4">
                Informational Interview Management
            </h1>

            <Row>
                <Col xs={12} className="mb-4">
                    <Button onClick={() => { setShowModal(true); resetForm(); }}>
                        + Schedule Informational Interview
                    </Button>
                </Col>
            </Row>

            <Row className="py-4">
                <Col xs={12} className="mb-4">
                    <div className="filter-section">
                        <h5 className="text-white mb-3">Filter Interviews</h5>
                        <div className="filter-controls">
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
                                    name="status"
                                    value={filterText.status}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="requested">Requested</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_response">No Response</option>
                                </Form.Select>
                            </div>
                            <div className="filter-group">
                                <input
                                    type="text"
                                    placeholder="Search by contact..."
                                    name="contact"
                                    value={filterText.contact}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
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
                    {filterInterviews(interviews).length === 0 ? (
                        <p className="text-white">
                            {Object.values(filterText).some(val => val !== "")
                                ? "No interviews match your search."
                                : "No informational interviews found. Start by scheduling one!"}
                        </p>
                    ) : (
                        <div className="timeline-wrapper">
                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <div className="timeline-line"></div>
                                    <div className="timeline-dates">
                                        {filterInterviews(interviews).map(interview => (
                                            <div key={interview._id} className="timeline-date-item">
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-date-text">
                                                    {interview.scheduled_date || interview.request_date || "No Date"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="timeline-scroll">
                                    {filterInterviews(interviews).map(interview => (
                                        <Card key={interview._id} className="contact-card interview-card" style={{ cursor: "pointer" }} onClick={() => navigate(`/network/interview/${interview._id}`)}>
                                            <Card.Body>
                                                <Row className="contact-section">
                                                    {/* "d-flex justify-content-between align-items-start mb-2" */}
                                                    <Col style={{ textAlign: "left" }}>
                                                        <Card.Title as="h3">{interview.company}</Card.Title>
                                                        <Card.Subtitle as="h5" className="mb-3">
                                                            {interview.industry}
                                                        </Card.Subtitle>
                                                    </Col>
                                                    <Col xs="auto" style={{ margin: "auto" }}>
                                                        <Badge bg={getStatusColor(interview.status)}>
                                                            {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                                                        </Badge>
                                                        <br></br>
                                                        <Badge bg={getFormatColor(interview.interview_format)}>
                                                            {interview.interview_format}
                                                        </Badge>
                                                    </Col>
                                                </Row>

                                                <div className="contact-section">
                                                    <h6 className="section-title">Contact</h6>
                                                    <p className="mb-0">{getContactName(interview.contact_id)}</p>
                                                </div>

                                                <div className="contact-section">
                                                    <h6 className="section-title">Schedule</h6>
                                                    <p className="mb-1"><strong>Requested:</strong> {interview.request_date || "—"}</p>
                                                    <p className="mb-1"><strong>Scheduled:</strong> {interview.scheduled_date || "—"}</p>
                                                    <p className="mb-0"><strong>Time:</strong> {interview.start_time || "—"} - {interview.end_time || "—"}</p>
                                                </div>

                                                {interview.topics_to_cover && interview.topics_to_cover.length > 0 && (
                                                    <div className="contact-section">
                                                        <h6 className="section-title">Topics to Cover</h6>
                                                        <div className="mt-1">
                                                            {interview.topics_to_cover.map((topic, i) => (
                                                                <Badge key={i} bg="light" text="dark" className="me-1">
                                                                    {topic}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {interview.key_insights && (
                                                    <div className="contact-section">
                                                        <h6 className="section-title">Key Insights</h6>
                                                        <p className="mb-0">{interview.key_insights.substring(0, 100)}...</p>
                                                    </div>
                                                )}

                                                {interview.industry_intelligence && (
                                                    <div className="contact-section">
                                                        <h6 className="section-title">Industry Intelligence</h6>
                                                        <p className="mb-0">{interview.industry_intelligence.substring(0, 100)}...</p>
                                                    </div>
                                                )}

                                                {interview.impact_on_job_search && interview.status === "completed" && (
                                                    <div className="contact-section">
                                                        <h6 className="section-title">Impact on Job Search</h6>
                                                        <p className="mb-0">
                                                            <span className={`badge bg-${interview.impact_on_job_search === 'high' ? 'success' : interview.impact_on_job_search === 'medium' ? 'warning' : 'secondary'}`}>
                                                                {interview.impact_on_job_search?.charAt(0).toUpperCase() + interview.impact_on_job_search?.slice(1)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="card-actions">
                                                    <Button className="action-button delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(interview._id); }}>
                                                        🗑️ Delete
                                                    </Button>
                                                    <Button className="action-button edit-btn" onClick={(e) => { e.stopPropagation(); handleEdit(interview); }}>
                                                        ✏️ Edit
                                                    </Button>
                                                    {interview.status === "confirmed" && (
                                                        <Button className="action-button complete-btn" onClick={(e) => { e.stopPropagation(); handleComplete(interview); }}>
                                                            ✅ Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Col>
            </Row>

            <InformationalInterviewForm
                showModal={showModal}
                setShowModal={setShowModal}
                editing={editing}
                formData={formData}
                setFormData={setFormData}
                contacts={contacts}
                rawTopicsInput={rawTopicsInput}
                setRawTopicsInput={setRawTopicsInput}
                rawQuestionsInput={rawQuestionsInput}
                setRawQuestionsInput={setRawQuestionsInput}
                handleAddOrUpdate={handleAddOrUpdate}
                resetForm={resetForm}
            />
        </Container>
    );
}
