import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API = `${API_BASE}/api/products`;

export const getProducts = (page, limit = 5) =>
    axios.get(`${API}?page=${page}&limit=${limit}`);

// Đã cập nhật hàm này để nhận thêm khoảng giá
export const getAllProducts = (minPrice = null, maxPrice = null) =>
    axios.get(`${API}/all`, {
        params: {
            minPrice: minPrice,
            maxPrice: maxPrice
        }
    });

export const createProduct = (data) =>
    axios.post(API, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

export const updateProduct = (id, data) =>
    axios.put(`${API}/${id}`, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

export const deleteProduct = (id) =>
    axios.delete(`${API}/${id}`);