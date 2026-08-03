import { useState, useEffect } from "react";
import { getImageUrl } from "../../utils/api";

function ProductForm({
    onAdd,
    categories,
    editingProduct,
    onCancel
}) {

    const [selectedFile, setSelectedFile] = useState(null);
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

        // lưu tên ảnh cũ
        data.append("HinhAnh", formData.HinhAnh || "");

        // chỉ upload nếu có chọn file mới
        if (selectedFile) {
            data.append("image", selectedFile);
        }

        try {
            await onAdd(data);
            resetForm();
        } catch (err) {
            console.error(err);
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

        <div className="card mb-4">

            <div className="card-body">

                <h4>

                    {
                        editingProduct
                            ? "Sửa sản phẩm"
                            : "Thêm sản phẩm"
                    }

                </h4>

                <form onSubmit={handleSubmit}>

                    <input
                        className={`form-control mb-1 ${
                            errors.TenSP
                                ? "is-invalid"
                                : formData.TenSP
                                    ? "is-valid"
                                    : ""
                        }`}
                        placeholder="Nhập tên sản phẩm"
                        name="TenSP"
                        value={formData.TenSP}
                        onChange={handleChange}
                    />

                    <div className="invalid-feedback">
                        {errors.TenSP}
                    </div>
                    <select
                        className={`form-control mb-1 ${
                            errors.MaDM
                                ? "is-invalid"
                                : formData.MaDM
                                ? "is-valid"
                                : ""
                        }`}
                        name="MaDM"
                        value={formData.MaDM}
                        onChange={handleChange}
                    >

                    <option value="">
                        Chọn danh mục
                    </option>

                    {
                        categories.map(category => (

                            <option
                                key={category.MaDM}
                                value={category.MaDM}
                            >
                                {category.TenDM}
                            </option>

                        ))
                    }

                    </select>

                    <div className="invalid-feedback">
                        {errors.MaDM}
                    </div>

                   {/* Ô nhập Giá Gốc */}
                    <input
                        className={`form-control mb-1 ${errors.GiaGoc ? "is-invalid" : formData.GiaGoc ? "is-valid" : ""}`}
                        placeholder="Giá gốc (VNĐ)"
                        name="GiaGoc"
                        value={formData.GiaGoc}
                        onChange={handleChange}
                    />
                    <div className="invalid-feedback">{errors.GiaGoc}</div>

                    {/* Ô nhập Giảm tối đa (%) */}
                    <input
                        type="number"
                        className="form-control mb-1 mt-2"
                        placeholder="% Giảm tối đa (VD: 30)"
                        name="GiamToiDa"
                        value={formData.GiamToiDa}
                        onChange={handleChange}
                    />

                    {/* Chọn chế độ giảm giá */}
                    <select
                        className="form-control mb-2 mt-2"
                        name="TuDongGiamGia"
                        value={formData.TuDongGiamGia}
                        onChange={(e) => setFormData({...formData, TuDongGiamGia: e.target.value === 'true'})}
                    >
                        <option value={true}>Bật tự động giảm giá theo giờ</option>
                        <option value={false}>Tắt (Bán đúng giá gốc)</option>
                    </select>

                    <input
                        className={`form-control mb-1 ${
                            errors.SoLuongTon
                                ? "is-invalid"
                                : formData.SoLuongTon
                                    ? "is-valid"
                                    : ""
                        }`}
                        placeholder="Số lượng tồn"
                        name="SoLuongTon"
                        value={formData.SoLuongTon}
                        onChange={handleChange}
                    />

                    <div className="invalid-feedback">
                        {errors.SoLuongTon}
                    </div>
                    
                    <input
                        className={`form-control mb-1 ${
                            errors.DonViTinh? "is-invalid"
                            : formData.DonViTinh
                            ? "is-valid"
                            : ""}`}
                        placeholder="Đơn vị tính"
                        name="DonViTinh"
                        value={formData.DonViTinh}
                        onChange={handleChange}
                    />
                    <div className="invalid-feedback">
                    {errors.DonViTinh}
                    </div>

                    <input
                        type="file"
                        className={`form-control ${
                            errors.image ? "is-invalid" : ""
                        }`}
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageChange}
                    />

                    <div className="invalid-feedback">
                        {errors.image}
                    </div>
                    {
                        errors.HinhAnh &&
                        <small className="text-danger">
                            {errors.HinhAnh}
                        </small>
                    }
                    {!selectedFile && formData.HinhAnh && (
                        <div className="mb-3">
                            <p>
                                <strong>Ảnh hiện tại:</strong> {formData.HinhAnh}
                            </p>

                            <img
                                src={getImageUrl(formData.HinhAnh)}
                                width="120"
                                style={{ borderRadius: 8 }}
                            />
                        </div>
                    )}
                    {selectedFile && (
                        <div className="mb-3">
                            <p>
                                <strong>Ảnh mới:</strong> {selectedFile.name}
                            </p>

                            <img
                                src={preview}
                                width="120"
                                style={{ borderRadius: 8 }}
                            />
                        </div>
                    )}
                    <textarea
                        className={`form-control mb-1 ${
                        errors.MoTa
                        ? "is-invalid"
                        : formData.MoTa
                        ? "is-valid"
                        : ""
                        }`}
                        placeholder="Mô tả"
                        name="MoTa"
                        value={formData.MoTa}
                        onChange={handleChange}
                    />
                    <div className="invalid-feedback">
                    {errors.MoTa}
                    </div>
                    <select
                        className="form-control mb-2"
                        name="TrangThai"
                        value={formData.TrangThai === 0 || formData.TrangThai === false || String(formData.TrangThai) === "0" || String(formData.TrangThai) === "false" ? 0 : 1}
                        onChange={handleChange}
                    >
                        <option value={1}>Đang bán</option>
                        <option value={0}>Đã ẩn</option>
                    </select>
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-success">
                            {
                                editingProduct
                                    ? "Cập nhật"
                                    : "Thêm sản phẩm"
                            }
                        </button>
                        {editingProduct && onCancel && (
                            <button type="button" className="btn btn-secondary" onClick={onCancel}>
                                Hủy
                            </button>
                        )}
                    </div>

                </form>

            </div>

        </div>

    );

}

export default ProductForm;