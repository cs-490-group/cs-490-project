import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Table, ProgressBar } from 'react-bootstrap';
import { FaArrowLeft, FaTrophy, FaFire, FaChartLine, FaMedal, FaStar, FaCode, FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import LeetCodeAPI from '../api/leetcode';

export default function LeetCodeDetails() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [badgesData, setBadgesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileResponse, badgesResponse] = await Promise.all([
                    LeetCodeAPI.getFullProfile(username),
                    LeetCodeAPI.getBadges(username)
                ]);
                setProfileData(profileResponse.data);
                setBadgesData(badgesResponse.data);
            } catch (err) {
                setError('Failed to fetch LeetCode data. Please check the username and try again.');
                console.error('Error fetching LeetCode data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchData();
        }
    }, [username]);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'success';
            case 'medium': return 'warning';
            case 'hard': return 'danger';
            default: return 'secondary';
        }
    };

    const renderProgressBar = (current, total, label, color = 'primary') => {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        const getColorClass = (variant) => {
            switch (variant) {
                case 'success': return '#28a745';
                case 'warning': return '#ffc107';
                case 'danger': return '#dc3545';
                case 'info': return '#17a2b8';
                case 'primary':
                default: return '#007bff';
            }
        };
        
        return (
            <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                    <span>{label}</span>
                    <span>{current}/{total}</span>
                </div>
                <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#e9ecef', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: getColorClass(color),
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <Container className="py-4">
                <div className="text-center">
                    <Spinner animation="border" size="lg" />
                    <p className="mt-3">Loading LeetCode profile details...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="primary" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" />
                    Go Back
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Button variant="outline-primary" onClick={() => navigate(-1)} className="mb-4">
                <FaArrowLeft className="me-2" />
                Back to Dashboard
            </Button>

            {/* Header Section */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="mb-2">
                                <FaCode className="me-2 text-warning" />
                                {profileData.username || username}
                            </h1>
                            <p className="text-muted mb-2">
                                {profileData.realName && `${profileData.realName} • `}
                                LeetCode Profile
                            </p>
                            <div className="d-flex gap-2 flex-wrap">
                                {profileData.country && (
                                    <Badge bg="info">
                                        {profileData.country}
                                    </Badge>
                                )}
                                <Badge bg="primary">
                                    <FaTrophy className="me-1" />
                                    Ranking #{profileData.ranking || 'N/A'}
                                </Badge>
                                <Badge bg="success">
                                    <FaFire className="me-1" />
                                    {profileData.streak || 0} Day Streak
                                </Badge>
                            </div>
                        </Col>
                        <Col md={4} className="text-end">
                            <Button 
                                variant="outline-primary" 
                                href={`https://leetcode.com/u/${username}`}
                                target="_blank"
                            >
                                <FaExternalLinkAlt className="me-2" />
                                View on LeetCode
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Problem Solving Stats */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">
                                <FaChartLine className="me-2" />
                                Problem Solving Statistics
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {renderProgressBar(
                                profileData.totalSolved || 0,
                                profileData.totalQuestions || 0,
                                "Total Problems Solved",
                                "success"
                            )}
                            <Row className="mb-3">
                                <Col md={4}>
                                    <div className="text-center">
                                        <h6>Easy</h6>
                                        <Badge bg="success" className="fs-6">
                                            {profileData.easySolved || 0}
                                        </Badge>
                                        <small className="text-muted">
                                            {profileData.totalEasy || 0} total
                                        </small>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="text-center">
                                        <h6>Medium</h6>
                                        <Badge bg="warning" className="fs-6">
                                            {profileData.mediumSolved || 0}
                                        </Badge>
                                        <small className="text-muted">
                                            {profileData.totalMedium || 0} total
                                        </small>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="text-center">
                                        <h6>Hard</h6>
                                        <Badge bg="danger" className="fs-6">
                                            {profileData.hardSolved || 0}
                                        </Badge>
                                        <small className="text-muted">
                                            {profileData.totalHard || 0} total
                                        </small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Badges Section */}
            {badgesData && badgesData.badges && badgesData.badges.length > 0 && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            <FaMedal className="me-2" />
                            Achievements & Badges
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {badgesData.badges.map((badge, index) => (
                                <Col md={6} lg={4} className="mb-3" key={index}>
                                    <div className="d-flex align-items-center p-3 border rounded">
                                        {badge.icon && (
                                            <img 
                                                src={badge.icon} 
                                                alt={badge.displayName || badge.name}
                                                className="me-3"
                                                style={{ width: '40px', height: '40px' }}
                                            />
                                        )}
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{badge.displayName || badge.name || 'Badge'}</h6>
                                            <small className="text-muted d-block">
                                                {badge.description || 'Achievement unlocked'}
                                            </small>
                                            {badge.creationDate && (
                                                <small className="text-muted">
                                                    <FaStar className="me-1" />
                                                    Earned: {new Date(badge.creationDate).toLocaleDateString()}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Recent Activity */}
            {profileData.recentSubmission && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            <FaStar className="me-2" />
                            Recent Activity
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Table responsive>
                            <thead>
                                <tr>
                                    <th>Problem</th>
                                    <th>Difficulty</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profileData.recentSubmission.slice(0, 10).map((submission, index) => (
                                    <tr key={index}>
                                        <td>
                                            <a 
                                                href={`https://leetcode.com/problems/${submission.titleSlug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-decoration-none"
                                            >
                                                {submission.title}
                                            </a>
                                        </td>
                                        <td>
                                            <Badge bg={getDifficultyColor(submission.difficulty)}>
                                                {submission.difficulty}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge bg={submission.status === 'Accepted' ? 'success' : 'danger'}>
                                                <FaCheckCircle className="me-1" />
                                                {submission.status}
                                            </Badge>
                                        </td>
                                        <td>{new Date(submission.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}
