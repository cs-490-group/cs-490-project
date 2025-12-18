import { useState, useEffect } from "react";
import { Container, Card, Spinner, Row, Col, Badge, Button } from "react-bootstrap";
import NetworksAPI from "../../api/network";
import "./network.css";
import posthog from "posthog-js";

let loadingMessages = [
	"**Discovering new connections...**",
	"Finding professionals in your industry...",
	"Expanding your network reach...",
	"Discovering potential mentors and colleagues...",
	"Building bridges to new opportunities..."
];

export default function DiscoveryPage() {
	const [contacts, setContacts] = useState([]);
	const [avatars, setAvatars] = useState({});
	const [avatarBlobs, setAvatarBlobs] = useState({}); // Store original blobs for copying
	const [loading, setLoading] = useState(true);
	const [loadingMessage, setLoadMessage] = useState("Placeholder");
	const [filterText, setFilterText] = useState({
		name: "",
		email: "",
		phone: "",
		company: "",
		position: "",
		location: "",
		institution: "",
		degree: "",
		connectionDegree: "",
		industry_professional: ""
	});

	useEffect(() => {
		setLoadMessage(loadingMessages[Math.floor(Math.random() * (loadingMessages.length))]);
		fetchDiscoveryContacts();
	}, []);

	const fetchDiscoveryContacts = async () => {
		try {
			const res = await NetworksAPI.getDiscovery();
			setContacts(res.data || []);
			// Fetch avatars for each contact and store blobs
			const avatarPromises = (res.data || []).map(async (contact) => {
				try {
					const avatarResponse = await NetworksAPI.getAvatar(contact._id);
					const avatarUrl = URL.createObjectURL(avatarResponse.data);
					// Store the blob for later copying
					return { 
						[contact._id]: avatarUrl,
						blob: avatarResponse.data
					};
				} catch (error) {
					return { [contact._id]: "./default.png" };
				}
			});
			
			const avatarResults = await Promise.all(avatarPromises);
			const avatarMap = avatarResults.reduce((acc, curr) => ({ ...acc, [Object.keys(curr)[0]]: curr[Object.keys(curr)[0]] }), {});
			const blobMap = avatarResults.reduce((acc, curr) => {
				const contactId = Object.keys(curr)[0];
				if (curr.blob) {
					acc[contactId] = curr.blob;
				}
				return acc;
			}, {});
			
			setAvatars(avatarMap);
			setAvatarBlobs(blobMap);
		} catch (error) {
			console.error("Failed to fetch discovery contacts:", error);
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
			if (filterText.institution && !contact.education?.institution_name?.toLowerCase().includes(filterText.institution.toLowerCase())) {
				return false;
			}
			if (filterText.degree && !contact.education?.degree?.toLowerCase().includes(filterText.degree.toLowerCase())) {
				return false;
			}
			if (filterText.connectionDegree && !contact.connection_degree?.toString().includes(filterText.connectionDegree)) {
				return false;
			}
			if (filterText.industry_professional && ((contact.industry_professional && filterText.industry_professional === "false") || (!contact.industry_professional && filterText.industry_professional === "true"))) {
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
			location: "",
			institution: "",
			degree: "",
			connectionDegree: "",
			industry_professional: ""
		});
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

	const handleAddContact = async (contact) => {
		try {
			// Copy ALL available contact data (don't hardcode fields)
			const contactData = { ...contact };
			
			// Remove discovery-specific and system fields that shouldn't be copied
			delete contactData._id;  // Don't copy the discovery contact ID
			delete contactData.is_alumni;
			delete contactData.connection_degree;
			delete contactData.mutual_connection;
			delete contactData.num_users_with_contact;
			delete contactData.owned_by;  // Let the backend set this
			delete contactData.associated_users;  // Let the backend set this
			
			// Clean education data if it exists and has invalid structure
			if (contactData.education && typeof contactData.education === 'object') {
				// Keep only valid fields for ContactEducation schema
				const cleanedEdu = {};
				const validEduFields = ['institution_name', 'degree', 'field_of_study', 'graduation_date', 'education_level', 'achievements'];
				validEduFields.forEach(field => {
					if (contactData.education[field] !== undefined) {
						cleanedEdu[field] = contactData.education[field];
					}
				});
				contactData.education = Object.keys(cleanedEdu).length > 0 ? cleanedEdu : null;
			}
			
			// Ensure we have the contact ID from the original
			const originalContactId = contact._id;
			
			// Add the contact to user's own contacts
			const addResponse = await NetworksAPI.add(contactData);
			const newContactId = addResponse.data.contact_id; // Backend returns contact_id field
			
			// If the original contact has an avatar, copy it to the new contact
			if (originalContactId && newContactId && avatarBlobs[originalContactId]) {
				try {
					const avatarBlob = avatarBlobs[originalContactId];
					
					// Convert blob to file for upload
					const avatarFile = new File([avatarBlob], 'avatar.jpg', { type: 'image/jpeg' });
					
					// Upload avatar to new contact
					await NetworksAPI.uploadAvatar(newContactId, avatarFile);
				} catch (avatarError) {
					// Continue without avatar - not a critical error
				}
			}
			
			alert(`Successfully added ${contact.name} to your contacts!`);
			posthog.capture("contact_added", { contact_name: contact.name, contact_email: contact.email });
			
			// Optionally refresh the discovery contacts list
			fetchDiscoveryContacts();
		} catch (error) {
			console.error("Failed to add contact:", error);
			alert(`Failed to add ${contact.name}. Please try again.`);
		}
	};

	const getAlumniBadge = (contact) => {
		if (contact.is_alumni) {
			return (
				<Badge bg="info" className="small-badge me-2">
					<i className="bi bi-mortarboard-fill me-1"></i>
					Alumni
				</Badge>
			);
		}
		return null;
	};

	const getConnectionDegreeBadge = (contact) => {
		if (contact.connection_degree === 2) {
			return (
				<Badge bg="success" className="small-badge me-2">
					<i className="bi bi-people-fill me-1"></i>
					2nd Degree
				</Badge>
			);
		} else if (contact.connection_degree === 3) {
			return (
				<Badge bg="warning" className="small-badge me-2">
					<i className="bi bi-person-lines-fill me-1"></i>
					3rd Degree
				</Badge>
			);
		} else if (contact.connection_degree === 0) {
			return (
				<Badge bg="primary" className="small-badge me-2">
					<i className="bi bi-person-plus-fill me-1"></i>
					New Connection
				</Badge>
			);
		}
		return null;
	};

	const getMutualConnection = (contact) => {
		// For 2nd degree connections, show the actual mutual connection details
		if (contact.connection_degree === 2 && contact.mutual_connection) {
			const mutual = contact.mutual_connection;
			return `Connected to ${mutual.name} - ${mutual.email}`;
		}
		return null;
	};

	if (loading) {
		return (
			<Container fluid className="dashboard-gradient min-vh-100 py-4">
				<div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "200px" }}>
					<Spinner animation="border" variant="light" className="mb-3" />
					<p className="text-white fs-5">Hold on while we discover new connections...</p>
				</div>
			</Container>
		);
	}

	return (
		<Container fluid className="dashboard-gradient min-vh-100 py-4">
			<h1 className="text-center text-white fw-bold mb-5 display-4">
				Discover New Connections
			</h1>

			<Row className="py-4">
				<Col xs={12} className="mb-4">
					<div className="filter-section">
						<h2 className="text-white mb-3">Search Professionals</h2>
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
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by institution..."
									name="institution"
									value={filterText.institution}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<input
									type="text"
									placeholder="Search by degree..."
									name="degree"
									value={filterText.degree}
									onChange={handleFilterChange}
									className="filter-input"
								/>
							</div>
							<div className="filter-group">
								<select
									name="connectionDegree"
									aria-label="Filter by Connection Degree"
									value={filterText.connectionDegree}
									onChange={handleFilterChange}
									className="form-select"
								>
									<option value="">All Degrees</option>
									<option value="0">New</option>
									<option value="2">2nd Degree</option>
									<option value="3">3rd Degree</option>
								</select>
							</div>
							<div className="filter-group">
								<select
									placeholder="Filter by industry professional..."
									name="industry_professional"
									value={filterText.industry_professional}
									onChange={handleFilterChange}
									className="filter-input"
									style={{color:"black"}}
								>
									<option value="">All Contacts</option>
									<option value="true">Industry Professionals</option>
									<option value="false">Non-Professionals</option>
								</select>
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
							{Object.values(filterText).some(val => val !== "") ? "No professionals match your search." : "No professionals available for discovery at the moment."}
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

										{/* Education Section */}
										{contact.education && (
											<div className="contact-section">
												<div className="section-header">
													<small className="section-title">Education</small>
												</div>
												<div className="section-content">
													{contact.education.institution_name && (
														<div className="contact-info-row">
															<strong>Institution:</strong> {contact.education.institution_name}
														</div>
													)}
													{contact.education.degree && (
														<div className="contact-info-row">
															<strong>Degree:</strong> {contact.education.degree}
														</div>
													)}
													{contact.education.field_of_study && (
														<div className="contact-info-row">
															<strong>Field:</strong> {contact.education.field_of_study}
														</div>
													)}
													{contact.education.graduation_date && (
														<div className="contact-info-row">
															<strong>Graduated:</strong> {contact.education.graduation_date}
														</div>
													)}
												</div>
											</div>
										)}

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
												<small className="section-title">Relationship Type</small>
											</div>
											<div className="section-content">
												<div className="d-flex gap-2 mb-2 flex-wrap">
													{contact.industry_professional && (
														<Badge bg="info" className="small-badge">
															<i className="bi bi-briefcase-fill me-1"></i>
															Industry Professional
														</Badge>
													)}
													{getConnectionDegreeBadge(contact)}
													{getAlumniBadge(contact)}
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
												{getMutualConnection(contact) && (
													<div className="mt-2">
														<small className="text-muted">
															<i className="bi bi-link-45deg me-1"></i>
															{getMutualConnection(contact)}
														</small>
													</div>
												)}
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

										{/* Add Contact Button */}
										<div className="mt-auto pt-3 border-top">
											<Button variant="success" onClick={() => handleAddContact(contact)}>
												<i className="bi bi-plus-circle me-2"></i>
												Add Contact
											</Button>
										</div>
									</Card.Body>
								</Card>
							))}
						</div>
					)}
				</Col>
			</Row>
		</Container>
	);
}
