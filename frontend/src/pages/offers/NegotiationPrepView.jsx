import React, { useState } from "react";
import {
    Container,
    Card,
    Row,
    Col,
    Alert,
    Button,
    Badge,
    Table,
    Accordion,
    Spinner,
} from "react-bootstrap";
import OffersAPI from "../../api/offers";
import "../../styles/offers.css";

export default function NegotiationPrepView({ offer, onBack }) {
    const [activeTab, setActiveTab] = useState("summary");
    const [downloading, setDownloading] = useState(null);
    const [error, setError] = useState(null);

    const prep = offer?.negotiation_prep;

    if (!prep) {
        return (
            <Alert variant="warning">
                No negotiation preparation available. Generate one first.
            </Alert>
        );
    }

    const handleExport = async (format) => {
        try {
            setDownloading(format);
            setError(null);

            let response;
            if (format === "pdf") {
                response = await OffersAPI.exportPDF(offer._id);
            } else if (format === "docx") {
                response = await OffersAPI.exportDOCX(offer._id);
            } else if (format === "json") {
                response = await OffersAPI.exportJSON(offer._id);
            }

            const url = URL.createObjectURL(response);
            const link = document.createElement("a");
            link.href = url;
            link.download = `salary_negotiation_${offer.company}.${
                format === "docx" ? "docx" : format === "pdf" ? "pdf" : "json"
            }`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Error exporting ${format}:`, err);
            setError(`Failed to export ${format.toUpperCase()}`);
        } finally {
            setDownloading(null);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>💼 Salary Negotiation Preparation</h3>
                <Button variant="outline-secondary" size="sm" onClick={onBack}>
                    ← Back to Offer
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="bg-light mb-4">
                <Card.Body>
                    <h6 className="mb-3">📥 Export Your Negotiation Guide</h6>
                    <div className="d-flex gap-2 flex-wrap">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleExport("pdf")}
                            disabled={downloading}
                        >
                            {downloading === "pdf" ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Exporting...
                                </>
                            ) : (
                                "📄 Export as PDF"
                            )}
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleExport("docx")}
                            disabled={downloading}
                        >
                            {downloading === "docx" ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Exporting...
                                </>
                            ) : (
                                "📘 Export as Word"
                            )}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleExport("json")}
                            disabled={downloading}
                        >
                            {downloading === "json" ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Exporting...
                                </>
                            ) : (
                                "📊 Export as JSON"
                            )}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <div className="nav nav-tabs mb-4" role="tablist">
                {[
                    { id: "summary", label: "📋 Summary" },
                    { id: "market", label: "📊 Market Data" },
                    { id: "talking", label: "💬 Talking Points" },
                    { id: "scripts", label: "📝 Scripts" },
                    { id: "counter", label: "⚔️ Counter-Offers" },
                    { id: "timing", label: "⏱️ Timing Strategy" },
                    { id: "confidence", label: "💪 Confidence Exercises" },
                    { id: "best", label: "✓ Best Practices" },
                    { id: "warnings", label: "⚠️ Warnings" },
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
                {activeTab === "summary" && (
                    <div>
                        {/* Offer Analysis Card */}
                        {prep.offer_analysis && (
                            <Card className="mb-4 border-primary">
                                <Card.Body>
                                    <h5 className="mb-4">💼 Confident Negotiation Backed by Data</h5>

                                    {/* Offer Score */}
                                    <Row className="mb-4">
                                        <Col md={6} className="text-center">
                                            <div className="p-3 bg-light rounded">
                                                <h2 className="mb-2">
                                                    <span style={{ fontSize: "3em", color: "#0066cc" }}>
                                                        {prep.offer_analysis.offer_score || 0}
                                                    </span>
                                                    <span className="text-muted">/100</span>
                                                </h2>
                                                <p className="mb-0 fw-bold">Offer Score</p>
                                                <small className="text-muted">
                                                    {prep.offer_analysis.score_interpretation || "Evaluating..."}
                                                </small>
                                            </div>
                                        </Col>

                                        {/* Market Percentile */}
                                        <Col md={6} className="text-center">
                                            <div className="p-3 bg-light rounded">
                                                <h3 className="mb-2" style={{ color: "#28a745" }}>
                                                    {prep.offer_analysis.market_percentile || 50}
                                                    <sup>th</sup>
                                                </h3>
                                                <p className="mb-0 fw-bold">Market Percentile</p>
                                                <small className="text-muted">
                                                    {prep.offer_analysis.market_percentile >= 75
                                                        ? "Excellent Position"
                                                        : prep.offer_analysis.market_percentile >= 50
                                                        ? "Competitive Position"
                                                        : "Below Market"}
                                                </small>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Offer vs Market */}
                                    {prep.offer_analysis.vs_median && (
                                        <Alert
                                            variant={
                                                prep.offer_analysis.vs_median === "above"
                                                    ? "success"
                                                    : prep.offer_analysis.vs_median === "at"
                                                    ? "info"
                                                    : "warning"
                                            }
                                            className="mb-3"
                                        >
                                            <strong>Position vs Market Median:</strong>{" "}
                                            {prep.offer_analysis.vs_median === "above"
                                                ? "✅ Above Market Median"
                                                : prep.offer_analysis.vs_median === "at"
                                                ? "✓ At Market Median"
                                                : "⚠️ Below Market Median"}
                                        </Alert>
                                    )}

                                    {/* Component Breakdown */}
                                    {prep.offer_analysis.breakdown && (
                                        <div className="mb-3">
                                            <h6 className="mb-2">Component Scores</h6>
                                            <Table borderless responsive size="sm" className="mb-0">
                                                <tbody>
                                                    <tr className="border-bottom">
                                                        <td className="fw-bold">Base Salary</td>
                                                        <td className="text-end">
                                                            <Badge bg="primary">
                                                                {prep.offer_analysis.breakdown.salary || 0}/100
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-bottom">
                                                        <td className="fw-bold">Bonus</td>
                                                        <td className="text-end">
                                                            <Badge bg="secondary">
                                                                {prep.offer_analysis.breakdown.bonus || 0}/100
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr className="border-bottom">
                                                        <td className="fw-bold">Equity</td>
                                                        <td className="text-end">
                                                            <Badge bg="info">
                                                                {prep.offer_analysis.breakdown.equity || 0}/100
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Benefits</td>
                                                        <td className="text-end">
                                                            <Badge bg="success">
                                                                {prep.offer_analysis.breakdown.benefits || 0}/100
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Negotiation Readiness Assessment */}
                        {prep.readiness_assessment && (
                            <Card className="mb-4">
                                <Card.Body>
                                    <h5 className="mb-3">
                                        💪 Negotiation Readiness Assessment
                                    </h5>

                                    <Row className="mb-3">
                                        <Col md={8}>
                                            <div>
                                                <p className="mb-2">
                                                    <strong>Readiness Score:</strong>{" "}
                                                    <Badge
                                                        bg={
                                                            prep.readiness_assessment.readiness_score >= 85 ? "success" :
                                                            prep.readiness_assessment.readiness_score >= 70 ? "info" :
                                                            prep.readiness_assessment.readiness_score >= 50 ? "warning" :
                                                            "danger"
                                                        }
                                                    >
                                                        {prep.readiness_assessment.readiness_score || 0}/100
                                                    </Badge>
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Status:</strong>{" "}
                                                    <span style={{ fontSize: "1.2em" }}>
                                                        {prep.readiness_assessment.emoji || ""}
                                                    </span>{" "}
                                                    {prep.readiness_assessment.interpretation}
                                                </p>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Readiness Components */}
                                    {prep.readiness_assessment.components && (
                                        <div className="mb-3">
                                            <h6 className="mb-2">Preparation Materials</h6>
                                            <Table borderless responsive size="sm" className="mb-0">
                                                <tbody>
                                                    {prep.readiness_assessment.components.talking_points && (
                                                        <tr className="border-bottom">
                                                            <td>✓ Talking Points</td>
                                                            <td className="text-end">
                                                                {prep.readiness_assessment.components.talking_points.count} points
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {prep.readiness_assessment.components.market_data && (
                                                        <tr className="border-bottom">
                                                            <td>✓ Market Data</td>
                                                            <td className="text-end">Ready</td>
                                                        </tr>
                                                    )}
                                                    {prep.readiness_assessment.components.scripts && (
                                                        <tr className="border-bottom">
                                                            <td>✓ Negotiation Scripts</td>
                                                            <td className="text-end">
                                                                {prep.readiness_assessment.components.scripts.count} scripts
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {prep.readiness_assessment.components.exercises && (
                                                        <tr>
                                                            <td>✓ Confidence Exercises</td>
                                                            <td className="text-end">
                                                                {prep.readiness_assessment.components.exercises.count} exercises
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Advice */}
                                    {prep.readiness_assessment.advice && (
                                        <Alert variant="light" className="mb-0">
                                            <strong>💡 Advice:</strong> {prep.readiness_assessment.advice}
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Negotiation Focus Recommendations */}
                        {prep.negotiation_focus && (
                            <Card className="mb-4 border-warning">
                                <Card.Body>
                                    <h5 className="mb-3">
                                        🎯 Recommended Negotiation Strategy
                                    </h5>

                                    {/* Primary Focus */}
                                    <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#fff3cd" }}>
                                        <h6 className="mb-2">
                                            {prep.negotiation_focus.emoji || "🎯"} Primary Focus: <strong>{prep.negotiation_focus.primary || "Not determined"}</strong>
                                        </h6>
                                        <p className="mb-2">{prep.negotiation_focus.reasoning}</p>

                                        {/* Urgency Badge */}
                                        {prep.negotiation_focus.urgency && (
                                            <Badge
                                                bg={
                                                    prep.negotiation_focus.urgency === "HIGH"
                                                        ? "danger"
                                                        : prep.negotiation_focus.urgency === "MEDIUM"
                                                        ? "warning"
                                                        : "success"
                                                }
                                                className="me-2"
                                            >
                                                {prep.negotiation_focus.urgency} Priority
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Secondary Focus */}
                                    {prep.negotiation_focus.secondary && prep.negotiation_focus.secondary.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="mb-2">Secondary Focus Areas</h6>
                                            <div>
                                                {prep.negotiation_focus.secondary.map((item, idx) => (
                                                    <Badge key={idx} bg="light" text="dark" className="me-2 mb-2">
                                                        {item}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Items */}
                                    {prep.negotiation_focus.action_items && prep.negotiation_focus.action_items.length > 0 && (
                                        <div>
                                            <h6 className="mb-2">Action Items</h6>
                                            <ol className="ps-3 mb-0">
                                                {prep.negotiation_focus.action_items.map((item, idx) => (
                                                    <li key={idx} className="mb-1">
                                                        {item}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Executive Summary Section */}
                        {prep.executive_summary && (
                            <Card className="mb-4">
                                <Card.Body>
                                    <h6 className="mb-3">📝 Executive Summary</h6>
                                    <p style={{ whiteSpace: "pre-wrap" }}>
                                        {prep.executive_summary}
                                    </p>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === "market" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">Market Salary Research</h6>
                            <Table borderless responsive className="mb-0">
                                <tbody>
                                    <tr className="border-bottom">
                                        <td className="fw-bold">Market Median</td>
                                        <td>
                                            {formatCurrency(
                                                prep.market_salary_data.median_salary
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-bottom">
                                        <td className="fw-bold">25th Percentile</td>
                                        <td>
                                            {formatCurrency(
                                                prep.market_salary_data.percentile_25
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-bottom">
                                        <td className="fw-bold">75th Percentile</td>
                                        <td>
                                            {formatCurrency(
                                                prep.market_salary_data.percentile_75
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-bottom">
                                        <td className="fw-bold">90th Percentile</td>
                                        <td>
                                            {formatCurrency(
                                                prep.market_salary_data.percentile_90
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-bottom">
                                        <td className="fw-bold">Industry Average</td>
                                        <td>
                                            {formatCurrency(
                                                prep.market_salary_data.industry_average
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-bottom">
                                        <td className="fw-bold">Salary Trend</td>
                                        <td>
                                            <Badge bg="info">
                                                {prep.market_salary_data.salary_trend}
                                            </Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Company Size Factor</td>
                                        <td>
                                            {prep.market_salary_data.company_size_factor}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>

                            {prep.market_salary_data.comparable_companies && (
                                <>
                                    <h6 className="mt-4 mb-2">Comparable Companies</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {prep.market_salary_data.comparable_companies.map(
                                            (company, idx) => (
                                                <Badge key={idx} bg="light" text="dark">
                                                    {company}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "talking" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">💬 Key Talking Points</h6>
                            <Accordion defaultActiveKey="0">
                                {(prep.talking_points || []).map((point, idx) => {
                                    // Handle both old string format and new object format
                                    const pointText = typeof point === 'string' ? point : (point?.point || '');
                                    const category = typeof point === 'string' ? 'experience' : (point?.category || 'experience');
                                    const supportingData = typeof point === 'string' ? null : point?.supporting_data;
                                    const confidenceLevel = typeof point === 'string' ? null : point?.confidence_level;

                                    return (
                                        <Accordion.Item eventKey={String(idx)} key={idx}>
                                            <Accordion.Header>
                                                <Badge
                                                    bg={
                                                        category === "market_data"
                                            ? "info"
                                            : category === "experience"
                                            ? "success"
                                            : category === "achievement"
                                            ? "warning"
                                            : "secondary"
                                                    }
                                                    className="me-2"
                                                >
                                                    {category}
                                                </Badge>
                                                {pointText ? pointText.substring(0, 60) + '...' : 'No text'}
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <p>
                                                    <strong>Point:</strong> {pointText}
                                                </p>
                                                {supportingData && (
                                                    <p>
                                                        <strong>Supporting Data:</strong>{" "}
                                                        {supportingData}
                                                    </p>
                                                )}
                                                {confidenceLevel && (
                                                    <p>
                                                        <strong>Confidence Level:</strong>{" "}
                                                        {confidenceLevel}/10
                                                    </p>
                                                )}
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    );
                                })}
                            </Accordion>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "scripts" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">📝 Negotiation Scripts</h6>
                            {!prep.negotiation_scripts || !Array.isArray(prep.negotiation_scripts) || prep.negotiation_scripts.length === 0 ? (
                                <p className="text-muted">No negotiation scripts available.</p>
                            ) : (
                                <Accordion defaultActiveKey="0">
                                    {prep.negotiation_scripts.map((script, idx) => {
                                        // Handle both string keys (old format) and object format
                                        const scenario = script?.scenario || `Scenario ${idx + 1}`;
                                        const openingStatement = script?.opening_statement || '';
                                        const talkingPoints = script?.talking_points || [];
                                        const potential_objections = script?.potential_objections || [];
                                        const your_responses = script?.your_responses || [];
                                        const closingStatement = script?.closing_statement || '';
                                        const toneTips = script?.tone_tips || '';

                                        return (
                                            <Accordion.Item eventKey={String(idx)} key={idx}>
                                                <Accordion.Header>{scenario}</Accordion.Header>
                                                <Accordion.Body>
                                                    {openingStatement && (
                                                        <>
                                                            <h6 className="mt-3 mb-2">Opening Statement</h6>
                                                            <p className="bg-light p-3 rounded">
                                                                "{openingStatement}"
                                                            </p>
                                                        </>
                                                    )}

                                                    {talkingPoints.length > 0 && (
                                                        <>
                                                            <h6 className="mt-3 mb-2">Talking Points</h6>
                                                            <ul>
                                                                {talkingPoints.map((tp, tidx) => (
                                                                    <li key={tidx}>{tp || 'Point'}</li>
                                                                ))}
                                                            </ul>
                                                        </>
                                                    )}

                                                    {potential_objections &&
                                                        potential_objections.length > 0 && (
                                                            <>
                                                                <h6 className="mt-3 mb-2">
                                                                    Potential Objections & Responses
                                                                </h6>
                                                                {potential_objections.map(
                                                                    (obj, oidx) => (
                                                                        <div key={oidx} className="mb-2">
                                                                            <strong>Objection:</strong>{" "}
                                                                            {obj}
                                                                            <br />
                                                                            <strong>Your Response:</strong>{" "}
                                                                            {your_responses?.[oidx] || 'Response'}
                                                                        </div>
                                                                    )
                                                                )}
                                                            </>
                                                        )}

                                                    {closingStatement && (
                                                        <>
                                                            <h6 className="mt-3 mb-2">Closing Statement</h6>
                                                            <p className="bg-light p-3 rounded">
                                                                "{closingStatement}"
                                                            </p>
                                                        </>
                                                    )}

                                                    {toneTips && (
                                                        <>
                                                            <h6 className="mt-3 mb-2">Tone Tips</h6>
                                                            <p>{toneTips}</p>
                                                        </>
                                                    )}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        );
                                    })}
                                </Accordion>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "counter" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">⚔️ Counter-Offer Templates</h6>
                            {!prep.counter_offer_templates || !Array.isArray(prep.counter_offer_templates) || prep.counter_offer_templates.length === 0 ? (
                                <p className="text-muted">No counter-offer templates available.</p>
                            ) : (
                                <Table responsive>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Metric</th>
                                            <th>Offered</th>
                                            <th>Market</th>
                                            <th>Suggested Counter</th>
                                            <th>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prep.counter_offer_templates.map((template, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-bold">
                                                    {template?.metric || 'N/A'}
                                                </td>
                                                <td>{template?.offered_value || 'N/A'}</td>
                                                <td>{template?.market_value || 'N/A'}</td>
                                                <td className="fw-bold text-success">
                                                    {template?.suggested_counter || 'N/A'}
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={
                                                            template?.priority_level === "critical"
                                                                ? "danger"
                                                                : template?.priority_level === "high"
                                                                ? "warning"
                                                                : "info"
                                                        }
                                                    >
                                                        {template?.priority_level || 'medium'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "timing" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">⏱️ Timing Strategy</h6>
                            <p style={{ whiteSpace: "pre-wrap" }}>
                                {prep.timing_strategy}
                            </p>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "confidence" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">💪 Confidence Building Exercises</h6>
                            {prep.confidence_exercises && prep.confidence_exercises.length > 0 ? (
                                <Accordion defaultActiveKey="0">
                                    {prep.confidence_exercises.map((exercise, idx) => (
                                        <Accordion.Item eventKey={String(idx)} key={idx}>
                                            <Accordion.Header>
                                                {idx + 1}. {exercise.title || `Exercise ${idx + 1}`}
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <p>
                                                    <strong>Description:</strong> {exercise.description || exercise}
                                                </p>
                                                {exercise.duration && (
                                                    <p>
                                                        <strong>Duration:</strong> {exercise.duration}
                                                    </p>
                                                )}
                                                {exercise.tips && (
                                                    <p>
                                                        <strong>Tips:</strong> {exercise.tips}
                                                    </p>
                                                )}
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            ) : (
                                <p className="text-muted">No confidence exercises available.</p>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "best" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">✓ Best Practices</h6>
                            <ol>
                                {prep.best_practices.map((practice, idx) => (
                                    <li key={idx} className="mb-2">
                                        {practice}
                                    </li>
                                ))}
                            </ol>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "warnings" && (
                    <Card className="mb-4">
                        <Card.Body>
                            {prep.common_mistakes && (
                                <>
                                    <h6 className="mb-3">⚠️ Common Mistakes to Avoid</h6>
                                    <ul className="mb-4">
                                        {prep.common_mistakes.map((mistake, idx) => (
                                            <li key={idx} className="mb-2">
                                                {mistake}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {prep.red_flags && (
                                <>
                                    <h6 className="mb-3">🚩 Red Flags in Offers</h6>
                                    <ul>
                                        {prep.red_flags.map((flag, idx) => (
                                            <li key={idx} className="mb-2">
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                )}
            </div>
        </div>
    );
}
