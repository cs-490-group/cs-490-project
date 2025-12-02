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
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">Executive Summary</h6>
                            <p style={{ whiteSpace: "pre-wrap" }}>
                                {prep.executive_summary}
                            </p>
                        </Card.Body>
                    </Card>
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
                                {prep.talking_points.map((point, idx) => (
                                    <Accordion.Item eventKey={String(idx)} key={idx}>
                                        <Accordion.Header>
                                            <Badge
                                                bg={
                                                    point.category === "market_data"
                                        ? "info"
                                        : point.category === "experience"
                                        ? "success"
                                        : point.category === "achievements"
                                        ? "warning"
                                        : "secondary"
                                                }
                                                className="me-2"
                                            >
                                                {point.category}
                                            </Badge>
                                            {point.point.substring(0, 60)}...
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <p>
                                                <strong>Point:</strong> {point.point}
                                            </p>
                                            {point.supporting_data && (
                                                <p>
                                                    <strong>Supporting Data:</strong>{" "}
                                                    {point.supporting_data}
                                                </p>
                                            )}
                                            {point.confidence_level && (
                                                <p>
                                                    <strong>Confidence Level:</strong>{" "}
                                                    {point.confidence_level}/10
                                                </p>
                                            )}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "scripts" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">📝 Negotiation Scripts</h6>
                            <Accordion defaultActiveKey="0">
                                {prep.negotiation_scripts.map((script, idx) => (
                                    <Accordion.Item eventKey={String(idx)} key={idx}>
                                        <Accordion.Header>{script.scenario}</Accordion.Header>
                                        <Accordion.Body>
                                            <h6 className="mt-3 mb-2">Opening Statement</h6>
                                            <p className="bg-light p-3 rounded">
                                                "{script.opening_statement}"
                                            </p>

                                            <h6 className="mt-3 mb-2">Talking Points</h6>
                                            <ul>
                                                {script.talking_points.map((tp, tidx) => (
                                                    <li key={tidx}>{tp}</li>
                                                ))}
                                            </ul>

                                            {script.potential_objections &&
                                                script.potential_objections.length > 0 && (
                                                    <>
                                                        <h6 className="mt-3 mb-2">
                                                            Potential Objections & Responses
                                                        </h6>
                                                        {script.potential_objections.map(
                                                            (obj, oidx) => (
                                                                <div key={oidx} className="mb-2">
                                                                    <strong>Objection:</strong>{" "}
                                                                    {obj}
                                                                    <br />
                                                                    <strong>Your Response:</strong>{" "}
                                                                    {script.your_responses[oidx]}
                                                                </div>
                                                            )
                                                        )}
                                                    </>
                                                )}

                                            <h6 className="mt-3 mb-2">Closing Statement</h6>
                                            <p className="bg-light p-3 rounded">
                                                "{script.closing_statement}"
                                            </p>

                                            {script.tone_tips && (
                                                <>
                                                    <h6 className="mt-3 mb-2">Tone Tips</h6>
                                                    <p>{script.tone_tips}</p>
                                                </>
                                            )}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        </Card.Body>
                    </Card>
                )}

                {activeTab === "counter" && (
                    <Card className="mb-4">
                        <Card.Body>
                            <h6 className="mb-3">⚔️ Counter-Offer Templates</h6>
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
                                                {template.metric}
                                            </td>
                                            <td>{template.offered_value}</td>
                                            <td>{template.market_value}</td>
                                            <td className="fw-bold text-success">
                                                {template.suggested_counter}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        template.priority_level === "critical"
                                                            ? "danger"
                                                            : template.priority_level === "high"
                                                            ? "warning"
                                                            : "info"
                                                    }
                                                >
                                                    {template.priority_level}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
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
