import { useState, useEffect } from "react";
import { API_BASE } from "../../../utils/api";

function HoSoCaNhan() {
    const [formData, setFormData] = useState({
        hoTen: "",
        soDienThoai: "",
        email: "",
        gioiTinh: "nam",
        ngaySinh: "",
    });

    const [avatarUrl, setAvatarUrl] = useState("");
    const [originalEmail, setOriginalEmail] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setFormData((prev) => ({
                ...prev,
                hoTen: storedUser.HoTen || "",
                soDienThoai: storedUser.SoDienThoai || "",
                email: storedUser.email || "",
                gioiTinh: storedUser.GioiTinh || "nam",
                ngaySinh: storedUser.NgaySinh || "",
            }));
            if (storedUser.avatarUrl || storedUser.HinhAnh) {
                setAvatarUrl(storedUser.avatarUrl || storedUser.HinhAnh);
            }
            setOriginalEmail(storedUser.email || "");
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaveMessage("");

        if (formData.email !== originalEmail) {
            setPasswordError("");
            setConfirmPassword("");
            setShowPasswordModal(true);
            return;
        }

        saveProfile();
    };

    const saveProfile = async () => {
        setIsSaving(true);
        setSaveMessage("");

        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    hoTen: formData.hoTen,
                    soDienThoai: formData.soDienThoai,
                    gioiTinh: formData.gioiTinh,
                    ngaySinh: formData.ngaySinh,
                    avatarUrl: avatarUrl || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSaveMessage(data.message || "Cập nhật thất bại, vui lòng thử lại.");
                return;
            }

            // Cập nhật lại localStorage để header "Xin chào ..." và tên hiển thị đổi theo
            const storedUser = JSON.parse(localStorage.getItem('user')) || {};
            const updatedUser = {
                ...storedUser,
                HoTen: formData.hoTen,
                SoDienThoai: formData.soDienThoai,
                GioiTinh: formData.gioiTinh,
                NgaySinh: formData.ngaySinh,
                avatarUrl: avatarUrl || storedUser.avatarUrl || storedUser.HinhAnh,
                HinhAnh: avatarUrl || storedUser.HinhAnh || storedUser.avatarUrl,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Báo cho các component khác (như Profile.jsx) biết localStorage vừa đổi
            window.dispatchEvent(new Event("userUpdated"));

            setSaveMessage("Cập nhật hồ sơ thành công!");
        } catch (err) {
            console.error("Lỗi cập nhật hồ sơ:", err);
            setSaveMessage("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmPassword = async () => {
        if (!confirmPassword) {
            setPasswordError("Vui lòng nhập mật khẩu.");
            return;
        }

        setIsVerifying(true);
        setPasswordError("");

        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`${API_BASE}/api/auth/verify-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ password: confirmPassword }),
            });
            const data = await res.json();

            if (!res.ok || !data.valid) {
                setPasswordError(data.message || "Mật khẩu không chính xác.");
                setIsVerifying(false);
                return;
            }

            await saveProfile();
            setOriginalEmail(formData.email);
            setShowPasswordModal(false);
            setConfirmPassword("");
        } catch (err) {
            console.error("Lỗi xác thực mật khẩu:", err);
            setPasswordError("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="shadow-sm rounded p-4">
            <h5 className="mb-4">Hồ sơ cá nhân</h5>

            {saveMessage && (
                <div className={`alert ${saveMessage.includes("thành công") ? "alert-success" : "alert-danger"} py-2`}>
                    {saveMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4 d-flex align-items-center gap-3">
                    <div
                        className="rounded-circle border overflow-hidden d-flex align-items-center justify-content-center bg-light text-success fw-bold flex-shrink-0"
                        style={{ width: "70px", height: "70px", fontSize: "24px" }}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            (formData.hoTen || "U").charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <label className="btn btn-outline-success btn-sm mb-1 cursor-pointer" htmlFor="hoso-avatar-input">
                            📷 Chọn ảnh đại diện
                        </label>
                        <input
                            type="file"
                            id="hoso-avatar-input"
                            accept="image/*"
                            className="d-none"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    alert("Kích thước file quá lớn (tối đa 5MB). Vui lòng chọn ảnh có dung lượng nhỏ hơn!");
                                    return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setAvatarUrl(reader.result);
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                        <div className="text-muted small">Dung lượng tối đa 2MB. Định dạng PNG, JPG, JPEG.</div>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">Họ và tên*</label>
                    <input
                        type="text"
                        name="hoTen"
                        className="form-control"
                        placeholder="Nhập họ và tên"
                        value={formData.hoTen}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Số điện thoại*</label>
                    <input
                        type="tel"
                        name="soDienThoai"
                        className="form-control"
                        placeholder="Số điện thoại"
                        value={formData.soDienThoai}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Email
                        {formData.email !== originalEmail && (
                            <span className="text-warning ms-2" style={{ fontSize: "12px" }}>
                                ⚠ Email đã thay đổi, cần xác nhận mật khẩu khi lưu
                            </span>
                        )}
                    </label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label d-block">Giới tính</label>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="gioiTinh"
                            value="nam"
                            checked={formData.gioiTinh === "nam"}
                            onChange={handleChange}
                        />
                        <label className="form-check-label">Nam</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="gioiTinh"
                            value="nu"
                            checked={formData.gioiTinh === "nu"}
                            onChange={handleChange}
                        />
                        <label className="form-check-label">Nữ</label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label">Ngày sinh</label>
                    <input
                        type="date"
                        name="ngaySinh"
                        className="form-control"
                        value={formData.ngaySinh}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" className="btn btn-dark" disabled={isSaving}>
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
            </form>

            {showPasswordModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                    onClick={() => !isVerifying && setShowPasswordModal(false)}
                >
                    <div
                        className="bg-white rounded-4 p-4"
                        style={{ width: "400px", maxWidth: "90%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h6 className="fw-bold mb-2">Xác nhận mật khẩu</h6>
                        <p className="text-muted small mb-3">
                            Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại trước khi đổi email sang{" "}
                            <strong>{formData.email}</strong>.
                        </p>

                        <input
                            type="password"
                            className={`form-control mb-2 ${passwordError ? "is-invalid" : ""}`}
                            placeholder="Nhập mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoFocus
                        />
                        {passwordError && (
                            <div className="text-danger small mb-2">{passwordError}</div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowPasswordModal(false)}
                                disabled={isVerifying}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn-dark"
                                onClick={handleConfirmPassword}
                                disabled={isVerifying}
                            >
                                {isVerifying ? "Đang kiểm tra..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HoSoCaNhan;