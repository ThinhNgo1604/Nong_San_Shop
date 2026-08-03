import { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/api";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "../../services/Admin/productApi";

import { getCategories } from "../../services/Admin/categoryApi";

import ProductForm from "../../components/Product/ProductForm";

import Pagination from "../../components/Common/Pagination";

function Product() {

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3500);
    };

    useEffect(() => {
        fetchProducts(page);
        fetchCategories();
    }, [page]);

    async function fetchProducts(currentPage) {
        try {
            const res = await getProducts(currentPage);
            setProducts(res.data.products);
            setTotalPages(res.data.totalPages); 
        } catch (error) {
            console.log(error);
        }
    }

    async function fetchCategories() {
        try {
            const res = await getCategories();
            setCategories(res.data);
        } catch (error) {
            console.log(error);
        }
    }

    const handleSave = async (data) => {
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.MaSP, data);
                showToast("Cập nhật sản phẩm thành công!", "success");
                await fetchProducts(page);
            } else {
                await createProduct(data);
                showToast("Thêm sản phẩm thành công!", "success");
                setPage(1);
                await fetchProducts(1);
            }
            setEditingProduct(null);
            setShowForm(false);
        } catch (error) {
            showToast(
                error.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm.",
                "error"
            );
            console.log(error);
            throw error;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

        try {
            await deleteProduct(id);
            showToast("Xóa sản phẩm thành công!", "success");
            await fetchProducts(page);
        } catch (err) {
            showToast(
                err.response?.data?.message || "Không thể xóa sản phẩm.",
                "error"
            );
            console.log(err);
        }
    };

    const handleStartAdd = () => {
        if (editingProduct) {
            setEditingProduct(null);
            setShowForm(true);
        } else {
            setShowForm(prev => !prev);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container-fluid pb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fw-bold m-0 text-success">Quản lý sản phẩm</h3>
                <button
                    className={`btn btn-sm ${showForm && !editingProduct ? 'btn-outline-secondary' : 'btn-success'}`}
                    onClick={handleStartAdd}
                >
                    {showForm && !editingProduct ? "✕ Đóng form" : "+ Thêm sản phẩm mới"}
                </button>
            </div>

            {showForm && (
                <ProductForm
                    onAdd={handleSave}
                    categories={categories}
                    editingProduct={editingProduct}
                    onCancel={() => {
                        setEditingProduct(null);
                        setShowForm(false);
                    }}
                />
            )}

            <table className="table table-bordered table-hover">

                <thead className="table-success">

                    <tr>
                        
                        <th>Tên sản phẩm</th>

                        <th>Hình ảnh</th>

                        <th>Danh mục</th>

                        <th>Giá</th>

                        <th>Tồn kho</th>

                        <th>Đơn vị</th>

                        <th>Trạng thái</th>

                        <th width="180">Thao tác</th>

                    </tr>

                </thead>

                <tbody>

                    {
                        products.map(product => (

                            <tr key={product.MaSP}>


                                <td>{product.TenSP}</td>
                                
                                <td>
                            <img
                                src={getImageUrl(product.HinhAnh)}
                                alt={product.TenSP}
                                width="70"
                                height="70"
                                style={{
                                    objectFit: "cover",
                                    borderRadius: "8px"
                                }}
                            />
                        </td>

                                <td>{product.TenDM}</td>

                                <td>{Number(product.GiaGoc).toLocaleString()} đ</td>

                                <td>{product.SoLuongTon}</td>

                                <td>{product.DonViTinh}</td>

                                <td>
                                    {product.TrangThai === 0 ? (
                                        <span className="badge bg-secondary">Đã ẩn</span>
                                    ) : product.SoLuongTon === 0 ? (
                                        <span className="badge bg-danger">Hết hàng</span>
                                    ) : (
                                        <span className="badge bg-success">Đang bán</span>
                                    )}
                                </td>

                                <td>

                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        onClick={() => handleEditProduct(product)}
                                    >
                                        Sửa
                                    </button>

                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(product.MaSP)}
                                    >
                                        Xóa
                                    </button>

                                </td>
                            </tr>

                        ))
                    }

                </tbody>

            </table>
            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

            {/* Notification Toast fixed at bottom right */}
            {toast.show && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9999,
                        minWidth: '240px',
                        maxWidth: '340px',
                        backgroundColor: toast.type === 'error' ? '#991b1b' : '#166534',
                        color: '#ffffff',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    <span style={{ fontSize: '16px' }}>
                        {toast.type === 'error' ? '❌' : '✅'}
                    </span>
                    <div style={{ flex: 1 }}>{toast.message}</div>
                    <button
                        type="button"
                        onClick={() => setToast({ show: false, message: '', type: 'success' })}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 4px',
                            lineHeight: 1
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>

    );

}

export default Product;