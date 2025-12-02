import React from "react";
import { Card, Badge, Button, Row, Col, Tooltip, OverlayTrigger } from "react-bootstrap";

export default function OfferCard({
    offer,
    onSelect,
    onEdit,
    onDelete,
    onGenNegotiationPrep,
}) {
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
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
        <Card className="shadow-sm border-0 mb-3 hover-shadow" style={{ cursor: "pointer" }}>
            <Card.Body>
                <Row className="mb-3">
                    <Col>
                        <h5 className="mb-1">
                            {offer.job_title}
                            <Badge
                                bg={getStatusBadgeVariant(offer.offer_status)}
                                className="ms-2"
                            >
                                {offer.offer_status}
                            </Badge>
                        </h5>
                        <p className="text-muted mb-0">{offer.company}</p>
                        <small className="text-secondary">{offer.location}</small>
                    </Col>
                    <Col md={3} className="text-end">
                        <h6 className="text-primary mb-0">
                            {formatCurrency(offer.offered_salary_details?.base_salary || 0)}
                        </h6>
                        <small className="text-muted">Base Salary</small>
                    </Col>
                </Row>

                {/* Compensation breakdown */}
                <Row className="mb-3">
                    <Col>
                        <div className="d-flex flex-wrap gap-2">
                            {offer.offered_salary_details?.signing_bonus && (
                                <Badge bg="light" text="dark" className="fs-7">
                                    💵 Signing: {formatCurrency(offer.offered_salary_details.signing_bonus)}
                                </Badge>
                            )}
                            {offer.offered_salary_details?.annual_bonus && (
                                <Badge bg="light" text="dark" className="fs-7">
                                    📊 Bonus: {offer.offered_salary_details.annual_bonus}
                                </Badge>
                            )}
                            {offer.offered_salary_details?.pto_days && (
                                <Badge bg="light" text="dark" className="fs-7">
                                    🏖️ PTO: {offer.offered_salary_details.pto_days} days
                                </Badge>
                            )}
                            {offer.offered_salary_details?.remote_flexibility && (
                                <Badge bg="light" text="dark" className="fs-7">
                                    🌍 {offer.offered_salary_details.remote_flexibility}
                                </Badge>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* Decision Deadline */}
                {days !== null && (
                    <Row className="mb-3">
                        <Col>
                            <div
                                className={`alert mb-0 ${
                                    days < 0
                                        ? "alert-danger"
                                        : days <= 3
                                        ? "alert-warning"
                                        : "alert-info"
                                }`}
                            >
                                <small>
                                    ⏰ Decision Deadline:{" "}
                                    {new Date(offer.decision_deadline).toLocaleDateString()} (
                                    {days < 0
                                        ? `${Math.abs(days)} days overdue`
                                        : days === 0
                                        ? "TODAY"
                                        : days === 1
                                        ? "TOMORROW"
                                        : `${days} days left`}
                                    )
                                </small>
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Action Buttons */}
                <Row className="mt-3 pt-2 border-top">
                    <Col>
                        <div className="d-flex gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => onSelect(offer)}
                                className="flex-grow-1"
                            >
                                View Details
                            </Button>

                            {!offer.negotiation_prep && (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={
                                        <Tooltip>
                                            Generate salary negotiation materials
                                        </Tooltip>
                                    }
                                >
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => onGenNegotiationPrep(offer._id)}
                                        className="flex-grow-1"
                                    >
                                        Generate Prep
                                    </Button>
                                </OverlayTrigger>
                            )}

                            {offer.negotiation_prep && (
                                <Badge bg="success" className="d-flex align-items-center p-2">
                                    ✓ Prep Ready
                                </Badge>
                            )}

                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => onEdit(offer)}
                            >
                                Edit
                            </Button>

                            <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => onDelete(offer._id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}
