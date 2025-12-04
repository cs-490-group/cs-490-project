import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col, Alert } from "react-bootstrap";
import OffersAPI from "../../api/offers";
import JobsAPI from "../../api/jobs";

export default function OfferForm({ offer, onSave, onCancel }) {
    const [jobTitle, setJobTitle] = useState(offer?.job_title || "");
    const [company, setCompany] = useState(offer?.company || "");
    const [location, setLocation] = useState(offer?.location || "");
    const [baseSalary, setBaseSalary] = useState(
        offer?.offered_salary_details?.base_salary || ""
    );
    const [signingBonus, setSigningBonus] = useState(
        offer?.offered_salary_details?.signing_bonus || ""
    );
    const [annualBonus, setAnnualBonus] = useState(
        offer?.offered_salary_details?.annual_bonus || ""
    );
    const [stockOptions, setStockOptions] = useState(
        offer?.offered_salary_details?.stock_options || ""
    );
    const [rsus, setRsus] = useState(offer?.offered_salary_details?.rsus || "");
    const [ptoDays, setPtoDays] = useState(
        offer?.offered_salary_details?.pto_days || ""
    );
    const [remoteFlexibility, setRemoteFlexibility] = useState(
        offer?.offered_salary_details?.remote_flexibility || ""
    );
    const [relocationPackage, setRelocationPackage] = useState(
        offer?.offered_salary_details?.relocation_package || ""
    );
    const [otherBenefits, setOtherBenefits] = useState(
        offer?.offered_salary_details?.other_benefits?.join(", ") || ""
    );
    const [offerReceivedDate, setOfferReceivedDate] = useState(
        offer?.offer_received_date || new Date().toISOString().split("T")[0]
    );
    const [decisionDeadline, setDecisionDeadline] = useState(
        offer?.decision_deadline || ""
    );
    const [internalNotes, setInternalNotes] = useState(
        offer?.internal_notes || ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [jobId, setJobId] = useState(offer?.job_id || "");
    const [loadingJobs, setLoadingJobs] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await JobsAPI.getAll();
                setJobs(response.data || []);
            } catch (err) {
                console.error("Error loading jobs:", err);
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchJobs();
    }, []);

    const handleJobSelect = (selectedJobId) => {
        setJobId(selectedJobId);
        if (selectedJobId) {
            const selectedJob = jobs.find(j => j._id === selectedJobId);
            if (selectedJob) {
                setJobTitle(selectedJob.job_title || "");
                const companyName = typeof selectedJob.company === "string" ? selectedJob.company : selectedJob.company?.name || "";
                setCompany(companyName);
                setLocation(selectedJob.location || "");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const offerData = {
                job_title: jobTitle,
                company,
                location,
                job_id: jobId || offer?.job_id || "",
                offered_salary_details: {
                    base_salary: baseSalary ? parseInt(baseSalary) : null,
                    signing_bonus: signingBonus ? parseInt(signingBonus) : null,
                    annual_bonus: annualBonus || null,
                    stock_options: stockOptions || null,
                    rsus: rsus || null,
                    pto_days: ptoDays ? parseInt(ptoDays) : null,
                    remote_flexibility: remoteFlexibility || null,
                    relocation_package: relocationPackage || null,
                    other_benefits: otherBenefits
                        ? otherBenefits
                              .split(",")
                              .map((b) => b.trim())
                              .filter((b) => b)
                        : [],
                },
                offer_received_date: offerReceivedDate,
                decision_deadline: decisionDeadline || null,
                offer_status: offer?.offer_status || "received",
                internal_notes: internalNotes,
            };

            if (offer?._id) {
                await OffersAPI.update(offer._id, offerData);
            } else {
                await OffersAPI.create(offerData);
            }

            onSave();
        } catch (err) {
            console.error("Error saving offer:", err);
            setError(err.response?.data?.detail || "Failed to save offer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                    {offer ? "Edit Job Offer" : "Add New Job Offer"}
                </h5>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <h6 className="mb-3 text-secondary">
                        <strong>📋 Offer Details</strong>
                    </h6>

                    <Form.Group className="mb-3">
                        <Form.Label>Import From Job Posting</Form.Label>
                        <Form.Select
                            value={jobId}
                            onChange={(e) => handleJobSelect(e.target.value)}
                            disabled={loadingJobs}
                        >
                            <option value="">-- Select a job to auto-fill details --</option>
                            {jobs.map((job) => {
                                const companyName = typeof job.company === "string" ? job.company : job.company?.name || "";
                                return (
                                    <option key={job._id} value={job._id}>
                                        {job.job_title} at {companyName} ({job.location})
                                    </option>
                                );
                            })}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Select a job from your saved postings to auto-fill job title, company, and location
                        </Form.Text>
                    </Form.Group>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Job Title <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Senior Software Engineer"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Company <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Google"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Location <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., San Francisco, CA"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Offer Received Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={offerReceivedDate}
                                    onChange={(e) => setOfferReceivedDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="mb-3 mt-4 text-secondary">
                        <strong>💰 Compensation Package</strong>
                    </h6>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Base Salary (Annual)</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="e.g., 150000"
                                    value={baseSalary}
                                    onChange={(e) => setBaseSalary(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Signing Bonus</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="e.g., 50000"
                                    value={signingBonus}
                                    onChange={(e) => setSigningBonus(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Annual Bonus</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., 10-20% or $10k-$20k"
                                    value={annualBonus}
                                    onChange={(e) => setAnnualBonus(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Stock Options / RSUs</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., 0.5% vesting over 4 years"
                                    value={stockOptions}
                                    onChange={(e) => setStockOptions(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="mb-3 mt-4 text-secondary">
                        <strong>🎁 Benefits & Flexibility</strong>
                    </h6>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>PTO Days</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="e.g., 20"
                                    value={ptoDays}
                                    onChange={(e) => setPtoDays(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Remote Flexibility</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., full-remote, hybrid, on-site"
                                    value={remoteFlexibility}
                                    onChange={(e) => setRemoteFlexibility(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Relocation Package</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., $15,000 relocation assistance"
                            value={relocationPackage}
                            onChange={(e) => setRelocationPackage(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Other Benefits</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., health insurance, 401k match, gym membership (comma-separated)"
                            value={otherBenefits}
                            onChange={(e) => setOtherBenefits(e.target.value)}
                        />
                    </Form.Group>

                    <h6 className="mb-3 mt-4 text-secondary">
                        <strong>📅 Decision Timeline</strong>
                    </h6>

                    <Form.Group className="mb-3">
                        <Form.Label>Decision Deadline</Form.Label>
                        <Form.Control
                            type="date"
                            value={decisionDeadline}
                            onChange={(e) => setDecisionDeadline(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Internal Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Your personal notes about this offer..."
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                        />
                    </Form.Group>

                    <div className="d-flex gap-2 mt-4">
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                            className="flex-grow-1"
                        >
                            {loading ? "Saving..." : "Save Offer"}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}
