import React, { useState, useEffect } from 'react';
import './UuDaiThanhVien.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api/vouchers`;

function UuDaiThanhVien() {
    const [vouchers, setVouchers] = useState([]);
    const [myVouchers, setMyVouchers] = useState([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [redeemingId, setRedeemingId] = useState(null);

    const getToken = () => localStorage.getItem('token');

    const fetchData = async () => {
        setIsLoading(true);
        setErrorMsg('');
        const token = getToken();

        if (!token) {
            setErrorMsg('Vui lòng đăng nhập để xem ưu đãi thành viên.');
            setIsLoading(false);
            return;
        }

        try {
            const [redeemableRes, myVouchersRes] = await Promise.all([
                fetch(`${API_URL}/redeemable`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/my-vouchers`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const redeemableData = await redeemableRes.json();
            const myVouchersData = await myVouchersRes.json();

            if (!redeemableRes.ok) {
                setErrorMsg(redeemableData.message || 'Không tải được danh sách ưu đãi');
                setIsLoading(false);
                return;
            }

            setVouchers(redeemableData.vouchers);
            setTotalPoints(redeemableData.totalPoints);
            setMyVouchers(Array.isArray(myVouchersData) ? myVouchersData : []);
        } catch (err) {
            setErrorMsg('Không thể kết nối tới máy chủ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRedeem = async (voucher) => {
        if (!window.confirm(`Đổi ${voucher.SoDiemDoi} điểm lấy voucher "${voucher.Code}"?`)) return;

        setRedeemingId(voucher.MaGG);
        try {
            const res = await fetch(`${API_URL}/${voucher.MaGG}/redeem`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Đổi voucher thất bại');
                return;
            }

            alert(`🎉 ${data.message}`);
            setTotalPoints(data.totalPoints);
            fetchData(); // tải lại danh sách để cập nhật SoLuong + ví voucher
        } catch (err) {
            alert('Không thể kết nối tới máy chủ');
        } finally {
            setRedeemingId(null);
        }
    };

    const formatVoucherValue = (v) => {
        return v.LoaiGiam === 'Phần trăm'
            ? `Giảm ${v.GiaTriGiam}%`
            : `Giảm ${Number(v.GiaTriGiam).toLocaleString()}đ`;
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        alert(`Đã sao chép mã: ${code}`);
    };

    if (isLoading) {
        return (
            <div className="uudai-wrapper">
                <h5 className="uudai-loading">⏳ Đang tải ưu đãi...</h5>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="uudai-wrapper">
                <div className="uudai-error">{errorMsg}</div>
            </div>
        );
    }

    return (
        <div className="uudai-wrapper">
            <div className="uudai-points-banner">
                <span>Điểm tích lũy của bạn</span>
                <strong>{totalPoints} điểm</strong>
            </div>

            <h5 className="uudai-section-title">Đổi điểm lấy Voucher</h5>
            {vouchers.length === 0 ? (
                <p className="uudai-empty">Hiện chưa có voucher nào để đổi điểm.</p>
            ) : (
                <div className="uudai-grid">
                    {vouchers.map((v) => {
                        const notEnough = totalPoints < v.SoDiemDoi;
                        return (
                            <div key={v.MaGG} className="uudai-card">
                                <div className="uudai-card-value">{formatVoucherValue(v)}</div>
                                <div className="uudai-card-code">{v.Code}</div>
                                <div className="uudai-card-condition">
                                    Đơn từ {Number(v.DieuKienApDung).toLocaleString()}đ
                                </div>
                                <div className="uudai-card-expiry">
                                    HSD: {new Date(v.NgayKT).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="uudai-card-footer">
                                    <span className="uudai-card-points">{v.SoDiemDoi} điểm</span>
                                    <button
                                        className="uudai-card-btn"
                                        disabled={notEnough || redeemingId === v.MaGG}
                                        onClick={() => handleRedeem(v)}
                                    >
                                        {redeemingId === v.MaGG
                                            ? 'Đang đổi...'
                                            : notEnough
                                            ? 'Chưa đủ điểm'
                                            : 'Đổi ngay'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <h5 className="uudai-section-title" style={{ marginTop: '30px' }}>Ví Voucher của tôi</h5>
            {myVouchers.length === 0 ? (
                <p className="uudai-empty">Bạn chưa đổi voucher nào.</p>
            ) : (
                <div className="uudai-my-list">
                    {myVouchers.map((v) => (
                        <div key={v.MaKHV} className={`uudai-my-item ${v.DaSuDung ? 'used' : ''}`}>
                            <div>
                                <div className="uudai-my-code">{v.Code}</div>
                                <div className="uudai-my-desc">
                                    {formatVoucherValue(v)} · Đơn từ {Number(v.DieuKienApDung).toLocaleString()}đ
                                    · HSD: {new Date(v.NgayKT).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            {v.DaSuDung ? (
                                <span className="uudai-my-used-tag">Đã dùng</span>
                            ) : (
                                <button className="uudai-my-copy-btn" onClick={() => copyCode(v.Code)}>
                                    Sao chép mã
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default UuDaiThanhVien;
