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
	const [contactFormVisibility, setContactFormVisibility] = useState(false);
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
			for (const contact of transformedContacts) {
				try {
					const res = await NetworksAPI.getAvatar(contact.id);
					const avatarBlob = res.data;
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
			setContactFormVisibility(false);
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

			const res = await NetworksAPI.update(contactId, filteredData);
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
		setContactFormVisibility(!contactFormVisibility);
	};

	const handleDelete = event => {
		deleteContact(event.target.getAttribute("contact"));
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
				<div className="min-vh-100 py-4">
					{contactFormVisibility ? (
						<>
							<Button style={{ border: "none" }} variant="danger" type="button" onClick={showContactForm}>
								╳ Cancel
							</Button>
						</>
					) : (
						<Button id="add-contact-button" onClick={showContactForm}>+ Add Contact</Button>
					)}
					{contacts.length === 0 ? (
						<div>
							<p className="text-white">
								{loadingMessage}
							</p>
						</div>
					) : (
						<div className="contact-display">
							{contacts.map(contact => (
								<Card key={contact.id} className="contact-card">
									<Card.Img contact={contact.id} className="contact-avatar" src={fetchAvatar(contact.id)}></Card.Img>
									<Card.Title as="h3">{contact.name}</Card.Title>
									<Card.Subtitle as="h5">{contact.email}</Card.Subtitle>
									<br />
									<Row>
										<Col>
											<h4>Numbers</h4>
											Primary: {contact.phone_numbers.primary}
											<br />
											Home: {contact.phone_numbers.home}
											<br />
											Work: {contact.phone_numbers.work}
											<br />
											Mobile: {contact.phone_numbers.mobile}
										</Col>
										<Col>
											<h4>Employment</h4>
											Position: {contact.employment.position}
											<br />
											Company: {contact.employment.company}
											<br />
											Location: {contact.employment.location}
										</Col>
									</Row>
									<Row>
										<Col>
											<h4>Websites</h4>
											Linkedin: {contact.websites.linkedin}
											<br />
											Other: {contact.websites.other}
										</Col>
									</Row>
									<Row style={{ display: "flex", flexDirection: "row" }}>
										<Button style={{ width: "fit-content", height: "3rem", backgroundColor: "red", border: "none" }} contact={contact.id} onClick={handleDelete}>🗑️</Button>
										<Button style={{ width: "fit-content", height: "3rem", marginLeft: "0.5rem", backgroundColor: "orange", border: "none" }} contact={contact.id} onClick={null}>✏️</Button>
									</Row>
								</Card>
							))}
						</div>
					)}
					{contactFormVisibility ? (
						<AddContact
							data={formData}
							addData={addContact}
							setData={setFormData}
						></AddContact>
					) : null}
				</div>
			)}
		</Container>
	);
}
