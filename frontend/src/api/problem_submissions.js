import api from './base';

class ProblemSubmissionsAPI {
    async list(platform) {
        const response = await api.get(`/problem-submissions/${platform}`);
        return response.data;
    }

    async create(platform, data) {
        const payload = {
            platform,
            problem_title: data.problem_title,
            description: data.description || null,
            difficulty: data.difficulty || null,
            language: data.language || null,
            submission_date: data.submission_date ? new Date(data.submission_date).toISOString() : null,
        };
        const response = await api.post(`/problem-submissions/${platform}`, payload);
        return response.data;
    }

    async update(platform, submissionId, patch) {
        const payload = {
            problem_title: patch.problem_title,
            description: patch.description,
            difficulty: patch.difficulty,
            language: patch.language,
            submission_date: patch.submission_date ? new Date(patch.submission_date).toISOString() : patch.submission_date,
        };
        const response = await api.put(`/problem-submissions/${platform}/${submissionId}`, payload);
        return response.data;
    }

    async remove(platform, submissionId) {
        const response = await api.delete(`/problem-submissions/${platform}/${submissionId}`);
        return response.data;
    }
}

const problemSubmissionsAPI = new ProblemSubmissionsAPI();
export default problemSubmissionsAPI;

