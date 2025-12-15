import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Alert,
    Spinner,
} from "react-bootstrap";
import OffersAPI from "../../api/offers";
import OfferForm from "./OfferForm";
import OfferCard from "./OfferCard";
import NegotiationPrepView from "./NegotiationPrepView";
import OfferDetailsModal from "./OfferDetailsModal";
import OfferComparisonView from "./OfferComparisonView";

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
    const [showComparison, setShowComparison] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        try {
            setLoading(true);
            const response = showArchived
                ? await OffersAPI.getArchivedOffers()
                : await OffersAPI.getActiveOffers();
            setOffers(response.data);
            setError(null);
        } catch (err) {
            console.error("Error loading offers:", err);
            setError("Failed to load offers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, [showArchived]);

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
        try {
            setGeneratingPrep(offerId);
            setError(null);

            // Backend automatically extracts achievements from user profile
            // No manual input required!
            await OffersAPI.generateNegotiationPrep(offerId);

            await loadOffers();

            const updatedOffer = await OffersAPI.get(offerId);
            setSelectedOffer(updatedOffer.data);
            setShowNegotiationPrep(true);
            setShowDetails(false);
        } catch (err) {
            console.error("Error generating prep:", err);
            let errorMessage = "Failed to generate negotiation prep";

            // Handle different error response formats
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (Array.isArray(err.response?.data)) {
                // Pydantic validation errors - extract messages
                errorMessage = err.response.data
                    .map(e => e.msg || JSON.stringify(e))
                    .join("; ");
            } else if (typeof err.response?.data === 'string') {
                errorMessage = err.response.data;
            }

            setError(errorMessage);
        } finally {
            setGeneratingPrep(null);
        }
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
                    onRegenerate={async () => {
                        const updatedOffer = await OffersAPI.get(selectedOffer._id);
                        setSelectedOffer(updatedOffer.data);
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

    if (showComparison) {
        return (
            <OfferComparisonView
                offers={offers}
                onBack={() => setShowComparison(false)}
            />
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "8px", color: "#1a1a1a" }}>
                        Job Offers & Salary Negotiation
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: "#000", marginBottom: "0", lineHeight: "1.6" }}>
                        Track your offers and prepare for negotiations with AI-powered insights
                    </p>
                </Col>
                <Col md={4} className="text-end">
                    <Button
                        variant="outline-primary"
                        onClick={() => setShowComparison(true)}
                        disabled={offers.length < 2}
                        className="me-2"
                    >
                        📊 Compare Offers
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setEditingOffer(null);
                            setShowForm(true);
                        }}
                    >
                        + Add New Offer
                    </Button>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col>
                    <Button
                        variant={showArchived ? "outline-secondary" : "secondary"}
                        size="sm"
                        onClick={() => setShowArchived(false)}
                        className="me-2"
                    >
                        Active Offers
                    </Button>
                    <Button
                        variant={showArchived ? "secondary" : "outline-secondary"}
                        size="sm"
                        onClick={() => setShowArchived(true)}
                    >
                        Archived Offers
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
                <Row className="g-3">
                    {offers.map((offer) => (
                        <Col md={6} lg={4} key={offer._id}>
                            <OfferCard
                                offer={offer}
                                onSelect={handleSelectOffer}
                                onEdit={() => {
                                    setEditingOffer(offer);
                                    setShowForm(true);
                                }}
                                onDelete={handleDeleteOffer}
                                onGenNegotiationPrep={handleGenerateNegotiationPrep}
                            />
                        </Col>
                    ))}
                </Row>
            )}

        </Container>
    );
}
