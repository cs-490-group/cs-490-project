import { useState, useEffect } from "react";
import { Container, Card, Button, Spinner, Row, Col, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NetworksAPI from "../../api/network";
import ContactForm from "./ContactForm";
import "./network.css";

let loadingMessages = [
	"**Crickets**",
	"Let's invite some more people into your network!",
	"A broader network builds to your success, let's invite some people!",
	"Let's meet some new people, send them a request!",
	"It's empty in here... let's change that!"
];

export default function NetworkOverview() {
	const navigate = useNavigate();
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
		location: "",
		institution: "",
		degree: ""
	});
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		avatar: null,
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
		education: {
			institution_name: "",
			degree: "",
			field_of_study: "",
			graduation_date: "",
			education_level: "",
			achievements: ""
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
		// Scroll to top when component mounts
		window.scrollTo(0, 0);
	}, []);

	const fetchContacts = async () => {
		try {
			const res = await NetworksAPI.getAll();
			setContacts(res.data || []);
			
			// Clear existing avatars to force refresh
			setAvatars({});
			
			// Fetch avatars for each contact
			const avatarPromises = (res.data || []).map(async (contact) => {
				try {
					const avatarResponse = await NetworksAPI.getAvatar(contact._id);
					const avatarUrl = URL.createObjectURL(avatarResponse.data);
					return { [contact._id]: avatarUrl };
				} catch (error) {
					// Handle 400/404 (avatar not found) and other errors gracefully
					if (error.response?.status === 400 || error.response?.status === 404) {
						return { [contact._id]: "./default.png" };
					}
					console.warn(`Failed to fetch avatar for ${contact._id}:`, error.message);
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

	const getUniqueDegrees = () => {
		const degrees = contacts
			.map(contact => contact.education?.degree)
			.filter(degree => degree && degree.trim() !== '');
		return [...new Set(degrees)].sort();
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
			degree: ""
		});
	};

	const handleAddOrUpdate = async () => {
		try {
			// Clean up the data before sending to match backend schema
			const dataToSend = {
				name: formData.name || null,
				email: formData.email || null,
				phone_numbers: {
					primary: formData.phone_numbers.primary || null,
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
				education: {
					institution_name: formData.education.institution_name || null,
					degree: formData.education.degree || null,
					field_of_study: formData.education.field_of_study || null,
					graduation_date: formData.education.graduation_date || null,
					education_level: formData.education.education_level || null,
					achievements: formData.education.achievements || null
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

			let contactId;
			if (editing && editingContactId) {
				await NetworksAPI.update(editingContactId, dataToSend);
				contactId = editingContactId;
			} else {
				const response = await NetworksAPI.add(dataToSend);
				contactId = response.data.contact_id;
			}

			// Handle avatar upload
			if (formData.avatar && formData.avatar instanceof File) {
				try {
					console.log("Uploading avatar for contact:", contactId);
					console.log("Avatar file:", formData.avatar);
					console.log("Avatar file type:", formData.avatar.type);
					console.log("Avatar file size:", formData.avatar.size);
					
					if (editing && editingContactId) {
						// Try to update first, if that fails, upload
						console.log("Editing existing contact, updating avatar");
						await NetworksAPI.updateAvatar(editingContactId, formData.avatar);
					} else {
						console.log("Creating new contact, uploading avatar");
						const result = await NetworksAPI.uploadAvatar(contactId, formData.avatar);
						console.log("Upload result:", result);
					}
					console.log("Avatar upload successful");
				} catch (avatarError) {
					console.error("Avatar upload error:", avatarError);
					console.error("Error response:", avatarError.response?.data);
					// If update fails (no existing avatar), try uploading
					if (editing && editingContactId) {
						try {
							await NetworksAPI.uploadAvatar(editingContactId, formData.avatar);
							console.log("Fallback upload successful");
						} catch (fallbackError) {
							console.error("Fallback upload also failed:", fallbackError);
						}
					} else {
						throw avatarError;
					}
				}
			} else {
				console.log("No avatar to upload or avatar is not a File object");
				console.log("formData.avatar:", formData.avatar);
				console.log("Is File?", formData.avatar instanceof File);
			}

			await fetchContacts();
			setShowModal(false);
			resetForm();
		} catch (error) {
			console.error("Error saving contact:", error);
			console.error("Error details:", error.response?.data);
		}
	};

	const handleEdit = (contact) => {
		setEditing(true);
		setEditingContactId(contact._id);
		setFormData({
			name: contact.name || "",
			email: contact.email || "",
			avatar: null,
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
			education: {
				institution_name: contact.education?.institution_name || "",
				degree: contact.education?.degree || "",
				field_of_study: contact.education?.field_of_study || "",
				graduation_date: contact.education?.graduation_date || "",
				education_level: contact.education?.education_level || "",
				achievements: contact.education?.achievements || ""
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
					// Avatar deletion failed (likely doesn't exist) - continue
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
			avatar: null,
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
			education: {
				institution_name: "",
				degree: "",
				field_of_study: "",
				graduation_date: "",
				education_level: "",
				achievements: ""
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
					<Button onClick={() => { setShowModal(true); resetForm(); }} style={{margin:"auto"}}>
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
								<select
									placeholder="Search by degree..."
									name="degree"
									value={filterText.degree}
									onChange={handleFilterChange}
									className="filter-input"
									style={{color:"black"}}
								>
									<option value="">All Degrees</option>
									{getUniqueDegrees().map(degree => (
										<option key={degree} value={degree}>
											{degree}
										</option>
									))}
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
							{Object.values(filterText).some(val => val !== "") ? "No contacts match your search." : "No contacts found. Add your first contact to get started!"}
						</p>
					) : (
						<div className="contact-display">
							{filterContacts(contacts).map(contact => (
								<Card key={contact._id} className="contact-card clickable-card" onClick={() => navigate(`/network/contact/${contact._id}`)}>
									<Card.Body>
										{/* Header with avatar and centered name/email */}
										<div className="d-flex flex-column align-items-center text-center mb-3">
											<img 
												src={avatars[contact._id] || "./default.png"} 
												alt={contact.name}
												className="contact-avatar"
												onError={(e) => {
													e.target.src = "./default.png";
												}}
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
														   className="external-link"
														   onClick={(e) => e.stopPropagation()}>
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
														   className="external-link"
														   onClick={(e) => e.stopPropagation()}>
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
												<Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(contact); }}>
													Edit
												</Button>
												<Button variant="outline-danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(contact); }}>
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

			<ContactForm
				showModal={showModal}
				setShowModal={setShowModal}
				editing={editing}
				editingContactId={editingContactId}
				formData={formData}
				setFormData={setFormData}
				handleAddOrUpdate={handleAddOrUpdate}
			/>
		</Container>
	);
}
