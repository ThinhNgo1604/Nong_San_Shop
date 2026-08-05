import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';
import TreasureChestWidget from "../../components/TreasureChestWidget/TreasureChestWidget";
import { API_BASE, getImageUrl, handleImageError } from "../../utils/api";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shippingType, setShippingType] = useState('standard');
  const navigate = useNavigate();

  // STATE CHO MÃ GIẢM GIÁ
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  const storedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    let localCart = [];
    try {
      localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(localCart)) localCart = [];
    } catch (e) {
      localCart = [];
    }

    if (storedUser) {
      fetch(`${API_BASE}/api/cart/${storedUser.maTK || storedUser.MaTK}`)
        .then((res) => res.json())
        .then((data) => {
          let serverCart = Array.isArray(data) ? data.map(item => ({
            ...item,
            id: Number(item.id || item.maSP),
            maSP: Number(item.maSP || item.id),
            quantity: Number(item.quantity) || 1
          })) : [];

          // Gộp giỏ hàng Server và LocalStorage để không làm mất sản phẩm nào
          const mergedCartMap = new Map();

          // 1. Nạp sản phẩm từ Server
          serverCart.forEach(item => {
            const id = Number(item.id || item.maSP);
            if (id) mergedCartMap.set(id, item);
          });

          // 2. Gộp sản phẩm từ Local (giữ lại các sản phẩm local chưa có trên server hoặc cập nhật số lượng)
          let needsServerSync = false;
          localCart.forEach(localItem => {
            const id = Number(localItem.id || localItem.maSP);
            if (!id) return;
            if (mergedCartMap.has(id)) {
              const existing = mergedCartMap.get(id);
              const maxQty = Math.max(Number(existing.quantity) || 1, Number(localItem.quantity) || 1);
              mergedCartMap.set(id, { ...existing, quantity: maxQty });
            } else {
              mergedCartMap.set(id, localItem);
              needsServerSync = true;
            }
          });

          const mergedCart = Array.from(mergedCartMap.values());

          setCartItems(mergedCart);
          localStorage.setItem('cart', JSON.stringify(mergedCart));
          window.dispatchEvent(new Event('cartUpdated'));

          if (needsServerSync && mergedCart.length > 0) {
            fetch(`${API_BASE}/api/cart/merge`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                maKH: storedUser.maTK || storedUser.MaTK,
                localCart: mergedCart
              })
            }).catch(err => console.error("Lỗi đồng bộ giỏ hàng server:", err));
          }

          setIsLoading(false);
        })
        .catch((err) => { 
          console.error("Lỗi lấy giỏ hàng server:", err); 
          setCartItems(localCart);
          setIsLoading(false); 
        });
    } else {
      setCartItems(localCart);
      setIsLoading(false);
    }

    // Tải danh sách mã giảm giá đang hoạt động
    fetch(`${API_BASE}/api/vouchers/active`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableVouchers(data);
        }
      })
      .catch(err => console.log("Lỗi tải vouchers active:", err));
  }, []);

  // Giá an toàn cho từng sản phẩm
  const getItemPrice = (item) => Number(item.price ?? item.DonGia ?? item.donGia ?? 0);

  // TÍNH TỔNG TIỀN TẠM TÍNH (An toàn, tránh NaN)
  const subTotal = cartItems.reduce((acc, item) => acc + (getItemPrice(item) * (Number(item.quantity) || 1)), 0);

  // Cập nhật lại số tiền giảm khi subTotal thay đổi
  useEffect(() => {
    if (appliedVoucher) {
      const minOrder = Number(appliedVoucher.DieuKienApDung || appliedVoucher.GiaTriToiThieu || 0);
      if (subTotal < minOrder) {
        setAppliedVoucher(null);
        setDiscount(0);
        showToast(`Mã ${appliedVoucher.Code} đã bị hủy vì đơn hàng không còn đủ ${minOrder.toLocaleString()}đ`, 'error');
      } else {
        let discountValue = 0;
        const loaiGiam = String(appliedVoucher.LoaiGiam || '').toLowerCase();
        if (loaiGiam.includes('phần trăm') || loaiGiam.includes('phan tram') || loaiGiam.includes('%')) {
          discountValue = (subTotal * Number(appliedVoucher.GiaTriGiam || 0)) / 100;
          if (appliedVoucher.GiamToiDa && Number(appliedVoucher.GiamToiDa) > 0) {
            discountValue = Math.min(discountValue, Number(appliedVoucher.GiamToiDa));
          }
        } else {
          discountValue = Number(appliedVoucher.GiaTriGiam || 0);
        }
        discountValue = Math.min(discountValue, subTotal);
        setDiscount(discountValue);
      }
    }
  }, [subTotal]);

  // ĐÃ SỬA HÀM NÀY: Gọi API lưu số lượng mới xuống DB và luôn cập nhật localStorage
  const updateQuantity = async (id, delta) => {
    const numericId = Number(id);
    const item = cartItems.find(i => Number(i.id || i.maSP) === numericId);
    if (!item) return;

    const newQuantity = Math.max(1, Number(item.quantity) + delta);
    if (newQuantity === Number(item.quantity)) return;

    const updatedCart = cartItems.map(i => 
      Number(i.id || i.maSP) === numericId ? { ...i, quantity: newQuantity } : i
    );

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    if (storedUser) {
      try {
        await fetch(`${API_BASE}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maKH: storedUser.maTK || storedUser.MaTK,
            maSP: numericId,
            soLuong: delta
          })
        });
      } catch (error) {
        console.error("Lỗi cập nhật số lượng trên Server:", error);
      }
    }
  };

  const removeItem = async (id) => {
    const numericId = Number(id);
    const updatedCart = cartItems.filter(item => {
      const itemMaSP = Number(item.maSP !== undefined ? item.maSP : item.id);
      return itemMaSP !== numericId;
    });

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    if (storedUser) {
      try {
        await fetch(`${API_BASE}/api/cart/remove/${storedUser.maTK || storedUser.MaTK}/${numericId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error("Lỗi xóa sản phẩm trên server:", error);
      }
    }
  };

  const clearAllItems = async () => {
    setCartItems([]);
    setAppliedVoucher(null);
    setDiscount(0);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));

    if (storedUser) {
      try {
        await fetch(`${API_BASE}/api/cart/clear/${storedUser.maTK || storedUser.MaTK}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error("Lỗi xóa toàn bộ sản phẩm trên server:", error);
      }
    }
  };

  // XỬ LÝ ÁP DỤNG MÃ GIẢM GIÁ
  const handleApplyPromo = async (codeToApply) => {
    const targetCode = typeof codeToApply === 'string' ? codeToApply : promoCode;
    const cleanCode = targetCode.trim();

    if (!cleanCode) return showToast("Vui lòng nhập mã giảm giá!", "error");
    
    try {
        let allVouchers = [...availableVouchers];

        // Lấy danh sách voucher hoạt động mới nhất từ server
        const res = await fetch(`${API_BASE}/api/vouchers/active`);
        if (res.ok) {
          const freshVouchers = await res.json();
          if (Array.isArray(freshVouchers)) allVouchers = freshVouchers;
        }

        // Lấy thêm ví voucher của user nếu đã đăng nhập
        if (storedUser) {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const myRes = await fetch(`${API_BASE}/api/vouchers/my-vouchers`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (myRes.ok) {
                        const myV = await myRes.json();
                        if (Array.isArray(myV)) {
                            myV.forEach(mv => {
                                const mvCode = String(mv.Code || mv.code || '').toUpperCase();
                                if (mvCode && !allVouchers.some(a => String(a.Code || a.code || '').toUpperCase() === mvCode)) {
                                    allVouchers.push({
                                        MaGG: mv.MaGG,
                                        Code: mv.Code || mv.code,
                                        LoaiGiam: mv.LoaiGiam,
                                        GiaTriGiam: mv.GiaTriGiam,
                                        NgayKT: mv.NgayKT,
                                        DieuKienApDung: mv.DieuKienApDung || 0,
                                        GiamToiDa: mv.GiamToiDa
                                    });
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.log("Error fetching my vouchers:", e);
                }
            }
        }
        
        // Tìm mã giảm giá trùng khớp (không phân biệt hoa thường)
        const voucher = allVouchers.find(v => String(v.Code || v.code || v.MaCode || '').trim().toUpperCase() === cleanCode.toUpperCase());
        
        if (!voucher) {
            return showToast("Mã giảm giá không hợp lệ hoặc đã hết hạn!", "error");
        }
        
        const minOrder = Number(voucher.DieuKienApDung || voucher.GiaTriToiThieu || 0);
        if (subTotal < minOrder) {
            return showToast(`Đơn hàng phải từ ${minOrder.toLocaleString()}đ để áp dụng mã này (Tạm tính: ${subTotal.toLocaleString()}đ)!`, "error");
        }
        
        let discountValue = 0;
        const loaiGiam = String(voucher.LoaiGiam || '').toLowerCase();
        if (loaiGiam.includes('phần trăm') || loaiGiam.includes('phan tram') || loaiGiam.includes('%')) {
            discountValue = (subTotal * Number(voucher.GiaTriGiam || 0)) / 100;
            if (voucher.GiamToiDa && Number(voucher.GiamToiDa) > 0) {
              discountValue = Math.min(discountValue, Number(voucher.GiamToiDa));
            }
        } else {
            discountValue = Number(voucher.GiaTriGiam || 0);
        }

        discountValue = Math.min(discountValue, subTotal);
        
        setDiscount(discountValue);
        setAppliedVoucher(voucher);
        setPromoCode(voucher.Code || cleanCode);
        showToast(`🎉 Áp dụng mã ${voucher.Code || cleanCode} thành công! Bạn được giảm ${Number(discountValue).toLocaleString()}đ.`);
        
    } catch (error) {
        console.error(error);
        showToast("Lỗi khi kiểm tra mã giảm giá.", "error");
    }
  };

  const handleRemovePromo = () => {
      setAppliedVoucher(null);
      setDiscount(0);
      setPromoCode('');
      showToast("Đã hủy áp dụng mã giảm giá");
  };

  const handleCheckoutClick = () => {
    navigate('/checkout', { 
      state: { 
        cartItems, 
        shippingType, 
        discount, 
        appliedVoucher, 
        promoCode 
      } 
    });
  };

  const shippingFee = shippingType === 'standard' ? 22000 : 0;
  // Tính tổng tiền cuối cùng (không cho phép âm)
  const totalAmount = Math.max(0, subTotal + shippingFee - discount);

  if (isLoading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#4caf50' }}>Đang tải...</h2>;

  return (
    <div className="cart-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px dashed #a5d6a7', paddingBottom: '15px' }}>
        <h2 className="cart-header" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Giỏ hàng của bạn 🌱</h2>
        {cartItems.length > 0 && (
          <button 
            onClick={clearAllItems}
            style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
          >
            🗑️ Xóa tất cả
          </button>
        )}
      </div>
      
      {cartItems.length === 0 ? (
        <div className="empty-cart-container">
            <div className="empty-cart-icon">🛒</div>
            <h3 className="empty-cart-title">Giỏ hàng của bạn đang trống</h3>
            <p className="empty-cart-text">Hãy quay lại trang sản phẩm để chọn cho mình những món nông sản tươi ngon nhất nhé!</p>
            <Link to="/products" className="btn-continue-shopping">
                &larr; Tiếp tục mua sắm
            </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-left">
            <table className="cart-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Tạm tính</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, idx) => {
                  const itemId = item.maSP !== undefined ? item.maSP : (item.id !== undefined ? item.id : idx);
                  return (
                    <tr key={itemId} className="cart-row">
                      <td className="cart-col-action">
                        <button onClick={() => removeItem(itemId)} className="btn-remove">🗑️</button>
                      </td>
                      <td className="cart-col-product">
                        <div className="product-icon" style={{ padding: 0, width: '60px', height: '60px', flexShrink: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                          <img 
                            src={getImageUrl(item.HinhAnh || item.image || item.hinh_anh)} 
                            alt={item.name || item.TenSP} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={handleImageError}
                          />
                        </div>
                        <h4 className="product-name">{item.name || item.TenSP}</h4>
                      </td>
                      <td className="cart-col-price">{Number(item.price || item.DonGia || 0).toLocaleString()} đ</td>
                      <td className="cart-col-qty">
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => updateQuantity(itemId, -1)}>-</button>
                          <div className="qty-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.quantity}
                          </div>
                          <button className="qty-btn" onClick={() => updateQuantity(itemId, 1)}>+</button>
                        </div>
                      </td>
                      <td className="cart-col-total">{(Number(item.price || item.DonGia || 0) * item.quantity).toLocaleString()} đ</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* KHU VỰC NHẬP MÃ GIẢM GIÁ */}
            <div className="promo-section">
                <h3 className="promo-title">Mã giảm giá</h3>
                <div className="promo-input-group">
                    <input 
                        type="text" 
                        className="promo-input" 
                        placeholder="Nhập mã giảm giá (VD: NONGSAN10, FREESHIP)" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={appliedVoucher !== null}
                    />
                    {appliedVoucher ? (
                        <button className="btn-apply-promo" style={{backgroundColor: '#d32f2f'}} onClick={handleRemovePromo}>
                            Hủy mã
                        </button>
                    ) : (
                        <button className="btn-apply-promo" onClick={() => handleApplyPromo()}>
                            Áp dụng
                        </button>
                    )}
                </div>

                {/* DANG SÁCH MÃ GIẢM GIÁ KHẢ DỤNG CHO PHÉP BẤM NHANH */}
                {availableVouchers.length > 0 && !appliedVoucher && (
                  <div className="mt-3">
                    <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginBottom: '8px' }}>
                      🎟️ Mã giảm giá có sẵn (bấm để dùng):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableVouchers.map(v => {
                        const minReq = Number(v.DieuKienApDung || v.GiaTriToiThieu || 0);
                        const isEligible = subTotal >= minReq;
                        const vCode = v.Code || v.code || v.MaCode;
                        return (
                          <button
                            key={v.MaGG || vCode}
                            type="button"
                            onClick={() => {
                              setPromoCode(vCode);
                              handleApplyPromo(vCode);
                            }}
                            style={{
                              backgroundColor: isEligible ? '#e8f5e9' : '#f5f5f5',
                              color: isEligible ? '#1b5e20' : '#757575',
                              border: isEligible ? '1px solid #81c784' : '1px solid #e0e0e0',
                              borderRadius: '20px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                            title={`Đơn tối thiểu ${minReq.toLocaleString()}đ`}
                          >
                            <span>🏷️ {vCode}</span>
                            <span style={{ fontSize: '11px', opacity: 0.85 }}>
                              ({v.LoaiGiam === 'Phần trăm' ? `Giảm ${v.GiaTriGiam}%` : `Giảm ${Number(v.GiaTriGiam).toLocaleString()}đ`})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

          </div>

          <div className="cart-right">
            <div className="summary-box">
              <h3 className="summary-title">Tổng cộng</h3>
              
              <div className="summary-row">
                <span>Tạm tính</span>
                <span style={{ fontWeight: 'bold' }}>{subTotal.toLocaleString()} đ</span>
              </div>
              
              {/* HIỂN THỊ DÒNG TRỪ TIỀN GIẢM GIÁ */}
              {discount > 0 && (
                <div className="summary-row" style={{ color: '#d32f2f' }}>
                    <span>Giảm giá Voucher ({appliedVoucher?.Code})</span>
                    <span style={{ fontWeight: 'bold' }}>- {discount.toLocaleString()} đ</span>
                </div>
              )}

              <div className="shipping-options">
                 <label className="shipping-label">
                   <input type="radio" checked={shippingType === 'standard'} onChange={() => setShippingType('standard')} /> Giao tiêu chuẩn (22.000đ)
                 </label>
                 <label className="shipping-label">
                   <input type="radio" checked={shippingType === 'store'} onChange={() => setShippingType('store')} /> Nhận tại cửa hàng (Miễn phí)
                 </label>
              </div>

              <div className="summary-total">
                <span>Tổng</span>
                <span className="summary-total-val">{totalAmount.toLocaleString()} đ</span>
              </div>
              <button className="btn-checkout" onClick={handleCheckoutClick}>TIẾN HÀNH THANH TOÁN</button>
            </div>
          </div>
        </div>
      )}
      <TreasureChestWidget />

      {/* TOAST THÔNG BÁO */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            minWidth: '260px',
            maxWidth: '360px',
            backgroundColor: toast.type === 'error' ? '#991b1b' : '#166534',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'error' ? '❌' : '✅'}
          </span>
          <div style={{ flex: 1, lineHeight: '1.4' }}>{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;