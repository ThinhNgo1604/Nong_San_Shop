import { useState, useEffect } from "react";
import { getImageUrl } from "../../utils/api";
import { uploadImageToFirebase } from "../../services/firebase";

function ProductForm({
    onAdd,
    categories,
    editingProduct,
    onCancel
}) {

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        TenSP: "",
        MaDM: "",
        GiaGoc: "",          // Đổi từ DonGia thành GiaGoc
        GiamToiDa: 30,       // Mặc định giảm tối đa 30%
        TuDongGiamGia: true, // Mặc định bật giảm giá theo giờ
        MoTa: "",
        HinhAnh: "",
        SoLuongTon: "",
        DonViTinh: "",
        TrangThai: true
    });
    const [preview, setPreview] = useState("");

    useEffect(() => {

        if (editingProduct) {

            setFormData(editingProduct);

            setSelectedFile(null);

            setPreview(
                getImageUrl(editingProduct.HinhAnh)
            );

        } else {

            setFormData({
                TenSP: "",
                MaDM: "",
                GiaGoc: "",          // Đổi từ DonGia thành GiaGoc
                GiamToiDa: 30,       // Mặc định giảm tối đa 30%
                TuDongGiamGia: true, // Mặc định bật giảm giá theo giờ
                MoTa: "",
                HinhAnh: "",
                SoLuongTon: "",
                DonViTinh: "",
                TrangThai: true
            });

            setSelectedFile(null);
            setPreview("");

        }

    }, [editingProduct]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allow = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (!allow.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                image: "Chỉ được chọn JPG, JPEG, PNG hoặc WEBP"
            }));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setErrors(prev => ({
                ...prev,
                image: "Ảnh tối đa 2MB"
            }));
            return;
        }

        setErrors(prev => ({
            ...prev,
            image: ""
        }));

        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
    };


