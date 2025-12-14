import api from "./base";

const BASE_URL = "/material-comparison";

class MaterialComparisonAPI {
    // Get resume version comparison
    getResumeComparison() {
        return api.get(`${BASE_URL}/resumes`);
    }

    // Get cover letter comparison
    getCoverLetterComparison() {
        return api.get(`${BASE_URL}/cover-letters`);
    }

    // Get combined comparison (both resumes and cover letters)
    getCombinedComparison() {
        return api.get(`${BASE_URL}/combined`);
    }

    // Get success trends over time - UC-119
    getSuccessTrends(weeks = 12) {
        return api.get(`${BASE_URL}/success-trends?weeks=${weeks}`);
    }

    // Archive resume version
    archiveResumeVersion(resumeId, versionId) {
        return api.post(`${BASE_URL}/resumes/${resumeId}/versions/${versionId}/archive`);
    }

    // Archive cover letter
    archiveCoverLetter(letterId) {
        return api.post(`${BASE_URL}/cover-letters/${letterId}/archive`);
    }
}

export default new MaterialComparisonAPI();
