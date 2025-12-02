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
    generateNegotiationPrep(offerId, achievements = []) {
        return api.post(`${BASE_URL}/${offerId}/generate-negotiation-prep`, {
            achievements
        });
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
}

export default new OffersAPI();
