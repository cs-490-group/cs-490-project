import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Table,
    Form,
    Badge,
    Alert,
    Spinner,
} from "react-bootstrap";
import OffersAPI from "../../api/offers";

export default function OfferComparisonView({ offers: allOffers, onBack }) {
    const [selectedOffers, setSelectedOffers] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const formatCurrency = (value) => {
        if (!value && value !== 0) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleToggleOffer = (offerId) => {
        setSelectedOffers(prev => {
            if (prev.includes(offerId)) {
                return prev.filter(id => id !== offerId);
            } else if (prev.length < 5) {
                return [...prev, offerId];
            } else {
                alert("Maximum 5 offers can be compared at once");
                return prev;
            }
        });
    };

    const handleCompare = async () => {
        if (selectedOffers.length < 2) {
            setError("Please select at least 2 offers to compare");
            return;
        }

        // Check if all selected offers have been evaluated
        const unevaluatedOffers = selectedOffers.filter(id => {
            const offer = allOffers.find(o => o._id === id);
            return !offer?.offer_score?.weighted_total_score;
        });

        if (unevaluatedOffers.length > 0) {
            setError(`${unevaluatedOffers.length} offer(s) haven't been evaluated yet. Please go to the Evaluation tab for each offer and calculate total compensation and offer score first.`);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await OffersAPI.compareOffers(selectedOffers);
            setComparison(response.data);
        } catch (err) {
            setError("Failed to compare offers: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getRecommendationBadge = (rec) => {
        const variant = {
            "Strong Accept": "success",
            "Accept": "primary",
            "Negotiate": "warning",
            "Consider Declining": "danger"
        }[rec] || "secondary";

        return <Badge bg={variant}>{rec}</Badge>;
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Side-by-Side Offer Comparison</h2>
                <Button variant="outline-secondary" onClick={onBack}>
                    ← Back to Offers
                </Button>
            </div>

            <Alert variant="info" className="mb-4">
                <strong>📊 How to compare offers:</strong>
                <ol className="mb-0 mt-2">
                    <li>For each offer, go to the <strong>Evaluation</strong> tab and calculate total compensation and offer score</li>
                    <li>Come back here and select 2-5 evaluated offers</li>
                    <li>Click "Compare" to see side-by-side analysis</li>
                </ol>
            </Alert>

            {/* Offer Selection */}
            <Card className="mb-4">
                <Card.Header>
                    <h6 className="mb-0">Select Offers to Compare (2-5 offers)</h6>
                </Card.Header>
                <Card.Body>
                    <Row>
                        {allOffers.map(offer => {
                            const isSelected = selectedOffers.includes(offer._id);
                            const hasScore = offer.offer_score?.weighted_total_score;

                            return (
                                <Col md={6} lg={4} key={offer._id} className="mb-3">
                                    <Card
                                        className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggleOffer(offer._id)}
                                    >
                                        <Card.Body>
                                            <Form.Check
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleOffer(offer._id)}
                                                label=""
                                                className="float-end"
                                            />
                                            <h6>{offer.company}</h6>
                                            <p className="text-muted small mb-1">{offer.job_title}</p>
                                            <p className="mb-0"><strong>{formatCurrency(offer.offered_salary_details?.base_salary)}</strong></p>
                                            {!hasScore && (
                                                <Badge bg="warning" className="mt-2">Not Evaluated</Badge>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    {selectedOffers.length > 0 && (
                        <Alert variant="secondary" className="mt-3 mb-2">
                            <strong>Selected:</strong> {selectedOffers.length} offer(s) |
                            <strong className="ms-2">Evaluated:</strong> {selectedOffers.filter(id => {
                                const offer = allOffers.find(o => o._id === id);
                                return offer?.offer_score?.weighted_total_score;
                            }).length} of {selectedOffers.length}
                        </Alert>
                    )}

                    <Button
                        variant="primary"
                        onClick={handleCompare}
                        disabled={selectedOffers.length < 2 || loading}
                        className="mt-3"
                    >
                        {loading ? <Spinner size="sm" /> : `Compare ${selectedOffers.length} Selected Offers`}
                    </Button>
                </Card.Body>
            </Card>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Comparison Results */}
            {comparison && (
                <>
                    {/* Winner Banner */}
                    {comparison.winner && (
                        <Alert variant="success" className="text-center">
                            <h5 className="mb-2">🏆 Recommended Offer</h5>
                            <h4>{comparison.winner.company} - {comparison.winner.job_title}</h4>
                            <p className="mb-1">Weighted Score: <strong>{comparison.winner.weighted_total_score}/100</strong></p>
                            {getRecommendationBadge(comparison.winner.recommendation)}
                        </Alert>
                    )}

                    {/* Comparison Matrix */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Detailed Comparison</h5>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive bordered hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Metric</th>
                                        {comparison.offers.map((offer, idx) => (
                                            <th key={idx} className="text-center">
                                                {offer.company}
                                                <br />
                                                <small className="text-muted">{offer.location}</small>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="fw-bold">Job Title</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center">{offer.job_title}</td>
                                        ))}
                                    </tr>

                                    <tr className="table-info">
                                        <td className="fw-bold">Base Salary</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center fw-bold">
                                                {formatCurrency(offer.base_salary)}
                                            </td>
                                        ))}
                                    </tr>

                                    <tr className="table-success">
                                        <td className="fw-bold">Year 1 Total Comp</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center fw-bold">
                                                {formatCurrency(offer.year_1_total)}
                                            </td>
                                        ))}
                                    </tr>

                                    <tr className="table-success">
                                        <td className="fw-bold">Annual Total Comp</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center fw-bold">
                                                {formatCurrency(offer.annual_total)}
                                            </td>
                                        ))}
                                    </tr>

                                    <tr className="table-success">
                                        <td className="fw-bold">4-Year Total Comp</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center fw-bold">
                                                {formatCurrency(offer.four_year_total)}
                                            </td>
                                        ))}
                                    </tr>

                                    <tr>
                                        <td className="fw-bold">Financial Score</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center">
                                                {offer.financial_score}/100
                                            </td>
                                        ))}
                                    </tr>

                                    <tr>
                                        <td className="fw-bold">Non-Financial Score</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center">
                                                {offer.non_financial_score}/100
                                            </td>
                                        ))}
                                    </tr>

                                    <tr className="table-warning">
                                        <td className="fw-bold">Weighted Total Score</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center fw-bold">
                                                {offer.weighted_total_score}/100
                                            </td>
                                        ))}
                                    </tr>

                                    <tr>
                                        <td className="fw-bold">Recommendation</td>
                                        {comparison.offers.map((offer, idx) => (
                                            <td key={idx} className="text-center">
                                                {getRecommendationBadge(offer.recommendation)}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </>
            )}
        </Container>
    );
}
