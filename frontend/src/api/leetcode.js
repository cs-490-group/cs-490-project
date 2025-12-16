import api from "./base";

const BASE_URL = "https://alfa-leetcode-api.onrender.com";

class LeetCodeAPI {
    getFullProfile(username) {
        return api.get(`${BASE_URL}/${username}/profile`);
    }

    getBadges(username) {
        return api.get(`${BASE_URL}/${username}/badges`);
    }
}
// https://leetcode.com/u/:username/