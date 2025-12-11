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
        <Card className="shadow-sm border-0 mb-2 hover-shadow" style={{ cursor: "pointer" }}>
            <Card.Body style={{ padding: "12px 16px" }}>
                {/* Header: Title and Salary */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                            <h6 className="mb-0" style={{ fontSize: "1rem", fontWeight: "600" }}>
                                {offer.job_title}
                            </h6>
                            <Badge
                                bg={getStatusBadgeVariant(offer.offer_status)}
                                style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                            >
                                {offer.offer_status}
                            </Badge>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "2px" }}>
                            {offer.company} • {offer.location}
                        </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: "12px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0066cc", marginBottom: "2px" }}>
                            {formatCurrency(offer.offered_salary_details?.base_salary || 0)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#999" }}>Base</div>
                    </div>
                </div>

                {/* Compensation breakdown - inline */}
                {(offer.offered_salary_details?.signing_bonus ||
                    offer.offered_salary_details?.annual_bonus ||
                    offer.offered_salary_details?.pto_days ||
                    offer.offered_salary_details?.remote_flexibility) && (
                    <div className="d-flex flex-wrap gap-1 mb-2" style={{ fontSize: "0.8rem" }}>
                        {offer.offered_salary_details?.signing_bonus && (
                            <Badge bg="light" text="dark" style={{ padding: "2px 6px", fontSize: "0.75rem" }}>
                                💵 {formatCurrency(offer.offered_salary_details.signing_bonus)}
                            </Badge>
                        )}
                        {offer.offered_salary_details?.annual_bonus && (
                            <Badge bg="light" text="dark" style={{ padding: "2px 6px", fontSize: "0.75rem" }}>
                                📊 {offer.offered_salary_details.annual_bonus}
                            </Badge>
                        )}
                        {offer.offered_salary_details?.pto_days && (
                            <Badge bg="light" text="dark" style={{ padding: "2px 6px", fontSize: "0.75rem" }}>
                                🏖️ {offer.offered_salary_details.pto_days}d
                            </Badge>
                        )}
                        {offer.offered_salary_details?.remote_flexibility && (
                            <Badge bg="light" text="dark" style={{ padding: "2px 6px", fontSize: "0.75rem" }}>
                                🌍 {offer.offered_salary_details.remote_flexibility}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Decision Deadline - compact */}
                {days !== null && (
                    <div
                        className={`alert mb-2 ${
                            days < 0
                                ? "alert-danger"
                                : days <= 3
                                ? "alert-warning"
                                : "alert-info"
                        }`}
                        style={{
                            padding: "6px 10px",
                            marginBottom: "8px",
                            fontSize: "0.8rem",
                            borderRadius: "4px",
                            borderLeft: "3px solid"
                        }}
                    >
                        ⏰{" "}
                        {days < 0
                            ? `${Math.abs(days)}d overdue`
                            : days === 0
                            ? "TODAY"
                            : days === 1
                            ? "TOMORROW"
                            : `${days}d left`}
                    </div>
                )}

                {/* Action Buttons - compact */}
                <div className="d-flex gap-1 flex-wrap" style={{ marginTop: "8px" }}>
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onSelect(offer)}
                        style={{ fontSize: "0.8rem", padding: "4px 10px", flex: 1, minWidth: "100px" }}
                    >
                        View
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
                                style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                            >
                                Gen
                            </Button>
                        </OverlayTrigger>
                    )}

                    {offer.negotiation_prep && (
                        <Badge bg="success" style={{ fontSize: "0.75rem", padding: "4px 8px", display: "flex", alignItems: "center" }}>
                            ✓ Ready
                        </Badge>
                    )}

                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => onEdit(offer)}
                        style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                    >
                        Edit
                    </Button>

                    <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onDelete(offer._id)}
                        style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                    >
                        Del
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}
