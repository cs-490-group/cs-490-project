import axios from "axios";

const BASE_URL = "https://alfa-leetcode-api.onrender.com";

// Create a separate axios instance for external API calls without auth headers
const externalApi = axios.create();

class LeetCodeAPI {
    getFullProfile(username) {
        return externalApi.get(`${BASE_URL}/${username}/profile`);
    }

    getBadges(username) {
        return externalApi.get(`${BASE_URL}/${username}/badges`);
    }
}
// https://leetcode.com/u/:username/
export default new LeetCodeAPI();