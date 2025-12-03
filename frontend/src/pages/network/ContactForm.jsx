import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row, Accordion } from "react-bootstrap";
import "./network.css";

export default function AddContact({ editing, addData, data, setData }) {
    const fileRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [interactions, setInteractions] = useState([]);

    const onPick = (event) => {
        const f = event.target.files?.[0];
        setSelectedFile(f || null);

        if (f) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewUrl(event.target.result);
            };
            reader.readAsDataURL(f);
        } else {
            setPreviewUrl(null);
        }

        setData(prevData => ({
            ...prevData,
            avatar: f
        }));
    };

    const updateData = (event) => {
        const { name, value } = event.target;
        setData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const addInteraction = () => {
        const newInteraction = {
            date: new Date().toISOString().split('T')[0],
            type: "other",
            notes: ""
        };
        const updatedInteractions = [...(data.interaction_history || []), newInteraction];
        setData(prevData => ({
            ...prevData,
            interaction_history: updatedInteractions
        }));
    };

    const updateInteraction = (index, field, value) => {
        const updatedInteractions = [...(data.interaction_history || [])];
        updatedInteractions[index] = { ...updatedInteractions[index], [field]: value };
        setData(prevData => ({
            ...prevData,
            interaction_history: updatedInteractions
        }));
    };

    const removeInteraction = (index) => {
        const updatedInteractions = (data.interaction_history || []).filter((_, i) => i !== index);
        setData(prevData => ({
            ...prevData,
            interaction_history: updatedInteractions
        }));
    };

    useEffect(() => {
        if (!editing) {
            setPreviewUrl(null);
            setSelectedFile(null);
        } else if (editing && data.avatar) {
            if (typeof data.avatar === 'string') {
                setPreviewUrl(data.avatar);
            } else if (data.avatar instanceof Blob) {
                setPreviewUrl(URL.createObjectURL(data.avatar));
            }
        }
    }, [editing, data.avatar]);

    const handleSubmit = (event) => {
        event.preventDefault();

        // Only pass avatar if it's a File object (newly selected), otherwise omit it
        const submitData = { ...data };
        if (submitData.avatar && typeof submitData.avatar === 'string') {
            delete submitData.avatar;
        }

        addData(submitData);
    }

    return (
        <Form id="add-contact-form" onSubmit={handleSubmit}>
            <Form.Group className="form-section">
                <Form.Label className="form-section-title">Avatar</Form.Label>
                <div className="avatar-preview">
                    {previewUrl && <img src={previewUrl} alt="Avatar preview" />}
                </div>
                <Form.Control type="file" accept="image/*" ref={fileRef} onChange={onPick} />
            </Form.Group>

            <Form.Group className="form-section">
                <Form.Label className="form-section-title">Personal Info</Form.Label>
                <div className="form-row">
                    <Form.Group className="form-group-half">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control type="text" placeholder="First Name" name="firstName" value={data.firstName || ""} onChange={updateData} />
                    </Form.Group>
                    <Form.Group className="form-group-half">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control type="text" placeholder="Last Name" name="lastName" value={data.lastName || ""} onChange={updateData} />
                    </Form.Group>
                </div>
                <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" placeholder="Email" name="email" value={data.email || ""} onChange={updateData} />
                </Form.Group>
            </Form.Group>

            <Form.Group className="form-section">
                <Form.Label className="form-section-title">Phone Numbers</Form.Label>
                <Form.Group>
                    <Form.Label>Primary</Form.Label>
                    <Form.Select name="primary" value={data.primary || "home"} onChange={updateData}>
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="mobile">Mobile</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="form-row">
                    <Form.Group className="form-group-half">
                        <Form.Label>Home</Form.Label>
                        <Form.Control type="tel" placeholder="Home Number" name="homeNum" value={data.homeNum || ""} onChange={updateData} />
                    </Form.Group>
                    <Form.Group className="form-group-half">
                        <Form.Label>Work</Form.Label>
                        <Form.Control type="tel" placeholder="Work Number" name="workNum" value={data.workNum || ""} onChange={updateData} />
                    </Form.Group>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Mobile</Form.Label>
                    <Form.Control type="tel" placeholder="Mobile Number" name="mobileNum" value={data.mobileNum || ""} onChange={updateData} />
                </Form.Group>
            </Form.Group>

            <Form.Group className="form-section">
                <Form.Label className="form-section-title">Employment</Form.Label>
                <Form.Group>
                    <Form.Label>Company</Form.Label>
                    <Form.Control type="text" placeholder="Company" name="company" value={data.company || ""} onChange={updateData} />
                </Form.Group>
                <Form.Group className="form-row">
                    <Form.Group className="form-group-half">
                        <Form.Label>Position</Form.Label>
                        <Form.Control type="text" placeholder="Position" name="position" value={data.position || ""} onChange={updateData} />
                    </Form.Group>
                    <Form.Group className="form-group-half">
                        <Form.Label>Location</Form.Label>
                        <Form.Control type="text" placeholder="Location" name="location" value={data.location || ""} onChange={updateData} />
                    </Form.Group>
                </Form.Group>
            </Form.Group>

            <Form.Group className="form-section">
                <Form.Label className="form-section-title">Websites</Form.Label>
                <Form.Group>
                    <Form.Label>LinkedIn</Form.Label>
                    <Form.Control type="text" placeholder="LinkedIn URL" name="linkedin" value={data.linkedin || ""} onChange={updateData} />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Other</Form.Label>
                    <Form.Control type="text" placeholder="Other Website" name="other" value={data.other || ""} onChange={updateData} />
                </Form.Group>
            </Form.Group>

            <Accordion className="form-section">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Relationship Context</Accordion.Header>
                    <Accordion.Body>
                        <Form.Group className="form-row">
                            <Form.Group className="form-group-half">
                                <Form.Label>Relationship Type</Form.Label>
                                <Form.Select name="relationship_type" value={data.relationship_type || ""} onChange={updateData}>
                                    <option value="">Select type</option>
                                    <option value="colleague">Colleague</option>
                                    <option value="mentor">Mentor</option>
                                    <option value="mentee">Mentee</option>
                                    <option value="friend">Friend</option>
                                    <option value="client">Client</option>
                                    <option value="recruiter">Recruiter</option>
                                    <option value="other">Other</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="form-group-half">
                                <Form.Label>Relationship Strength</Form.Label>
                                <Form.Select name="relationship_strength" value={data.relationship_strength || ""} onChange={updateData}>
                                    <option value="">Select strength</option>
                                    <option value="strong">Strong</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="weak">Weak</option>
                                </Form.Select>
                            </Form.Group>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Industry</Form.Label>
                            <Form.Select name="industry" value={data.industry || ""} onChange={updateData}>
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
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                    <Accordion.Header>Professional & Personal Interests</Accordion.Header>
                    <Accordion.Body>
                        <Form.Group>
                            <Form.Label>Professional Interests</Form.Label>
                            <Form.Control as="textarea" rows={2} placeholder="Career goals, expertise, projects" name="professional_interests" value={data.professional_interests || ""} onChange={updateData} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Personal Interests</Form.Label>
                            <Form.Control as="textarea" rows={2} placeholder="Hobbies, interests, personality traits" name="personal_interests" value={data.personal_interests || ""} onChange={updateData} />
                        </Form.Group>
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                    <Accordion.Header>Interaction History</Accordion.Header>
                    <Accordion.Body>
                        {(data.interaction_history || []).map((interaction, index) => (
                            <div key={index} className="interaction-record mb-3 pb-3 border-bottom">
                                <Form.Group className="form-row">
                                    <Form.Group className="form-group-half">
                                        <Form.Label>Date</Form.Label>
                                        <Form.Control type="date" value={interaction.date || ""} onChange={(e) => updateInteraction(index, "date", e.target.value)} />
                                    </Form.Group>
                                    <Form.Group className="form-group-half">
                                        <Form.Label>Type</Form.Label>
                                        <Form.Select value={interaction.type || "other"} onChange={(e) => updateInteraction(index, "type", e.target.value)}>
                                            <option value="call">Call</option>
                                            <option value="email">Email</option>
                                            <option value="meeting">Meeting</option>
                                            <option value="message">Message</option>
                                            <option value="other">Other</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control as="textarea" rows={2} placeholder="What did you discuss?" value={interaction.notes || ""} onChange={(e) => updateInteraction(index, "notes", e.target.value)} />
                                </Form.Group>
                                <Button variant="danger" size="sm" onClick={() => removeInteraction(index)}>Remove</Button>
                            </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={addInteraction}>+ Add Interaction</Button>
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3">
                    <Accordion.Header>Relationship Maintenance</Accordion.Header>
                    <Accordion.Body>
                        <Form.Group>
                            <Form.Label>Notes</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Additional notes about this contact" name="notes" value={data.notes || ""} onChange={updateData} />
                        </Form.Group>
                        <Form.Group className="form-row">
                            <Form.Group className="form-group-half">
                                <Form.Label>Reminder Frequency</Form.Label>
                                <Form.Select name="reminder_frequency" value={data.reminder_frequency || "none"} onChange={updateData}>
                                    <option value="none">None</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="form-group-half">
                                <Form.Label>Next Reminder Date</Form.Label>
                                <Form.Control type="date" name="next_reminder_date" value={data.next_reminder_date || ""} onChange={updateData} />
                            </Form.Group>
                        </Form.Group>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            <Button type="submit" className="form-submit-btn">{editing ? "Update Contact" : "Add Contact"}</Button>
        </Form>
    );
}