import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Row, Col, Card, Form, Badge } from "react-bootstrap";

export default function ContactSelectionModal({
    showModal,
    setShowModal,
    onContactSelect,
    selectedContactId,
    contacts,
    jobDetails
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchName, setSearchName] = useState("");
    const [searchCompany, setSearchCompany] = useState("");
    const [searchIndustry, setSearchIndustry] = useState("");
    const [searchRelationship, setSearchRelationship] = useState("");
    const [showOnlyOptimal, setShowOnlyOptimal] = useState(false);

    // Remove the checkbox for optimal suggestions since we're showing them automatically

    const scoredContacts = useMemo(() => {
        if (!contacts || contacts.length === 0) return [];
        return contacts.map(contact => {
            let score = 0;
            let reasons = [];
            if (jobDetails?.industry && contact.industry) {
                if (contact.industry.toLowerCase() === jobDetails.industry.toLowerCase()) {
                    score += 30;
                    reasons.push("Industry match");
                }
            }
            if (jobDetails?.company && contact.employment?.company) {
                if (contact.employment.company.toLowerCase() === jobDetails.company.toLowerCase()) {
                    score += 25;
                    reasons.push("Current employee");
                }
            }
            if (jobDetails?.company && contact.employment?.company) {
                const jobCompanyLower = jobDetails.company.toLowerCase();
                const contactCompanyLower = contact.employment.company.toLowerCase();
                const relatedPatterns = [
                    /\b(google|alphabet)\b/i,
                    /\b(microsoft|azure|office)\b/i,
                    /\b(amazon|aws)\b/i,
                    /\b(apple|ios|mac)\b/i,
                    /\b(meta|facebook|instagram)\b/i,
                    /\b(netflix|streaming)\b/i
                ];
                for (const pattern of relatedPatterns) {
                    if (pattern.test(jobCompanyLower) && pattern.test(contactCompanyLower)) {
                        score += 15;
                        reasons.push("Related company");
                        break;
                    }
                }
            }
            if (jobDetails?.title && contact.employment?.position) {
                const jobTitle = jobDetails.title.toLowerCase();
                const contactPosition = contact.employment.position.toLowerCase();
                const seniorRoles = [
                    'manager', 'director', 'vp', 'vice president', 'lead', 'principal',
                    'senior', 'sr.', 'head', 'chief', 'cto', 'ceo', 'cfo', 'coo'
                ];
                if (seniorRoles.some(role => contactPosition.includes(role))) {
                    score += 20;
                    reasons.push("Senior position");
                }
                const technicalRoles = [
                    'engineer', 'developer', 'architect', 'designer', 'product',
                    'analyst', 'consultant', 'specialist', 'expert'
                ];
                if (technicalRoles.some(role => contactPosition.includes(role))) {
                    score += 10;
                    reasons.push("Relevant role");
                }
            }
            if (contact.relationship_strength) {
                switch (contact.relationship_strength.toLowerCase()) {
                    case 'very strong':
                        score += 15;
                        reasons.push("Very strong relationship");
                        break;
                    case 'strong':
                        score += 10;
                        reasons.push("Strong relationship");
                        break;
                    case 'moderate':
                        score += 5;
                        reasons.push("Moderate relationship");
                        break;
                    default:
                        break;
                }
            }
            if (contact.last_interaction_date) {
                const daysSinceInteraction = Math.floor(
                    (new Date() - new Date(contact.last_interaction_date)) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceInteraction <= 30) {
                    score += 5;
                    reasons.push("Recent interaction");
                } else if (daysSinceInteraction <= 90) {
                    score += 2;
                    reasons.push("Recent-ish interaction");
                }
            }
            return { ...contact, score, reasons };
        });
    }, [contacts, jobDetails]);

    const filteredContacts = useMemo(() => {
        let filtered = scoredContacts;
        if (searchName) {
            filtered = filtered.filter(contact =>
                contact.name?.toLowerCase().includes(searchName.toLowerCase())
            );
        }
        if (searchCompany) {
            filtered = filtered.filter(contact =>
                contact.employment?.company?.toLowerCase().includes(searchCompany.toLowerCase())
            );
        }
        if (searchIndustry) {
            filtered = filtered.filter(contact =>
                contact.industry?.toLowerCase().includes(searchIndustry.toLowerCase())
            );
        }
        if (searchRelationship) {
            filtered = filtered.filter(contact =>
                contact.relationship_type?.toLowerCase().includes(searchRelationship.toLowerCase()) ||
                contact.relationship_strength?.toLowerCase().includes(searchRelationship.toLowerCase())
            );
        }
        return filtered;
    }, [scoredContacts, searchName, searchCompany, searchIndustry, searchRelationship]);

    const clearSearch = () => {
        setSearchName("");
        setSearchCompany("");
        setSearchIndustry("");
        setSearchRelationship("");
        setShowOnlyOptimal(false);
    };

    const handleContactSelect = (contact) => {
        onContactSelect(contact);
        setShowModal(false);
    };

    const handleClose = () => {
        setShowModal(false);
    };

    const isSelected = (contact) => {
        return selectedContactId && (contact._id === selectedContactId);
    };

    const getScoreColor = (score) => {
        if (score >= 50) return "success";
        if (score >= 30) return "warning";
        return "secondary";
    };

    const getRelationshipColor = (type) => {
        if (!type) return "secondary";
        switch (type.toLowerCase()) {
            case 'professional': return "primary";
            case 'personal': return "info";
            case 'academic': return "success";
            case 'mentor': return "warning";
            default: return "secondary";
        }
    };

    const getStrengthColor = (strength) => {
        if (!strength) return "secondary";
        switch (strength.toLowerCase()) {
            case 'very strong': return "success";
            case 'strong': return "info";
            case 'moderate': return "warning";
            case 'weak': return "danger";
            default: return "secondary";
        }
    };

    const sortedContacts = [...filteredContacts].sort((a, b) => b.score - a.score);
    const optimalContacts = sortedContacts.filter((_, index, arr) => {
        const threshold = Math.max(30, arr[Math.floor(arr.length * 0.2)]?.score || 0);
        return sortedContacts[index].score >= threshold;
    });

    const otherContacts = sortedContacts.filter(contact =>
        !optimalContacts.some(optimal => optimal._id === contact._id)
    );

    return (
        <Modal show={showModal} onHide={handleClose} size="xl" centered contentClassName="modal-centered-content">
            <Modal.Header closeButton>
                <Modal.Title>Select a Contact for Referral</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {jobDetails && (
                    <div className="mb-4">
                        <Card className="bg-light border-info">
                            <Card.Body className="py-3">
                                <h6 className="fw-bold mb-2">Referral Target</h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Position:</strong> {jobDetails.title}</p>
                                        <p className="mb-1"><strong>Company:</strong> {jobDetails.company}</p>
                                    </div>
                                    <div className="col-md-6">
                                        {jobDetails.industry && (
                                            <p className="mb-1"><strong>Industry:</strong> {jobDetails.industry}</p>
                                        )}
                                        {jobDetails.location && (
                                            <p className="mb-1"><strong>Location:</strong> {jobDetails.location}</p>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                )}
                {!loading && !error && contacts.length > 0 && (
                    <div className="mb-4">
                        <Row className="g-2 mb-2">
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by company..."
                                    value={searchCompany}
                                    onChange={(e) => setSearchCompany(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by industry..."
                                    value={searchIndustry}
                                    onChange={(e) => setSearchIndustry(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by relationship..."
                                    value={searchRelationship}
                                    onChange={(e) => setSearchRelationship(e.target.value)}
                                />
                            </Col>
                        </Row>
                        <Row className="g-2 align-items-center">
                            <Col md={12}>
                                {(searchName || searchCompany || searchIndustry || searchRelationship) && (
                                    <div className="d-flex justify-content-end align-items-center">
                                        <Button variant="outline-secondary" size="sm" onClick={clearSearch} className="me-2">
                                            Clear Filters
                                        </Button>
                                        <span className="text-muted">
                                            {filteredContacts.length} of {contacts.length} contacts
                                        </span>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </div>
                )}
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <p>No contacts found in your network.</p>
                        <p>Add some contacts first to be able to request referrals.</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <p>No contacts match your search criteria.</p>
                        <Button variant="outline-primary" onClick={clearSearch}>
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="contact-selection-grid">
                        {/* Suggested Contacts Section */}
                        {optimalContacts.length > 0 && (
                            <div className="mb-4">
                                <h5 className="text-primary mb-3">
                                    <strong>Suggested ({optimalContacts.length})</strong>
                                </h5>
                                <div className="g-3 mb-4" style={{ display: "flex", flexDirection: "row", overflow: "auto", gap: "0.5rem" }}>
                                    {optimalContacts.map((contact) => (
                                        <Card key={contact._id}
                                            className={`contact-card h-100 cursor-pointer ${isSelected(contact) ? 'border-primary bg-light' : ''}`}
                                            onClick={() => handleContactSelect(contact)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <Card.Title as="h6" className="mb-1">
                                                        {contact.name}
                                                    </Card.Title>
                                                    {isSelected(contact) && (
                                                        <div className="badge bg-primary">Selected</div>
                                                    )}
                                                </div>

                                                {/* Score Badge */}
                                                {jobDetails && contact.score > 0 && (
                                                    <div className="mb-2">
                                                        <Badge bg={getScoreColor(contact.score)}>
                                                            Score: {contact.score}
                                                        </Badge>
                                                        {contact.reasons.length > 0 && (
                                                            <div className="mt-1">
                                                                {contact.reasons.map((reason, index) => (
                                                                    <Badge key={index} bg="light" text="dark" className="me-1 mb-1" style={{ fontSize: '0.7em' }}>
                                                                        {reason}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <Card.Subtitle as="div" className="mb-2 text-muted">
                                                    <strong>{contact.email}</strong>
                                                </Card.Subtitle>

                                                {/* Employment Info */}
                                                {contact.employment?.company && (
                                                    <div className="mb-1">
                                                        <small className="text-muted">
                                                            <strong>Company:</strong> {contact.employment.company}
                                                        </small>
                                                    </div>
                                                )}

                                                {contact.employment?.position && (
                                                    <div className="mb-1">
                                                        <small className="text-muted">
                                                            <strong>Position:</strong> {contact.employment.position}
                                                        </small>
                                                    </div>
                                                )}

                                                {contact.industry && (
                                                    <div className="mb-1">
                                                        <small className="text-muted">
                                                            <strong>Industry:</strong> {contact.industry}
                                                        </small>
                                                    </div>
                                                )}

                                                {/* Relationship Info */}
                                                <div className="mt-2">
                                                    {contact.relationship_type && (
                                                        <Badge bg={getRelationshipColor(contact.relationship_type)} className="me-1">
                                                            {contact.relationship_type}
                                                        </Badge>
                                                    )}
                                                    {contact.relationship_strength && (
                                                        <Badge bg={getStrengthColor(contact.relationship_strength)}>
                                                            {contact.relationship_strength}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Last Interaction */}
                                                {contact.last_interaction_date && (
                                                    <div className="mt-2">
                                                        <small className="text-muted">
                                                            <strong>Last interaction:</strong> {new Date(contact.last_interaction_date).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>

                                {/* Horizontal separator */}
                                {otherContacts.length > 0 && (
                                    <hr className="my-4" />
                                )}
                            </div>
                        )}

                        {/* Other Contacts Section */}
                        {otherContacts.length > 0 && (
                            <div>
                                <h5 className="text-muted mb-3">
                                    <strong>Others ({otherContacts.length})</strong>
                                </h5>
                                <div style={{ display: "flex", flexDirection: "row", overflow: "auto", gap: "0.5rem" }}>
                                    {otherContacts.map((contact) => (
                                        <Card
                                            className={`contact-card h-100 cursor-pointer ${isSelected(contact) ? 'border-primary bg-light' : ''}`}
                                            onClick={() => handleContactSelect(contact)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <Card.Title as="h6" className="mb-1">
                                                        {contact.name}
                                                    </Card.Title>
                                                    {isSelected(contact) && (
                                                        <div className="badge bg-primary">Selected</div>
                                                    )}
                                                </div>

                                                {/* Score Badge (if any) */}
                                                {jobDetails && contact.score > 0 && (
                                                    <div className="mb-2">
                                                        <Badge bg={getScoreColor(contact.score)}>
                                                            Score: {contact.score}
                                                        </Badge>
                                                        {contact.reasons.length > 0 && (
                                                            <div className="mt-1">
                                                                {contact.reasons.map((reason, index) => (
                                                                    <Badge key={index} bg="light" text="dark" className="me-1 mb-1" style={{ fontSize: '0.7em' }}>
                                                                        {reason}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <Card.Subtitle as="div" className="mb-2 text-muted">
                                                    <strong>{contact.email}</strong>
                                                </Card.Subtitle>

                                                {/* Employment Info */}
                                                {contact.employment?.company && (
                                                    <div className="mb-1">
                                                        <small className="text-muted">
                                                            <strong>Company:</strong> {contact.employment.company}
                                                        </small>
                                                    </div>
                                                )}

                                                {contact.employment?.position && (
                                                    <div className="mb-1">
                                                        <small className="text-muted">
                                                            <strong>Position:</strong> {contact.employment.position}
                                                        </small>
                                                    </div>
                                                )}

                                                {contact.industry && (
                                                    <div className="mb-1">
                                                        <small className="text-muted">
                                                            <strong>Industry:</strong> {contact.industry}
                                                        </small>
                                                    </div>
                                                )}

                                                {/* Relationship Info */}
                                                <div className="mt-2">
                                                    {contact.relationship_type && (
                                                        <Badge bg={getRelationshipColor(contact.relationship_type)} className="me-1">
                                                            {contact.relationship_type}
                                                        </Badge>
                                                    )}
                                                    {contact.relationship_strength && (
                                                        <Badge bg={getStrengthColor(contact.relationship_strength)}>
                                                            {contact.relationship_strength}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Last Interaction */}
                                                {contact.last_interaction_date && (
                                                    <div className="mt-2">
                                                        <small className="text-muted">
                                                            <strong>Last interaction:</strong> {new Date(contact.last_interaction_date).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
