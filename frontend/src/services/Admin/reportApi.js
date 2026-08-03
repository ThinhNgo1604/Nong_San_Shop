import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/report`;

export const getDashboardReport = (from, to) =>
    axios.get(`${API}?from=${from}&to=${to}`);

export const getRevenueChart = (from, to) =>
    axios.get(`${API}/chart?from=${from}&to=${to}`);

export const getTopProducts=(from,to)=>

axios.get(

`${API}/top-products?from=${from}&to=${to}`

);