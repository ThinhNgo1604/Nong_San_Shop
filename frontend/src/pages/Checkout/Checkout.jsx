import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Checkout.css'; 
import { API_BASE, getImageUrl } from "../../utils/api"; 

// TODO: Thay bằng địa chỉ cửa hàng thật của bạn khi có
const STORE_ADDRESS = {
  HoTen: 'Nông Sản Shop',
  SoDienThoai: '1900 1234',
  DiaChiChiTiet: '123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh'
};

const SectionBlock = ({ title, children }) => (
    <div className="checkout-block">
      <h3>{title}</h3>
      {children}
    </div>
  );

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartItems, setCartItems] = useState(location.state?.cartItems || []);
  const initialShippingType = location.state?.shippingType || 'standard';
  const [discount, setDiscount] = useState(location.state?.discount || 0); 
  const [appliedVoucher, setAppliedVoucher] = useState(location.state?.appliedVoucher || null);
  const [promoCode, setPromoCode] = useState(location.state?.promoCode || '');
  
  const [shippingType, setShippingType] = useState(initialShippingType);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem('user'));
  const [guestInfo, setGuestInfo] = useState({ hoTen: '', soDienThoai: '', diaChi: '' });

  // State cho luồng VietQR
  const [showVietQR, setShowVietQR] = useState(false);
  const [vietQrData, setVietQrData] = useState(null); // { qrUrl, content, maDH }
  const pollingRef = useRef(null);

  // State cho thông báo lỗi thanh toán / địa chỉ
  const [errorMessage, setErrorMessage] = useState('');

  // State cho thông báo "Thành công" theo style riêng của web
  // successType: 'payment' (đã thanh toán qua VietQR) | 'order' (đặt hàng COD/tiền mặt)
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState('payment');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
        fetch(`${API_BASE}/api/addresses/${storedUser.maTK}`)
            .then(res => res.json())
            .then(data => {
                setAddresses(data);
                if (data.length > 0) {
                    const defaultAddr = data.find(a => a.MacDinh) || data[0];
                    setSelectedAddress(defaultAddr);
                }
            })
            .catch(err => console.error(err));
    }

    // Dọn interval polling khi rời trang
    return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const getItemPrice = (item) => Number(item.price ?? item.DonGia ?? item.donGia ?? 0);
  const subTotal = cartItems.reduce((total, item) => total + (getItemPrice(item) * (Number(item.quantity) || 1)), 0);
  const shippingFee = shippingType === 'standard' ? 22000 : 0;
  const totalAmount = Math.max(0, subTotal + shippingFee - discount);

  // Bắt đầu polling kiểm tra trạng thái thanh toán mỗi 3 giây (dùng cho VietQR)
  const startPollingPaymentStatus = (maDH) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    pollingRef.current = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/orders/${maDH}/payment-status`);
            const data = await res.json();
            if (data.TrangThaiThanhToan === 'Đã thanh toán') {
                clearInterval(pollingRef.current);
                setShowVietQR(false);
                setSuccessType('payment');
                setShowSuccess(true);
                
                // Xóa giỏ hàng local và cập nhật header
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cartUpdated'));

                // Tự động chuyển trang sau khi hiện thông báo 2.2 giây
                setTimeout(() => {
                    if (!currentUser) navigate('/');
                    else navigate('/profile/don-hang');
                }, 2200);
            }
        } catch (err) {
            console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
        }
    }, 3000);
  };

  const handleConfirmClick = async () => {
    setErrorMessage('');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    // Validate cho giao hàng tiêu chuẩn
    if (shippingType === 'standard') {
        if (storedUser && !selectedAddress) {
            setErrorMessage("Vui lòng thêm và chọn địa chỉ giao hàng trước khi thanh toán!");
            return;
        }
        if (!storedUser && (!guestInfo.hoTen || !guestInfo.soDienThoai || !guestInfo.diaChi)) {
            setErrorMessage("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }
    }

    setIsProcessing(true);
    try {
        // Tạo payload linh hoạt dựa trên user hoặc guest
        const payload = storedUser ? {
            isGuest: false,
            maKH: storedUser.maTK || storedUser.MaTK,
            maDC: shippingType === 'store' ? null : selectedAddress?.MaDC,
            cartItems: cartItems,
            tongTien: totalAmount,
            trangThaiThanhToan: 'Chưa thanh toán'
        } : {
            isGuest: true,
            guestInfo: guestInfo,
            cartItems: cartItems,
            tongTien: totalAmount,
            trangThaiThanhToan: 'Chưa thanh toán'
        };

        // Bước 1: luôn tạo đơn hàng trước
        const orderRes = await fetch(`${API_BASE}/api/cart/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const orderData = await orderRes.json();

        if (!orderRes.ok) {
            setErrorMessage(orderData.message || "Có lỗi xảy ra khi tạo đơn hàng!");
            setIsProcessing(false);
            return;
        }

        // Bước 2a: MoMo
        if (paymentMethod === 'momo') {
            const momoRes = await fetch(`${API_BASE}/api/momo/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalAmount,
                    orderInfo: `Thanh toan don hang ${orderData.maDH}`,
                    maDH: orderData.maDH
                })
            });
            const momoData = await momoRes.json();

            if (momoRes.ok && momoData.payUrl) {
                sessionStorage.setItem('momoOrder', JSON.stringify({
                    orderId: momoData.orderId,
                    requestId: momoData.requestId
                }));
                // (Khách vãng lai thanh toán xong Momo thì redirect cần xử lý ở Backend/Trang Return)
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cartUpdated'));
                window.location.href = momoData.payUrl;
            } else {
                setErrorMessage(momoData.message || "Không khởi tạo được cổng thanh toán MoMo. Vui lòng chọn phương thức VietQR hoặc Tiền mặt.");
                setIsProcessing(false);
            }
            return;
        }

        // Bước 2b: VietQR
        if (paymentMethod === 'vietqr') {
            const qrRes = await fetch(`${API_BASE}/api/vietqr/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalAmount,
                    maDH: orderData.maDH
                })
            });
            const qrData = await qrRes.json();

            if (qrRes.ok && qrData.qrUrl) {
                setVietQrData({ ...qrData, maDH: orderData.maDH });
                setShowVietQR(true);
                startPollingPaymentStatus(orderData.maDH);
            } else {
                setErrorMessage(qrData.message || "Chưa khởi tạo được mã VietQR. Vui lòng kiểm tra lại thông tin nhận tiền.");
            }
            setIsProcessing(false);
            return;
        }

        // Các phương thức khác (Tiền mặt / COD)
        setSuccessType('order');
        setShowSuccess(true);

        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));

        setTimeout(() => {
            if (!storedUser) navigate('/');
            else navigate('/profile/don-hang');
        }, 2200);

    } catch (error) {
        setErrorMessage("Lỗi kết nối Server. Vui lòng thử lại sau giây lát.");
        setIsProcessing(false);
    }
  };

  // Người dùng bấm "Hủy bỏ" trên modal VietQR:
  // - Dừng polling kiểm tra thanh toán
  // - Gọi API hủy đơn hàng vừa tạo (đổi TrangThaiDonHang -> "Đã hủy")
  //   để tránh đơn hàng bị "treo" ở trạng thái Chờ xác nhận / Chưa thanh toán
  const handleCloseVietQR = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setShowVietQR(false);

    const maDH = vietQrData?.maDH;
    if (maDH) {
        try {
            await fetch(`${API_BASE}/api/orders/${maDH}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    TrangThaiDonHang: 'Đã hủy',
                    TrangThaiThanhToan: 'Chưa thanh toán'
                })
            });
        } catch (err) {
            console.error("Lỗi khi hủy đơn hàng chưa thanh toán:", err);
        }
    }

    setVietQrData(null);
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-wrapper" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Không có sản phẩm để thanh toán</h2>
        <Link to="/cart" style={{ color: '#2e7d32' }}>Quay lại giỏ hàng</Link>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper position-relative">
      <div className="checkout-container">
        <h2 className="checkout-title">THANH TOÁN</h2>

        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 mb-4 shadow-sm rounded-3" role="alert">
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <div className="flex-grow-1">
              <strong>Thông báo thanh toán:</strong> {errorMessage}
            </div>
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
          </div>
        )}

        <SectionBlock title={shippingType === 'store' ? 'ĐỊA CHỈ CỬA HÀNG' : 'ĐỊA CHỈ GIAO HÀNG'}>
          <div className="info-row d-flex justify-content-between align-items-center">
            {shippingType === 'store' ? (
                <div>
                    <span className="text-danger me-2">🏬</span>
                    <strong>{STORE_ADDRESS.HoTen} ({STORE_ADDRESS.SoDienThoai})</strong>
                    <span className="ms-2 text-muted">{STORE_ADDRESS.DiaChiChiTiet}</span>
                </div>
            ) : storedUser ? (
                selectedAddress ? (
                    <div>
                        <span className="text-danger me-2">📍</span>
                        <strong>{selectedAddress.HoTen} ({selectedAddress.SoDienThoai})</strong> 
                        <span className="ms-2 text-muted">{selectedAddress.DiaChiChiTiet}</span>
                        {selectedAddress.MacDinh ? <span className="badge border border-danger text-danger ms-2 bg-white">Mặc định</span> : ''}
                    </div>
                ) : (
                    <div className="text-danger fw-bold">Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ!</div>
                )
            ) : (
                // Form khách vãng lai
                <div className="guest-info-form w-100" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" placeholder="Họ và tên người nhận (*)" className="form-control"
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={guestInfo.hoTen} onChange={(e) => setGuestInfo({...guestInfo, hoTen: e.target.value})} 
                    />
                    <input type="text" placeholder="Số điện thoại (*)" className="form-control"
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={guestInfo.soDienThoai} onChange={(e) => setGuestInfo({...guestInfo, soDienThoai: e.target.value})} 
                    />
                    <input type="text" placeholder="Địa chỉ giao hàng chi tiết (*)" className="form-control"
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        value={guestInfo.diaChi} onChange={(e) => setGuestInfo({...guestInfo, diaChi: e.target.value})} 
                    />
                </div>
            )}
            
            {shippingType !== 'store' && storedUser && (
                <button onClick={() => setShowAddressModal(true)} className="btn btn-link text-primary text-decoration-none">Thay Đổi</button>
            )}
          </div>
        </SectionBlock>

        <SectionBlock title="PHƯƠNG THỨC VẬN CHUYỂN">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="checkoutShipping" value="standard" checked={shippingType === 'standard'} onChange={() => setShippingType('standard')} style={{ marginRight: '10px' }} />
              Giao hàng tiêu chuẩn: <strong style={{ marginLeft: '5px' }}>22.000 đ</strong>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="checkoutShipping" value="store" checked={shippingType === 'store'} onChange={() => setShippingType('store')} style={{ marginRight: '10px' }} />
              Nhận tại cửa hàng: <strong style={{ color: '#4caf50', marginLeft: '5px' }}>Miễn phí</strong>
            </label>
          </div>
        </SectionBlock>

        <SectionBlock title="PHƯƠNG THỨC THANH TOÁN">
          <div>
            <label className="radio-label">
              <input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <img src={getImageUrl("images.png")} alt="MoMo" className="pay-icon" /> Ví MoMo
            </label>
            <label className="radio-label">
              <input type="radio" name="payment" value="vietqr" checked={paymentMethod === 'vietqr'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span style={{
                  display: 'inline-block', background: '#00a651', color: '#fff', fontWeight: 'bold',
                  fontSize: '11px', padding: '3px 6px', borderRadius: '4px', marginRight: '6px'
              }}>VietQR</span>
              Chuyển khoản QR ngân hàng
            </label>
            <label className="radio-label">
              <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span className="pay-icon-emoji">💵</span> Thanh toán bằng tiền mặt khi nhận hàng
            </label>
          </div>
        </SectionBlock>

        <SectionBlock title="KIỂM TRA LẠI ĐƠN HÀNG">
          <table className="order-table">
            <tbody>
              {cartItems.map((item, index) => {
                const itemPrice = getItemPrice(item);
                const itemQty = Number(item.quantity) || 1;
                return (
                  <tr key={index}>
                    <td style={{ color: '#333' }}>{item.name || item.TenSP}</td>
                    <td className="td-center">{itemPrice.toLocaleString()} đ</td>
                    <td className="td-center">{itemQty}</td>
                    <td className="td-right">{(itemPrice * itemQty).toLocaleString()} đ</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionBlock>

        <div className="checkout-footer">
          <div><Link to="/cart" style={{ color: '#2e7d32', textDecoration: 'none', fontSize: '14px' }}>&larr; Quay lại giỏ hàng</Link></div>
          <div className="summary-box">
            <div className="summary-row"><span>Thành tiền</span><span>{subTotal.toLocaleString()} đ</span></div>
            <div className="summary-row"><span>Phí vận chuyển</span><span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()} đ`}</span></div>
            
            {discount > 0 && (
                <div className="summary-row" style={{ color: '#d32f2f' }}>
                    <span>Giảm giá Voucher {(appliedVoucher?.Code || promoCode) ? `(${appliedVoucher?.Code || promoCode})` : ''}</span>
                    <span>- {discount.toLocaleString()} đ</span>
                </div>
            )}

            <div className="summary-total"><span>Tổng Số Tiền</span><span className="price">{totalAmount.toLocaleString()} đ</span></div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={handleConfirmClick} className="btn-confirm" disabled={isProcessing}>
                {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddressModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', width: '500px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Địa Chỉ Của Tôi</h5>
                    <button onClick={() => setShowAddressModal(false)} className="btn-close"></button>
                </div>
                <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {addresses.length === 0 && <p className="text-center text-muted">Vui lòng vào mục Sổ địa chỉ trong Profile để thêm mới!</p>}
                    {addresses.map(addr => (
                        <div key={addr.MaDC} className="d-flex align-items-start mb-3 border-bottom pb-3">
                            <input 
                                type="radio" name="addressSelection" className="mt-1 me-3" 
                                checked={selectedAddress?.MaDC === addr.MaDC}
                                onChange={() => setSelectedAddress(addr)}
                            />
                            <div className="flex-grow-1">
                                <div>
                                    <span className="fw-bold me-2">{addr.HoTen}</span>
                                    <span className="text-muted small">{addr.SoDienThoai}</span>
                                </div>
                                <div className="text-muted small mt-1">{addr.DiaChiChiTiet}</div>
                                {addr.MacDinh ? <span className="badge border border-danger text-danger bg-white mt-2">Mặc định</span> : ''}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-top text-end bg-light">
                    <button onClick={() => setShowAddressModal(false)} className="btn btn-secondary me-2">Hủy</button>
                    <button onClick={() => setShowAddressModal(false)} className="btn btn-danger">Xác nhận</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL QR VIETQR */}
      {showVietQR && vietQrData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', width: '350px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                <h4 style={{ color: '#00a651', marginBottom: '15px' }}>Quét mã VietQR để thanh toán</h4>
                <img src={vietQrData.qrUrl} alt="VietQR" style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '8px', width: '250px' }} />
                <p style={{ fontSize: '13px', color: '#555' }}>Nội dung chuyển khoản (giữ nguyên):</p>
                <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>{vietQrData.content}</p>
                <p style={{ fontSize: '13px', color: '#888' }}>Hệ thống sẽ tự động xác nhận sau khi nhận được tiền...</p>
                <button onClick={handleCloseVietQR} className="btn btn-outline-secondary w-100 mt-2">
                    Hủy bỏ
                </button>
            </div>
        </div>
      )}

      {/* MODAL THÔNG BÁO THANH TOÁN THÀNH CÔNG (thay cho alert() mặc định) */}
      {showSuccess && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1001
        }}>
            <div style={{
                backgroundColor: '#fff', padding: '40px 30px', borderRadius: '16px',
                textAlign: 'center', width: '320px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                animation: 'popIn 0.35s ease-out'
            }}>
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%',
                    backgroundColor: '#00a651', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', animation: 'checkPop 0.4s ease-out 0.1s both'
                }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h4 style={{ color: '#00a651', marginBottom: '8px', fontWeight: 700 }}>
                    {successType === 'payment' ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
                </h4>
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                    Đang chuyển đến trang chủ...
                </p>
            </div>

            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.85); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes checkPop {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
            `}</style>
        </div>
      )}
    </div>
  );
};

export default Checkout;