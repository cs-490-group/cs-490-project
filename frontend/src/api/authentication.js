import api from "./base";

const BASE_URL = "/auth";

class AuthAPI {
    register(data) {
        return api.post(`${BASE_URL}/register`, data);
    }

    login(credentials) {
        return api.post(`${BASE_URL}/login`, credentials);
    }

    logout() {
        return api.post(`${BASE_URL}/logout`);
    }

    validateSession() {
        return api.post(`${BASE_URL}/validate-session`);
    }

    forgotPassword(emailData) {
        return api.post(`${BASE_URL}/password/forgot`, emailData);
    }

    resetPassword(token) {
        return api.get(`${BASE_URL}/password/reset?token=${token}`);
    }

    updatePassword(credentials) {
        return api.put(`${BASE_URL}/password/update`, credentials);
    }

    loginGoogle(tokenData) {
        return api.post(`${BASE_URL}/login/google`, tokenData);
    }

    loginMicrosoft(tokenData) {
        return api.put(`${BASE_URL}/login/microsoft`, tokenData);
    }

    loginLinkedIn(codeData) {
        return api.post(`${BASE_URL}/login/linkedin`, codeData);
    }
}

export default new AuthAPI();