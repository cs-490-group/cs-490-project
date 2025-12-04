import api from "./base";

const BASE_URL = "/mentorship"

class MentorshipAPI {
    add(data) {
        return api.post(BASE_URL, data);
    }

    getAll() {
        return api.get(BASE_URL);
    }

    get(mentorshipId) {
        return api.get(`${BASE_URL}/${mentorshipId}`);
    }

    update(mentorshipId, data) {
        return api.put(`${BASE_URL}/${mentorshipId}`, data);
    }

    delete(mentorshipId) {
        return api.delete(`${BASE_URL}/${mentorshipId}`);
    }

    getMentors() {
        return api.get(`${BASE_URL}/mentors`);
    }

    getMentees() {
        return api.get(`${BASE_URL}/mentees`);
    }

    getActive() {
        return api.get(`${BASE_URL}/active`);
    }

    sendInvitation(mentorshipId, invitationData) {
        return api.post(`${BASE_URL}/${mentorshipId}/invite`, invitationData);
    }

    addProgressReport(mentorshipId, reportData) {
        return api.post(`${BASE_URL}/${mentorshipId}/progress`, reportData);
    }

    addSession(mentorshipId, sessionData) {
        return api.post(`${BASE_URL}/${mentorshipId}/session`, sessionData);
    }

    addFeedback(mentorshipId, feedbackData) {
        return api.post(`${BASE_URL}/${mentorshipId}/feedback`, feedbackData);
    }
}

export default new MentorshipAPI();
