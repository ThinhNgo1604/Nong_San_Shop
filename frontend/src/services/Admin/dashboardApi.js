import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/dashboard`;

export const getDashboard = (from, to) =>
    axios.get(API, {
        params: {
            from,
            to
        }
    });