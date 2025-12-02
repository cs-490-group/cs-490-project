import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import "./network.css";

export default function AddContact({ editing, addData, data, setData }) {
    const fileRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

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
                    <Form.Control type="url" placeholder="LinkedIn URL" name="linkedin" value={data.linkedin || ""} onChange={updateData} />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Other</Form.Label>
                    <Form.Control type="url" placeholder="Other Website" name="other" value={data.other || ""} onChange={updateData} />
                </Form.Group>
            </Form.Group>

            <Button type="submit" className="form-submit-btn">{editing ? "Update Contact" : "Add Contact"}</Button>
        </Form>
    );
}