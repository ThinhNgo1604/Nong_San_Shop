import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/products/prices`;

export const getPrices = () =>
    axios.get(API);

export const updatePrice = (id, data) =>
    axios.put(`${API}/${id}`, data);