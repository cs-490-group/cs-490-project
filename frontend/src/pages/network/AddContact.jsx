import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import "./network.css";

export default function AddContact({ data, setData }) {
    const fileRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {

    }, []);

    const doNothing = () => {
        // FIXME: placeholder function for now
    };

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
    };

    // const updateData = (event) => {
    //     const { key, value } = event.target;

    //     setData(prevData => ({
    //         ...prevData,
    //         [key]: value,
    //     }));
    // };

    // const updatePicture = (event) => {
    //     updateData(event);
    //     onPick(event);
    // };

    return (
        <Container className="text-center">
            <Form id="add-contact-form" >
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
                        <input placeholder="First Name..."></input>
                        <span className="field-label">Last Name</span>
                        <input placeholder="Last Name..."></input>
                    </Col>
                    <Col className="input-column">
                        <h5>Email</h5>
                        <span className="field-label">Primary Email</span>
                        <input placeholder="Email..."></input>
                        <span className="field-label">Secondary Email</span>
                        <input placeholder="Email..."></input>
                    </Col>
                    <Col className="input-column">
                        <h5>Numbers</h5>
                        <span className="field-label">Home Phone</span>
                        <input placeholder="Home..."></input>
                        <span className="field-label">Work Phone</span>
                        <input placeholder="Work..."></input>
                        <span className="field-label">Mobile Phone</span>
                        <input placeholder="Mobile..."></input>
                    </Col>
                </Row>
                <Row>
                    <Col className="input-column">
                        <h5>Wesbites</h5>
                        <span className="field-label">Linkedin</span>
                        <input placeholder="linkedin.com/in/..."></input>
                        <span className="field-label">Personal Website</span>
                        <input placeholder="URL..."></input>
                    </Col>
                    <Col className="input-column">
                        <h5>Employment</h5>
                        <span className="field-label">Company</span>
                        <input placeholder="Company..."></input>
                        <span className="field-label">Position</span>
                        <input placeholder="Position..."></input>
                        <span className="field-label">Location</span>
                        <input placeholder="Location..."
                        // key={"location"}
                        // value={data.location}
                        // onChange={updateData}
                        ></input>
                    </Col>
                </Row>
                <Button style={{ marginRight: "0.5rem" }} variant="primary" type="button" onClick={doNothing}>
                    + Add
                </Button>
            </Form>
        </Container>
    )
}