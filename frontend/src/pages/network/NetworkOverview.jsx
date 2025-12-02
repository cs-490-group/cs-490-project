import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Card, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import NetworksAPI from "../../api/network";
import "./network.css";
import AddContact from "./AddContact";

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
		avatar: null
	});
	const [avatars, setAvatars] = useState({});
	const [editingContactId, setEditingContactId] = useState(null);

	useEffect(() => {
		setLoadMessage(loadingMessages[Math.floor(Math.random() * (loadingMessages.length))]); // fun little feature
		fetchContacts();
	}, []);

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
				}
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
				avatar: null
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
				}
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
				avatar: null
			});
		}
	};

	const handleDelete = event => {
		deleteContact(event.target.getAttribute("contact"));
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
			avatar: avatars[contactId] || "./default.png"
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
			avatar: null
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
						{contacts.length === 0 ? (
							<p styles={{ marginTop: "1rem", width: "5rem" }} className="text-white">
								{loadingMessage}
							</p>
						) : (
							<Col className="contact-display">
								{contacts.map(contact => (
									<Card key={contact.id} className="contact-card">
										<Card.Img contact={contact.id} className="contact-avatar" src={fetchAvatar(contact.id)}></Card.Img>
										<Card.Body>
                                            <Card.Title as="h3">{contact.name}</Card.Title>
                                            <Card.Subtitle as="h5" className="mb-3">{contact.email}</Card.Subtitle>
                                            
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

                                            <div className="card-actions">
                                                <Button className="action-button delete-btn" contact={contact.id} onClick={handleDelete}>🗑️ Delete</Button>
                                                <Button className="action-button edit-btn" contact={contact.id} onClick={handleEdit}>✏️ Edit</Button>
                                            </div>
                                        </Card.Body>
									</Card>
								))}
							</Col>
						)}
						{addFormVis ? (
							<Col xs="auto">
								<AddContact
									data={formData}
									editing={editing}
									addData={handleAddOrUpdate}
									setData={setFormData}
								></AddContact>
							</Col>
						) : null}
					</Row>
				</>
			)}
		</Container>
	);
}
