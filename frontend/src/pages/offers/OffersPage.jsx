import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Alert,
    Spinner,
    Modal,
    Form,
} from "react-bootstrap";
import OffersAPI from "../../api/offers";
import OfferForm from "./OfferForm";
import OfferCard from "./OfferCard";
import NegotiationPrepView from "./NegotiationPrepView";
import OfferDetailsModal from "./OfferDetailsModal";

export default function OffersPage() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showNegotiationPrep, setShowNegotiationPrep] = useState(false);
    const [generatingPrep, setGeneratingPrep] = useState(null);
    const [showAchievementsModal, setShowAchievementsModal] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [newAchievement, setNewAchievement] = useState("");

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        try {
            setLoading(true);
            const response = await OffersAPI.getAll();
            setOffers(response.data);
            setError(null);
        } catch (err) {
            console.error("Error loading offers:", err);
            setError("Failed to load offers");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOffer = async () => {
        setShowForm(false);
        setEditingOffer(null);
        await loadOffers();
    };

    const handleDeleteOffer = async (offerId) => {
        if (!window.confirm("Are you sure you want to delete this offer?")) {
            return;
        }

        try {
            await OffersAPI.delete(offerId);
            await loadOffers();
        } catch (err) {
            console.error("Error deleting offer:", err);
            setError("Failed to delete offer");
        }
    };

    const handleSelectOffer = (offer) => {
        setSelectedOffer(offer);
        setShowDetails(true);
    };

    const handleGenerateNegotiationPrep = async (offerId) => {
        setShowAchievementsModal(offerId);
        setAchievements([]);
        setNewAchievement("");
    };

    const handleConfirmGeneratePrep = async () => {
        if (!showAchievementsModal) return;

        try {
            setGeneratingPrep(showAchievementsModal);

            const response = await OffersAPI.generateNegotiationPrep(
                showAchievementsModal,
                achievements
            );

            await loadOffers();

            const updatedOffer = await OffersAPI.get(showAchievementsModal);
            setSelectedOffer(updatedOffer.data);
            setShowNegotiationPrep(true);
            setShowDetails(false);

            setShowAchievementsModal(null);
        } catch (err) {
            console.error("Error generating prep:", err);
            setError(err.response?.data?.detail || "Failed to generate negotiation prep");
        } finally {
            setGeneratingPrep(null);
        }
    };

    const handleAddAchievement = () => {
        if (newAchievement.trim()) {
            setAchievements([...achievements, newAchievement]);
            setNewAchievement("");
        }
    };

    const handleRemoveAchievement = (idx) => {
        setAchievements(achievements.filter((_, i) => i !== idx));
    };

    if (showDetails && selectedOffer) {
        return (
            <Container className="py-4">
                <OfferDetailsModal
                    offer={selectedOffer}
                    onBack={() => {
                        setShowDetails(false);
                        setSelectedOffer(null);
                    }}
                    onEdit={() => {
                        setEditingOffer(selectedOffer);
                        setShowDetails(false);
                        setShowForm(true);
                    }}
                    onDelete={() => {
                        handleDeleteOffer(selectedOffer._id);
                        setShowDetails(false);
                        setSelectedOffer(null);
                    }}
                    onGeneratePrep={() => {
                        handleGenerateNegotiationPrep(selectedOffer._id);
                        setShowDetails(false);
                    }}
                    onViewPrep={() => {
                        setShowNegotiationPrep(true);
                        setShowDetails(false);
                    }}
                />
            </Container>
        );
    }

    if (showNegotiationPrep && selectedOffer) {
        return (
            <Container className="py-4">
                <NegotiationPrepView
                    offer={selectedOffer}
                    onBack={() => {
                        setShowNegotiationPrep(false);
                        setShowDetails(true);
                    }}
                />
            </Container>
        );
    }

    if (showForm) {
        return (
            <Container className="py-4">
                <OfferForm
                    offer={editingOffer}
                    onSave={handleSaveOffer}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingOffer(null);
                    }}
                />
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h2>💼 Job Offers & Salary Negotiation</h2>
                    <p className="text-muted">
                        Manage your job offers and prepare for salary negotiations with AI-powered insights
                    </p>
                </Col>
                <Col md={3} className="text-end">
                    <Button
                        variant="primary"
                        onClick={() => {
                            setEditingOffer(null);
                            setShowForm(true);
                        }}
                        size="lg"
                    >
                        + Add New Offer
                    </Button>
                </Col>
            </Row>

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading offers...</p>
                </div>
            ) : offers.length === 0 ? (
                <Alert variant="info">
                    <h6>📝 No offers yet</h6>
                    <p>Create your first offer to get started with salary negotiation preparation.</p>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setEditingOffer(null);
                            setShowForm(true);
                        }}
                    >
                        Create First Offer
                    </Button>
                </Alert>
            ) : (
                <Row>
                    <Col>
                        {offers.map((offer) => (
                            <OfferCard
                                key={offer._id}
                                offer={offer}
                                onSelect={handleSelectOffer}
                                onEdit={() => {
                                    setEditingOffer(offer);
                                    setShowForm(true);
                                }}
                                onDelete={handleDeleteOffer}
                                onGenNegotiationPrep={handleGenerateNegotiationPrep}
                            />
                        ))}
                    </Col>
                </Row>
            )}

            <Modal
                show={!!showAchievementsModal}
                onHide={() => setShowAchievementsModal(null)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>📝 Add Key Achievements</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">
                        Add your key achievements to strengthen your negotiation talking points.
                    </p>

                    <div className="mb-3">
                        <Form.Group>
                            <Form.Label>Achievement</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Led team of 5 engineers, increased productivity by 30%"
                                    value={newAchievement}
                                    onChange={(e) => setNewAchievement(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            handleAddAchievement();
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline-primary"
                                    onClick={handleAddAchievement}
                                >
                                    Add
                                </Button>
                            </div>
                        </Form.Group>
                    </div>

                    {achievements.length > 0 && (
                        <div>
                            <h6>Your Achievements</h6>
                            <div className="list-group">
                                {achievements.map((achievement, idx) => (
                                    <div
                                        key={idx}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                    >
                                        <span>✓ {achievement}</span>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleRemoveAchievement(idx)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowAchievementsModal(null)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirmGeneratePrep}
                        disabled={generatingPrep}
                    >
                        {generatingPrep ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                />
                                Generating...
                            </>
                        ) : (
                            "Generate Negotiation Prep"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
