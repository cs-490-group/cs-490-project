import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import ReferralsAPI from "../../api/referrals";
import NetworksAPI from "../../api/network";
import ReferralManagementForm from "./ReferralManagementForm";
import { formatLocalDate, formatLocalDateTime, toUTCDate, toLocalDateString } from "../../utils/dateUtils";
import "./network.css";

export default function ReferralManagement() {
    const location = useLocation();
    const [referrals, setReferrals] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingReferralId, setEditingReferralId] = useState(null);
    const [filterText, setFilterText] = useState({
        company: "",
        position: "",
        status: "",
        contact: ""
    });
    const [formData, setFormData] = useState({
        contact_id: "",
        job_id: null,
        job_application_id: null,
        company: "",
        position: "",
        request_date: toLocalDateString(new Date()),
        status: "pending",
        message: "",
        follow_up_date: "",
        response_date: "",
        referral_success: null,
        notes: "",
        relationship_impact: null,
        gratitude_sent: false,
        gratitude_date: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Check if there's prefill data from navigation (from JobCard Request Referral button)
        if (location.state?.prefillJob) {
            const prefillJob = location.state.prefillJob;
            
            // Update formData with job information
            setFormData({
                ...formData,
                job_id: prefillJob.job_id,
                company: prefillJob.company || "",
                position: prefillJob.position || "",
            });
            
            // Show the modal for creating a new referral
            setShowModal(true);
            setEditing(false);
            
            // Clear the navigation state to prevent re-prefilling on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const fetchData = async () => {
        try {
            const [referralsRes, contactsRes] = await Promise.all([
                ReferralsAPI.getAll(),
                NetworksAPI.getAll()
            ]);
            
            setReferrals(referralsRes.data || []);
            setContacts(contactsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterReferrals = (referralsToFilter) => {
        return referralsToFilter.filter(referral => {
            if (filterText.company && !referral.company?.toLowerCase().includes(filterText.company.toLowerCase())) {
                return false;
            }
            if (filterText.position && !referral.position?.toLowerCase().includes(filterText.position.toLowerCase())) {
                return false;
            }
            if (filterText.status && referral.status !== filterText.status) {
                return false;
            }
            if (filterText.contact) {
                const contact = contacts.find(c => c._id === referral.contact_id);
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

    const handleAddOrUpdate = async () => {
        try {
            // Ensure proper data formatting with UTC normalization
            const dataToSend = {
                ...formData,
                request_date: toUTCDate(formData.request_date),
                follow_up_date: formData.follow_up_date ? toUTCDate(formData.follow_up_date) : "",
                response_date: formData.response_date ? toUTCDate(formData.response_date) : null,
                gratitude_date: formData.gratitude_date ? toUTCDate(formData.gratitude_date) : null,
                job_application_id: formData.job_application_id || null,
                referral_success: formData.referral_success || null,
                relationship_impact: formData.relationship_impact || null,
                gratitude_sent: formData.gratitude_sent || false
            };
            
            if (editing && editingReferralId) {
                await ReferralsAPI.update(editingReferralId, dataToSend);
            } else {
                await ReferralsAPI.add(dataToSend);
            }
            await fetchData();
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving referral:", error);
        }
    };

    const handleEdit = (referral) => {
        setEditing(true);
        setEditingReferralId(referral._id);
        setFormData({
            contact_id: referral.contact_id || "",
            job_id: referral.job_id || null,
            job_application_id: referral.job_application_id || null,
            company: referral.company || "",
            position: referral.position || "",
            request_date: referral.request_date ? toLocalDateString(referral.request_date) : toLocalDateString(new Date()),
            status: referral.status || "pending",
            message: referral.message || referral.personalized_message || "",
            follow_up_date: referral.follow_up_date ? toLocalDateString(referral.follow_up_date) : "",
            response_date: referral.response_date ? toLocalDateString(referral.response_date) : "",
            referral_success: referral.referral_success || null,
            notes: referral.notes || "",
            relationship_impact: referral.relationship_impact || null,
            gratitude_sent: referral.gratitude_sent || false,
            gratitude_date: referral.gratitude_date ? toLocalDateString(referral.gratitude_date) : ""
        });
        setShowModal(true);
    };

    const handleDelete = async (referralId) => {
        if (window.confirm("Are you sure you want to delete this referral request?")) {
            try {
                await ReferralsAPI.delete(referralId);
                await fetchData();
            } catch (error) {
                console.error("Failed to delete referral:", error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            contact_id: "",
            job_id: null,
            job_application_id: null,
            company: "",
            position: "",
            request_date: toLocalDateString(new Date()),
            status: "pending",
            message: "",
            follow_up_date: "",
            response_date: "",
            referral_success: null,
            notes: "",
            relationship_impact: null,
            gratitude_sent: false,
            gratitude_date: ""
        });
        setEditing(false);
        setEditingReferralId(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "warning";
            case "requested": return "info";
            case "accepted": return "success";
            case "declined": return "danger";
            case "completed": return "primary";
            default: return "secondary";
        }
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
            position: "",
            status: "",
            contact: ""
        });
    };

    if (loading) {
        return (
            <Container fluid className="dashboard-gradient min-vh-100 py-4">
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
                    <Spinner animation="border" variant="light" className="mb-3" />
                    <p className="text-white fs-5">Loading referral requests...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="dashboard-gradient min-vh-100 py-4">
            <h1 className="text-center text-white fw-bold mb-5 display-4">
                Referral Request Management
            </h1>

            <Row>
                <Col xs={12} className="mb-4">
                    <Button onClick={() => { setShowModal(true); resetForm(); }}>
                        + New Referral Request
                    </Button>
                </Col>
            </Row>

            <Row className="py-4">
                <Col xs={12} className="mb-4">
                    <div className="filter-section">
                        <h5 className="text-white mb-3">Filter Referrals</h5>
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
                                <input
                                    type="text"
                                    placeholder="Search by position..."
                                    name="position"
                                    value={filterText.position}
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
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="requested">Requested</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="declined">Declined</option>
                                    <option value="completed">Completed</option>
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
                    {filterReferrals(referrals).length === 0 ? (
                        <p className="text-white">
                            {Object.values(filterText).some(val => val !== "") 
                                ? "No referral requests match your search." 
                                : "No referral requests found. Start by adding one!"}
                        </p>
                    ) : (
                        <div className="contact-display">
                            {filterReferrals(referrals).map(referral => (
                                <Card key={referral._id} className="contact-card">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Card.Title as="h4">{referral.company}</Card.Title>
                                            <Badge bg={getStatusColor(referral.status)}>
                                                {referral.status?.charAt(0).toUpperCase() + referral.status?.slice(1)}
                                            </Badge>
                                        </div>

                                        <Card.Subtitle as="h6" className="mb-3 text-muted">
                                            {referral.position} • {getContactName(referral.contact_id)}
                                        </Card.Subtitle>

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <small className="text-muted">
                                                <strong>Requested:</strong> {formatLocalDate(referral.request_date)}
                                            </small>
                                            {referral.follow_up_date && (
                                                <small className="text-muted">
                                                    <strong>Follow-up:</strong> {formatLocalDate(referral.follow_up_date)}
                                                </small>
                                            )}
                                        </div>

                                        {referral.message && (
                                            <div className="mb-3">
                                                <p className="mb-0 small text-muted">{referral.message.substring(0, 100)}...</p>
                                            </div>
                                        )}

                                        <div className="card-actions">
                                            <Button className="action-button edit-btn" onClick={() => handleEdit(referral)}>
                                                ✏️ Edit
                                            </Button>
                                            <Button className="action-button delete-btn" onClick={() => handleDelete(referral._id)}>
                                                🗑️ Delete
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Col>
            </Row>

            <ReferralManagementForm
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
