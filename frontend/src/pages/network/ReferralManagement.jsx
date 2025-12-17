import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form, Modal } from "react-bootstrap";
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
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [activeFollowUpReferral, setActiveFollowUpReferral] = useState(null);
    const [followUpMessage, setFollowUpMessage] = useState("");
    const [followUpStatus, setFollowUpStatus] = useState("sent");
    const [followUpKind, setFollowUpKind] = useState("standard");
    const [savingFollowUp, setSavingFollowUp] = useState(false);
    const [followUpError, setFollowUpError] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [editingFollowUp, setEditingFollowUp] = useState(null);
    const [editFollowUpMessage, setEditFollowUpMessage] = useState("");
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

    const logContactInteraction = async (contactId, notes) => {
        if (!contactId || !notes) {
            return;
        }
        try {
            const contact = contacts.find(c => c._id === contactId);
            if (!contact) {
                return;
            }
            const now = new Date().toISOString();
            const newInteraction = {
                date: now,
                type: "message",
                notes
            };
            const updatedHistory = [
                ...(contact.interaction_history || []),
                newInteraction
            ];
            const updatePayload = {
                interaction_history: updatedHistory,
                last_interaction_date: now
            };
            await NetworksAPI.update(contactId, updatePayload);

            setContacts(prevContacts =>
                prevContacts.map(c =>
                    c._id === contactId
                        ? { ...c, interaction_history: updatedHistory, last_interaction_date: now }
                        : c
                )
            );
        } catch (error) {
            console.error("Failed to log contact interaction:", error);
        }
    };

    const isOnOrAfterToday = (utcDateString) => {
        if (!utcDateString) return false;
        const date = new Date(utcDateString);
        if (isNaN(date.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cmp = new Date(date.getTime());
        cmp.setHours(0, 0, 0, 0);
        return cmp.getTime() <= today.getTime();
    };

    const hasSentFollowUpOfKind = (referral, kind) => {
        if (!referral || !Array.isArray(referral.follow_ups)) return false;
        return referral.follow_ups.some(f => f.status === "sent" && (!kind || f.kind === kind));
    };

    const shouldShowRequestAlert = (referral) => {
        if (!referral?.request_date) return false;
        if (referral.status !== "pending") return false;
        return isOnOrAfterToday(referral.request_date);
    };

    const shouldShowStandardFollowUpAlert = (referral) => {
        if (!referral?.follow_up_date) return false;
        if (referral.status !== "requested") return false;
        if (hasSentFollowUpOfKind(referral, "standard")) return false;
        return isOnOrAfterToday(referral.follow_up_date);
    };

    const shouldShowThankYouAlert = (referral) => {
        if (!referral?.follow_up_date) return false;
        if (!["accepted", "completed"].includes(referral.status)) return false;
        if (hasSentFollowUpOfKind(referral, "thank_you")) return false;
        return isOnOrAfterToday(referral.follow_up_date);
    };

    const openFollowUpModal = (referral, kind = "standard") => {
        if (!referral) return;
        const contactName = getContactName(referral.contact_id);
        let defaultMessage;
        if (kind === "thank_you") {
            defaultMessage = `Hi ${contactName},\n\nThank you so much for your help with the referral for the ${referral.position} role at ${referral.company}. I really appreciate your support and the time you took to assist me.\n\nThanks again!`;
        } else {
            defaultMessage = `Hi ${contactName},\n\nI wanted to follow up on my referral request for the ${referral.position} role at ${referral.company}. I just wanted to check if you had any updates or needed any more information from me.\n\nThank you again for your help!`;
        }
        setActiveFollowUpReferral(referral);
        setFollowUpMessage(defaultMessage);
        setFollowUpStatus("sent");
        setFollowUpKind(kind);
        setFollowUpError(null);
        setShowFollowUpModal(true);
    };

    const handleSendFollowUp = async () => {
        if (!activeFollowUpReferral || !followUpMessage.trim()) {
            setFollowUpError("Please enter a follow-up message.");
            return;
        }
        try {
            setSavingFollowUp(true);
            setFollowUpError(null);
            const newFollowUp = {
                date: new Date().toISOString(),
                status: followUpStatus,
                message: followUpMessage.trim(),
                kind: followUpKind
            };
            const existing = Array.isArray(activeFollowUpReferral.follow_ups)
                ? activeFollowUpReferral.follow_ups
                : [];
            const updatedFollowUps = [...existing, newFollowUp];
            // Send full ReferralRequest payload to satisfy backend schema
            await ReferralsAPI.update(activeFollowUpReferral._id, {
                contact_id: activeFollowUpReferral.contact_id,
                job_id: activeFollowUpReferral.job_id || null,
                job_application_id: activeFollowUpReferral.job_application_id || null,
                company: activeFollowUpReferral.company,
                position: activeFollowUpReferral.position,
                request_date: activeFollowUpReferral.request_date,
                status: activeFollowUpReferral.status,
                message: activeFollowUpReferral.message,
                follow_up_date: activeFollowUpReferral.follow_up_date,
                response_date: activeFollowUpReferral.response_date || null,
                referral_success: activeFollowUpReferral.referral_success || null,
                notes: activeFollowUpReferral.notes || "",
                relationship_impact: activeFollowUpReferral.relationship_impact || null,
                gratitude_sent: activeFollowUpReferral.gratitude_sent || false,
                gratitude_date: activeFollowUpReferral.gratitude_date || null,
                follow_ups: updatedFollowUps
            });

            if (followUpStatus === "sent") {
                const interactionNote =
                    followUpKind === "thank_you"
                        ? `Referral thank-you message sent for ${activeFollowUpReferral.position} at ${activeFollowUpReferral.company}.`
                        : `Referral follow-up sent for ${activeFollowUpReferral.position} at ${activeFollowUpReferral.company}.`;
                await logContactInteraction(
                    activeFollowUpReferral.contact_id,
                    interactionNote
                );
            }

            await fetchData();
            setShowFollowUpModal(false);
            setActiveFollowUpReferral(null);
            setFollowUpMessage("");
        } catch (error) {
            console.error("Failed to send follow-up:", error);
            setFollowUpError("Failed to save follow-up. Please try again.");
        } finally {
            setSavingFollowUp(false);
        }
    };

    const handleAddOrUpdate = async () => {
        try {
            const isEditingExisting = editing && editingReferralId;
            let previousStatus = null;
            if (isEditingExisting) {
                const existing = referrals.find(r => r._id === editingReferralId);
                previousStatus = existing?.status || null;
            }

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
            
            if (isEditingExisting) {
                await ReferralsAPI.update(editingReferralId, dataToSend);
            } else {
                await ReferralsAPI.add(dataToSend);
            }
            await fetchData();
            setShowModal(false);
            resetForm();

            const newStatus = formData.status;
            const contactIdForInteraction = formData.contact_id;
            const statusIsTerminal = ["requested", "accepted", "declined", "completed"].includes(newStatus);

            // Log interaction for new referral creation
            if (!isEditingExisting && contactIdForInteraction) {
                await logContactInteraction(
                    contactIdForInteraction,
                    `Referral requested for ${formData.position} at ${formData.company}.`
                );
            }

            // Log interaction for status changes
            if (contactIdForInteraction && statusIsTerminal) {
                if (!isEditingExisting || previousStatus !== newStatus) {
                    await logContactInteraction(
                        contactIdForInteraction,
                        `Referral status set to ${newStatus} for ${formData.position} at ${formData.company}.`
                    );
                }
            }
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

    const handleReferralClick = (referral) => {
        console.log("Card click triggered", referral);
        setSelectedReferral(referral);
        setShowDetailModal(true);
    };

    const handleEditFollowUp = (followUp, index) => {
        console.log("Edit follow-up triggered", followUp, index);
        setEditingFollowUp(index);
        setEditFollowUpMessage(followUp.message);
    };

    const handleSaveFollowUpEdit = async () => {
        if (!selectedReferral || editingFollowUp === null || !editFollowUpMessage.trim()) {
            return;
        }
        
        try {
            const updatedFollowUps = [...selectedReferral.follow_ups];
            updatedFollowUps[editingFollowUp] = {
                ...updatedFollowUps[editingFollowUp],
                message: editFollowUpMessage.trim()
            };
            
            await ReferralsAPI.update(selectedReferral._id, {
                contact_id: selectedReferral.contact_id,
                job_id: selectedReferral.job_id || null,
                job_application_id: selectedReferral.job_application_id || null,
                company: selectedReferral.company,
                position: selectedReferral.position,
                request_date: selectedReferral.request_date,
                status: selectedReferral.status,
                message: selectedReferral.message,
                follow_up_date: selectedReferral.follow_up_date,
                response_date: selectedReferral.response_date || null,
                referral_success: selectedReferral.referral_success || null,
                notes: selectedReferral.notes || "",
                relationship_impact: selectedReferral.relationship_impact || null,
                gratitude_sent: selectedReferral.gratitude_sent || false,
                gratitude_date: selectedReferral.gratitude_date || null,
                follow_ups: updatedFollowUps
            });
            
            // Update local state
            setSelectedReferral(prev => ({
                ...prev,
                follow_ups: updatedFollowUps
            }));
            
            // Update referrals list
            setReferrals(prev => prev.map(r => 
                r._id === selectedReferral._id 
                    ? { ...r, follow_ups: updatedFollowUps }
                    : r
            ));
            
            setEditingFollowUp(null);
            setEditFollowUpMessage("");
        } catch (error) {
            console.error("Failed to update follow-up:", error);
        }
    };

    const handleCancelFollowUpEdit = () => {
        setEditingFollowUp(null);
        setEditFollowUpMessage("");
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
                <Col className="mb-4">
                    <Button onClick={() => { setShowModal(true); resetForm(); }} style={{margin:"auto"}}>
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
                                    aria-label="Filter by status"
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
                                <Card key={referral._id} className="contact-card referral-card-clickable" onClick={() => !showDetailModal && handleReferralClick(referral)} style={{ cursor: showDetailModal ? 'default' : 'pointer' }}>
                                    <Card.Body>
                                        {shouldShowRequestAlert(referral) && (
                                            <Alert variant="warning" className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>Time to send your referral request.</strong>
                                                        <div className="small">Request date has been reached for this opportunity.</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(referral); }}
                                                    >
                                                        Open request form
                                                    </Button>
                                                </div>
                                            </Alert>
                                        )}

                                        {shouldShowStandardFollowUpAlert(referral) && (
                                            <Alert variant="info" className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>Time to follow up.</strong>
                                                        <div className="small">Follow-up date has been reached for this referral.</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={(e) => { e.stopPropagation(); openFollowUpModal(referral, "standard"); }}
                                                    >
                                                        Compose follow-up
                                                    </Button>
                                                </div>
                                            </Alert>
                                        )}
                                        {shouldShowThankYouAlert(referral) && (
                                            <Alert variant="success" className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>Send a thank-you message.</strong>
                                                        <div className="small">This referral has been {referral.status}, it's a great time to thank your contact.</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={(e) => { e.stopPropagation(); openFollowUpModal(referral, "thank_you"); }}
                                                    >
                                                        Compose thank-you
                                                    </Button>
                                                </div>
                                            </Alert>
                                        )}
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

                                        {Array.isArray(referral.follow_ups) && referral.follow_ups.length > 0 && (
                                            <div className="mb-2 small text-info">
                                                
                                                {(() => {
                                                    const sentCount = referral.follow_ups.filter(f => f.status === "sent").length;
                                                    const totalCount = referral.follow_ups.length;
                                                    if (sentCount > 0) {
                                                        return `📧 ${sentCount} follow-up${sentCount !== 1 ? "s" : ""} sent (${totalCount} total)`;
                                                    }
                                                    return `📧 ${totalCount} follow-up${totalCount !== 1 ? "s" : ""} planned`;
                                                })()}
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

            <Modal
                show={showFollowUpModal}
                onHide={() => setShowFollowUpModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Referral Follow-Up</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activeFollowUpReferral && (
                        <div className="mb-3 small text-muted">
                            Following up on referral for <strong>{activeFollowUpReferral.position}</strong> at <strong>{activeFollowUpReferral.company}</strong>.
                        </div>
                    )}
                    {followUpError && (
                        <Alert variant="danger" className="mb-2">
                            {followUpError}
                        </Alert>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>Follow-up Message</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            value={followUpMessage}
                            onChange={(e) => setFollowUpMessage(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            value={followUpStatus}
                            onChange={(e) => setFollowUpStatus(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFollowUpModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSendFollowUp} disabled={savingFollowUp}>
                        {savingFollowUp ? "Saving..." : "Save Follow-Up"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Detailed Referral Modal */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Referral Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReferral && (
                        <div>
                            {/* Basic Information */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h5 className="text-primary mb-3">Basic Information</h5>
                                    <p><strong>Company:</strong> {selectedReferral.company}</p>
                                    <p><strong>Position:</strong> {selectedReferral.position}</p>
                                    <p><strong>Contact:</strong> {getContactName(selectedReferral.contact_id)}</p>
                                    <p><strong>Status:</strong> <Badge bg={getStatusColor(selectedReferral.status)}>{selectedReferral.status?.charAt(0).toUpperCase() + selectedReferral.status?.slice(1)}</Badge></p>
                                </Col>
                                <Col md={6}>
                                    <h5 className="text-primary mb-3">Timeline</h5>
                                    <p><strong>Request Date:</strong> {formatLocalDate(selectedReferral.request_date)}</p>
                                    {selectedReferral.follow_up_date && (
                                        <p><strong>Follow-up Date:</strong> {formatLocalDate(selectedReferral.follow_up_date)}</p>
                                    )}
                                    {selectedReferral.response_date && (
                                        <p><strong>Response Date:</strong> {formatLocalDate(selectedReferral.response_date)}</p>
                                    )}
                                    {selectedReferral.gratitude_date && (
                                        <p><strong>Thank You Sent:</strong> {formatLocalDate(selectedReferral.gratitude_date)}</p>
                                    )}
                                </Col>
                            </Row>

                            {/* Message */}
                            {selectedReferral.message && (
                                <div className="mb-4">
                                    <h5 className="text-primary mb-3">Referral Message</h5>
                                    <Card className="bg-light">
                                        <Card.Body>
                                            <p className="mb-0">{selectedReferral.message}</p>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedReferral.notes && (
                                <div className="mb-4">
                                    <h5 className="text-primary mb-3">Notes</h5>
                                    <Card className="bg-light">
                                        <Card.Body>
                                            <p className="mb-0">{selectedReferral.notes}</p>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}

                            {/* Follow-ups */}
                            {Array.isArray(selectedReferral.follow_ups) && selectedReferral.follow_ups.length > 0 && (
                                <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                                    <h5 className="text-primary mb-3">Follow-up History</h5>
                                    {selectedReferral.follow_ups.map((followUp, index) => (
                                        <Card key={index} className="mb-2" onClick={(e) => e.stopPropagation()}>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <Badge bg={followUp.status === "sent" ? "success" : "secondary"}>
                                                        {followUp.kind === "thank_you" ? "Thank You" : "Follow-up"}
                                                    </Badge>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <small className="text-muted">
                                                            {formatLocalDateTime(followUp.date)}
                                                        </small>
                                                        {editingFollowUp === index ? (
                                                            <div className="d-flex gap-1">
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="success"
                                                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveFollowUpEdit(); }}
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="secondary"
                                                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelFollowUpEdit(); }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline-primary"
                                                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleEditFollowUp(followUp, index); }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingFollowUp === index ? (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={3}
                                                            value={editFollowUpMessage}
                                                            onChange={(e) => setEditFollowUpMessage(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onFocus={(e) => e.stopPropagation()}
                                                            placeholder="Edit follow-up message..."
                                                            className="mb-2"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="mb-0">{followUp.message}</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="d-flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                    variant="primary" 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(selectedReferral); setShowDetailModal(false); }}
                                >
                                    Edit Referral
                                </Button>
                                {shouldShowStandardFollowUpAlert(selectedReferral) && (
                                    <Button 
                                        variant="info"
                                        onClick={(e) => { e.stopPropagation(); openFollowUpModal(selectedReferral, "standard"); setShowDetailModal(false); }}
                                    >
                                        Send Follow-up
                                    </Button>
                                )}
                                {shouldShowThankYouAlert(selectedReferral) && (
                                    <Button 
                                        variant="success"
                                        onClick={(e) => { e.stopPropagation(); openFollowUpModal(selectedReferral, "thank_you"); setShowDetailModal(false); }}
                                    >
                                        Send Thank You
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
