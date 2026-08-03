import { useEffect, useState } from "react";

function CategoryForm({
    onAdd,
    onUpdate,
    onCancel,
    editingCategory
}) {

    const [tenDM, setTenDM] = useState("");
    const [moTa, setMoTa] = useState("");
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        const data = {
            TenDM: tenDM.trim(),
            MoTa: moTa.trim()
        };

        if (editingCategory) {
            onUpdate(editingCategory.MaDM, data);
        } else {
            onAdd(data);
        }

        setTenDM("");
        setMoTa("");
        setErrors({});
    };

    useEffect(() => {
        if (editingCategory) {
            setTenDM(editingCategory.TenDM || "");
            setMoTa(editingCategory.MoTa || "");
            setErrors({});
        } else {
            setTenDM("");
            setMoTa("");
            setErrors({});
        }
    }, [editingCategory]);

    const validate = () => {
        let err = {};

        if (!tenDM.trim()) {
            err.tenDM = "Tên danh mục không được để trống.";
        } else if (tenDM.trim().length < 2) {
            err.tenDM = "Tên danh mục phải có ít nhất 2 ký tự.";
        } else if (tenDM.trim().length > 100) {
            err.tenDM = "Tên danh mục tối đa 100 ký tự.";
        }

        if (moTa && moTa.length > 255) {
            err.moTa = "Mô tả tối đa 255 ký tự.";
        }

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    return (
        <div className="card mb-4 shadow-sm">
            <div className="card-body">
                <h4 className="card-title mb-3">
                    {editingCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                </h4>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Tên danh mục</label>
                        <input
                            className={`form-control ${errors.tenDM ? "is-invalid" : ""}`}
                            placeholder="Nhập tên danh mục..."
                            value={tenDM}
                            onChange={(e) => setTenDM(e.target.value)}
                        />
                        {errors.tenDM && (
                            <div className="invalid-feedback d-block">{errors.tenDM}</div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Mô tả</label>
                        <textarea
                            className={`form-control ${errors.moTa ? "is-invalid" : ""}`}
                            rows="2"
                            placeholder="Nhập mô tả danh mục..."
                            value={moTa}
                            onChange={(e) => setMoTa(e.target.value)}
                        />
                        {errors.moTa && (
                            <div className="invalid-feedback d-block">{errors.moTa}</div>
                        )}
                    </div>

                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-success">
                            {editingCategory ? "Cập nhật" : "Thêm danh mục"}
                        </button>
                        {editingCategory && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    if (onCancel) onCancel();
                                }}
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CategoryForm;