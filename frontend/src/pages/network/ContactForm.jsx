import { Modal, Form, Button, Row, Col, Image as BootstrapImage } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";

export default function ContactForm({
    showModal,
    setShowModal,
    editing,
    editingContactId,
    formData,
    setFormData,
    handleAddOrUpdate
}) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Clear file input and preview when modal opens for new contact (not editing)
    useEffect(() => {
        console.log("useEffect triggered:", { showModal, editing });
        if (showModal && !editing) {
            console.log("Clearing file input and preview for new contact");
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setPreviewUrl(null);
        }
    }, [showModal, editing]);

    const resizeImage = (file, maxWidth = 1280, maxHeight = 720) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions to fit within 720p
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw resized image
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    // Convert blob back to File object
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(resizedFile);
                }, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const handleClose = () => {
        setShowModal(false);
        setPreviewUrl(null);
        // Clear the file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAddOrUpdate();
    };

    return (
        <Modal key={editing ? `edit-${editingContactId}` : 'add'} show={showModal} onHide={handleClose} size="lg" centered contentClassName="modal-centered-content">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editing ? "Edit Contact" : "Add New Contact"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Basic Information Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Basic Information</h6>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Profile Picture</Form.Label>
                                    <Form.Control
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                // Resize image to max 720p before setting
                                                try {
                                                    const resizedFile = await resizeImage(file);
                                                    setFormData({ ...formData, avatar: resizedFile });
                                                    
                                                    // Create preview URL from resized file
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setPreviewUrl(reader.result);
                                                    };
                                                    reader.readAsDataURL(resizedFile);
                                                } catch (error) {
                                                    console.error("Image resize failed:", error);
                                                    // Fallback to original file
                                                    setFormData({ ...formData, avatar: file });
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setPreviewUrl(reader.result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            } else {
                                                setPreviewUrl(null);
                                            }
                                        }}
                                    />
                                    {formData.avatar && (
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                Selected: {formData.avatar.name}
                                            </small>
                                        </div>
                                    )}
                                    {previewUrl && (
                                        <div className="mt-3">
                                            <div className="d-flex align-items-center">
                                                <BootstrapImage 
                                                    src={previewUrl} 
                                                    rounded 
                                                    style={{ 
                                                        width: '80px', 
                                                        height: '80px', 
                                                        objectFit: 'cover',
                                                        marginRight: '10px'
                                                    }} 
                                                />
                                                <div>
                                                    <small className="text-muted">Preview</small>
                                                    <br />
                                                    <Button 
                                                        variant="link" 
                                                        size="sm" 
                                                        className="p-0 text-danger"
                                                        onClick={() => {
                                                            setPreviewUrl(null);
                                                            setFormData({ ...formData, avatar: null });
                                                            // Clear the file input
                                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Employment Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Employment</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Position</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.employment.position}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            employment: { ...formData.employment, position: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.employment.company}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            employment: { ...formData.employment, company: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.employment.location}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            employment: { ...formData.employment, location: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Industry</Form.Label>
                                    <Form.Select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    >
                                        <option value="">Select Industry</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Education">Education</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Design">Design</option>
                                        <option value="Consulting">Consulting</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Education Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Education</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Institution Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.education?.institution_name || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            education: { 
                                                ...formData.education, 
                                                institution_name: e.target.value 
                                            }
                                        })}
                                        placeholder="University/School Name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Degree</Form.Label>
                                    <Form.Select
                                        value={formData.education?.degree || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            education: { 
                                                ...formData.education, 
                                                degree: e.target.value 
                                            }
                                        })}
                                    >
                                        <option value="">Select Degree</option>
                                        <option value="High School Diploma">High School Diploma</option>
                                        <option value="Associate of Arts">Associate of Arts</option>
                                        <option value="Associate of Science">Associate of Science</option>
                                        <option value="Bachelor of Arts">Bachelor of Arts</option>
                                        <option value="Bachelor of Science">Bachelor of Science</option>
                                        <option value="Bachelor of Business Administration">Bachelor of Business Administration</option>
                                        <option value="Bachelor of Engineering">Bachelor of Engineering</option>
                                        <option value="Master of Arts">Master of Arts</option>
                                        <option value="Master of Science">Master of Science</option>
                                        <option value="Master of Business Administration">Master of Business Administration</option>
                                        <option value="Master of Engineering">Master of Engineering</option>
                                        <option value="Juris Doctor">Juris Doctor</option>
                                        <option value="Doctor of Medicine">Doctor of Medicine</option>
                                        <option value="Doctor of Philosophy">PhD</option>
                                        <option value="Doctor of Education">Doctor of Education</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Field of Study</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.education?.field_of_study || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            education: { 
                                                ...formData.education, 
                                                field_of_study: e.target.value 
                                            }
                                        })}
                                        placeholder="e.g., Computer Science"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Graduation Date</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.education?.graduation_date || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            education: { 
                                                ...formData.education, 
                                                graduation_date: e.target.value 
                                            }
                                        })}
                                        placeholder="e.g., May 2020"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Education Level</Form.Label>
                                    <Form.Select
                                        value={formData.education?.education_level || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            education: { 
                                                ...formData.education, 
                                                education_level: e.target.value 
                                            }
                                        })}
                                    >
                                        <option value="">Select Level</option>
                                        <option value="High School">High School</option>
                                        <option value="Associate">Associate</option>
                                        <option value="Bachelor">Bachelor</option>
                                        <option value="Master">Master</option>
                                        <option value="PhD">PhD</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Achievements</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={formData.education?.achievements || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            education: { 
                                                ...formData.education, 
                                                achievements: e.target.value 
                                            }
                                        })}
                                        placeholder="Academic achievements, honors, etc..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Relationship Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Relationship</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Relationship Type</Form.Label>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Relationship Strength</Form.Label>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Reminder Frequency</Form.Label>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Select
                                    value={formData.relationship_type}
                                    onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                                >
                                    <option value="colleague">Colleague</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="mentee">Mentee</option>
                                    <option value="friend">Friend</option>
                                    <option value="client">Client</option>
                                    <option value="recruiter">Recruiter</option>
                                    <option value="other">Other</option>
                                </Form.Select>
                            </Col>
                            <Col md={4}>
                                <Form.Select
                                    value={formData.relationship_strength}
                                    onChange={(e) => setFormData({ ...formData, relationship_strength: e.target.value })}
                                >
                                    <option value="strong">Strong</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="weak">Weak</option>
                                </Form.Select>
                            </Col>
                            <Col md={4}>
                                <Form.Select
                                    value={formData.reminder_frequency}
                                    onChange={(e) => setFormData({ ...formData, reminder_frequency: e.target.value })}
                                >
                                    <option value="none">None</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </Form.Select>
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Industry Professional"
                                        checked={formData.industry_professional || false}
                                        onChange={(e) => setFormData({ ...formData, industry_professional: e.target.checked })}
                                    />
                                    <Form.Text className="text-muted">
                                        Mark this contact as an industry professional for discovery and networking features
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Contact Details Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Contact Details</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>LinkedIn</Form.Label>
                                    <Form.Control
                                        type="url"
                                        value={formData.websites.linkedin}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            websites: { ...formData.websites, linkedin: e.target.value }
                                        })}
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Other Website</Form.Label>
                                    <Form.Control
                                        type="url"
                                        value={formData.websites.other}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            websites: { ...formData.websites, other: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Work Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone_numbers.work}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phone_numbers: { ...formData.phone_numbers, work: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mobile Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone_numbers.mobile}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phone_numbers: { ...formData.phone_numbers, mobile: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Home Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.phone_numbers.home}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phone_numbers: { ...formData.phone_numbers, home: e.target.value }
                                        })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Primary Phone</Form.Label>
                                    <Form.Select
                                        value={formData.phone_numbers.primary || 'home'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phone_numbers: { ...formData.phone_numbers, primary: e.target.value }
                                        })}
                                    >
                                        <option value="home">Home</option>
                                        <option value="work">Work</option>
                                        <option value="mobile">Mobile</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Next Reminder Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.next_reminder_date}
                                        onChange={(e) => setFormData({ ...formData, next_reminder_date: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Interests Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Interests</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Professional Interests</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.professional_interests}
                                        onChange={(e) => setFormData({ ...formData, professional_interests: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Personal Interests</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.personal_interests}
                                        onChange={(e) => setFormData({ ...formData, personal_interests: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Notes Section */}
                    <div className="form-section">
                        <h6 className="form-section-title">Notes</h6>
                        <Form.Group className="mb-3">
                            <Form.Label>Personal Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Personal notes about this contact..."
                            />
                        </Form.Group>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    {editing ? "Update" : "Add"} Contact
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
