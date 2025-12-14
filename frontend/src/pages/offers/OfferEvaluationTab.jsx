import React, { useState, useEffect } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    Form,
    Table,
    Badge,
    Alert,
    Spinner,
    ProgressBar,
} from "react-bootstrap";
import OffersAPI from "../../api/offers";

export default function OfferEvaluationTab({ offer, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Scenario analysis
    const [showScenarioAnalysis, setShowScenarioAnalysis] = useState(false);
    const [scenarios, setScenarios] = useState([]);
    const [scenarioResults, setScenarioResults] = useState(null);

    // Archive modal
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    // Equity form state
    const [equityType, setEquityType] = useState("RSUs");
    const [numShares, setNumShares] = useState("");
    const [stockPrice, setStockPrice] = useState("");
    const [strikePrice, setStrikePrice] = useState("");
    const [vestingYears, setVestingYears] = useState(4);
    const [cliffMonths, setCliffMonths] = useState(12);

    // Benefits form state
    const [healthInsurance, setHealthInsurance] = useState("");
    const [dentalVision, setDentalVision] = useState("");
    const [retirement401k, setRetirement401k] = useState("");
    const [lifeInsurance, setLifeInsurance] = useState("");
    const [disabilityInsurance, setDisabilityInsurance] = useState("");
    const [hsaContribution, setHsaContribution] = useState("");
    const [commuterBenefits, setCommuterBenefits] = useState("");
    const [educationStipend, setEducationStipend] = useState("");
    const [wellnessStipend, setWellnessStipend] = useState("");
    const [homeOfficeStipend, setHomeOfficeStipend] = useState("");

    // Non-financial factors (1-10 scale)
    const [cultureFit, setCultureFit] = useState(5);
    const [growthOpportunities, setGrowthOpportunities] = useState(5);
    const [workLifeBalance, setWorkLifeBalance] = useState(5);
    const [teamQuality, setTeamQuality] = useState(5);
    const [missionAlignment, setMissionAlignment] = useState(5);
    const [commuteQuality, setCommuteQuality] = useState(5);
    const [jobSecurity, setJobSecurity] = useState(5);
    const [learningOpportunities, setLearningOpportunities] = useState(5);

    // Market data
    const [marketMedian, setMarketMedian] = useState("");

    const formatCurrency = (value) => {
        if (!value && value !== 0) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const totalComp = offer?.offered_salary_details?.total_compensation;
    const equityDetails = offer?.offered_salary_details?.equity_details;
    const benefitsVal = offer?.offered_salary_details?.benefits_valuation;
    const colData = offer?.offered_salary_details?.cost_of_living;
    const offerScore = offer?.offer_score;

    const handleCalculateEquity = async () => {
        if (!numShares || !stockPrice) {
            setError("Please enter number of shares and stock price");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const equityData = {
                equity_type: equityType,
                number_of_shares: parseInt(numShares),
                current_stock_price: parseFloat(stockPrice),
                strike_price: strikePrice ? parseFloat(strikePrice) : 0,
                vesting_years: parseInt(vestingYears),
                cliff_months: parseInt(cliffMonths),
            };

            await OffersAPI.calculateEquity(offer._id, equityData);
            setSuccess("Equity valuation calculated");
            onRefresh();
        } catch (err) {
            setError("Failed to calculate equity: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateBenefits = async () => {
        try {
            setLoading(true);
            setError(null);

            const benefitsData = {
                health_insurance_value: parseFloat(healthInsurance) || 0,
                dental_vision_value: parseFloat(dentalVision) || 0,
                retirement_401k_match: retirement401k || "0",
                life_insurance_value: parseFloat(lifeInsurance) || 0,
                disability_insurance_value: parseFloat(disabilityInsurance) || 0,
                hsa_contribution: parseFloat(hsaContribution) || 0,
                commuter_benefits: parseFloat(commuterBenefits) || 0,
                education_stipend: parseFloat(educationStipend) || 0,
                wellness_stipend: parseFloat(wellnessStipend) || 0,
                home_office_stipend: parseFloat(homeOfficeStipend) || 0,
            };

            await OffersAPI.calculateBenefits(offer._id, benefitsData);
            setSuccess("Benefits valuation calculated");
            onRefresh();
        } catch (err) {
            setError("Failed to calculate benefits: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateTotalComp = async () => {
        try {
            setLoading(true);
            setError(null);

            await OffersAPI.calculateTotalComp(offer._id);
            setSuccess("Total compensation calculated");
            onRefresh();
        } catch (err) {
            setError("Failed to calculate total comp: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateCOL = async () => {
        try {
            setLoading(true);
            setError(null);

            await OffersAPI.calculateCostOfLiving(offer._id);
            setSuccess("Cost of living calculated");
            onRefresh();
        } catch (err) {
            setError("Failed to calculate COL: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateScore = async () => {
        try {
            setLoading(true);
            setError(null);

            const nonFinancialFactors = {
                culture_fit: cultureFit,
                growth_opportunities: growthOpportunities,
                work_life_balance: workLifeBalance,
                team_quality: teamQuality,
                mission_alignment: missionAlignment,
                commute_quality: commuteQuality,
                job_security: jobSecurity,
                learning_opportunities: learningOpportunities,
            };

            const median = marketMedian ? parseFloat(marketMedian) : null;

            await OffersAPI.calculateOfferScore(offer._id, nonFinancialFactors, median);
            setSuccess("Offer score calculated");
            onRefresh();
        } catch (err) {
            setError("Failed to calculate score: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Total Compensation Summary */}
            {totalComp && (
                <Card className="mb-4 border-primary">
                    <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">Total Compensation Summary</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="text-center">
                            <Col md={4}>
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted small mb-1">Year 1 Total</h6>
                                    <h4 className="text-primary mb-0">{formatCurrency(totalComp.year_1_total)}</h4>
                                    <small className="text-muted">Base + Signing + Bonus + Equity + Benefits</small>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted small mb-1">Annual Total (Year 2+)</h6>
                                    <h4 className="text-success mb-0">{formatCurrency(totalComp.annual_total)}</h4>
                                    <small className="text-muted">Base + Bonus + Equity + Benefits</small>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted small mb-1">4-Year Total</h6>
                                    <h4 className="text-info mb-0">{formatCurrency(totalComp.four_year_total)}</h4>
                                    <small className="text-muted">Full vesting period value</small>
                                </div>
                            </Col>
                        </Row>

                        <hr />

                        <Row className="mt-3">
                            <Col md={6}>
                                <Table size="sm" borderless>
                                    <tbody>
                                        <tr>
                                            <td>Base Salary:</td>
                                            <td className="text-end fw-bold">{formatCurrency(totalComp.base_salary)}</td>
                                        </tr>
                                        <tr>
                                            <td>Signing Bonus:</td>
                                            <td className="text-end">{formatCurrency(totalComp.signing_bonus)}</td>
                                        </tr>
                                        <tr>
                                            <td>Annual Bonus (Expected):</td>
                                            <td className="text-end">{formatCurrency(totalComp.annual_bonus_expected)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>
                            <Col md={6}>
                                <Table size="sm" borderless>
                                    <tbody>
                                        <tr>
                                            <td>Year 1 Equity:</td>
                                            <td className="text-end">{formatCurrency(totalComp.year_1_equity)}</td>
                                        </tr>
                                        <tr>
                                            <td>Annual Equity (Avg):</td>
                                            <td className="text-end">{formatCurrency(totalComp.annual_equity)}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Benefits:</td>
                                            <td className="text-end">{formatCurrency(totalComp.total_benefits)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Offer Score */}
            {offerScore && (
                <Card className="mb-4 border-success">
                    <Card.Header className="bg-success text-white">
                        <h5 className="mb-0">Offer Score & Recommendation</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={8}>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Financial Score</span>
                                        <span className="fw-bold">{offerScore.financial_score}/100</span>
                                    </div>
                                    <ProgressBar now={offerScore.financial_score} variant="primary" />
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Non-Financial Score</span>
                                        <span className="fw-bold">{offerScore.non_financial_score}/100</span>
                                    </div>
                                    <ProgressBar now={offerScore.non_financial_score} variant="info" />
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Weighted Total Score</span>
                                        <span className="fw-bold">{offerScore.weighted_total_score}/100</span>
                                    </div>
                                    <ProgressBar now={offerScore.weighted_total_score} variant="success" />
                                </div>

                                {offerScore.percentile_vs_market && (
                                    <p className="text-muted small mb-0">
                                        Market Percentile: {offerScore.percentile_vs_market}th percentile
                                    </p>
                                )}
                            </Col>
                            <Col md={4} className="text-center">
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted mb-2">Recommendation</h6>
                                    <Badge
                                        bg={
                                            offerScore.recommendation === "Strong Accept"
                                                ? "success"
                                                : offerScore.recommendation === "Accept"
                                                ? "primary"
                                                : offerScore.recommendation === "Negotiate"
                                                ? "warning"
                                                : "danger"
                                        }
                                        className="fs-6 p-2"
                                    >
                                        {offerScore.recommendation}
                                    </Badge>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Cost of Living */}
            {colData && (
                <Card className="mb-4">
                    <Card.Header>
                        <h6 className="mb-0">Cost of Living Adjustment</h6>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <p><strong>Location:</strong> {colData.location}</p>
                                <p><strong>COL Index:</strong> {colData.col_index} (100 = national avg)</p>
                                <p><strong>Tax Rate:</strong> {(colData.tax_rate * 100).toFixed(1)}%</p>
                            </Col>
                            <Col md={6}>
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted mb-1">Adjusted Salary Value</h6>
                                    <h4 className="text-primary mb-0">{formatCurrency(colData.adjusted_salary)}</h4>
                                    <small className="text-muted">
                                        Equivalent to this in a national-average city
                                    </small>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Row>
                {/* Equity Valuation Form */}
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header>
                            <h6 className="mb-0">Equity Valuation Calculator</h6>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Equity Type</Form.Label>
                                <Form.Select
                                    value={equityType}
                                    onChange={(e) => setEquityType(e.target.value)}
                                >
                                    <option value="RSUs">RSUs</option>
                                    <option value="Stock Options">Stock Options</option>
                                    <option value="ISO">ISO (Incentive Stock Options)</option>
                                    <option value="NSO">NSO (Non-Qualified Stock Options)</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Number of Shares/Units</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={numShares}
                                    onChange={(e) => setNumShares(e.target.value)}
                                    placeholder="e.g., 10000"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Current Stock Price ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={stockPrice}
                                    onChange={(e) => setStockPrice(e.target.value)}
                                    placeholder="e.g., 150.00"
                                />
                            </Form.Group>

                            {equityType.includes("Options") && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Strike Price ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={strikePrice}
                                        onChange={(e) => setStrikePrice(e.target.value)}
                                        placeholder="e.g., 50.00"
                                    />
                                </Form.Group>
                            )}

                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vesting Years</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={vestingYears}
                                            onChange={(e) => setVestingYears(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Cliff (months)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={cliffMonths}
                                            onChange={(e) => setCliffMonths(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Button
                                variant="primary"
                                onClick={handleCalculateEquity}
                                disabled={loading}
                                className="w-100"
                            >
                                {loading ? <Spinner size="sm" /> : "Calculate Equity Value"}
                            </Button>

                            {equityDetails && (
                                <div className="mt-3 p-3 bg-light rounded">
                                    <p className="mb-1"><strong>Total Value at Vest:</strong> {formatCurrency(equityDetails.estimated_value_at_vest)}</p>
                                    <p className="mb-1"><strong>Year 1 Value:</strong> {formatCurrency(equityDetails.year_1_value)}</p>
                                    <p className="mb-0"><strong>Annual Avg Value:</strong> {formatCurrency(equityDetails.annual_equity_value)}</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Benefits Valuation Form */}
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header>
                            <h6 className="mb-0">Benefits Valuation Calculator</h6>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
                            <Form.Group className="mb-2">
                                <Form.Label className="small">Health Insurance (employer contribution)</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={healthInsurance}
                                    onChange={(e) => setHealthInsurance(e.target.value)}
                                    placeholder="e.g., 8000"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">Dental & Vision</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={dentalVision}
                                    onChange={(e) => setDentalVision(e.target.value)}
                                    placeholder="e.g., 1500"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">401k Match (% or $)</Form.Label>
                                <Form.Control
                                    type="text"
                                    size="sm"
                                    value={retirement401k}
                                    onChange={(e) => setRetirement401k(e.target.value)}
                                    placeholder="e.g., 6% or 5000"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">Life Insurance</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={lifeInsurance}
                                    onChange={(e) => setLifeInsurance(e.target.value)}
                                    placeholder="e.g., 500"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">Disability Insurance</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={disabilityInsurance}
                                    onChange={(e) => setDisabilityInsurance(e.target.value)}
                                    placeholder="e.g., 600"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">HSA Contribution</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={hsaContribution}
                                    onChange={(e) => setHsaContribution(e.target.value)}
                                    placeholder="e.g., 1000"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">Commuter Benefits</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={commuterBenefits}
                                    onChange={(e) => setCommuterBenefits(e.target.value)}
                                    placeholder="e.g., 300"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">Education Stipend</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={educationStipend}
                                    onChange={(e) => setEducationStipend(e.target.value)}
                                    placeholder="e.g., 2000"
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="small">Wellness Stipend</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={wellnessStipend}
                                    onChange={(e) => setWellnessStipend(e.target.value)}
                                    placeholder="e.g., 500"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small">Home Office Stipend</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    value={homeOfficeStipend}
                                    onChange={(e) => setHomeOfficeStipend(e.target.value)}
                                    placeholder="e.g., 1000"
                                />
                            </Form.Group>

                            <Button
                                variant="success"
                                onClick={handleCalculateBenefits}
                                disabled={loading}
                                className="w-100"
                            >
                                {loading ? <Spinner size="sm" /> : "Calculate Benefits Value"}
                            </Button>

                            {benefitsVal && (
                                <div className="mt-3 p-3 bg-light rounded">
                                    <h6 className="mb-2">Total Annual Benefits Value:</h6>
                                    <h4 className="text-success mb-0">{formatCurrency(benefitsVal.total_benefits_value)}</h4>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Non-Financial Factors */}
            <Card className="mb-4">
                <Card.Header>
                    <h6 className="mb-0">Non-Financial Factors (1-10 scale)</h6>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Culture Fit: {cultureFit}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={cultureFit}
                                    onChange={(e) => setCultureFit(parseInt(e.target.value))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Growth Opportunities: {growthOpportunities}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={growthOpportunities}
                                    onChange={(e) => setGrowthOpportunities(parseInt(e.target.value))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Work-Life Balance: {workLifeBalance}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={workLifeBalance}
                                    onChange={(e) => setWorkLifeBalance(parseInt(e.target.value))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Team Quality: {teamQuality}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={teamQuality}
                                    onChange={(e) => setTeamQuality(parseInt(e.target.value))}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mission Alignment: {missionAlignment}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={missionAlignment}
                                    onChange={(e) => setMissionAlignment(parseInt(e.target.value))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Commute Quality: {commuteQuality}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={commuteQuality}
                                    onChange={(e) => setCommuteQuality(parseInt(e.target.value))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Job Security: {jobSecurity}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={jobSecurity}
                                    onChange={(e) => setJobSecurity(parseInt(e.target.value))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Learning Opportunities: {learningOpportunities}</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    value={learningOpportunities}
                                    onChange={(e) => setLearningOpportunities(parseInt(e.target.value))}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Market Median Salary (optional, for comparison)</Form.Label>
                        <Form.Control
                            type="number"
                            value={marketMedian}
                            onChange={(e) => setMarketMedian(e.target.value)}
                            placeholder="e.g., 140000"
                        />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Action Buttons */}
            <Row>
                <Col md={6}>
                    <Button
                        variant="info"
                        onClick={handleCalculateCOL}
                        disabled={loading}
                        className="w-100 mb-3"
                    >
                        {loading ? <Spinner size="sm" /> : "Calculate Cost of Living"}
                    </Button>
                </Col>
                <Col md={6}>
                    <Button
                        variant="primary"
                        onClick={handleCalculateTotalComp}
                        disabled={loading}
                        className="w-100 mb-3"
                    >
                        {loading ? <Spinner size="sm" /> : "Calculate Total Compensation"}
                    </Button>
                </Col>
            </Row>

            <Button
                variant="success"
                size="lg"
                onClick={handleCalculateScore}
                disabled={loading || !totalComp}
                className="w-100"
            >
                {loading ? <Spinner size="sm" /> : "Calculate Offer Score"}
            </Button>

            {!totalComp && (
                <Alert variant="warning" className="mt-3">
                    Calculate total compensation first before generating the offer score.
                </Alert>
            )}

            {/* Scenario Analysis */}
            <Card className="mt-4">
                <Card.Header>
                    <h6 className="mb-0">Scenario Analysis ("What-If" Calculator)</h6>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted small">
                        Test different negotiation scenarios to see how they affect total compensation
                    </p>

                    <Button
                        variant="info"
                        onClick={() => {
                            setScenarios([
                                {
                                    name: "Negotiate 10% higher base salary",
                                    changes: {
                                        base_salary: (offer.offered_salary_details?.base_salary || 0) * 1.1
                                    }
                                },
                                {
                                    name: "Negotiate higher signing bonus",
                                    changes: {
                                        signing_bonus: (offer.offered_salary_details?.signing_bonus || 0) + 10000
                                    }
                                },
                                {
                                    name: "Request more equity",
                                    changes: {
                                        equity_number_of_shares: (equityDetails?.number_of_shares || 0) * 1.25
                                    }
                                }
                            ]);

                            OffersAPI.runScenarioAnalysis(offer._id, [
                                {
                                    name: "Negotiate 10% higher base salary",
                                    changes: {
                                        base_salary: (offer.offered_salary_details?.base_salary || 0) * 1.1
                                    }
                                },
                                {
                                    name: "Negotiate higher signing bonus",
                                    changes: {
                                        signing_bonus: (offer.offered_salary_details?.signing_bonus || 0) + 10000
                                    }
                                },
                                {
                                    name: "Request more equity",
                                    changes: {
                                        equity_number_of_shares: (equityDetails?.number_of_shares || 0) * 1.25
                                    }
                                }
                            ])
                            .then(res => {
                                setScenarioResults(res.data.scenarios);
                                setShowScenarioAnalysis(true);
                            })
                            .catch(err => setError("Failed to run scenario analysis: " + err.message));
                        }}
                        disabled={!totalComp || loading}
                    >
                        Run Scenario Analysis
                    </Button>

                    {showScenarioAnalysis && scenarioResults && (
                        <div className="mt-3">
                            <Table striped bordered responsive>
                                <thead>
                                    <tr>
                                        <th>Scenario</th>
                                        <th>Year 1 Total</th>
                                        <th>Annual Total</th>
                                        <th>4-Year Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="table-info">
                                        <td><strong>Current Offer</strong></td>
                                        <td><strong>{formatCurrency(totalComp?.year_1_total)}</strong></td>
                                        <td><strong>{formatCurrency(totalComp?.annual_total)}</strong></td>
                                        <td><strong>{formatCurrency(totalComp?.four_year_total)}</strong></td>
                                    </tr>
                                    {scenarioResults.map((scenario, idx) => (
                                        <tr key={idx}>
                                            <td>{scenario.scenario_name}</td>
                                            <td>{formatCurrency(scenario.total_compensation?.year_1_total)}</td>
                                            <td>{formatCurrency(scenario.total_compensation?.annual_total)}</td>
                                            <td>{formatCurrency(scenario.total_compensation?.four_year_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Archive Offer */}
            <Card className="mt-4 border-danger">
                <Card.Header className="bg-danger text-white">
                    <h6 className="mb-0">Archive Offer</h6>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted small">
                        Archive this offer if you've declined it. Archived offers are moved to a separate list.
                    </p>

                    <Form.Group className="mb-3">
                        <Form.Label>Decline Reason (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="e.g., Accepted another offer, Low compensation, Poor culture fit..."
                        />
                    </Form.Group>

                    <Button
                        variant="danger"
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to archive this offer?")) {
                                try {
                                    setLoading(true);
                                    await OffersAPI.archiveOffer(offer._id, declineReason || null);
                                    setSuccess("Offer archived successfully");
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 1500);
                                } catch (err) {
                                    setError("Failed to archive offer: " + err.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        disabled={loading}
                    >
                        Archive This Offer
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
}
