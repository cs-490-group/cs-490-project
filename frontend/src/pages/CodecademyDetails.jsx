import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaArrowLeft, FaTrophy, FaFire, FaChartLine, FaMedal, FaStar, FaCode, FaCheckCircle, FaExternalLinkAlt, FaPlus, FaEdit, FaTrash, FaInfoCircle, FaGraduationCap } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileApi from '../api/profiles';
import BadgesAPI from '../api/badges';

export default function CodecademyDetails() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Badge management state
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [badgeForm, setBadgeForm] = useState({
        name: '',
        description: '',
        earnedDate: '',
        icon: '',
        category: 'course',
        iconFile: null,
        iconMode: 'url' // Track which mode is selected
    });
    const [badges, setBadges] = useState([]);
    const [iconPreview, setIconPreview] = useState('');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const [profileResponse, badgesResponse] = await Promise.all([
                    ProfileApi.get(),
                    BadgesAPI.getPlatformBadges('codecademy')
                ]);
                
                setProfileData(profileResponse.data);
                setBadges(badgesResponse.badges.map(badge => BadgesAPI.formatBadgeFromAPI(badge)));
            } catch (err) {
                setError('Failed to fetch profile data. Please try again.');
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfileData();
        }
    }, [username]);

    const handleBadgeSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let iconData = badgeForm.icon;
            
            // Handle file upload
            if (badgeForm.iconFile) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const badgeData = {
                        ...badgeForm,
                        icon: reader.result,
                        platform: 'codecademy'
                    };
                    
                    await saveBadge(badgeData);
                };
                reader.readAsDataURL(badgeForm.iconFile);
            } else {
                // Use URL or no icon
                const badgeData = {
                    ...badgeForm,
                    icon: iconData,
                    platform: 'codecademy'
                };
                
                await saveBadge(badgeData);
            }
        } catch (err) {
            setError('Failed to save badge. Please try again.');
            console.error('Error saving badge:', err);
        }
    };

    const saveBadge = async (badgeData) => {
        const formattedData = BadgesAPI.formatBadgeData(badgeData);
        
        if (editingBadge !== null) {
            // Update existing badge
            const updatedBadge = await BadgesAPI.updateBadge(editingBadge, formattedData);
            const updatedBadges = badges.map((badge, index) => 
                index === editingBadge ? BadgesAPI.formatBadgeFromAPI(updatedBadge) : badge
            );
            setBadges(updatedBadges);
        } else {
            // Add new badge
            const newBadge = await BadgesAPI.createBadge(formattedData);
            setBadges([...badges, BadgesAPI.formatBadgeFromAPI(newBadge)]);
        }
        
        // Reset form
        resetBadgeForm();
        setShowBadgeModal(false);
    };

    const resetBadgeForm = () => {
        setBadgeForm({ name: '', description: '', earnedDate: '', icon: '', category: 'course', iconFile: null, iconMode: 'url' });
        setEditingBadge(null);
        setIconPreview('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBadgeForm({ ...badgeForm, iconFile: file });
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditBadge = async (badge, index) => {
        setBadgeForm({
            name: badge.name,
            description: badge.description,
            earnedDate: badge.earnedDate,
            icon: badge.icon,
            category: badge.category,
            iconFile: null,
            iconMode: 'url'
        });
        setEditingBadge(badge.id);
        setShowBadgeModal(true);
    };

    const handleDeleteBadge = async (index) => {
        try {
            const badgeToDelete = badges[index];
            await BadgesAPI.deleteBadge(badgeToDelete.id);
            const updatedBadges = badges.filter((_, i) => i !== index);
            setBadges(updatedBadges);
        } catch (err) {
            setError('Failed to delete badge. Please try again.');
            console.error('Error deleting badge:', err);
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

    const getBadgesByCategory = (category) => {
        return badges.filter(badge => badge.category === category);
    };

    const courseBadges = getBadgesByCategory('course');
    const skillBadges = getBadgesByCategory('skill');
    const careerBadges = getBadgesByCategory('career');

    if (loading) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Loading Codecademy profile...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
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
                                <FaGraduationCap className="me-2 text-danger" />
                                {username}
                            </h1>
                            <p className="text-muted mb-2">
                                Codecademy Profile
                            </p>
                            <div className="d-flex gap-2 flex-wrap">
                                <Badge bg="danger">
                                    <FaTrophy className="me-1" />
                                    Profile Connected
                                </Badge>
                                <Badge bg="info">
                                    <FaStar className="me-1" />
                                    {badges.length} Achievements
                                </Badge>
                                <Badge bg="success">
                                    <FaCode className="me-1" />
                                    {courseBadges.length} Courses
                                </Badge>
                            </div>
                        </Col>
                        <Col md={4} className="text-end">
                            <Button 
                                variant="outline-danger" 
                                href={`https://www.codecademy.com/profiles/${username}`}
                                target="_blank"
                            >
                                <FaExternalLinkAlt className="me-2" />
                                View on Codecademy
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Learning Progress */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">
                                <FaChartLine className="me-2" />
                                Learning Progress (Manual Tracking)
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Alert variant="info">
                                <FaInfoCircle className="me-2" />
                                Since Codecademy API access is limited, you can manually track your learning progress here.
                            </Alert>
                            {renderProgressBar(
                                courseBadges.length,
                                Math.max(courseBadges.length + 5, 10),
                                "Courses Completed",
                                "success"
                            )}
                            {renderProgressBar(
                                skillBadges.length,
                                Math.max(skillBadges.length + 3, 5),
                                "Skills Mastered",
                                "warning"
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Badges Section */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 flex-grow-1">
                        <FaGraduationCap className="me-2" />
                        Achievements & Badges
                    </h5>
                    <div className="ms-auto">
                        <Button 
                            variant="primary" 
                            size="sm"
                            style={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                            onClick={() => setShowBadgeModal(true)}
                        >
                            <FaPlus className="me-2" />
                            Add Badge
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {badges.length === 0 ? (
                        <Alert variant="info">
                            <FaInfoCircle className="me-2" />
                            No badges added yet. Click "Add Badge" to manually add your Codecademy achievements.
                        </Alert>
                    ) : (
                        <Row>
                            {badges.map((badge, index) => (
                                <Col md={4} key={badge.id} className="mb-3">
                                    <Card className="h-100">
                                        <Card.Body className="text-center">
                                            {badge.icon ? (
                                                <img 
                                                    src={badge.icon} 
                                                    alt={badge.name}
                                                    style={{ width: '60px', height: '60px', marginBottom: '10px' }}
                                                    className="rounded"
                                                />
                                            ) : (
                                                <FaGraduationCap size={60} className="text-danger mb-3" />
                                            )}
                                            <h6 className="mb-2">{badge.name}</h6>
                                            <p className="text-muted small mb-2">{badge.description}</p>
                                            <Badge 
                                                bg={
                                                    badge.category === 'course' ? 'success' :
                                                    badge.category === 'skill' ? 'warning' :
                                                    badge.category === 'career' ? 'danger' : 'primary'
                                                } 
                                                className="mb-2"
                                            >
                                                {badge.category ? badge.category.charAt(0).toUpperCase() + badge.category.slice(1) : 'Achievement'}
                                            </Badge>
                                            {badge.earnedDate && (
                                                <div className="text-muted small">
                                                    Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                                                </div>
                                            )}
                                            <div className="mt-2 d-flex justify-content-center gap-2">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleEditBadge(badge, index)}
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteBadge(index)}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Badge Modal */}
            <Modal show={showBadgeModal} onHide={() => setShowBadgeModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingBadge !== null ? 'Edit Badge' : 'Add Badge'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleBadgeSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Badge Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={badgeForm.name}
                                onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})}
                                placeholder="e.g., Learn Python 3"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={badgeForm.description}
                                onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})}
                                placeholder="Describe the course or achievement"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Earned Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={badgeForm.earnedDate}
                                onChange={(e) => setBadgeForm({...badgeForm, earnedDate: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                value={badgeForm.category}
                                onChange={(e) => setBadgeForm({...badgeForm, category: e.target.value})}
                            >
                                <option value="course">Course Completion</option>
                                <option value="skill">Skill Badge</option>
                                <option value="career">Career Path</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Badge Icon</Form.Label>
                            <div className="mb-2">
                                <Form.Check
                                    type="radio"
                                    label="Upload Image"
                                    name="iconType"
                                    id="uploadIcon"
                                    checked={badgeForm.iconMode === 'upload'}
                                    onChange={() => {
                                        setBadgeForm({...badgeForm, iconMode: 'upload', icon: ''});
                                        setIconPreview('');
                                    }}
                                />
                                <Form.Check
                                    type="radio"
                                    label="Use URL"
                                    name="iconType"
                                    id="urlIcon"
                                    checked={badgeForm.iconMode === 'url'}
                                    onChange={() => {
                                        setBadgeForm({...badgeForm, iconMode: 'url', iconFile: null});
                                        setIconPreview('');
                                    }}
                                />
                            </div>
                            {badgeForm.iconMode === 'url' ? (
                                <Form.Control
                                    type="url"
                                    value={badgeForm.icon}
                                    onChange={(e) => setBadgeForm({...badgeForm, icon: e.target.value})}
                                    placeholder="https://example.com/badge-icon.png"
                                />
                            ) : (
                                <div>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="mb-2"
                                    />
                                    {iconPreview && (
                                        <div className="text-center">
                                            <img 
                                                src={iconPreview} 
                                                alt="Icon preview" 
                                                style={{ maxWidth: '100px', maxHeight: '100px' }}
                                                className="border rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowBadgeModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {editingBadge !== null ? 'Update Badge' : 'Add Badge'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}