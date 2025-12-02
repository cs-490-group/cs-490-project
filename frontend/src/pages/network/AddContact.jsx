import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import "./network.css";

export default function AddContact({ addData, data, setData }) {
    const fileRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {

    }, []);

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
        const formKey = event.target.getAttribute("formkey");
        const value = event.target.value;

        setData(prevData => ({
            ...prevData,
            [formKey]: value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        addData(data);
    }

    return (
        <Container className="text-center">
            <Form id="add-contact-form" onSubmit={handleSubmit}>
                <Row>
                    <Col className="input-column">
                        <h5>Contact Photo</h5>
                        <img
                            src={previewUrl || "./default.png"}
                            style={{
                                width: "5rem",
                                height: "5rem",
                                borderRadius: "100%",
                                border: "0.05rem solid gray",
                                margin: "auto",
                                marginBottom: "0.5rem",
                                marginTop: "1rem",
                                objectFit: "cover"
                            }}
                        />
                        <Button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                        >
                            📄 Upload Image
                        </Button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={onPick}
                            hidden
                        />
                    </Col>

                </Row>
                <Row>
                    <Col className="input-column">
                        <h5>Name</h5>
                        <span className="field-label">First Name</span>
                        <input formkey="firstName" onChange={updateData} value={data.firstName ?? ""} placeholder="First Name..."></input>
                        <span className="field-label">Last Name</span>
                        <input formkey="lastName" onChange={updateData} value={data.lastName ?? ""} placeholder="Last Name..."></input>
                        <h5>Email</h5>
                        <span className="field-label">Primary Email</span>
                        <input formkey="email" onChange={updateData} value={data.email ?? ""} placeholder="Email..."></input>
                    </Col>
                    <Col className="input-column">
                        <h5>Numbers</h5>
                        <select formkey="primary" value={data.primary ?? "home"} onChange={updateData}>
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="mobile">Mobile</option>
                        </select>
                        <span className="field-label">Home Phone</span>
                        <input formkey="homeNum" onChange={updateData} value={data.homeNum ?? ""} placeholder="Home..."></input>
                        <span className="field-label">Work Phone</span>
                        <input formkey="workNum" onChange={updateData} value={data.workNum ?? ""} placeholder="Work..."></input>
                        <span className="field-label">Mobile Phone</span>
                        <input formkey="mobileNum" onChange={updateData} value={data.mobileNum ?? ""} placeholder="Mobile..."></input>
                    </Col>
                </Row>
                <Row>
                    <Col className="input-column">
                        <h5>Wesbites</h5>
                        <span className="field-label">Linkedin</span>
                        <input formkey="linkedin" onChange={updateData} value={data.linkedin ?? ""} placeholder="linkedin.com/in/..."></input>
                        <span className="field-label">Personal Website</span>
                        <input formkey="other" onChange={updateData} value={data.other ?? ""} placeholder="URL..."></input>
                    </Col>
                    <Col className="input-column">
                        <h5>Employment</h5>
                        <span className="field-label">Company</span>
                        <input formkey="company" onChange={updateData} value={data.company ?? ""} placeholder="Company..."></input>
                        <span className="field-label">Position</span>
                        <input formkey="position" onChange={updateData} value={data.position ?? ""} placeholder="Position..."></input>
                        <span className="field-label">Location</span>
                        <input formkey="location" onChange={updateData} value={data.location ?? ""} placeholder="Location..."
                        ></input>
                    </Col>
                </Row>
                <Button style={{ marginRight: "0.5rem" }} variant="primary" type="submit">
                    + Add
                </Button>
            </Form>
        </Container>
    )
}