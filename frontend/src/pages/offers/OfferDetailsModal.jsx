import React, { useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    Table,
    Alert,
    Form,
} from "react-bootstrap";
import OffersAPI from "../../api/offers";

export default function OfferDetailsModal({
    offer,
    onBack,
    onEdit,
    onDelete,
    onGeneratePrep,
    onViewPrep,
}) {
    const [activeTab, setActiveTab] = useState("details");
    const [newStatus, setNewStatus] = useState(offer.offer_status);
    const [updating, setUpdating] = useState(false);

    const formatCurrency = (value) => {
        if (!value) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleStatusChange = async () => {
        if (newStatus === offer.offer_status) return;

        try {
            setUpdating(true);
            await OffersAPI.updateStatus(offer._id, newStatus);
            offer.offer_status = newStatus;
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
            setNewStatus(offer.offer_status);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadgeVariant = (status) => {
        const variants = {
            received: "info",
            negotiating: "warning",
            accepted: "success",
            rejected: "danger",
            withdrawn: "secondary",
            expired: "dark",
        };
        return variants[status] || "primary";
    };

    const daysUntilDeadline = () => {
        if (!offer.decision_deadline) return null;
        const deadline = new Date(offer.decision_deadline);
        const today = new Date();
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const days = daysUntilDeadline();

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">{offer.job_title}</h2>
                    <p className="text-muted mb-0">{offer.company} • {offer.location}</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={onBack}>
                        ← Back
                    </Button>
                </div>
            </div>

            <Card className="bg-light mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col>
                            <h5 className="mb-0 text-primary">
                                {formatCurrency(offer.offered_salary_details?.base_salary)}
                            </h5>
                            <small className="text-muted">Base Salary</small>
                        </Col>
                        <Col>
                            <Form.Select
                                size="sm"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                disabled={updating}
                            >
                                <option value="received">Received</option>
                                <option value="negotiating">Negotiating</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </Form.Select>
                            <Button
                                size="sm"
                                variant="link"
                                onClick={handleStatusChange}
                                disabled={updating || newStatus === offer.offer_status}
                                className="p-0 mt-1"
                            >
                                {updating ? "Updating..." : "Update Status"}
                            </Button>
                        </Col>
                        <Col className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={
                                        offer.negotiation_prep
                                            ? onViewPrep
                                            : onGeneratePrep
                                    }
                                >
                                    {offer.negotiation_prep
                                        ? "💼 View Negotiation Prep"
                                        : "📊 Generate Negotiation Prep"}
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={onEdit}>
                                    Edit
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                "Are you sure you want to delete this offer?"
                                            )
                                        ) {
                                            onDelete();
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {days !== null && (
                <Alert
                    variant={
                        days < 0
                            ? "danger"
                            : days <= 3
                            ? "warning"
                            : "info"
                    }
                >
                    <strong>⏰ Decision Deadline:</strong>{" "}
                    {new Date(offer.decision_deadline).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}{" "}
                    {days < 0
                        ? `(${Math.abs(days)} days overdue!)`
                        : days === 0
                        ? "(TODAY!)"
                        : days === 1
                        ? "(TOMORROW)"
                        : `(${days} days remaining)`}
                </Alert>
            )}

            <div className="nav nav-tabs mb-4" role="tablist">
                {[
                    { id: "details", label: "📋 Details" },
                    { id: "compensation", label: "💰 Compensation" },
                    { id: "benefits", label: "🎁 Benefits" },
                    { id: "notes", label: "📝 Notes" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === "details" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <Table borderless responsive>
                                <tbody>
                                    <tr>
                                        <td className="fw-bold" style={{ width: "200px" }}>
                                            Job Title
                                        </td>
                                        <td>{offer.job_title}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Company</td>
                                        <td>{offer.company}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Location</td>
                                        <td>{offer.location}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Status</td>
                                        <td>
                                            <Badge
                                                bg={getStatusBadgeVariant(offer.offer_status)}
                                            >
                                                {offer.offer_status}
                                            </Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Offer Received</td>
                                        <td>
                                            {new Date(
                                                offer.offer_received_date
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Decision Deadline</td>
                                        <td>
                                            {offer.decision_deadline
                                                ? new Date(
                                                      offer.decision_deadline
                                                  ).toLocaleDateString()
                                                : "Not set"}
                                        </td>
                                    </tr>
                                    {offer.negotiation_prep && (
                                        <tr>
                                            <td className="fw-bold">Negotiation Prep</td>
                                            <td>
                                                <Badge bg="success">✓ Generated</Badge>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "compensation" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">Salary & Bonus Structure</h6>
                            <Table borderless responsive>
                                <tbody>
                                    <tr>
                                        <td className="fw-bold">Base Salary</td>
                                        <td>
                                            <h5 className="text-primary mb-0">
                                                {formatCurrency(
                                                    offer.offered_salary_details?.base_salary
                                                )}
                                            </h5>
                                        </td>
                                    </tr>
                                    {offer.offered_salary_details?.signing_bonus && (
                                        <tr>
                                            <td className="fw-bold">Signing Bonus</td>
                                            <td>
                                                {formatCurrency(
                                                    offer.offered_salary_details
                                                        .signing_bonus
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {offer.offered_salary_details?.annual_bonus && (
                                        <tr>
                                            <td className="fw-bold">Annual Bonus</td>
                                            <td>
                                                {offer.offered_salary_details.annual_bonus}
                                            </td>
                                        </tr>
                                    )}
                                    {offer.offered_salary_details?.stock_options && (
                                        <tr>
                                            <td className="fw-bold">Stock Options</td>
                                            <td>
                                                {offer.offered_salary_details.stock_options}
                                            </td>
                                        </tr>
                                    )}
                                    {offer.offered_salary_details?.rsus && (
                                        <tr>
                                            <td className="fw-bold">RSUs</td>
                                            <td>{offer.offered_salary_details.rsus}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "benefits" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">Benefits & Flexibility</h6>
                            <Table borderless responsive>
                                <tbody>
                                    {offer.offered_salary_details?.pto_days && (
                                        <tr>
                                            <td className="fw-bold">PTO Days</td>
                                            <td>
                                                {offer.offered_salary_details.pto_days} days/year
                                            </td>
                                        </tr>
                                    )}
                                    {offer.offered_salary_details?.remote_flexibility && (
                                        <tr>
                                            <td className="fw-bold">Remote Flexibility</td>
                                            <td>
                                                {offer.offered_salary_details
                                                    .remote_flexibility}
                                            </td>
                                        </tr>
                                    )}
                                    {offer.offered_salary_details?.relocation_package && (
                                        <tr>
                                            <td className="fw-bold">Relocation Package</td>
                                            <td>
                                                {offer.offered_salary_details
                                                    .relocation_package}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            {offer.offered_salary_details?.other_benefits &&
                                offer.offered_salary_details.other_benefits.length > 0 && (
                                    <>
                                        <h6 className="mt-4 mb-3">Other Benefits</h6>
                                        <ul>
                                            {offer.offered_salary_details.other_benefits.map(
                                                (benefit, idx) => (
                                                    <li key={idx}>{benefit}</li>
                                                )
                                            )}
                                        </ul>
                                    </>
                                )}
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "notes" && (
                    <Card className="mb-4">
                        <Card.Body>
                            {offer.internal_notes ? (
                                <p style={{ whiteSpace: "pre-wrap" }}>
                                    {offer.internal_notes}
                                </p>
                            ) : (
                                <p className="text-muted">No notes added yet.</p>
                            )}
                        </Card.Body>
                    </Card>
                )}
            </div>
        </div>
    );
}
