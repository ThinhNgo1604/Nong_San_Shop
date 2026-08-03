import { useEffect, useState } from "react";

function VoucherForm({
    editingVoucher,
    onAdd,
    onUpdate,
    onCancel
}) {

    const [formData, setFormData] = useState({
        Code: "",
        LoaiGiam: "",
        GiaTriGiam: "",
        NgayBD: "",
        NgayKT: "",
        DieuKienApDung: "",
        SoLuong: "",
        SoDiemDoi: ""
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {

        if (editingVoucher) {

            setFormData({
                ...editingVoucher,
                SoDiemDoi: editingVoucher.SoDiemDoi ?? ""
            });

        } else {

            setFormData({
                Code: "",
                LoaiGiam: "",
                GiaTriGiam: "",
                NgayBD: "",
                NgayKT: "",
                DieuKienApDung: "",
                SoLuong: "",
                SoDiemDoi: ""
            });

        }

        setErrors({});

    }, [editingVoucher]);

    const handleChange = (e) => {

        let { name, value } = e.target;

        if (name === "Code") {

            value = value.toUpperCase();

            value = value.replace(/\s/g, "");

        }

        setFormData({
            ...formData,
            [name]: value
        });

        setErrors({
            ...errors,
            [name]: ""
        });

    };

    const validate = () => {

        const newErrors = {};

        if (!formData.Code.trim()) {

            newErrors.Code = "Vui lòng nhập mã giảm giá";

        }
        else if (!/^[A-Za-z0-9]+$/.test(formData.Code)) {

            newErrors.Code = "Chỉ được nhập chữ và số";

        }
        else if (formData.Code.length < 3 || formData.Code.length > 20) {

            newErrors.Code = "Độ dài từ 3-20 ký tự";

        }

        if (!formData.LoaiGiam) {

            newErrors.LoaiGiam = "Vui lòng chọn loại giảm";

        }

        if (!formData.GiaTriGiam) {

            newErrors.GiaTriGiam = "Vui lòng nhập giá trị";

        }
        else if (isNaN(formData.GiaTriGiam)) {

            newErrors.GiaTriGiam = "Chỉ được nhập số";

        }
        else {

            const value = Number(formData.GiaTriGiam);

            if (value <= 0)
                newErrors.GiaTriGiam = "Giá trị phải lớn hơn 0";

            if (
                formData.LoaiGiam === "Phần trăm" &&
                value > 100
            ) {

                newErrors.GiaTriGiam = "Không được vượt quá 100%";

            }

        }

        if (!formData.NgayBD)
            newErrors.NgayBD = "Chọn ngày bắt đầu";

        if (!formData.NgayKT)
            newErrors.NgayKT = "Chọn ngày kết thúc";

        if (
            formData.NgayBD &&
            formData.NgayKT &&
            new Date(formData.NgayKT) < new Date(formData.NgayBD)
        ) {

            newErrors.NgayKT = "Ngày kết thúc phải sau ngày bắt đầu";

        }

        if (!formData.DieuKienApDung) {

            newErrors.DieuKienApDung = "Nhập điều kiện áp dụng";

        }
        else if (isNaN(formData.DieuKienApDung)) {

            newErrors.DieuKienApDung = "Chỉ nhập số";

        }
        else if (Number(formData.DieuKienApDung) < 0) {

            newErrors.DieuKienApDung = "Không được nhỏ hơn 0";

        }

        if (!formData.SoLuong) {

            newErrors.SoLuong = "Nhập số lượng";

        }
        else if (!Number.isInteger(Number(formData.SoLuong))) {

            newErrors.SoLuong = "Số lượng phải là số nguyên";

        }
        else if (Number(formData.SoLuong) <= 0) {

            newErrors.SoLuong = "Số lượng phải lớn hơn 0";

        }

        if (formData.SoDiemDoi !== "") {

            if (!Number.isInteger(Number(formData.SoDiemDoi))) {

                newErrors.SoDiemDoi = "Điểm đổi phải là số nguyên";

            }
            else if (Number(formData.SoDiemDoi) <= 0) {

                newErrors.SoDiemDoi = "Điểm đổi phải lớn hơn 0";

            }

        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        if (!validate()) return;

        if (editingVoucher) {

            onUpdate(editingVoucher.MaGG, formData);

        }
        else {

            onAdd(formData);

        }

    };

    return (

        <div className="card mb-4">

            <div className="card-body">

                <h4>
                    {editingVoucher ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
                </h4>

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">

                        <label className="form-label">Code</label>

                        <input
                            className={`form-control ${
                                errors.Code
                                    ? "is-invalid"
                                    : formData.Code
                                    ? "is-valid"
                                    : ""
                            }`}
                            name="Code"
                            value={formData.Code}
                            onChange={handleChange}
                        />

                        <div className="invalid-feedback">
                            {errors.Code}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Loại giảm</label>

                        <select
                            className={`form-control ${
                                errors.LoaiGiam ? "is-invalid" : ""
                            }`}
                            name="LoaiGiam"
                            value={formData.LoaiGiam}
                            onChange={handleChange}
                        >
                            <option value="">Loại giảm</option>
                            <option value="Phần trăm">Phần trăm</option>
                            <option value="Tiền">Tiền</option>
                        </select>

                        <div className="invalid-feedback">
                            {errors.LoaiGiam}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Giá trị giảm</label>

                        <input
                            className={`form-control ${
                                errors.GiaTriGiam ? "is-invalid" : ""
                            }`}
                            name="GiaTriGiam"
                            value={formData.GiaTriGiam}
                            onChange={handleChange}
                        />

                        <div className="invalid-feedback">
                            {errors.GiaTriGiam}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Ngày bắt đầu</label>

                        <input
                            type="date"
                            className={`form-control ${
                                errors.NgayBD ? "is-invalid" : ""
                            }`}
                            name="NgayBD"
                            value={formData.NgayBD?.slice(0,10)}
                            onChange={handleChange}
                        />

                        <div className="invalid-feedback">
                            {errors.NgayBD}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Ngày kết thúc</label>

                        <input
                            type="date"
                            className={`form-control ${
                                errors.NgayKT ? "is-invalid" : ""
                            }`}
                            name="NgayKT"
                            value={formData.NgayKT?.slice(0,10)}
                            onChange={handleChange}
                        />

                        <div className="invalid-feedback">
                            {errors.NgayKT}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Điều kiện áp dụng</label>

                        <input
                            className={`form-control ${
                                errors.DieuKienApDung ? "is-invalid" : ""
                            }`}
                            name="DieuKienApDung"
                            value={formData.DieuKienApDung}
                            onChange={handleChange}
                        />

                        <div className="invalid-feedback">
                            {errors.DieuKienApDung}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Số lượng</label>

                        <input
                            className={`form-control ${
                                errors.SoLuong ? "is-invalid" : ""
                            }`}
                            name="SoLuong"
                            value={formData.SoLuong}
                            onChange={handleChange}
                        />

                        <div className="invalid-feedback">
                            {errors.SoLuong}
                        </div>

                    </div>

                    <div className="mb-3">

                        <label className="form-label">Điểm đổi</label>

                        <input
                            type="number"
                            className={`form-control ${
                                errors.SoDiemDoi ? "is-invalid" : ""
                            }`}
                            name="SoDiemDoi"
                            value={formData.SoDiemDoi}
                            onChange={handleChange}
                            placeholder="Để trống nếu không dùng để đổi điểm"
                        />

                        <div className="invalid-feedback">
                            {errors.SoDiemDoi}
                        </div>

                    </div>

                    <button className="btn btn-success me-2">

                        {editingVoucher ? "Cập nhật" : "Thêm"}

                    </button>

                    {editingVoucher && (

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            Hủy
                        </button>

                    )}

                </form>

            </div>

        </div>

    );

}

export default VoucherForm;