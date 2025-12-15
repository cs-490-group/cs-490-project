import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Table,
    Badge,
    Alert,
    Spinner,
    Button,
    ProgressBar,
    Nav,
} from "react-bootstrap";
import MaterialComparisonAPI from "../../api/materialComparison";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function MaterialComparisonDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("resumes");

    const [resumeData, setResumeData] = useState([]);
    const [coverLetterData, setCoverLetterData] = useState([]);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        loadComparisonData();
    }, []);

    const loadComparisonData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await MaterialComparisonAPI.getCombinedComparison();

            setResumeData(response.data.resumes || []);
            setCoverLetterData(response.data.cover_letters || []);
            setSummary(response.data.summary);

        } catch (err) {
            console.error("Error loading comparison data:", err);
            setError("Failed to load comparison data");
        } finally {
            setLoading(false);
        }
    };

    const formatRate = (rate) => {
        if (rate === null || rate === undefined) return "N/A";
        return `${rate}%`;
    };

    const getRateBadgeVariant = (rate) => {
        if (rate >= 50) return "success";
        if (rate >= 25) return "warning";
        return "danger";
    };

    const handleArchiveResume = async (resumeId, versionId) => {
        if (!window.confirm("Are you sure you want to archive this resume version?")) {
            return;
        }

        try {
            await MaterialComparisonAPI.archiveResumeVersion(resumeId, versionId);
            alert("Resume version archived successfully");
            loadComparisonData();
        } catch (err) {
            alert("Failed to archive resume version");
        }
    };

    const handleArchiveCoverLetter = async (letterId) => {
        if (!window.confirm("Are you sure you want to archive this cover letter?")) {
            return;
        }

        try {
            await MaterialComparisonAPI.archiveCoverLetter(letterId);
            alert("Cover letter archived successfully");
            loadComparisonData();
        } catch (err) {
            alert("Failed to archive cover letter");
        }
    };

    // Chart data for resumes
    const getResumeChartData = () => {
        const topResumes = resumeData
            .filter(r => r.applications_count > 0)
            .sort((a, b) => b.applications_count - a.applications_count)
            .slice(0, 5);

        return {
            labels: topResumes.map(r => r.version_name || r.resume_name),
            datasets: [
                {
                    label: 'Response Rate %',
                    data: topResumes.map(r => r.response_rate),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
                {
                    label: 'Interview Rate %',
                    data: topResumes.map(r => r.interview_rate),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Offer Rate %',
                    data: topResumes.map(r => r.offer_rate),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                },
            ],
        };
    };

    // Chart data for cover letters
    const getCoverLetterChartData = () => {
        const topLetters = coverLetterData
            .filter(l => l.applications_count > 0)
            .sort((a, b) => b.applications_count - a.applications_count)
            .slice(0, 5);

        return {
            labels: topLetters.map(l => l.letter_name),
            datasets: [
                {
                    label: 'Response Rate %',
                    data: topLetters.map(l => l.response_rate),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
                {
                    label: 'Interview Rate %',
                    data: topLetters.map(l => l.interview_rate),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                },
                {
                    label: 'Offer Rate %',
                    data: topLetters.map(l => l.offer_rate),
                    backgroundColor: 'rgba(255, 205, 86, 0.6)',
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Performance Comparison',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Rate (%)'
                }
            }
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading comparison data...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "8px" }}>
                        Application Material Comparison
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "0" }}>
                        Compare performance of different resume and cover letter versions
                    </p>
                </Col>
            </Row>

            {summary && (
                <Alert variant="info" className="mb-4">
                    <strong>📊 {summary.note}</strong>
                    <div className="mt-2">
                        <small>
                            Tracking {summary.total_resume_versions} resume version(s) and{" "}
                            {summary.total_cover_letter_versions} cover letter(s)
                        </small>
                    </div>
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Nav variant="tabs" className="mb-4">
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === "resumes"}
                        onClick={() => setActiveTab("resumes")}
                    >
                        📄 Resume Versions
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === "cover-letters"}
                        onClick={() => setActiveTab("cover-letters")}
                    >
                        ✉️ Cover Letters
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {/* Resume Comparison */}
            {activeTab === "resumes" && (
                <>
                    {/* Chart */}
                    {resumeData.filter(r => r.applications_count > 0).length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Resume Performance Visualization</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar data={getResumeChartData()} options={chartOptions} />
                            </Card.Body>
                        </Card>
                    )}

                    {/* Table */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Resume Version Comparison</h5>
                        </Card.Header>
                        <Card.Body>
                            {resumeData.length === 0 ? (
                                <Alert variant="info">
                                    No resume versions found. Create resume versions and use them in applications to see performance data.
                                </Alert>
                            ) : (
                                <Table responsive hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Version Name</th>
                                            <th className="text-center">Applications</th>
                                            <th className="text-center">Response Rate</th>
                                            <th className="text-center">Interview Rate</th>
                                            <th className="text-center">Offer Rate</th>
                                            <th className="text-center">Avg Response Time</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumeData.map((resume, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <strong>{resume.version_name}</strong>
                                                    <br />
                                                    <small className="text-muted">{resume.resume_name}</small>
                                                    {resume.is_current && (
                                                        <Badge bg="primary" className="ms-2">Current</Badge>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="secondary">{resume.applications_count}</Badge>
                                                </td>
                                                <td className="text-center">
                                                    {resume.applications_count >= 10 ? (
                                                        <Badge bg={getRateBadgeVariant(resume.response_rate)}>
                                                            {formatRate(resume.response_rate)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">{formatRate(resume.response_rate)}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {resume.applications_count >= 10 ? (
                                                        <Badge bg={getRateBadgeVariant(resume.interview_rate)}>
                                                            {formatRate(resume.interview_rate)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">{formatRate(resume.interview_rate)}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {resume.applications_count >= 10 ? (
                                                        <Badge bg={getRateBadgeVariant(resume.offer_rate)}>
                                                            {formatRate(resume.offer_rate)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">{formatRate(resume.offer_rate)}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {resume.avg_response_time_days !== null
                                                        ? `${resume.avg_response_time_days} days`
                                                        : "N/A"}
                                                </td>
                                                <td className="text-center">
                                                    {!resume.is_current && resume.applications_count === 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => handleArchiveResume(resume.resume_id, resume.version_id)}
                                                        >
                                                            Archive
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}

                            {resumeData.some(r => r.applications_count > 0 && r.applications_count < 10) && (
                                <Alert variant="warning" className="mt-3 mb-0">
                                    <small>
                                        ⚠️ Versions with fewer than 10 applications are shown with muted colors.
                                        Use 10+ applications per version for meaningful comparisons.
                                    </small>
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}

            {/* Cover Letter Comparison */}
            {activeTab === "cover-letters" && (
                <>
                    {/* Chart */}
                    {coverLetterData.filter(l => l.applications_count > 0).length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Cover Letter Performance Visualization</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar data={getCoverLetterChartData()} options={chartOptions} />
                            </Card.Body>
                        </Card>
                    )}

                    {/* Table */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Cover Letter Comparison</h5>
                        </Card.Header>
                        <Card.Body>
                            {coverLetterData.length === 0 ? (
                                <Alert variant="info">
                                    No cover letters found. Create cover letters and use them in applications to see performance data.
                                </Alert>
                            ) : (
                                <Table responsive hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Cover Letter</th>
                                            <th className="text-center">Template Type</th>
                                            <th className="text-center">Applications</th>
                                            <th className="text-center">Response Rate</th>
                                            <th className="text-center">Interview Rate</th>
                                            <th className="text-center">Offer Rate</th>
                                            <th className="text-center">Avg Response Time</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coverLetterData.map((letter, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <strong>{letter.letter_name}</strong>
                                                    {letter.is_default && (
                                                        <Badge bg="primary" className="ms-2">Default</Badge>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="info">{letter.template_type}</Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="secondary">{letter.applications_count}</Badge>
                                                </td>
                                                <td className="text-center">
                                                    {letter.applications_count >= 10 ? (
                                                        <Badge bg={getRateBadgeVariant(letter.response_rate)}>
                                                            {formatRate(letter.response_rate)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">{formatRate(letter.response_rate)}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {letter.applications_count >= 10 ? (
                                                        <Badge bg={getRateBadgeVariant(letter.interview_rate)}>
                                                            {formatRate(letter.interview_rate)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">{formatRate(letter.interview_rate)}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {letter.applications_count >= 10 ? (
                                                        <Badge bg={getRateBadgeVariant(letter.offer_rate)}>
                                                            {formatRate(letter.offer_rate)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">{formatRate(letter.offer_rate)}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {letter.avg_response_time_days !== null
                                                        ? `${letter.avg_response_time_days} days`
                                                        : "N/A"}
                                                </td>
                                                <td className="text-center">
                                                    {!letter.is_default && letter.applications_count === 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => handleArchiveCoverLetter(letter.letter_id)}
                                                        >
                                                            Archive
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}

                            {coverLetterData.some(l => l.applications_count > 0 && l.applications_count < 10) && (
                                <Alert variant="warning" className="mt-3 mb-0">
                                    <small>
                                        ⚠️ Cover letters with fewer than 10 applications are shown with muted colors.
                                        Use 10+ applications per version for meaningful comparisons.
                                    </small>
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}
        </Container>
    );
}
