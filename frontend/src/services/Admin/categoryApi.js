import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/categories`;

export const getCategories = () => axios.get(API);

export const createCategory = (data) => 
    axios.post(API, data);

export const updateCategory = (id, data) =>
    axios.put(`${API}/${id}`, data);

export const deleteCategory = (id) =>
    axios.delete(`${API}/${id}`);