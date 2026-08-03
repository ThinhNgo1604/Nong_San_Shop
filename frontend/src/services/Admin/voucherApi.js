import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/vouchers`;

export const getVouchers = () => axios.get(API);

export const createVoucher = (data) => axios.post(API, data);

export const updateVoucher = (id, data) =>
    axios.put(`${API}/${id}`, data);

export const deleteVoucher = (id) =>
    axios.delete(`${API}/${id}`);