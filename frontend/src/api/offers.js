import api from "./base";

const BASE_URL = "/offers";

class OffersAPI {
    // Offer Management
    create(offerData) {
        return api.post(BASE_URL, offerData);
    }

    get(offerId) {
        return api.get(`${BASE_URL}/${offerId}`);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    getForJob(jobId) {
        return api.get(`${BASE_URL}/job/${jobId}`);
    }

    update(offerId, offerData) {
        return api.put(`${BASE_URL}/${offerId}`, offerData);
    }

    delete(offerId) {
        return api.delete(`${BASE_URL}/${offerId}`);
    }

    // Salary Negotiation Preparation
    // Backend automatically extracts achievements from user's employment, projects, and resume
    generateNegotiationPrep(offerId) {
        return api.post(`${BASE_URL}/${offerId}/generate-negotiation-prep`);
    }

    getNegotiationPrep(offerId) {
        return api.get(`${BASE_URL}/${offerId}/negotiation-prep`);
    }

    // Offer Status
    updateStatus(offerId, status) {
        return api.put(`${BASE_URL}/${offerId}/status`, status, {
            headers: { "Content-Type": "application/json" }
        });
    }

    // Negotiation Tracking
    addNegotiationHistory(offerId, historyEntry) {
        return api.post(`${BASE_URL}/${offerId}/negotiation-history`, historyEntry);
    }

    setNegotiationOutcome(offerId, outcome) {
        return api.post(`${BASE_URL}/${offerId}/negotiation-outcome`, outcome);
    }

    // Export Functions
    async exportPDF(offerId) {
        try {
            const response = await api.get(`${BASE_URL}/${offerId}/export/pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting PDF:', error);
            throw error;
        }
    }

    async exportDOCX(offerId) {
        try {
            const response = await api.get(`${BASE_URL}/${offerId}/export/docx`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting DOCX:', error);
            throw error;
        }
    }

    async exportJSON(offerId) {
        try {
            const response = await api.get(`${BASE_URL}/${offerId}/export/json`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting JSON:', error);
            throw error;
        }
    }

    // ============================================
    // UC-127: Offer Evaluation & Comparison
    // ============================================

    // Total Compensation Calculation
    calculateTotalComp(offerId) {
        return api.post(`${BASE_URL}/${offerId}/calculate-total-comp`);
    }

    // Equity Valuation
    calculateEquity(offerId, equityData) {
        return api.post(`${BASE_URL}/${offerId}/calculate-equity`, equityData);
    }

    // Benefits Monetary Valuation
    calculateBenefits(offerId, benefitsData) {
        return api.post(`${BASE_URL}/${offerId}/calculate-benefits`, benefitsData);
    }

    // Cost of Living Adjustment
    calculateCostOfLiving(offerId) {
        return api.post(`${BASE_URL}/${offerId}/calculate-col`);
    }

    // Offer Scoring
    calculateOfferScore(offerId, nonFinancialFactors, marketMedian = null, weights = null) {
        return api.post(`${BASE_URL}/${offerId}/calculate-score`, {
            non_financial_factors: nonFinancialFactors,
            market_median: marketMedian,
            weights: weights
        });
    }

    // Scenario Analysis
    runScenarioAnalysis(offerId, scenarios) {
        return api.post(`${BASE_URL}/${offerId}/scenario-analysis`, scenarios);
    }

    // Side-by-Side Comparison
    compareOffers(offerIds, weights = null) {
        return api.post(`${BASE_URL}/compare`, { offer_ids: offerIds, weights });
    }

    // Archive Offer
    archiveOffer(offerId, declineReason = null) {
        return api.post(`${BASE_URL}/${offerId}/archive`, { decline_reason: declineReason });
    }

    // Get Active/Archived Offers
    getActiveOffers() {
        return api.get(`${BASE_URL}/active`);
    }

    getArchivedOffers() {
        return api.get(`${BASE_URL}/archived`);
    }
}

export default new OffersAPI();
