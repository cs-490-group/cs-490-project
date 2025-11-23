import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Card, Button, Alert, Spinner } from "react-bootstrap";
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
	const [formData, setFormData] = useState(null);

	useEffect(() => {
		setLoadMessage(loadingMessages[Math.floor(Math.random() * (loadingMessages.length))]); // fun little feature
		fetchContacts();
	}, []);

	const fetchContacts = async () => {
		try {
			const res = await NetworksAPI.getAll();
			const contacts = res.data;

			const transformedContacts = (contacts || []).map(contact => ({
				id: contact._id,
				name: contact.name,
				email: contact.email,
				phone_numbers: contact.phone_numbers,
				websites: contact.websites,
				employment: contact.employment
			}));

			setContacts(transformedContacts);
		} catch (error) {
			console.error("Failed to load contacts:", error);
		} finally {
			setLoading(false);
		}
	};

	const showContactForm = () => {
		setContactFormVisibility(!contactFormVisibility);
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
					{contacts.length == 0 ? (
						<div>
							<p className="text-white">
								{loadingMessage}
							</p>
							{contactFormVisibility ? (
								<>
									<Button variant="danger" type="button" onClick={showContactForm}>
										╳ Cancel
									</Button>
									<AddContact
									data={formData}
									setData={setFormData}
									></AddContact>
								</>
							) : (
								<Button id="add-contact-button" onClick={showContactForm}>+ Add Contact</Button>
							)}
						</div>
					) : (
						<div>
							{contacts.map(contact => (
								<Card>

								</Card>
							))};
						</div>
					)}
				</div>
			)}
		</Container>
	);
}
