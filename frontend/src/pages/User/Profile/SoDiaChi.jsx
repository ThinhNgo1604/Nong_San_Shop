import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';

function SoDiaChi() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // null if adding, maDC if editing
    const [formData, setFormData] = useState({ hoTen: '', soDienThoai: '', diaChiChiTiet: '', macDinh: false });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const maTK = user ? (user.maTK || user.MaTK || user.MaKH || user.maKH) : null;

    // Gọi API lấy danh sách địa chỉ
    const fetchAddresses = () => {
        if (maTK) {
            setLoading(true);
            fetch(`${API_BASE}/api/addresses/${maTK}`)
                .then(res => res.json())
                .then(data => {
                    setAddresses(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi lấy danh sách địa chỉ:", err);
                    setLoading(false);
                });
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [maTK]);

    const handleOpenAddForm = () => {
        setEditingId(null);
        setFormData({
            hoTen: user?.hoTen || user?.HoTen || '',
            soDienThoai: user?.soDienThoai || user?.SoDienThoai || '',
            diaChiChiTiet: '',
            macDinh: addresses.length === 0
        });
        setShowForm(true);
    };

    const handleOpenEditForm = (addr) => {
        const id = addr.MaDC || addr.maDC;
        setEditingId(id);
        setFormData({
            hoTen: addr.HoTen || addr.hoTen || '',
            soDienThoai: addr.SoDienThoai || addr.soDienThoai || '',
            diaChiChiTiet: addr.DiaChiChiTiet || addr.diaChiChiTiet || '',
            macDinh: !!(addr.MacDinh || addr.macDinh)
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ hoTen: '', soDienThoai: '', diaChiChiTiet: '', macDinh: false });
    };

    // Gửi form (Thêm hoặc Sửa)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!maTK) {
            alert("Vui lòng đăng nhập lại!");
            return;
        }

        try {
            if (editingId) {
                // UPDATE
                const res = await fetch(`${API_BASE}/api/addresses/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        maDC: editingId,
                        maTK,
                        ...formData
                    })
                });
                if (res.ok) {
                    alert("Cập nhật địa chỉ thành công!");
                    handleCancel();
                    fetchAddresses();
                } else {
                    const err = await res.json();
                    alert(err.message || "Lỗi khi cập nhật địa chỉ");
                }
            } else {
                // ADD
                const res = await fetch(`${API_BASE}/api/addresses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        maTK,
                        ...formData
                    })
                });
                if (res.ok) {
                    alert("Thêm địa chỉ mới thành công!");
                    handleCancel();
                    fetchAddresses();
                } else {
                    const err = await res.json();
                    alert(err.message || "Lỗi khi thêm địa chỉ");
                }
            }
        } catch (error) {
            console.error("Lỗi submit địa chỉ:", error);
            alert("Lỗi kết nối máy chủ");
        }
    };

    // Gọi API set mặc định
    const handleSetDefault = async (maDC) => {
        try {
            const res = await fetch(`${API_BASE}/api/addresses/set-default`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maTK, maDC })
            });
            if (res.ok) {
                fetchAddresses();
            } else {
                alert("Lỗi khi cập nhật địa chỉ mặc định");
            }
        } catch (error) {
            alert("Lỗi cập nhật");
        }
    };

    // Xóa địa chỉ
    const handleDelete = async (maDC) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/addresses/${maDC}?maTK=${maTK}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchAddresses();
            } else {
                alert("Lỗi khi xóa địa chỉ");
            }
        } catch (error) {
            alert("Lỗi khi xóa địa chỉ");
        }
    };

    return (
        <div className="shadow-sm rounded p-4 bg-white border">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Sổ địa chỉ</h5>
                {!showForm ? (
                    <button onClick={handleOpenAddForm} className="btn btn-primary btn-sm fw-medium">
                        + Thêm địa chỉ mới
                    </button>
                ) : (
                    <button onClick={handleCancel} className="btn btn-outline-secondary btn-sm">
                        Hủy
                    </button>
                )}
            </div>

            {/* FORM THÊM / CHỈNH SỬA ĐỊA CHỈ */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-4 p-3 bg-light border rounded shadow-sm">
                    <h6 className="fw-bold mb-3 text-success">
                        {editingId ? "✏️ Chỉnh sửa địa chỉ" : "➕ Thêm địa chỉ mới"}
                    </h6>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Họ Tên người nhận <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={formData.hoTen}
                                onChange={e => setFormData({ ...formData, hoTen: e.target.value })}
                                placeholder="Nhập họ và tên người nhận"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Số điện thoại <span className="text-danger">*</span></label>
                            <input
                                type="tel"
                                className="form-control"
                                required
                                value={formData.soDienThoai}
                                onChange={e => setFormData({ ...formData, soDienThoai: e.target.value })}
                                placeholder="Nhập số điện thoại nhận hàng"
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-medium">Địa chỉ chi tiết <span className="text-danger">*</span></label>
                        <textarea
                            rows="2"
                            className="form-control"
                            required
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            value={formData.diaChiChiTiet}
                            onChange={e => setFormData({ ...formData, diaChiChiTiet: e.target.value })}
                        />
                    </div>
                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="defaultCheck"
                            checked={formData.macDinh}
                            onChange={e => setFormData({ ...formData, macDinh: e.target.checked })}
                        />
                        <label className="form-check-label user-select-none" htmlFor="defaultCheck">
                            Đặt làm địa chỉ nhận hàng mặc định
                        </label>
                    </div>
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-success fw-medium">
                            {editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}
                        </button>
                        <button type="button" onClick={handleCancel} className="btn btn-light border">
                            Hủy bỏ
                        </button>
                    </div>
                </form>
            )}

            {/* DANH SÁCH ĐỊA CHỈ */}
            {loading ? (
                <p className="text-muted text-center py-3">Đang tải danh sách địa chỉ...</p>
            ) : addresses.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    <p className="mb-2">Bạn chưa có địa chỉ nhận hàng nào trong sổ địa chỉ.</p>
                    <button onClick={handleOpenAddForm} className="btn btn-outline-success btn-sm">
                        + Thêm địa chỉ đầu tiên
                    </button>
                </div>
            ) : (
                <div className="address-list">
                    {addresses.map((addr) => (
                        <div key={addr.MaDC} className="address-item py-3 border-bottom position-relative">
                            <div className="row align-items-center">
                                <div className="col-md-8 col-12 mb-2 mb-md-0">
                                    <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                                        <span className="fw-bold text-dark">{addr.HoTen}</span>
                                        <span className="text-secondary border-start ps-2">{addr.SoDienThoai}</span>
                                        {addr.MacDinh ? (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1">
                                                Mặc định
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="text-muted small">
                                        {addr.DiaChiChiTiet}
                                    </div>
                                </div>
                                <div className="col-md-4 col-12 text-md-end d-flex gap-2 justify-content-md-end align-items-center">
                                    {!(addr.MacDinh || addr.macDinh) && (
                                        <button
                                            onClick={() => handleSetDefault(addr.MaDC || addr.maDC)}
                                            className="btn btn-sm btn-outline-secondary py-1 px-2"
                                            style={{ fontSize: '12px' }}
                                        >
                                            Đặt mặc định
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleOpenEditForm(addr)}
                                        className="btn btn-sm btn-outline-primary py-1 px-2"
                                        style={{ fontSize: '12px' }}
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr.MaDC || addr.maDC)}
                                        className="btn btn-sm btn-outline-danger py-1 px-2"
                                        style={{ fontSize: '12px' }}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SoDiaChi;
