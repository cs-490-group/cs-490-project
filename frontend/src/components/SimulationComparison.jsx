import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
} from "chart.js";
import CareerSimulationAPI from "../api/career_simulation";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
};

export default function SimulationComparison({ offers = [], show, onHide }) {
    const [selectedOfferIds, setSelectedOfferIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [scenario, setScenario] = useState("expected");
    const [simulationYears, setSimulationYears] = useState(10);
    const [annualRaisePercent, setAnnualRaisePercent] = useState(3);

    const toggleOffer = (offerId) => {
        setSelectedOfferIds((prev) => {
            if (prev.includes(offerId)) return prev.filter((x) => x !== offerId);
            return [...prev, offerId];
        });
    };

    const handleCompare = async () => {
        try {
            setLoading(true);
            setError(null);
            setResult(null);

            if (selectedOfferIds.length < 2) {
                setError("Select at least 2 offers to compare.");
                return;
            }

            const payload = {
                offer_ids: selectedOfferIds,
                simulation_years: simulationYears,
                annual_raise_percent: annualRaisePercent,
            };

            const data = await CareerSimulationAPI.compareOffers(payload);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || "Failed to compare simulations");
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!result?.offers?.length) return null;

        const offersOut = result.offers;
        const years = offersOut[0]?.scenarios?.[scenario]?.total_comp_by_year?.length || 0;
        const labels = Array.from({ length: years }, (_, i) => `Year ${i}`);

        const palette = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#a855f7"]; 

        const datasets = offersOut.map((o, idx) => {
            const series = o?.scenarios?.[scenario]?.total_comp_by_year || [];
            return {
                label: `${o.company || "Offer"} (${o.job_title || ""})`,
                data: series,
                borderColor: palette[idx % palette.length],
                backgroundColor: palette[idx % palette.length],
                tension: 0.25,
            };
        });

        return { labels, datasets };
    }, [result, scenario]);

    const tableRows = useMemo(() => {
        if (!result?.offers?.length) return [];

        return result.offers.map((o) => {
            const series = o?.scenarios?.[scenario]?.total_comp_by_year || [];
            const total5 = series.length >= 6 ? series.slice(1, 6).reduce((a, b) => a + b, 0) : null;
            const total10 = series.length >= 11 ? series.slice(1, 11).reduce((a, b) => a + b, 0) : null;
            const peak = o?.scenarios?.[scenario]?.peak_salary;

            return {
                offerId: o.offer_id,
                company: o.company,
                jobTitle: o.job_title,
                total5,
                total10,
                peak,
            };
        });
    }, [result, scenario]);

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Compare Career Salary Growth</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Row className="mb-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Scenario</Form.Label>
                            <Form.Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                                <option value="conservative">Conservative</option>
                                <option value="expected">Expected</option>
                                <option value="optimistic">Optimistic</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Projection Years</Form.Label>
                            <Form.Select value={simulationYears} onChange={(e) => setSimulationYears(parseInt(e.target.value, 10))}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Annual Raise % (expected)</Form.Label>
                            <Form.Control
                                type="number"
                                value={annualRaisePercent}
                                onChange={(e) => setAnnualRaisePercent(parseFloat(e.target.value))}
                                step="0.1"
                                min="0"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Card className="mb-3">
                    <Card.Header>Select Offers to Compare</Card.Header>
                    <Card.Body>
                        <Row>
                            {offers.map((o) => (
                                <Col md={6} lg={4} key={o._id} className="mb-2">
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedOfferIds.includes(o._id)}
                                        onChange={() => toggleOffer(o._id)}
                                        label={`${o.company} - ${o.job_title}`}
                                    />
                                </Col>
                            ))}
                        </Row>
                        <Button variant="primary" onClick={handleCompare} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : "Compare"}
                        </Button>
                    </Card.Body>
                </Card>

                {chartData && (
                    <Card className="mb-3">
                        <Card.Header>Total Compensation Growth</Card.Header>
                        <Card.Body style={{ height: 360 }}>
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: "bottom" } },
                                }}
                            />
                        </Card.Body>
                    </Card>
                )}

                {tableRows.length > 0 && (
                    <Card>
                        <Card.Header>Totals</Card.Header>
                        <Card.Body>
                            <Table responsive bordered>
                                <thead>
                                    <tr>
                                        <th>Offer</th>
                                        <th>5-Year Total</th>
                                        <th>10-Year Total</th>
                                        <th>Peak Salary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.map((r) => (
                                        <tr key={r.offerId}>
                                            <td>{r.company} - {r.jobTitle}</td>
                                            <td>{formatCurrency(r.total5)}</td>
                                            <td>{formatCurrency(r.total10)}</td>
                                            <td>{formatCurrency(r.peak)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}
