import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Card, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import NetworksAPI from "../../api/network";
import "./network.css";
import ContactForm from "./ContactForm";

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
	const [addFormVis, setAddFormVis] = useState(false);
	const [editing, setEditing] = useState(false);
	const [filterText, setFilterText] = useState({
		name: "",
		email: "",
		phone: "",
		company: "",
		position: "",
		location: ""
	});
	const [formData, setFormData] = useState({
		firstName: null,
		lastName: null,
		email: null,
		homeNum: null,
		workNum: null,
		mobileNum: null,
		primary: null,
		linkedin: null,
		other: null,
		company: null,
		position: null,
		location: null,
		avatar: null,
		relationship_type: null,
		relationship_strength: null,
		industry: null,
		professional_interests: null,
		personal_interests: null,
		interaction_history: [],
		notes: null,
		reminder_frequency: "none",
		next_reminder_date: null
	});
	const [avatars, setAvatars] = useState({});
	const [editingContactId, setEditingContactId] = useState(null);

	useEffect(() => {
		setLoadMessage(loadingMessages[Math.floor(Math.random() * (loadingMessages.length))]); // fun little feature
		fetchContacts();
	}, []);

	const filterContacts = (contactsToFilter) => {
		return contactsToFilter.filter(contact => {
			// Filter by name
			if (filterText.name && !contact.name.toLowerCase().includes(filterText.name.toLowerCase())) {
				return false;
			}

			// Filter by email
			if (filterText.email && !contact.email?.toLowerCase().includes(filterText.email.toLowerCase())) {
				return false;
			}

			// Filter by phone numbers
			if (filterText.phone) {
				const phoneFilter = filterText.phone.toLowerCase();
				const hasMatchingPhone = 
					contact.phone_numbers?.home?.toLowerCase().includes(phoneFilter) ||
					contact.phone_numbers?.work?.toLowerCase().includes(phoneFilter) ||
					contact.phone_numbers?.mobile?.toLowerCase().includes(phoneFilter);
				if (!hasMatchingPhone) {
					return false;
				}
			}

			// Filter by company
			if (filterText.company && !contact.employment?.company?.toLowerCase().includes(filterText.company.toLowerCase())) {
				return false;
			}

			// Filter by position
			if (filterText.position && !contact.employment?.position?.toLowerCase().includes(filterText.position.toLowerCase())) {
				return false;
			}

			// Filter by location
			if (filterText.location && !contact.employment?.location?.toLowerCase().includes(filterText.location.toLowerCase())) {
				return false;
			}

			return true;
		});
	};

	const fetchContacts = async () => {
		try {
			const res = await NetworksAPI.getAll();
			const contacts = res.data;

			let transformedContacts = (contacts || []).map(contact => ({
				id: contact._id,
				name: contact.name,
				email: contact.email,
				phone_numbers: contact.phone_numbers,
				websites: contact.websites,
				employment: contact.employment,
				relationship_type: contact.relationship_type,
				relationship_strength: contact.relationship_strength,
				industry: contact.industry,
				professional_interests: contact.professional_interests,
				personal_interests: contact.personal_interests,
				interaction_history: contact.interaction_history || [],
				last_interaction_date: contact.last_interaction_date,
				notes: contact.notes,
				reminder_frequency: contact.reminder_frequency,
				next_reminder_date: contact.next_reminder_date,
				mutual_connections: contact.mutual_connections || [],
				linked_job_opportunities: contact.linked_job_opportunities || [],
				linked_companies: contact.linked_companies || []
			}));

			setContacts(transformedContacts);

			// Fetch avatars for each contact
			const avatarMap = {};
			const blobMap = {};
			for (const contact of transformedContacts) {
				try {
					const res = await NetworksAPI.getAvatar(contact.id);
					const avatarBlob = res.data;
					blobMap[contact.id] = avatarBlob;
					avatarMap[contact.id] = URL.createObjectURL(avatarBlob);
				} catch (error) {
					console.error(`Failed to load avatar for ${contact.id}:`, error);
					avatarMap[contact.id] = "./default.png";
				}
			}
			setAvatars(avatarMap);
		} catch (error) {
			console.error("Failed to load contacts:", error);
		} finally {
			setLoading(false);
		}
	};

	const addContact = async (data) => {
		try {
			const filteredData = {
				name: `${data.firstName}${data.lastName !== "" ? " " + data.lastName : ""}`,
				email: data.email !== "" ? data.email : null,
				phone_numbers: {
					primary: data.primary,
					home: data.homeNum !== "" ? data.homeNum : null,
					work: data.workNum !== "" ? data.workNum : null,
					mobile: data.mobileNum !== "" ? data.mobileNum : null
				},
				websites: {
					linkedin: data.linkedin !== "" ? data.linkedin : null,
					other: data.other !== "" ? data.other : null
				},
				employment: {
					position: data.position !== "" ? data.position : null,
					company: data.company !== "" ? data.company : null,
					location: data.location !== "" ? data.location : null
				},
				relationship_type: data.relationship_type || null,
				relationship_strength: data.relationship_strength || null,
				industry: data.industry !== "" ? data.industry : null,
				professional_interests: data.professional_interests !== "" ? data.professional_interests : null,
				personal_interests: data.personal_interests !== "" ? data.personal_interests : null,
				interaction_history: data.interaction_history || [],
				notes: data.notes !== "" ? data.notes : null,
				reminder_frequency: data.reminder_frequency || "none",
				next_reminder_date: data.next_reminder_date || null
			}

			const res = await NetworksAPI.add(filteredData);
			await NetworksAPI.uploadAvatar(res.data.contact_id, data.avatar);
		} catch (error) {
			console.error(error);
		} finally {
			fetchContacts();
			setAddFormVis(false);
			setFormData({
				firstName: null,
				lastName: null,
				email: null,
				homeNum: null,
				workNum: null,
				mobileNum: null,
				primary: null,
				linkedin: null,
				other: null,
				company: null,
				position: null,
				location: null,
				avatar: null,
				relationship_type: null,
				relationship_strength: null,
				industry: null,
				professional_interests: null,
				personal_interests: null,
				interaction_history: [],
				notes: null,
				reminder_frequency: "none",
				next_reminder_date: null
			});
		}
	};

	const deleteContact = async (contactId) => {
		try {
			await NetworksAPI.delete(contactId);
			await NetworksAPI.deleteAvatar(contactId);
		} catch (error) {
			console.error(error);
		} finally {
			fetchContacts();
		}
	}

	const updateContact = async (contactId, data) => {
		try {
			const filteredData = {
				name: `${data.firstName}${data.lastName !== "" ? " " + data.lastName : ""}`,
				email: data.email !== "" ? data.email : null,
				phone_numbers: {
					primary: data.primary,
					home: data.homeNum !== "" ? data.homeNum : null,
					work: data.workNum !== "" ? data.workNum : null,
					mobile: data.mobileNum !== "" ? data.mobileNum : null
				},
				websites: {
					linkedin: data.linkedin !== "" ? data.linkedin : null,
					other: data.other !== "" ? data.other : null
				},
				employment: {
					position: data.position !== "" ? data.position : null,
					company: data.company !== "" ? data.company : null,
					location: data.location !== "" ? data.location : null
				},
				relationship_type: data.relationship_type || null,
				relationship_strength: data.relationship_strength || null,
				industry: data.industry !== "" ? data.industry : null,
				professional_interests: data.professional_interests !== "" ? data.professional_interests : null,
				personal_interests: data.personal_interests !== "" ? data.personal_interests : null,
				interaction_history: data.interaction_history || [],
				notes: data.notes !== "" ? data.notes : null,
				reminder_frequency: data.reminder_frequency || "none",
				next_reminder_date: data.next_reminder_date || null
			}

			await NetworksAPI.update(contactId, filteredData);
			await NetworksAPI.updateAvatar(contactId, data.avatar);
		} catch (error) {
			console.error(error);
		} finally {
			fetchContacts();
		}
	};

	const fetchAvatar = (contactId) => {
		return avatars[contactId] || "./default.png";
	}

	const showContactForm = () => {
		setAddFormVis(!addFormVis);
		if (addFormVis) {
			setEditing(false);
			setEditingContactId(null);
			setFormData({
				firstName: null,
				lastName: null,
				email: null,
				homeNum: null,
				workNum: null,
				mobileNum: null,
				primary: null,
				linkedin: null,
				other: null,
				company: null,
				position: null,
				location: null,
				avatar: null,
				relationship_type: null,
				relationship_strength: null,
				industry: null,
				professional_interests: null,
				personal_interests: null,
				interaction_history: [],
				notes: null,
				reminder_frequency: "none",
				next_reminder_date: null
			});
		}
	};

	const handleDelete = event => {
		deleteContact(event.target.getAttribute("contact"));
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

	const handleEdit = event => {
		const contactId = event.target.getAttribute("contact");
		setEditingContactId(contactId);
		setEditing(true);
		setAddFormVis(true);
		const contact = contacts.find(c => c.id === contactId);
		setFormData({
			firstName: contact.name.split(" ")[0],
			lastName: contact.name.split(" ").slice(1).join(" "),
			email: contact.email || "",
			homeNum: contact.phone_numbers.home || "",
			workNum: contact.phone_numbers.work || "",
			mobileNum: contact.phone_numbers.mobile || "",
			primary: contact.phone_numbers.primary || "home",
			linkedin: contact.websites.linkedin || "",
			other: contact.websites.other || "",
			company: contact.employment.company || "",
			position: contact.employment.position || "",
			location: contact.employment.location || "",
			avatar: avatars[contactId] || "./default.png",
			relationship_type: contact.relationship_type || "",
			relationship_strength: contact.relationship_strength || "",
			industry: contact.industry || "",
			professional_interests: contact.professional_interests || "",
			personal_interests: contact.personal_interests || "",
			interaction_history: contact.interaction_history || [],
			notes: contact.notes || "",
			reminder_frequency: contact.reminder_frequency || "none",
			next_reminder_date: contact.next_reminder_date || ""
		});
	}

	const handleAddOrUpdate = async (data) => {
		if (editing && editingContactId) {
			await updateContact(editingContactId, data);
			setEditing(false);
			setEditingContactId(null);
		} else {
			await addContact(data);
		}
		setAddFormVis(false);
		setFormData({
			firstName: null,
			lastName: null,
			email: null,
			homeNum: null,
			workNum: null,
			mobileNum: null,
			primary: null,
			linkedin: null,
			other: null,
			company: null,
			position: null,
			location: null,
			avatar: null,
			relationship_type: null,
			relationship_strength: null,
			industry: null,
			professional_interests: null,
			personal_interests: null,
			interaction_history: [],
			notes: null,
			reminder_frequency: "none",
			next_reminder_date: null
		});
	};

	return (
		<Container fluid className="dashboard-gradient min-vh-100 py-4">
			{/* We should remove dashboard-gradient from each indidivual component and make it global */}
			<h1 className="text-center text-white fw-bold mb-5 display-4">
				Your Professional Network
			</h1>
			{loading ? (
				<div className="min-vh-100 py-4">
					<div
						className="d-flex flex-column align-items-center justify-content-center"
						style={{ height: "200px" }}
					>
						<Spinner animation="border" variant="light" className="mb-3" />
						<p className="text-white fs-5">
							Hold on while we fetch your contacts...
						</p>
					</div>
				</div>
			) : (
				<>
					<Row>
						{addFormVis ? (
							<Button id="add-contact-button" type="button" onClick={showContactForm}>
								╳ Cancel
							</Button>
						) : (
							<Button id="add-contact-button" onClick={showContactForm}>+ Add Contact</Button>
						)}
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
								<p styles={{ marginTop: "1rem", width: "5rem" }} className="text-white">
									{Object.values(filterText).some(val => val !== "") ? "No contacts match your search." : loadingMessage}
								</p>
							) : (
								<div className="contact-display">
									{filterContacts(contacts).map(contact => (
										<Card key={contact.id} className="contact-card">
											<Card.Img contact={contact.id} className="contact-avatar" src={fetchAvatar(contact.id)}></Card.Img>
											<Card.Body>
												<Card.Title as="h3">{contact.name}</Card.Title>
												<Card.Subtitle as="h5" className="mb-3">{contact.email}</Card.Subtitle>

												{contact.relationship_type && (
													<div className="contact-section">
														<h6 className="section-title">Relationship</h6>
														<p className="mb-1"><strong>Type:</strong> {contact.relationship_type || "—"}</p>
														<p className="mb-1"><strong>Strength:</strong> {contact.relationship_strength || "—"}</p>
														<p className="mb-2"><strong>Industry:</strong> {contact.industry || "—"}</p>
													</div>
												)}

												<div className="contact-section">
													<h6 className="section-title">Phone Numbers</h6>
													<p className="mb-1"><strong>Primary:</strong> {contact.phone_numbers.primary || "—"}</p>
													<p className="mb-1"><strong>Home:</strong> {contact.phone_numbers.home || "—"}</p>
													<p className="mb-1"><strong>Work:</strong> {contact.phone_numbers.work || "—"}</p>
													<p className="mb-2"><strong>Mobile:</strong> {contact.phone_numbers.mobile || "—"}</p>
												</div>

												<div className="contact-section">
													<h6 className="section-title">Employment</h6>
													<p className="mb-1"><strong>Position:</strong> {contact.employment.position || "—"}</p>
													<p className="mb-1"><strong>Company:</strong> {contact.employment.company || "—"}</p>
													<p className="mb-2"><strong>Location:</strong> {contact.employment.location || "—"}</p>
												</div>

												<div className="contact-section">
													<h6 className="section-title">Websites</h6>
													<p className="mb-1"><strong>LinkedIn:</strong> {contact.websites.linkedin || "—"}</p>
													<p className="mb-2"><strong>Other:</strong> {contact.websites.other || "—"}</p>
												</div>

												{contact.professional_interests && (
													<div className="contact-section">
														<h6 className="section-title">Professional Interests</h6>
														<p className="mb-0">{contact.professional_interests}</p>
													</div>
												)}

												{contact.interaction_history && contact.interaction_history.length > 0 && (
													<div className="contact-section">
														<h6 className="section-title">Recent Interactions</h6>
														<p className="mb-2"><strong>Last:</strong> {contact.last_interaction_date || "—"}</p>
														<p className="mb-0"><strong>Count:</strong> {contact.interaction_history.length}</p>
													</div>
												)}

												{contact.notes && (
													<div className="contact-section">
														<h6 className="section-title">Notes</h6>
														<p className="mb-0">{contact.notes}</p>
													</div>
												)}

												{contact.reminder_frequency !== "none" && (
													<div className="contact-section">
														<h6 className="section-title">Reminders</h6>
														<p className="mb-1"><strong>Frequency:</strong> {contact.reminder_frequency || "—"}</p>
														<p className="mb-0"><strong>Next:</strong> {contact.next_reminder_date || "—"}</p>
													</div>
												)}

												<div className="card-actions">
													<Button className="action-button delete-btn" contact={contact.id} onClick={handleDelete}>🗑️ Delete</Button>
													<Button className="action-button edit-btn" contact={contact.id} onClick={handleEdit}>✏️ Edit</Button>
												</div>
											</Card.Body>
										</Card>
									))}
								</div>
							)}
						</Col>
						{addFormVis ? (
							<Col xs="auto">
								<ContactForm
									data={formData}
									editing={editing}
									addData={handleAddOrUpdate}
									setData={setFormData}
								></ContactForm>
							</Col>
						) : null}
					</Row>
				</>
			)}
		</Container>
	);
}
