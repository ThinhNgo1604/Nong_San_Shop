import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/products`;

export const getAllProducts = () =>
    axios.get(`${API}/all`);

export const getProductById = (id) =>
    axios.get(`${API}/${id}`);