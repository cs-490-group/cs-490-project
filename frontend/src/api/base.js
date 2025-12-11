import axios from "axios";

const api = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/api`
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("session");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const uuid = localStorage.getItem("uuid");
    if (uuid) config.headers["uuid"] = uuid;
    return config
});

export default api;