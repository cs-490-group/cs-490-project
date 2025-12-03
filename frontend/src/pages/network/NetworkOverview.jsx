import { useState, useEffect } from "react";
import { Container, Card, Button, Spinner, Row, Col, Modal, Form, Badge } from "react-bootstrap";
import NetworksAPI from "../../api/network";
import "./network.css";

let loadingMessages = [
	"**Crickets**",
	"Let's invite some more people into your network!",
	"A broader network builds to your success, let's invite some people!",
	"Let's meet some new people, send them a request!",
	"It's empty in here... let's change that!"
];

export default function NetworkOverview() {
	const [contacts, setContacts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMessage, setLoadMessage] = useState("Placeholder");
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editingContactId, setEditingContactId] = useState(null);
	const [filterText, setFilterText] = useState({
		name: "",
		email: "",
		phone: "",
		company: "",
		position: "",
		location: ""
	});
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone_numbers: {
			primary: "",
			home: "",
			work: "",
			mobile: ""
		},
		websites: {
			linkedin: "",
			other: ""
		},
		employment: {
			position: "",
			company: "",
			location: ""
		},
		relationship_type: "colleague",
		relationship_strength: "moderate",
		industry: "",
		professional_interests: "",
		personal_interests: "",
		interaction_history: [],
		notes: "",
		reminder_frequency: "none",
		next_reminder_date: ""
	});

	const [avatars, setAvatars] = useState({});

	useEffect(() => {
		setLoadMessage(loadingMessages[Math.floor(Math.random() * (loadingMessages.length))]);
		fetchContacts();
	}, []);

	const fetchContacts = async () => {
		try {
			const res = await NetworksAPI.getAll();
			setContacts(res.data || []);
			// Fetch avatars for each contact
			const avatarPromises = (res.data || []).map(async (contact) => {
				try {
					const avatarResponse = await NetworksAPI.getAvatar(contact._id);
					const avatarUrl = URL.createObjectURL(avatarResponse.data);
					return { [contact._id]: avatarUrl };
				} catch (error) {
					return { [contact._id]: "./default.png" };
				}
			});
			
			const avatarResults = await Promise.all(avatarPromises);
			const avatarMap = avatarResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
			setAvatars(avatarMap);
		} catch (error) {
			console.error("Failed to fetch contacts:", error);
		} finally {
			setLoading(false);
		}
	};

	const filterContacts = (contactsToFilter) => {
		return contactsToFilter.filter(contact => {
			if (filterText.name && !contact.name?.toLowerCase().includes(filterText.name.toLowerCase())) {
				return false;
			}
			if (filterText.email && !contact.email?.toLowerCase().includes(filterText.email.toLowerCase())) {
				return false;
			}
			if (filterText.phone && !JSON.stringify(contact.phone_numbers || {}).toLowerCase().includes(filterText.phone.toLowerCase())) {
				return false;
			}
			if (filterText.company && !contact.employment?.company?.toLowerCase().includes(filterText.company.toLowerCase())) {
				return false;
			}
			if (filterText.position && !contact.employment?.position?.toLowerCase().includes(filterText.position.toLowerCase())) {
				return false;
			}
			if (filterText.location && !contact.employment?.location?.toLowerCase().includes(filterText.location.toLowerCase())) {
				return false;
			}
			return true;
		});
	};

	const handleFilterChange = (event) => {
		const { name, value } = event.target;
		setFilterText(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const clearFilters = () => {
		setFilterText({
			name: "",
			email: "",
			phone: "",
			company: "",
			position: "",
			location: ""
		});
	};

	const handleAddOrUpdate = async () => {
		try {
			// Clean up the data before sending to match backend schema
			const dataToSend = {
				name: formData.name || null,
				email: formData.email || null,
				phone_numbers: {
					primary: formData.phone_numbers.primary || null, // Send as string, backend schema needs fixing
					home: formData.phone_numbers.home || null,
					work: formData.phone_numbers.work || null,
					mobile: formData.phone_numbers.mobile || null
				},
				websites: {
					linkedin: formData.websites.linkedin || null,
					other: formData.websites.other || null
				},
				employment: {
					position: formData.employment.position || null,
					company: formData.employment.company || null,
					location: formData.employment.location || null
				},
				relationship_type: formData.relationship_type || null,
				relationship_strength: formData.relationship_strength || null,
				industry: formData.industry || null,
				professional_interests: formData.professional_interests || null,
				personal_interests: formData.personal_interests || null,
				interaction_history: formData.interaction_history || [],
				notes: formData.notes || null,
				reminder_frequency: formData.reminder_frequency || null,
				next_reminder_date: formData.next_reminder_date || null
			};

			if (editing && editingContactId) {
				await NetworksAPI.update(editingContactId, dataToSend);
			} else {
				await NetworksAPI.add(dataToSend);
			}
			await fetchContacts();
			setShowModal(false);
			resetForm();
		} catch (error) {
			console.error("Error saving contact:", error);
			console.error("Error details:", error.response?.data); // More detailed error
		}
	};

	const handleEdit = (contact) => {
		setEditing(true);
		setEditingContactId(contact._id);
		setFormData({
			name: contact.name || "",
			email: contact.email || "",
			phone_numbers: {
				primary: contact.phone_numbers?.primary || "",
				home: contact.phone_numbers?.home || "",
				work: contact.phone_numbers?.work || "",
				mobile: contact.phone_numbers?.mobile || ""
			},
			websites: {
				linkedin: contact.websites?.linkedin || "",
				other: contact.websites?.other || ""
			},
			employment: {
				position: contact.employment?.position || "",
				company: contact.employment?.company || "",
				location: contact.employment?.location || ""
			},
			relationship_type: contact.relationship_type || "colleague",
			relationship_strength: contact.relationship_strength || "moderate",
			industry: contact.industry || "",
			professional_interests: contact.professional_interests || "",
			personal_interests: contact.personal_interests || "",
			interaction_history: contact.interaction_history || [],
			notes: contact.notes || "",
			reminder_frequency: contact.reminder_frequency || "none",
			next_reminder_date: contact.next_reminder_date || ""
		});
		setShowModal(true);
	};

	const handleDelete = async (contact) => {
		if (window.confirm("Are you sure you want to delete this contact?")) {
			try {
				// Delete the contact first
				await NetworksAPI.delete(contact._id);
				
				// Try to delete avatar, but don't fail if it doesn't exist
				try {
					await NetworksAPI.deleteAvatar(contact._id);
				} catch (avatarError) {
					console.log("Avatar deletion failed (likely doesn't exist):", avatarError.message);
					// Continue without failing the whole operation
				}
				
				await fetchContacts();
			} catch (error) {
				console.error("Failed to delete contact:", error);
			}
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			email: "",
			phone_numbers: {
				primary: "",
				home: "",
				work: "",
				mobile: ""
			},
			websites: {
				linkedin: "",
				other: ""
			},
			employment: {
				position: "",
				company: "",
				location: ""
			},
			relationship_type: "colleague",
			relationship_strength: "moderate",
			industry: "",
			professional_interests: "",
			personal_interests: "",
			interaction_history: [],
			notes: "",
			reminder_frequency: "none",
			next_reminder_date: ""
		});
		setEditing(false);
		setEditingContactId(null);
	};

	const getRelationshipColor = (type) => {
		switch (type) {
			case "colleague": return "primary";
			case "mentor": return "success";
			case "mentee": return "info";
			case "friend": return "secondary";
			case "client": return "warning";
			case "recruiter": return "danger";
			default: return "light";
		}
	};

	const getStrengthColor = (strength) => {
		switch (strength) {
			case "strong": return "success";
			case "moderate": return "warning";
			case "weak": return "secondary";
			default: return "light";
		}
	};

	if (loading) {
		return (
			<Container fluid className="dashboard-gradient min-vh-100 py-4">
				<div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
					<Spinner animation="border" variant="light" className="mb-3" />
					<p className="text-white fs-5">Hold on while we load your network...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container fluid className="dashboard-gradient min-vh-100 py-4">
			<h1 className="text-center text-white fw-bold mb-5 display-4">
				Your Professional Network
			</h1>

			<Row>
				<Col xs={12} className="mb-4">
					<Button onClick={() => { setShowModal(true); resetForm(); }}>
						+ Add Contact
					</Button>
				</Col>
			</Row>

			<Row className="py-4">
				<Col xs={12} className="mb-4">
					<div className="filter-section">
						<h5 className="text-white mb-3">Search Contacts</h5>
						<div className="filter-controls">
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by name..."
									name="name"
									value={filterText.name}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by email..."
									name="email"
									value={filterText.email}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by phone..."
									name="phone"
									value={filterText.phone}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by company..."
									name="company"
									value={filterText.company}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by position..."
									name="position"
									value={filterText.position}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by location..."
									name="location"
									value={filterText.location}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							{Object.values(filterText).some(val => val !== "") && (
								<Button className="filter-clear-btn" onClick={clearFilters}>Clear Filters</Button>
							)}
						</div>
					</div>
				</Col>
			</Row>

			<Row className="py-4">
				<Col>
					{filterContacts(contacts).length === 0 ? (
						<p className="text-white">
							{Object.values(filterText).some(val => val !== "") ? "No contacts match your search." : "No contacts found. Add your first contact to get started!"}
						</p>
					) : (
						<div className="contact-display">
							{filterContacts(contacts).map(contact => (
								<Card key={contact._id} className="contact-card">
									<Card.Body>
										{/* Header with avatar and centered name/email */}
										<div className="d-flex flex-column align-items-center text-center mb-3">
											<img 
												src={avatars[contact._id] || "./default.png"} 
												alt={contact.name}
												className="contact-avatar"
											/>
											<Card.Title as="h3" className="mb-1">{contact.name}</Card.Title>
											<Card.Subtitle className="mb-2">{contact.email}</Card.Subtitle>
										</div>

										{/* Employment Section */}
										<div className="contact-section">
											<div className="section-header">
												<small className="section-title">Employment</small>
											</div>
											<div className="section-content">
												{contact.employment?.position && (
													<div className="contact-info-row">
														<strong>Position:</strong> {contact.employment.position}
													</div>
												)}
												{contact.employment?.company && (
													<div className="contact-info-row">
														<strong>Company:</strong> {contact.employment.company}
													</div>
												)}
												{contact.employment?.location && (
													<div className="contact-info-row">
														<strong>Location:</strong> {contact.employment.location}
													</div>
												)}
												{contact.industry && (
													<div className="contact-info-row">
														<strong>Industry:</strong> {contact.industry}
													</div>
												)}
											</div>
										</div>

										{/* Contact Details Section */}
										<div className="contact-section">
											<div className="section-header">
												<small className="section-title">Contact Details</small>
											</div>
											<div className="section-content">
												{contact.phone_numbers?.primary && (
													<div className="contact-info-row">
														<strong>Phone:</strong> {contact.phone_numbers.primary}
													</div>
												)}
												{contact.websites?.linkedin && (
													<div className="contact-info-row">
														<strong>LinkedIn: </strong> 
														<a href={contact.websites.linkedin.startsWith('http') ? contact.websites.linkedin : `https://${contact.websites.linkedin}`} 
														   target="_blank" 
														   rel="noopener noreferrer"
														   className="external-link">
															LinkedIn Profile
														</a>
													</div>
												)}
												{contact.websites?.other && (
													<div className="contact-info-row">
														<strong>Website:</strong> 
														<a href={contact.websites.other.startsWith('http') ? contact.websites.other : `https://${contact.websites.other}`} 
														   target="_blank" 
														   rel="noopener noreferrer"
														   className="external-link">
															Visit Website
														</a>
													</div>
												)}
											</div>
										</div>

										{/* Relationship Section */}
										<div className="contact-section">
											<div className="section-header">
												<small className="section-title">Relationship</small>
											</div>
											<div className="section-content">
												<div className="d-flex gap-2 mb-2">
													{contact.relationship_type && (
														<Badge bg={getRelationshipColor(contact.relationship_type)} className="small-badge">
															{contact.relationship_type}
														</Badge>
													)}
													{contact.relationship_strength && (
														<Badge bg={getStrengthColor(contact.relationship_strength)} className="small-badge">
															{contact.relationship_strength}
														</Badge>
													)}
												</div>
											</div>
										</div>

										{/* Notes Section */}
										{contact.notes && (
											<div className="contact-section">
												<div className="section-header">
													<small className="section-title">Notes</small>
												</div>
												<div className="section-content">
													<div className="contact-info-row">
														{contact.notes.substring(0, 150)}{contact.notes.length > 150 ? "..." : ""}
													</div>
												</div>
											</div>
										)}

										{/* Action Buttons */}
										<div className="mt-auto pt-3 border-top">
											<div className="d-flex gap-2">
												<Button variant="outline-primary" size="sm" onClick={() => handleEdit(contact)}>
													Edit
												</Button>
												<Button variant="outline-danger" size="sm" onClick={() => handleDelete(contact)}>
													Delete
												</Button>
											</div>
										</div>
									</Card.Body>
								</Card>
							))}
						</div>
					)}
				</Col>
			</Row>

			<Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
				<Modal.Header closeButton>
					<Modal.Title>
						{editing ? "Edit Contact" : "Add New Contact"}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						{/* Basic Information Section */}
						<div className="form-section">
							<h6 className="form-section-title">Basic Information</h6>
							<Row>
								<Col md={12}>
									<Form.Group className="mb-3">
										<Form.Label>Name</Form.Label>
										<Form.Control
											type="text"
											value={formData.name}
											onChange={(e) => setFormData({...formData, name: e.target.value})}
											required
										/>
									</Form.Group>
								</Col>
							</Row>
							<Row>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Email</Form.Label>
										<Form.Control
											type="email"
											value={formData.email}
											onChange={(e) => setFormData({...formData, email: e.target.value})}
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Primary Phone</Form.Label>
										<Form.Control
											type="tel"
											value={formData.phone_numbers.primary}
											onChange={(e) => setFormData({
												...formData, 
												phone_numbers: {...formData.phone_numbers, primary: e.target.value}
											})}
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
												employment: {...formData.employment, position: e.target.value}
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
												employment: {...formData.employment, company: e.target.value}
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
												employment: {...formData.employment, location: e.target.value}
											})}
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Industry</Form.Label>
										<Form.Select
											value={formData.industry}
											onChange={(e) => setFormData({...formData, industry: e.target.value})}
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

						{/* Relationship Section */}
						<div className="form-section">
							<h6 className="form-section-title">Relationship</h6>
							<Row>
								<Col md={4}>
									<Form.Group className="mb-3">
										<Form.Label>Relationship Type</Form.Label>
										<Form.Select
											value={formData.relationship_type}
											onChange={(e) => setFormData({...formData, relationship_type: e.target.value})}
										>
											<option value="colleague">Colleague</option>
											<option value="mentor">Mentor</option>
											<option value="mentee">Mentee</option>
											<option value="friend">Friend</option>
											<option value="client">Client</option>
											<option value="recruiter">Recruiter</option>
											<option value="other">Other</option>
										</Form.Select>
									</Form.Group>
								</Col>
								<Col md={4}>
									<Form.Group className="mb-3">
										<Form.Label>Relationship Strength</Form.Label>
										<Form.Select
											value={formData.relationship_strength}
											onChange={(e) => setFormData({...formData, relationship_strength: e.target.value})}
										>
											<option value="strong">Strong</option>
											<option value="moderate">Moderate</option>
											<option value="weak">Weak</option>
										</Form.Select>
									</Form.Group>
								</Col>
								<Col md={4}>
									<Form.Group className="mb-3">
										<Form.Label>Reminder Frequency</Form.Label>
										<Form.Select
											value={formData.reminder_frequency}
											onChange={(e) => setFormData({...formData, reminder_frequency: e.target.value})}
										>
											<option value="none">None</option>
											<option value="weekly">Weekly</option>
											<option value="monthly">Monthly</option>
											<option value="quarterly">Quarterly</option>
											<option value="yearly">Yearly</option>
										</Form.Select>
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
												websites: {...formData.websites, linkedin: e.target.value}
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
												websites: {...formData.websites, other: e.target.value}
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
												phone_numbers: {...formData.phone_numbers, work: e.target.value}
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
												phone_numbers: {...formData.phone_numbers, mobile: e.target.value}
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
												phone_numbers: {...formData.phone_numbers, home: e.target.value}
											})}
										/>
									</Form.Group>
								</Col>
							</Row>
							<Row>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Next Reminder Date</Form.Label>
										<Form.Control
											type="date"
											value={formData.next_reminder_date}
											onChange={(e) => setFormData({...formData, next_reminder_date: e.target.value})}
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
											onChange={(e) => setFormData({...formData, professional_interests: e.target.value})}
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className="mb-3">
										<Form.Label>Personal Interests</Form.Label>
										<Form.Control
											type="text"
											value={formData.personal_interests}
											onChange={(e) => setFormData({...formData, personal_interests: e.target.value})}
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
									onChange={(e) => setFormData({...formData, notes: e.target.value})}
									placeholder="Personal notes about this contact..."
								/>
							</Form.Group>
						</div>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowModal(false)}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleAddOrUpdate}>
						{editing ? "Update" : "Add"} Contact
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
}
