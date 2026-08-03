import { useEffect, useState } from "react";

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "../../services/Admin/categoryApi";

import CategoryForm from "../../components/Category/CategoryForm";
import CategoryTable from "../../components/Category/CategoryTable";

function Category() {
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [toast, setToast] = useState({ type: "", message: "" });

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast({ type: "", message: "" }), 4000);
    };

    const fetchCategories = async () => {
        try {
            const res = await getCategories();
            setCategories(res.data);
        } catch (error) {
            console.log(error);
            showToast("danger", "Không thể tải danh sách danh mục.");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAdd = async (data) => {
        try {
            await createCategory(data);
            showToast("success", "Thêm danh mục thành công!");
            fetchCategories();
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Có lỗi xảy ra khi thêm.");
        }
    };

    const handleUpdate = async (id, data) => {
        try {
            await updateCategory(id, data);
            showToast("success", "Cập nhật danh mục thành công!");
            fetchCategories();
            setEditingCategory(null);
        } catch (error) {
            showToast("danger", error.response?.data?.message || "Có lỗi xảy ra khi cập nhật.");
        }
    };

    const onRequestDelete = (catOrId) => {
        let catObj = catOrId;
        if (typeof catOrId !== "object" || !catOrId) {
            catObj = categories.find(c => (c.MaDM || c.maDM || c.id) == catOrId) || { MaDM: catOrId, TenDM: `Mã #${catOrId}` };
        }
        setDeletingCategory(catObj);
    };

    const confirmDelete = async () => {
        if (!deletingCategory) return;
        const id = deletingCategory.MaDM || deletingCategory.maDM || deletingCategory.id;
        try {
            await deleteCategory(id);
            showToast("success", "Xóa danh mục thành công!");
            fetchCategories();
        } catch (error) {
            console.log(error);
            showToast("danger", error.response?.data?.message || "Không thể xóa danh mục.");
        } finally {
            setDeletingCategory(null);
        }
    };

    return (
        <div className="container py-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0 fw-bold">Quản lý danh mục</h2>
                <button
                    className="btn btn-success"
                    onClick={() => setEditingCategory(null)}
                >
                    + Thêm danh mục mới
                </button>
            </div>

            {toast.message && (
                <div className={`alert alert-${toast.type} alert-dismissible fade show shadow-sm mb-3`} role="alert">
                    {toast.message}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setToast({ type: "", message: "" })}
                    ></button>
                </div>
            )}

            <CategoryForm
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onCancel={() => setEditingCategory(null)}
                editingCategory={editingCategory}
            />

            <CategoryTable
                categories={categories}
                onEdit={setEditingCategory}
                onDelete={onRequestDelete}
            />

            {/* Custom Confirmation Modal */}
            {deletingCategory && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold">Xác nhận xóa</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setDeletingCategory(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-1">Bạn có chắc chắn muốn xóa danh mục này?</p>
                                <p className="fw-bold fs-5 text-danger mb-0">
                                    "{deletingCategory.TenDM || deletingCategory.tenDM || `Mã #${deletingCategory.MaDM}`}"
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setDeletingCategory(null)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                >
                                    Đồng ý Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Category;