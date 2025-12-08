import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import InformationalInterviewsAPI from "../../api/informationalInterviews";
import NetworksAPI from "../../api/network";
import InformationalInterviewForm from "./InformationalInterviewForm";
import { formatLocalDate, formatLocalDateTime, toLocalDate, isToday, getLocalDay, getLocalMonth, getLocalYear, toUTCDate } from "../../utils/dateUtils";
import "./network.css";

export default function InformationalInterviewManagement() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingInterviewId, setEditingInterviewId] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
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
        }).sort((a, b) => {
            // Sort by date first, then by start time
            const dateA = a.scheduled_date || a.request_date || '';
            const dateB = b.scheduled_date || b.request_date || '';

            // Compare dates
            if (dateA !== dateB) {
                return dateA.localeCompare(dateB);
            }

            // If dates are the same, sort by start time
            if (!a.start_time && !b.start_time) return 0;
            if (!a.start_time) return 1;
            if (!b.start_time) return -1;

            // Parse times for comparison
            const timeA = new Date(`2000-01-01T${a.start_time}`);
            const timeB = new Date(`2000-01-01T${b.start_time}`);
            return timeA - timeB;
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

    const isPastInterview = (interview) => {
        const interviewDateTime = new Date(`${interview.scheduled_date || interview.request_date}T${interview.end_time || '23:59'}`);
        return interviewDateTime < new Date();
    };

    const isCurrentlyOccurring = (interview) => {
        const now = new Date();
        const interviewDate = interview.scheduled_date || interview.request_date;
        const eventStart = new Date(`${interviewDate}T${interview.start_time || '00:00'}`);
        const eventEnd = new Date(`${interviewDate}T${interview.end_time || '23:59'}`);
        return now >= eventStart && now <= eventEnd;
    };

    const isLaterToday = (interview) => {
        const today = new Date();
        const interviewLocalDate = toLocalDate(interview.scheduled_date || interview.request_date);
        const interviewDate = new Date(interviewLocalDate);

        // Check if interview is today
        if (interviewDate.toDateString() !== today.toDateString()) {
            return false;
        }

        // Create full datetime objects for accurate comparison
        const interviewDateTime = new Date(interviewLocalDate);
        if (interview.start_time) {
            const [hours, minutes] = interview.start_time.split(':');
            interviewDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        // Check if interview is later today
        return interviewDateTime > today;
    };

    const renderCalendarView = () => {
        const filteredInterviews = filterInterviews(interviews);

        const getDaysInMonth = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();
            return { daysInMonth, startingDayOfWeek, year, month };
        };

        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

        const getInterviewsForDate = (day) => {
            return filteredInterviews.filter(interview => {
                const interviewDate = interview.scheduled_date || interview.request_date;
                return interviewDate && getLocalDay(interviewDate) === day &&
                    getLocalMonth(interviewDate) === month &&
                    getLocalYear(interviewDate) === year;
            });
        };

        const isTodayCheck = (day) => {
            return filteredInterviews.some(interview => {
                const interviewDate = interview.scheduled_date || interview.request_date;
                return interviewDate && isToday(interviewDate) && getLocalDay(interviewDate) === day;
            }) || (new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year);
        };

        const getInterviewStatusColor = (status) => {
            const colors = {
                "requested": "#17a2b8",
                "confirmed": "#ffc107",
                "completed": "#28a745",
                "cancelled": "#dc3545"
            };
            return colors[status] || "#6c757d";
        };

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const calendarDays = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="calendar-day-empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const interviewsOnDay = getInterviewsForDate(day);
            const hasInterviews = interviewsOnDay.length > 0;

            calendarDays.push(
                <div
                    key={day}
                    className={`calendar-day-cell ${isTodayCheck(day)
                        ? "calendar-day-cell-today"
                        : "calendar-day-cell-default"
                        } ${hasInterviews ? "calendar-day-cell-has-events" : ""
                        }`}
                    style={{ cursor: hasInterviews ? "pointer" : "default" }}
                >
                    <div className={`calendar-day-number ${isTodayCheck(day) ? "calendar-day-number-today" : ""
                        }`}>
                        {day}
                    </div>
                    {hasInterviews && (
                        <div className="calendar-event-list">
                            {interviewsOnDay.map(interview => (
                                <div
                                    key={interview._id}
                                    onClick={() => navigate(`/network/interview/${interview._id}`)}
                                    className={`calendar-event-item ${interview.status === 'cancelled' ? 'cancelled-event' : ''} ${isPastInterview(interview) ? 'past-event' : ''} ${isCurrentlyOccurring(interview) ? 'current-event' : ''} ${isLaterToday(interview) ? 'later-today-event' : ''}`}
                                    style={{ background: getInterviewStatusColor(interview.status) }}
                                >
                                    {interview.company}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="calendar-main-container">
                <div className="calendar-header-controls">
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="calendar-nav-button"
                    >
                        ← Previous
                    </button>
                    <h2 className="calendar-month-title">{monthNames[month]} {year}</h2>
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="calendar-nav-button"
                    >
                        Next →
                    </button>
                </div>

                <div className="calendar-grid-container">
                    {dayNames.map(day => (
                        <div key={day} className="calendar-day-header">
                            {day}
                        </div>
                    ))}
                    {calendarDays}
                </div>

                <div className="calendar-legend-container">
                    <div className="calendar-legend-row">
                        <div className="calendar-legend-label">Interview Status:</div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small" style={{ background: "#17a2b8" }}></div>
                            <span>Requested</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small" style={{ background: "#ffc107" }}></div>
                            <span>Confirmed</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small" style={{ background: "#28a745" }}></div>
                            <span>Completed</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small" style={{ background: "#dc3545" }}></div>
                            <span>Cancelled</span>
                        </div>
                    </div>

                    <div className="calendar-legend-row">
                        <div className="calendar-legend-label">Calendar:</div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-large calendar-legend-border-thin calendar-legend-has-events"></div>
                            <span>Has Interviews</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-large calendar-legend-border-thick"></div>
                            <span>Today</span>
                        </div>
                    </div>
                </div>
            </div>
        );
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

            <Button onClick={() => { setShowModal(true); resetForm(); }} style={{width:"fit-content", margin:"0 auto 0 auto"}}>
                + Schedule Informational Interview
            </Button>

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
                <Col className="mb-4">
                    <h5 className="text-white mb-3">Interview Timeline</h5>
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
                                        <Card key={interview._id} className={`contact-card interview-card ${interview.status === 'cancelled' ? 'cancelled-event' : ''} ${isPastInterview(interview) ? 'past-event' : ''} ${isCurrentlyOccurring(interview) ? 'current-event' : ''} ${isLaterToday(interview) ? 'later-today-event' : ''}`} style={{ cursor: "pointer" }} onClick={() => navigate(`/network/interview/${interview._id}`)}>
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
                                                    <p className="mb-0"><strong>Time:</strong> {interview.start_time ? new Date(`2000-01-01T${interview.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "—"} - {interview.end_time ? new Date(`2000-01-01T${interview.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "—"} {interview.start_time ? ` ${new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2] || new Date().toLocaleDateString('en-US', { timeZoneName: 'short', weekday: 'short' }).split(' ')[1]}` : ""}</p>
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
            <Row className="mb-4" style={{ margin: "0rem 1rem 0rem 1rem" }}>
                <h5 className="text-white mb-3">Interview Calendar</h5>
                {renderCalendarView()}
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
