import api from "./base";

class UserAPI {
  // Fetch all user data
  async getAllData() {
    // `api` already adds uuid + Authorization headers via interceptor
    try {
      const res = await api.get("/user/me/all_data");
      return res.data;
    } catch (err) {
      console.error("Error fetching user data:", err);
      throw err;
    }
  }
}

export default new UserAPI();
