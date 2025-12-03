import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import NetworkEventsAPI from "../../api/networkEvents";
import NetworksAPI from "../../api/network";
import NetworkEventForm from "./NetworkEventForm";
import { formatLocalDate, formatLocalDateTime, toLocalDate, isToday, getLocalDay, getLocalMonth, getLocalYear, toUTCDate } from "../../utils/dateUtils";
import "./network.css";

export default function NetworkEventManagement() {
    const [events, setEvents] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [viewMode, setViewMode] = useState("both"); // Keep for compatibility but always show both
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [filterText, setFilterText] = useState({
        event_name: "",
        event_type: "",
        industry: "",
        location: ""
    });
    const [formData, setFormData] = useState({
        event_name: "",
        event_type: "conference",
        event_date: new Date().toISOString().split('T')[0],
        start_time: "",
        end_time: "",
        location: "",
        virtual_link: "",
        industry: "",
        description: "",
        cost: 0,
        registration_status: "not_registered",
        networking_goals: [],
        pre_event_prep: "",
        target_companies: [],
        target_roles: [],
        attendance_confirmed: false,
        expected_contacts: [], // New field for expected contacts
        new_connections_made: [],
        follow_up_actions: [],
        event_notes: "",
        roi_rating: "none",
        would_recommend: null
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const [eventsRes, contactsRes] = await Promise.all([
                NetworkEventsAPI.getAll(),
                NetworksAPI.getAll()
            ]);
            
            setEvents(eventsRes.data || []);
            setContacts(contactsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = (eventsToFilter) => {
        return eventsToFilter.filter(event => {
            if (filterText.event_name && !event.event_name?.toLowerCase().includes(filterText.event_name.toLowerCase())) {
                return false;
            }
            if (filterText.event_type && event.event_type !== filterText.event_type) {
                return false;
            }
            if (filterText.industry && !event.industry?.toLowerCase().includes(filterText.industry.toLowerCase())) {
                return false;
            }
            if (filterText.location && !event.location?.toLowerCase().includes(filterText.location.toLowerCase())) {
                return false;
            }
            return true;
        });
    };

    const getEventTypeColor = (eventType) => {
        switch (eventType) {
            case "conference": return "primary";
            case "meetup": return "success";
            case "workshop": return "info";
            case "webinar": return "warning";
            case "social": return "secondary";
            case "virtual": return "dark";
            case "other": return "danger";
            default: return "light";
        }
    };

    const getRegistrationStatusColor = (status) => {
        switch (status) {
            case "not_registered": return "secondary";
            case "registered": return "info";
            case "attended": return "success";
            case "cancelled": return "danger";
            default: return "light";
        }
    };

    const isPastEvent = (event) => {
        const eventDateTime = new Date(`${event.event_date}T${event.end_time || '23:59'}`);
        return eventDateTime < new Date();
    };

    const isCurrentlyOccurring = (event) => {
        const now = new Date();
        const eventStart = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
        const eventEnd = new Date(`${event.event_date}T${event.end_time || '23:59'}`);
        return now >= eventStart && now <= eventEnd;
    };

    const isUpcoming = (event) => {
        const now = new Date();
        const eventStart = new Date(`${event.event_date}T${event.start_time || '00:00'}`);
        const eventEnd = new Date(`${event.event_date}T${event.end_time || '23:59'}`);
        const today = new Date();
        const eventDate = new Date(event.event_date);
        
        // Exclude past events, current events, and later today events
        if (isPastEvent(event) || isCurrentlyOccurring(event) || isLaterToday(event)) {
            return false;
        }
        
        // Only return true for future events (not today)
        return eventDate > today;
    };

    const isLaterToday = (event) => {
        const today = new Date();
        const eventLocalDate = toLocalDate(event.event_date);
        const eventDate = new Date(eventLocalDate);
        
        // Check if event is today
        if (eventDate.toDateString() !== today.toDateString()) {
            return false;
        }
        
        // Create full datetime objects for accurate comparison
        const eventDateTime = new Date(eventLocalDate);
        if (event.start_time) {
            const [hours, minutes] = event.start_time.split(':');
            eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        
        const now = new Date();
        const isLater = eventDateTime > now;
        return isLater;
    };

    const handleAddOrUpdate = async () => {
        try {
            const dataToSend = {
                ...formData,
                event_date: toUTCDate(formData.event_date).split('T')[0],
                networking_goals: formData.networking_goals || [],
                target_companies: formData.target_companies || [],
                target_roles: formData.target_roles || [],
                expected_contacts: formData.expected_contacts || [],
                new_connections_made: formData.new_connections_made || [],
                follow_up_actions: formData.follow_up_actions || []
            };
            
            if (editing && editingEventId) {
                await NetworkEventsAPI.update(editingEventId, dataToSend);
            } else {
                await NetworkEventsAPI.add(dataToSend);
            }
            await fetchEvents();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };

    const handleEdit = (event) => {
        setEditing(true);
        setEditingEventId(event._id);
        setFormData({
            event_name: event.event_name || "",
            event_type: event.event_type || "conference",
            event_date: event.event_date || new Date().toISOString().split('T')[0],
            start_time: event.start_time || "",
            end_time: event.end_time || "",
            location: event.location || "",
            virtual_link: event.virtual_link || "",
            industry: event.industry || "",
            description: event.description || "",
            cost: event.cost || 0,
            registration_status: event.registration_status || "not_registered",
            networking_goals: event.networking_goals || [],
            pre_event_prep: event.pre_event_prep || "",
            target_companies: event.target_companies || [],
            target_roles: event.target_roles || [],
            attendance_confirmed: event.attendance_confirmed || false,
            expected_contacts: event.expected_contacts || [],
            new_connections_made: event.new_connections_made || [],
            follow_up_actions: event.follow_up_actions || [],
            event_notes: event.event_notes || "",
            roi_rating: event.roi_rating || "none",
            would_recommend: event.would_recommend || null
        });
        setShowModal(true);
    };

    const handleDelete = async (event) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await NetworkEventsAPI.delete(event._id);
                await fetchEvents();
            } catch (error) {
                console.error("Failed to delete event:", error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            event_name: "",
            event_type: "conference",
            event_date: new Date().toISOString().split('T')[0],
            start_time: "",
            end_time: "",
            location: "",
            virtual_link: "",
            industry: "",
            description: "",
            cost: 0,
            registration_status: "not_registered",
            networking_goals: [],
            pre_event_prep: "",
            target_companies: [],
            target_roles: [],
            attendance_confirmed: false,
            expected_contacts: [],
            new_connections_made: [],
            follow_up_actions: [],
            event_notes: "",
            roi_rating: "none",
            would_recommend: null
        });
        setEditing(false);
        setEditingEventId(null);
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
            event_name: "",
            event_type: "",
            industry: "",
            location: ""
        });
    };

    const renderTimelineView = () => {
        const sortedEvents = filterEvents(events).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        
        return (
            <div className="timeline-container">
                {sortedEvents.map((event, index) => (
                    <div key={event._id} className="timeline-item">
                        <div className="timeline-marker">
                            <div className="timeline-date">
                                {formatLocalDate(event.event_date)}
                            </div>
                        </div>
                        <Card className={`timeline-card ${event.registration_status === 'cancelled' ? 'cancelled-event' : ''} ${isPastEvent(event) ? 'past-event' : ''} ${isCurrentlyOccurring(event) ? 'current-event' : ''} ${isLaterToday(event) ? 'later-today-event' : ''}`}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Card.Title as="h5">{event.event_name}</Card.Title>
                                    <div>
                                        <Badge bg={getEventTypeColor(event.event_type)} className="me-2">
                                            {event.event_type}
                                        </Badge>
                                        <Badge bg={getRegistrationStatusColor(event.registration_status)}>
                                            {event.registration_status}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <Card.Subtitle className="mb-2 text-muted">
                                    {event.location || "Virtual"}
                                </Card.Subtitle>
                                
                                {event.industry && (
                                    <p className="mb-2"><strong>Industry:</strong> {event.industry}</p>
                                )}
                                
                                {event.description && (
                                    <p className="mb-2">{event.description.substring(0, 150)}...</p>
                                )}
                                
                                {event.cost > 0 && (
                                    <p className="mb-2"><strong>Cost:</strong> ${event.cost}</p>
                                )}
                                
                                {event.networking_goals && event.networking_goals.length > 0 && (
                                    <div className="mb-2">
                                        <strong>Goals:</strong>
                                        <div className="mt-1">
                                            {event.networking_goals.map((goal, i) => (
                                                <Badge key={i} bg="light" text="dark" className="me-1">
                                                    {goal}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {event.expected_contacts && event.expected_contacts.length > 0 && (
                                    <div className="mb-2">
                                        <strong>Expected Contacts:</strong>
                                        <div className="mt-1">
                                            {event.expected_contacts.map((contactId, i) => {
                                                const contact = contacts.find(c => c._id === contactId);
                                                return (
                                                    <Badge key={i} bg="info" text="white" className="me-1">
                                                        {contact?.name || 'Unknown Contact'}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(event)}>
                                        Edit
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(event)}>
                                        Delete
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
        );
    };

    const renderCalendarView = () => {
        const filteredEvents = filterEvents(events);
        
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

        const getEventsForDate = (day) => {
            return filteredEvents.filter(event => {
                return getLocalDay(event.event_date) === day && 
                       getLocalMonth(event.event_date) === month && 
                       getLocalYear(event.event_date) === year;
            });
        };

        const isTodayCheck = (day) => {
            return filteredEvents.some(event => {
                return isToday(event.event_date) && getLocalDay(event.event_date) === day;
            }) || (new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year);
        };

        const getEventTypeColor = (eventType) => {
            const colors = {
                "conference": "#2196f3",
                "meetup": "#4caf50", 
                "workshop": "#ff9800",
                "webinar": "#9c27b0",
                "social": "#607d8b",
                "virtual": "#795548",
                "other": "#f44336"
            };
            return colors[eventType] || "#666";
        };

        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const calendarDays = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="calendar-day-empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const eventsOnDay = getEventsForDate(day);
            const hasEvents = eventsOnDay.length > 0;

            calendarDays.push(
                <div
                    key={day}
                    className={`calendar-day-cell ${
                        isTodayCheck(day) 
                            ? "calendar-day-cell-today" 
                            : "calendar-day-cell-default"
                    } ${
                        hasEvents ? "calendar-day-cell-has-events" : ""
                    }`}
                    style={{ cursor: hasEvents ? "pointer" : "default" }}
                >
                    <div className={`calendar-day-number ${
                        isTodayCheck(day) ? "calendar-day-number-today" : ""
                    }`}>
                        {day}
                    </div>
                    {hasEvents && (
                        <div className="calendar-event-list">
                            {eventsOnDay.map(event => (
                                <div
                                    key={event._id}
                                    onClick={() => handleEdit(event)}
                                    className={`calendar-event-item ${event.registration_status === 'cancelled' ? 'cancelled-event' : ''} ${isPastEvent(event) ? 'past-event' : ''} ${isCurrentlyOccurring(event) ? 'current-event' : ''} ${isLaterToday(event) ? 'later-today-event' : ''}`}
                                    style={{ background: getEventTypeColor(event.event_type) }}
                                >
                                    {event.event_name}
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
                        <div className="calendar-legend-label">Event Types:</div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small calendar-event-conference"></div>
                            <span>Conference</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small calendar-event-meetup"></div>
                            <span>Meetup</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small calendar-event-workshop"></div>
                            <span>Workshop</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small calendar-event-webinar"></div>
                            <span>Webinar</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small calendar-event-social"></div>
                            <span>Social</span>
                        </div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-small calendar-event-virtual"></div>
                            <span>Virtual</span>
                        </div>
                    </div>
                    
                    <div className="calendar-legend-row">
                        <div className="calendar-legend-label">Calendar:</div>
                        <div className="calendar-legend-item">
                            <div className="calendar-legend-icon-large calendar-legend-border-thin calendar-legend-has-events"></div>
                            <span>Has Events</span>
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
                <div className="network-loading-container">
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading networking events...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <h1 className="text-center text-white fw-bold mb-5 display-4">
                Networking Event Management
            </h1>

            <Row>
                <Col xs={12} className="mb-4">
                    <div className="d-flex justify-content-center align-items-center gap-3">
                        <Button onClick={() => { setShowModal(true); resetForm(); }}>
                            + Add Event
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row className="py-4" styles={{height:"fit-content"}}>
                <Col xs={12} className="mb-4">
                    <div className="filter-section">
                        <h5 className="text-white mb-3">Filter Events</h5>
                        <div className="filter-controls">
                            <div className="filter-group">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    name="event_name"
                                    value={filterText.event_name}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                            </div>
                            <div className="filter-group">
                                <Form.Select
                                    name="event_type"
                                    value={filterText.event_type}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                >
                                    <option value="">All Types</option>
                                    <option value="conference">Conference</option>
                                    <option value="meetup">Meetup</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="webinar">Webinar</option>
                                    <option value="social">Social</option>
                                    <option value="virtual">Virtual</option>
                                </Form.Select>
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
                                <input
                                    type="text"
                                    placeholder="Search by location..."
                                    name="location"
                                    value={filterText.location}
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
                    {filterEvents(events).length === 0 ? (
                        <p className="text-white">
                            {Object.values(filterText).some(val => val !== "") 
                                ? "No events match your search." 
                                : "No networking events found. Start by adding one!"}
                        </p>
                    ) : (
                        <Row>
                            <Col lg={4} className="mb-4">
                                <h5 className="text-white mb-3">Timeline View</h5>
                                <div className="timeline-scroll-wrapper">
                                    <div className="timeline-scroll-container">
                                        {renderTimelineView()}
                                    </div>
                                </div>
                            </Col>
                            <Col lg={8} className="mb-4">
                                <h5 className="text-white mb-3">Calendar View</h5>
                                {renderCalendarView()}
                            </Col>
                        </Row>
                    )}
                </Col>
            </Row>

            <NetworkEventForm
                showModal={showModal}
                setShowModal={setShowModal}
                editing={editing}
                formData={formData}
                setFormData={setFormData}
                contacts={contacts}
                handleAddOrUpdate={handleAddOrUpdate}
                resetForm={resetForm}
            />
        </Container>
    );
}