const handleChange = (e) => {

    const { name, value } = e.target;

    let error = "";

    switch (name) {

        case "TenSP":

            if (!value.trim())
                error = "Tên sản phẩm không được để trống";

            else if (value.trim().length < 2)
                error = "Tên sản phẩm phải có ít nhất 2 ký tự";

            else if (value.trim().length > 100)
                error = "Tên sản phẩm tối đa 100 ký tự";

            break;

        case "MaDM":
            if (!value)
                error = "Vui lòng chọn danh mục";
            break;

        case "GiaGoc":
            if (!value)
                error = "Giá không được để trống";
            else if (!/^\d+(\.\d+)?$/.test(value))
                error = "Giá chỉ được nhập số";
            break;

        case "SoLuongTon":
            if (!value)
                error = "Số lượng không được để trống";
            else if (!/^\d+$/.test(value))
                error = "Số lượng phải là số nguyên";
            break;

        case "DonViTinh":

            if (!value.trim())
                error = "Đơn vị tính không được để trống";

            else if (value.trim().length > 30)
                error = "Đơn vị tính tối đa 30 ký tự";

            break;
        case "MoTa":

            if (!value.trim())
                error = "Mô tả không được để trống";

            else if (value.trim().length > 1000)
                error = "Mô tả tối đa 1000 ký tự";

            break;

        default:
            break;
    }

    setErrors({
        ...errors,
        [name]: error
    });

    setFormData({
        ...formData,
        [name]: value
    });

};
const validate = () => {

    let newErrors = {};

    if (!formData.TenSP.trim()) {

        newErrors.TenSP =
            "Tên sản phẩm không được để trống";

    }
    else if (formData.TenSP.trim().length < 2) {

        newErrors.TenSP =
            "Tên sản phẩm phải có ít nhất 2 ký tự";

    }
    else if (formData.TenSP.trim().length > 100) {

        newErrors.TenSP =
            "Tên sản phẩm tối đa 100 ký tự";

    }

    if (!formData.MaDM) {
        newErrors.MaDM = "Vui lòng chọn danh mục";
    }

    if (!formData.GiaGoc || Number(formData.GiaGoc) <= 0) {
        newErrors.GiaGoc = "Giá phải lớn hơn 0";
    }

    if (
        formData.SoLuongTon === "" ||
        Number(formData.SoLuongTon) < 0
    ) {
        newErrors.SoLuongTon = "Số lượng tồn phải ≥ 0";
    }

    if (!formData.DonViTinh.trim()) {
        newErrors.DonViTinh = "Đơn vị tính không được để trống";
    }
    else if (formData.DonViTinh.trim().length > 30){
        newErrors.DonViTinh = "Đơn vị tính tối đa 30 ký tự";
    }

    if (!formData.MoTa.trim()) {
        newErrors.MoTa = "Mô tả không được để trống";
    }

    // Chỉ bắt buộc ảnh khi thêm mới
    if (
        !editingProduct &&
        !selectedFile
    ) {
        newErrors.image = "Vui lòng chọn hình ảnh";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

};
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setUploading(true);

        try {
            let imageUrl = formData.HinhAnh || "";
            if (selectedFile) {
                const uploaded = await uploadImageToFirebase(selectedFile);
                if (uploaded) {
                    imageUrl = uploaded;
                }
            }

            const data = new FormData();
            data.append("TenSP", formData.TenSP);
            data.append("MaDM", formData.MaDM);
            data.append("GiaGoc", formData.GiaGoc);
            data.append("GiamToiDa", formData.GiamToiDa);
            data.append("TuDongGiamGia", formData.TuDongGiamGia);
            data.append("MoTa", formData.MoTa);
            data.append("SoLuongTon", formData.SoLuongTon);
            data.append("DonViTinh", formData.DonViTinh);
            data.append("TrangThai", formData.TrangThai === true || formData.TrangThai === 1 || formData.TrangThai === "1" ? 1 : 0);

            // Gửi URL ảnh (đã upload lên Firebase Storage hoặc base64)
            data.append("HinhAnh", imageUrl);

            // cũng gửi file mút-tơ nếu backend muốn dùng làm fallback
            if (selectedFile) {
                data.append("image", selectedFile);
            }

            await onAdd(data);
            resetForm();
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };
const resetForm = () => {

    setFormData({
        TenSP: "",
        MaDM: "",
        GiaGoc: "",          // Đổi từ DonGia thành GiaGoc
        GiamToiDa: 30,       // Mặc định giảm tối đa 30%
        TuDongGiamGia: true, // Mặc định bật giảm giá theo giờ
        MoTa: "",
        HinhAnh: "",
        SoLuongTon: "",
        DonViTinh: "",
        TrangThai: 1
    });

    setSelectedFile(null);

    setPreview("");

};

    return (
        <div className="card mb-3 border-0 shadow-sm">
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="m-0 fw-bold text-success" style={{ fontSize: '1.05rem' }}>
                        {editingProduct ? "✏️ Sửa sản phẩm" : "➕ Thêm sản phẩm mới"}
                    </h5>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row g-2">
                        {/* Tên sản phẩm */}
                        <div className="col-md-5">
                            <label className="form-label small fw-semibold mb-1">Tên sản phẩm *</label>
                            <input
                                className={`form-control form-control-sm ${errors.TenSP ? "is-invalid" : ""}`}
                                placeholder="Nhập tên sản phẩm..."
                                name="TenSP"
                                value={formData.TenSP}
                                onChange={handleChange}
                            />
                            {errors.TenSP && <div className="invalid-feedback small">{errors.TenSP}</div>}
                        </div>

                        {/* Danh mục */}
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold mb-1">Danh mục *</label>
                            <select
                                className={`form-select form-select-sm ${errors.MaDM ? "is-invalid" : ""}`}
                                name="MaDM"
                                value={formData.MaDM}
                                onChange={handleChange}
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(category => (
                                    <option key={category.MaDM} value={category.MaDM}>
                                        {category.TenDM}
                                    </option>
                                ))}
                            </select>
                            {errors.MaDM && <div className="invalid-feedback small">{errors.MaDM}</div>}
                        </div>

                        {/* Giá gốc */}
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold mb-1">Giá gốc (VNĐ) *</label>
                            <input
                                className={`form-control form-control-sm ${errors.GiaGoc ? "is-invalid" : ""}`}
                                placeholder="VD: 85000"
                                name="GiaGoc"
                                value={formData.GiaGoc}
                                onChange={handleChange}
                            />
                            {errors.GiaGoc && <div className="invalid-feedback small">{errors.GiaGoc}</div>}
                        </div>

                        {/* % Giảm tối đa */}
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold mb-1">% Giảm tối đa</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="VD: 30"
                                name="GiamToiDa"
                                value={formData.GiamToiDa}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Số lượng tồn */}
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold mb-1">Tồn kho *</label>
                            <input
                                className={`form-control form-control-sm ${errors.SoLuongTon ? "is-invalid" : ""}`}
                                placeholder="VD: 100"
                                name="SoLuongTon"
                                value={formData.SoLuongTon}
                                onChange={handleChange}
                            />
                            {errors.SoLuongTon && <div className="invalid-feedback small">{errors.SoLuongTon}</div>}
                        </div>

                        {/* Đơn vị tính */}
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold mb-1">Đơn vị *</label>
                            <input
                                className={`form-control form-control-sm ${errors.DonViTinh ? "is-invalid" : ""}`}
                                placeholder="VD: Kg, Túi"
                                name="DonViTinh"
                                value={formData.DonViTinh}
                                onChange={handleChange}
                            />
                            {errors.DonViTinh && <div className="invalid-feedback small">{errors.DonViTinh}</div>}
                        </div>

                        {/* Tự động giảm giá */}
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold mb-1">Giảm giá tự động</label>
                            <select
                                className="form-select form-select-sm"
                                name="TuDongGiamGia"
                                value={formData.TuDongGiamGia}
                                onChange={(e) => setFormData({...formData, TuDongGiamGia: e.target.value === 'true'})}
                            >
                                <option value={true}>Bật theo khung giờ</option>
                                <option value={false}>Tắt (Bán đúng giá)</option>
                            </select>
                        </div>

                        {/* Trạng thái */}
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold mb-1">Trạng thái</label>
                            <select
                                className="form-select form-select-sm"
                                name="TrangThai"
                                value={formData.TrangThai === 0 || formData.TrangThai === false || String(formData.TrangThai) === "0" || String(formData.TrangThai) === "false" ? 0 : 1}
                                onChange={handleChange}
                            >
                                <option value={1}>Đang bán</option>
                                <option value={0}>Đã ẩn</option>
                            </select>
                        </div>

                        {/* Hình ảnh */}
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold mb-1">Hình ảnh</label>
                            <input
                                type="file"
                                className={`form-control form-control-sm ${errors.image ? "is-invalid" : ""}`}
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleImageChange}
                            />
                            {errors.image && <div className="invalid-feedback small">{errors.image}</div>}
                            {errors.HinhAnh && <small className="text-danger d-block">{errors.HinhAnh}</small>}
                        </div>

                        {/* Mô tả */}
                        <div className="col-md-10">
                            <label className="form-label small fw-semibold mb-1">Mô tả sản phẩm *</label>
                            <textarea
                                className={`form-control form-control-sm ${errors.MoTa ? "is-invalid" : ""}`}
                                rows="2"
                                placeholder="Nhập mô tả sản phẩm..."
                                name="MoTa"
                                value={formData.MoTa}
                                onChange={handleChange}
                            />
                            {errors.MoTa && <div className="invalid-feedback small">{errors.MoTa}</div>}
                        </div>

                        {/* Previews ảnh */}
                        <div className="col-md-2 d-flex align-items-center">
                            {(preview || formData.HinhAnh) && (
                                <div className="d-flex align-items-center gap-2 mt-2">
                                    <img
                                        src={preview || getImageUrl(formData.HinhAnh)}
                                        alt="Preview"
                                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                    <span className="small text-muted text-truncate" style={{ maxWidth: '90px' }}>
                                        {selectedFile ? selectedFile.name : (formData.HinhAnh ? "Ảnh hiện tại" : "")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-2 justify-content-end mt-2">
                        {editingProduct && onCancel && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel} disabled={uploading}>
                                Hủy
                            </button>
                        )}
                        <button type="submit" className="btn btn-sm btn-success px-3" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Đang xử lý ảnh...
                                </>
                            ) : (
                                editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProductForm;