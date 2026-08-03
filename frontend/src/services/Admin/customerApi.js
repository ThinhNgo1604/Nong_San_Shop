import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/customers`;

export const getCustomers = () => axios.get(API);

export const updateCustomerStatus = (id, data) =>
    axios.put(`${API}/${id}/status`, data);