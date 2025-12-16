import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaExternalLinkAlt, FaTrophy, FaCheckCircle, FaPlus, FaLink, FaEdit, FaSave, FaTimes, FaTrash, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import LeetCodeAPI from '../api/leetcode';
import ProfileApi from '../api/profiles';

export default function ExternalSkillsPlatforms() {
    const navigate = useNavigate();
    const [platforms, setPlatforms] = useState({
        leetcode: { url: '', username: '', data: null, badges: null, loading: false, error: null, isEditing: false },
        hackerrank: { url: '', username: '', data: null, loading: false, error: null, isEditing: false },
        codecademy: { url: '', username: '', data: null, loading: false, error: null, isEditing: false }
    });
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState(null);

    // Load external skills from profile on component mount
    useEffect(() => {
        const loadExternalSkills = async () => {
            try {
                const response = await ProfileApi.get();
                console.log('Profile API response:', response);
                const profile = response.data; // Direct object, not array
                console.log('Loaded profile:', profile);
                
                if (!profile) {
                    console.log('No profile found, using empty state');
                    setPlatforms(prev => ({
                        ...prev,
                        leetcode: { ...prev.leetcode, loading: false, error: null },
                        hackerrank: { ...prev.hackerrank, loading: false, error: null },
                        codecademy: { ...prev.codecademy, loading: false, error: null }
                    }));
                    return;
                }
                
                setProfileData(profile);
                // Load from individual profile fields
                const platformsData = {
                    leetcode: {
                        url: profile.leetcode || '',
                        username: profile.leetcode ? extractUsernameFromUrl(profile.leetcode, 'leetcode') || '' : '',
                        loading: false,
                        error: null,
                        isEditing: false
                    },
                    hackerrank: {
                        url: profile.hackerrank || '',
                        username: profile.hackerrank ? extractUsernameFromUrl(profile.hackerrank, 'hackerrank') || '' : '',
                        data: profile.hackerrank ? { url: profile.hackerrank } : null,
                        loading: false,
                        error: null,
                        isEditing: false
                    },
                    codecademy: {
                        url: profile.codeacademy || '',
                        username: profile.codeacademy ? extractUsernameFromUrl(profile.codeacademy, 'codecademy') || '' : '',
                        data: profile.codeacademy ? { url: profile.codeacademy } : null,
                        loading: false,
                        error: null,
                        isEditing: false
                    }
                };

                console.log('Platforms data before fetching:', platformsData);

                // Auto-fetch LeetCode data if URL exists
                if (platformsData.leetcode.url && platformsData.leetcode.username) {
                    try {
                        console.log('Fetching LeetCode data for username:', platformsData.leetcode.username);
                        const [profileResponse, badgesResponse] = await Promise.all([
                            LeetCodeAPI.getFullProfile(platformsData.leetcode.username),
                            LeetCodeAPI.getBadges(platformsData.leetcode.username)
                        ]);
                        platformsData.leetcode.data = profileResponse.data;
                        platformsData.leetcode.badges = badgesResponse.data;
                        console.log('LeetCode data fetched successfully');
                    } catch (error) {
                        console.error('Failed to fetch LeetCode data on load:', error);
                    }
                }

                setPlatforms(prev => ({
                    ...prev,
                    ...platformsData
                }));
            } catch (error) {
                console.error('Failed to load external skills:', error);
                // Set empty state on error
                setPlatforms(prev => ({
                    ...prev,
                    leetcode: { ...prev.leetcode, loading: false, error: null },
                    hackerrank: { ...prev.hackerrank, loading: false, error: null },
                    codecademy: { ...prev.codecademy, loading: false, error: null }
                }));
            }
        };

        loadExternalSkills();
    }, []);

    const extractUsernameFromUrl = (url, platform) => {
        try {
            if (platform === 'leetcode') {
                // Handle various LeetCode URL formats
                const patterns = [
                    /leetcode\.com\/u\/([^\/]+)/,
                    /leetcode\.com\/([^\/]+)/
                ];
                
                for (const pattern of patterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
            } else if (platform === 'hackerrank') {
                // Handle HackerRank profile URL format: https://www.hackerrank.com/profile/:username
                const pattern = /hackerrank\.com\/profile\/([^\/]+)/;
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            } else if (platform === 'codecademy') {
                // Handle Codecademy profile URL format: https://www.codecademy.com/profiles/:username
                const pattern = /codecademy\.com\/profiles\/([^\/]+)/;
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    const handleEdit = (platform) => {
        setPlatforms(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                isEditing: true
            }
        }));
    };

    const handleCancelEdit = (platform) => {
        setPlatforms(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                isEditing: false,
                url: profileData?.[platform] || '',
                username: profileData?.[platform] ? extractUsernameFromUrl(profileData[platform], platform) || '' : ''
            }
        }));
    };

    const handleSave = async (platform) => {
        if (!profileData) return;
        
        setSaving(true);
        try {
            // Update individual profile fields
            const updateData = {
                leetcode: platforms.leetcode.url || null,
                hackerrank: platforms.hackerrank.url || null,
                codeacademy: platforms.codecademy.url || null
            };

            console.log('Saving platform data:', updateData);
            await ProfileApi.update(updateData);
            console.log('Platform saved successfully');

            // Update profileData to reflect the saved state
            setProfileData(prev => ({
                ...prev,
                leetcode: platforms.leetcode.url,
                hackerrank: platforms.hackerrank.url,
                codeacademy: platforms.codecademy.url
            }));

            // Auto-fetch fresh data for the updated platform
            const platformData = platforms[platform];
            
            if (platform === 'leetcode' && platformData.url && platformData.username) {
                const [profileResponse, badgesResponse] = await Promise.all([
                    LeetCodeAPI.getFullProfile(platformData.username),
                    LeetCodeAPI.getBadges(platformData.username)
                ]);
                
                setPlatforms(prev => ({
                    ...prev,
                    [platform]: {
                        ...prev[platform],
                        data: profileResponse.data,
                        badges: badgesResponse.data,
                        isEditing: false,
                        loading: false,
                        error: null
                    }
                }));
            } else if (platform !== 'leetcode' && platformData.url) {
                setPlatforms(prev => ({
                    ...prev,
                    [platform]: {
                        ...prev[platform],
                        data: { url: platformData.url },
                        isEditing: false,
                        loading: false,
                        error: null
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to save platform:', error);
            console.error('Error response:', error.response);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (platform) => {
        if (!profileData) return;
        
        try {
            // Clear the platform URL in profile
            const updateData = {
                leetcode: platform === 'leetcode' ? null : platforms.leetcode.url || null,
                hackerrank: platform === 'hackerrank' ? null : platforms.hackerrank.url || null,
                codeacademy: platform === 'codecademy' ? null : platforms.codecademy.url || null
            };

            console.log('Deleting platform connection:', platform);
            await ProfileApi.update(updateData);
            console.log('Delete successful');

            // Update local state
            setPlatforms(prev => ({
                ...prev,
                [platform]: {
                    ...prev[platform],
                    url: '',
                    username: '',
                    data: null,
                    badges: null,
                    loading: false,
                    error: null,
                    isEditing: false
                }
            }));

            // Update profileData
            setProfileData(prev => ({
                ...prev,
                [platform]: null
            }));
        } catch (error) {
            console.error('Failed to delete platform connection:', error);
            console.error('Error response:', error.response);
        }
    };

    const cancelEdit = () => {
        // This function is no longer needed with platform-specific editing
    };

    const handleUrlChange = (platform, url) => {
        setPlatforms(prev => ({ 
            ...prev, 
            [platform]: { 
                ...prev[platform], 
                url, 
                username: extractUsernameFromUrl(url, platform) || '',
                error: null 
            } 
        }));
    };

    const handleConnect = async (platform) => {
        const platformData = platforms[platform];
        
        if (!platformData.username) {
            setPlatforms(prev => ({ 
                ...prev, 
                [platform]: { 
                    ...prev[platform], 
                    error: 'Please enter a valid profile URL' 
                } 
            }));
            return;
        }

        setPlatforms(prev => ({ 
            ...prev, 
            [platform]: { 
                ...prev[platform], 
                loading: true, 
                error: null 
            } 
        }));

        try {
            if (platform === 'leetcode') {
                const [profileResponse, badgesResponse] = await Promise.all([
                    LeetCodeAPI.getFullProfile(platformData.username),
                    LeetCodeAPI.getBadges(platformData.username)
                ]);

                // Update local state with fetched data
                setPlatforms(prev => ({ 
                    ...prev, 
                    [platform]: { 
                        ...prev[platform], 
                        data: profileResponse.data, 
                        badges: badgesResponse.data, 
                        loading: false 
                    } 
                }));

                // Automatically save to profile after successful connection
                if (profileData) {
                    const updateData = {
                        leetcode: platformData.url || null,
                        hackerrank: platforms.hackerrank.url || null,
                        codeacademy: platforms.codecademy.url || null
                    };

                    console.log('Auto-saving after connection:', updateData);
                    console.log('Profile ID:', profileData._id);
                    
                    try {
                        await ProfileApi.update(updateData);
                        console.log('Auto-save successful');
                        
                        // Update profileData to reflect the saved state
                        setProfileData(prev => ({
                            ...prev,
                            leetcode: platformData.url,
                            hackerrank: platforms.hackerrank.url,
                            codeacademy: platforms.codecademy.url
                        }));
                    } catch (updateError) {
                        console.error('Profile update failed:', updateError);
                        console.error('Error response:', updateError.response);
                    }
                }
            } else {
                // For HackerRank and Codecademy, just store the URL and save
                setPlatforms(prev => ({ 
                    ...prev, 
                    [platform]: { 
                        ...prev[platform], 
                        data: { url: platformData.url }, 
                        loading: false 
                    } 
                }));

                // Automatically save to profile
                if (profileData) {
                    const updateData = {
                        leetcode: platforms.leetcode.url || null,
                        hackerrank: platformData.url || null,
                        codeacademy: platforms.codecademy.url || null
                    };

                    console.log('Auto-saving after connection:', updateData);
                    
                    try {
                        await ProfileApi.update(updateData);
                        console.log('Auto-save successful');
                        
                        // Update profileData to reflect the saved state
                        setProfileData(prev => ({
                            ...prev,
                            leetcode: platforms.leetcode.url,
                            hackerrank: platformData.url,
                            codeacademy: platforms.codecademy.url
                        }));
                    } catch (updateError) {
                        console.error('Profile update failed:', updateError);
                        console.error('Error response:', updateError.response);
                    }
                }
            }
        } catch (error) {
            setPlatforms(prev => ({ 
                ...prev, 
                [platform]: { 
                    ...prev[platform], 
                    loading: false, 
                    error: 'Failed to fetch profile data. Please check the URL and try again.' 
                } 
            }));
        }
    };

    const renderLeetCodeStats = (data) => {
        if (!data) return null;

        return (
            <div className="leetcode-stats">
                <Row className="g-2 mb-3">
                    <Col xs={6}>
                        <div className="text-center p-2 bg-light rounded">
                            <div className="fw-bold text-primary">{data.totalSolved || 0}</div>
                            <div className="small text-muted">Problems Solved</div>
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="text-center p-2 bg-light rounded">
                            <div className="fw-bold text-info">{data.ranking || 'N/A'}</div>
                            <div className="small text-muted">Ranking</div>
                        </div>
                    </Col>
                </Row>
                
                <Row className="g-2 mb-3">
                    <Col xs={4}>
                        <div className="text-center p-2 bg-success bg-opacity-10 rounded">
                            <div className="fw-bold text-success">{data.easySolved || 0}</div>
                            <div className="small text-muted">Easy</div>
                        </div>
                    </Col>
                    <Col xs={4}>
                        <div className="text-center p-2 bg-warning bg-opacity-10 rounded">
                            <div className="fw-bold text-warning">{data.mediumSolved || 0}</div>
                            <div className="small text-muted">Medium</div>
                        </div>
                    </Col>
                    <Col xs={4}>
                        <div className="text-center p-2 bg-danger bg-opacity-10 rounded">
                            <div className="fw-bold text-danger">{data.hardSolved || 0}</div>
                            <div className="small text-muted">Hard</div>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    };

    const renderBadges = (badges) => {
        if (!badges || !badges.badges || badges.badges.length === 0) {
            return <div className="text-muted small">No badges earned yet</div>;
        }

        return (
            <div className="badges-section">
                <div className="fw-bold mb-2">Badges ({badges.badges.length})</div>
                <div className="d-flex flex-wrap gap-2">
                    {badges.badges.slice(0, 4).map(badge => (
                        <div key={badge.id} className="text-center" title={badge.displayName}>
                            {badge.icon ? (
                                <img 
                                    src={badge.icon} 
                                    alt={badge.displayName}
                                    style={{ width: '32px', height: '32px' }}
                                    className="rounded"
                                />
                            ) : (
                                <FaTrophy className="text-warning" style={{ fontSize: '24px' }} />
                            )}
                            <div className="small text-muted d-none">{badge.displayName}</div>
                        </div>
                    ))}
                    {badges.badges.length > 4 && (
                        <div className="text-muted small align-self-center">
                            +{badges.badges.length - 4} more
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const getPlaceholderText = (platform) => {
        switch (platform) {
            case 'leetcode':
                return 'https://leetcode.com/u/username';
            case 'hackerrank':
                return 'https://www.hackerrank.com/profile/username';
            case 'codecademy':
                return 'https://www.codecademy.com/profiles/username';
            default:
                return `https://${platform}.com/username`;
        }
    };

    const renderPlatformCard = (key, platform) => {
        const isConnected = platform.url && (
            (key === 'leetcode' && platform.data && (platform.data.totalSolved !== undefined || platform.data.url)) ||
            (key !== 'leetcode' && platform.data && platform.data.url)
        );
        
        return (
            <Col md={4} key={key}>
                <Card className={`mb-3 h-100 ${isConnected ? 'border-success' : ''}`}>
                    <Card.Body className="d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="mb-0">{key.charAt(0).toUpperCase() + key.slice(1)}</h5>
                            <div className="d-flex align-items-center gap-2">
                                {isConnected && (
                                    <Badge bg="success" className="d-flex align-items-center gap-1">
                                        <FaCheckCircle className="small" />
                                        Connected
                                    </Badge>
                                )}
                                {isConnected && !platform.isEditing && (
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm"
                                        onClick={() => handleEdit(key)}
                                        title="Edit profile link"
                                    >
                                        <FaEdit />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isConnected && !platform.isEditing ? (
                            <div className="flex-grow-1">
                                {key === 'leetcode' && platform.data && (
                                    <>
                                        {renderLeetCodeStats(platform.data)}
                                        {platform.badges && renderBadges(platform.badges)}
                                        <div className="mt-3">
                                            <Button 
                                                variant="link" 
                                                href={platform.url} 
                                                target="_blank"
                                                className="p-0 text-decoration-none me-3"
                                            >
                                                <FaExternalLinkAlt className="me-1" />
                                                View Profile
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                onClick={() => navigate(`/leetcode/${platform.username}`)}
                                                className="p-0 text-decoration-none me-3"
                                            >
                                                <FaChartLine className="me-1" />
                                                See Full Details
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                onClick={() => handleEdit(key)}
                                                className="p-0 text-decoration-none me-3"
                                            >
                                                <FaEdit className="me-1" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                onClick={() => handleDelete(key)}
                                                className="p-0 text-decoration-none text-danger"
                                            >
                                                <FaTrash className="me-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </>
                                )}
                                
                                {(key === 'hackerrank' || key === 'codecademy') && (
                                    <div>
                                        <div className="text-success mb-2">
                                            <FaCheckCircle className="me-2" />
                                            Profile linked successfully
                                        </div>
                                        <div className="mt-3">
                                            <Button 
                                                variant="link" 
                                                href={platform.url} 
                                                target="_blank"
                                                className="p-0 text-decoration-none me-3"
                                            >
                                                <FaExternalLinkAlt className="me-1" />
                                                View Profile
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                onClick={() => navigate(`/${key}/${platform.username}`)}
                                                className="p-0 text-decoration-none me-3"
                                            >
                                                <FaChartLine className="me-1" />
                                                See Full Details
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                onClick={() => handleEdit(key)}
                                                className="p-0 text-decoration-none me-3"
                                            >
                                                <FaEdit className="me-1" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                onClick={() => handleDelete(key)}
                                                className="p-0 text-decoration-none text-danger"
                                            >
                                                <FaTrash className="me-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-grow-1">
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted">
                                        Profile URL
                                    </Form.Label>
                                    <Form.Control
                                        placeholder={getPlaceholderText(key)}
                                        value={platform.url}
                                        onChange={(e) => handleUrlChange(key, e.target.value)}
                                        isInvalid={!!platform.error}
                                        disabled={!platform.isEditing && isConnected}
                                    />
                                    {platform.username && (
                                        <Form.Text className="text-success">
                                            <FaCheckCircle className="me-1" />
                                            Username detected: {platform.username}
                                        </Form.Text>
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        {platform.error}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                
                                {!isConnected && (
                                    <>
                                        <Button 
                                            onClick={() => handleConnect(key)}
                                            disabled={!platform.url || platform.loading}
                                            className="w-100 mb-2"
                                            variant="primary"
                                        >
                                            {platform.loading ? (
                                                <>
                                                    <Spinner size="sm" className="me-2" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <FaLink className="me-2" />
                                                    Connect Profile
                                                </>
                                            )}
                                        </Button>
                                        
                                        {key === 'hackerrank' || key === 'codecademy' ? (
                                            <Alert variant="info" className="mb-2 small">
                                                Manual linking only - API integration coming soon
                                            </Alert>
                                        ) : null}
                                    </>
                                )}
                                
                                {platform.isEditing && (
                                    <div className="d-flex gap-2 mt-2">
                                        <Button 
                                            variant="success" 
                                            size="sm"
                                            onClick={() => handleSave(key)}
                                            disabled={saving}
                                            className="flex-grow-1"
                                        >
                                            {saving ? (
                                                <>
                                                    <Spinner size="sm" className="me-1" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="me-1" />
                                                    Save
                                                </>
                                            )}
                                        </Button>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => handleCancelEdit(key)}
                                            disabled={saving}
                                        >
                                            <FaTimes />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    return (
        <Container>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2>External Skills Assessments</h2>
                <Badge bg="secondary" className="ms-2">
                    Verify your technical skills
                </Badge>
            </div>
            
            <Alert variant="info" className="mb-4">
                <strong>Link your coding profiles</strong> to showcase your technical abilities and certifications.
                LeetCode provides automatic data fetching, while HackerRank and Codecademy currently support manual linking.
            </Alert>

            <Row>
                {Object.entries(platforms).map(([key, platform]) => 
                    renderPlatformCard(key, platform)
                )}
            </Row>
        </Container>
    );
}