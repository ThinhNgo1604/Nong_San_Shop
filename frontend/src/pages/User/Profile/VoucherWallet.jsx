import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';

function VoucherWallet() {
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/vouchers/active`)
            .then(res => res.json())
            .then(data => {
                setVouchers(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        alert(`🎉 Đã sao chép mã: ${code}`);
    };

    if (isLoading) return <div className="text-center p-5 text-success">Đang tải mã giảm giá...</div>;

    return (
        <div className="shadow-sm rounded p-4 bg-white border mt-3">
            <h5 className="fw-bold mb-4 text-success">🎟️ Ví Voucher Của Tôi</h5>
            
            {vouchers.length === 0 ? (
                <p className="text-muted text-center py-4">Hiện chưa có mã giảm giá nào khả dụng.</p>
            ) : (
                <div className="row">
                    {vouchers.map(v => (
                        <div key={v.MaGG} className="col-md-6 mb-4">
                            <div className="d-flex border rounded overflow-hidden shadow-sm" style={{ height: '120px' }}>
                                {/* Phần bên trái: Giá trị giảm */}
                                <div className="bg-success text-white d-flex flex-column justify-content-center align-items-center p-2" style={{ width: '35%', borderRight: '2px dashed #fff' }}>
                                    <span className="fs-5 fw-bold text-center">
                                        {v.LoaiGiam === 'Phần trăm' ? `${v.GiaTriGiam}%` : `${Number(v.GiaTriGiam).toLocaleString()}đ`}
                                    </span>
                                    <small className="text-center mt-1">GIẢM</small>
                                </div>
                                
                                {/* Phần bên phải: Thông tin & Nút Copy */}
                                <div className="p-3 d-flex flex-column justify-content-between position-relative" style={{ width: '65%', backgroundColor: '#fafafa' }}>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{v.Code}</div>
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            Đơn tối thiểu {Number(v.DieuKienApDung).toLocaleString()}đ
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px' }}>
                                            HSD: {new Date(v.NgayKT).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(v.Code)} 
                                        className="btn btn-sm btn-outline-success position-absolute"
                                        style={{ bottom: '15px', right: '15px', fontSize: '12px', padding: '4px 12px' }}
                                    >
                                        Sao chép
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

export default VoucherWallet;