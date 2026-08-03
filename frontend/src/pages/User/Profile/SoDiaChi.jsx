import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';

function SoDiaChi() {
    const [addresses, setAddresses] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ hoTen: '', soDienThoai: '', diaChiChiTiet: '', macDinh: false });
    const user = JSON.parse(localStorage.getItem('user'));

    // Gọi API lấy danh sách
    const fetchAddresses = () => {
        if (user) {
            fetch(`${API_BASE}/api/addresses/${user.maTK}`)
                .then(res => res.json())
                .then(data => setAddresses(data))
                .catch(err => console.error(err));
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    // Gửi data thêm địa chỉ mới
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_BASE}/api/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, maTK: user.maTK })
            });
            alert("Thêm địa chỉ thành công!");
            setShowAddForm(false);
            setFormData({ hoTen: '', soDienThoai: '', diaChiChiTiet: '', macDinh: false });
            fetchAddresses(); // Render lại danh sách
        } catch (error) {
            alert("Lỗi khi thêm địa chỉ");
        }
    };

    // Gọi API set mặc định
    const handleSetDefault = async (maDC) => {
        try {
            await fetch(`${API_BASE}/api/addresses/set-default`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maTK: user.maTK, maDC })
            });
            fetchAddresses();
        } catch (error) {
            alert("Lỗi cập nhật");
        }
    };

    return (
        <div className="shadow-sm rounded p-4 bg-white border">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Sổ địa chỉ</h5>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-link text-primary text-decoration-none p-0 fw-medium">
                    {showAddForm ? 'Hủy thêm' : '+ Thêm địa chỉ mới'}
                </button>
            </div>

            {/* FORM THÊM ĐỊA CHỈ */}
            {showAddForm && (
                <form onSubmit={handleAddSubmit} className="mb-4 p-3 bg-light border rounded">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Họ Tên</label>
                            <input type="text" className="form-control" required value={formData.hoTen} onChange={e => setFormData({...formData, hoTen: e.target.value})} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Số điện thoại</label>
                            <input type="text" className="form-control" required value={formData.soDienThoai} onChange={e => setFormData({...formData, soDienThoai: e.target.value})} />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Địa chỉ chi tiết</label>
                        <input type="text" className="form-control" required placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" value={formData.diaChiChiTiet} onChange={e => setFormData({...formData, diaChiChiTiet: e.target.value})} />
                    </div>
                    <div className="form-check mb-3">
                        <input type="checkbox" className="form-check-input" id="defaultCheck" checked={formData.macDinh} onChange={e => setFormData({...formData, macDinh: e.target.checked})} />
                        <label className="form-check-label" htmlFor="defaultCheck">Đặt làm địa chỉ mặc định</label>
                    </div>
                    <button type="submit" className="btn btn-success">Lưu địa chỉ</button>
                </form>
            )}

            {/* DANH SÁCH ĐỊA CHỈ */}
            {addresses.length === 0 ? (
                <p className="text-muted">Bạn chưa có địa chỉ nào. Hãy thêm mới!</p>
            ) : (
                <div className="address-list">
                    {addresses.map((addr) => (
                        <div key={addr.MaDC} className="address-item py-3 border-bottom position-relative">
                            <div className="row">
                                <div className="col-md-9">
                                    <div className="d-flex align-items-center mb-1">
                                        <span className="fw-bold text-dark me-3">{addr.HoTen}</span>
                                        <span className="text-secondary border-start ps-3">{addr.SoDienThoai}</span>
                                        {addr.MacDinh ? (
                                            <span className="badge ms-3" style={{ backgroundColor: '#e0f7fa', color: '#006064', fontWeight: '500', borderRadius: '4px' }}>
                                                Địa chỉ mặc định
                                            </span>
                                        ) : (
                                            <button onClick={() => handleSetDefault(addr.MaDC)} className="btn btn-sm btn-outline-secondary ms-3" style={{ fontSize: '12px' }}>
                                                Thiết lập mặc định
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-muted small mt-2">
                                        {addr.DiaChiChiTiet}
                                    </div>
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