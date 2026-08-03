import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';
import TreasureChestWidget from "../../components/TreasureChestWidget/TreasureChestWidget";
import { API_BASE, getImageUrl } from "../../utils/api";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shippingType, setShippingType] = useState('standard');
  const navigate = useNavigate();

  // STATE CHO MÃ GIẢM GIÁ
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (storedUser) {
      fetch(`${API_BASE}/api/cart/${storedUser.maTK}`)
        .then((res) => res.json())
        .then((data) => {
          const formattedData = data.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 1
          }));
          setCartItems(formattedData);
          setIsLoading(false);
        })
        .catch((err) => { console.error(err); setIsLoading(false); });
    } else {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(localCart);
      setIsLoading(false);
    }
  }, []);

  // ĐÃ SỬA HÀM NÀY: Gọi API lưu số lượng mới xuống DB
  const updateQuantity = async (id, delta) => {
    // 1. Tìm sản phẩm hiện tại để kiểm tra
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    // 2. Tính số lượng mới (không cho phép giảm xuống dưới 1)
    const newQuantity = Math.max(1, Number(item.quantity) + delta);
    
    // Nếu đang là 1 mà bấm dấu trừ thì bỏ qua không làm gì cả
    if (newQuantity === item.quantity) return;

    // 3. Cập nhật UI ngay lập tức cho mượt
    setCartItems(prev => {
      const updatedCart = prev.map(i => 
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
      if (!storedUser) localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });

    // 4. Gọi API cập nhật xuống Database
    if (storedUser) {
      try {
        await fetch(`${API_BASE}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maKH: storedUser.maTK,
            maSP: id,
            soLuong: delta // Truyền thẳng +1 hoặc -1 để DB tự động cộng/trừ tương ứng
          })
        });
      } catch (error) {
        console.error("Lỗi cập nhật số lượng trên Server:", error);
      }
    }
  };

  const removeItem = async (id) => {
    if(window.confirm("Bạn có chắc muốn bỏ sản phẩm này?")) {
      setCartItems(prev => {
        const updatedCart = prev.filter(item => item.id !== id);
        if (!storedUser) localStorage.setItem('cart', JSON.stringify(updatedCart));
        return updatedCart;
      });

      if (storedUser) {
        try {
          await fetch(`${API_BASE}/api/cart/remove/${storedUser.maTK}/${id}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error("Lỗi xóa sản phẩm trên server:", error);
        }
      }
    }
  };

  // TÍNH TỔNG TIỀN TẠM TÍNH
  const subTotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);

  // XỬ LÝ ÁP DỤNG MÃ GIẢM GIÁ
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return alert("Vui lòng nhập mã giảm giá!");
    
    try {
        const res = await fetch(`${API_BASE}/api/vouchers/active`);
        const activeVouchers = await res.json();
        
        // Tìm mã giảm giá trùng khớp (không phân biệt hoa thường)
        const voucher = activeVouchers.find(v => v.Code.toUpperCase() === promoCode.trim().toUpperCase());
        
        if (!voucher) {
            return alert("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
        }
        
        if (subTotal < voucher.DieuKienApDung) {
            return alert(`Đơn hàng phải từ ${Number(voucher.DieuKienApDung).toLocaleString()}đ để áp dụng mã này!`);
        }
        
        let discountValue = 0;
        if (voucher.LoaiGiam === 'Phần trăm') {
            discountValue = (subTotal * voucher.GiaTriGiam) / 100;
        } else {
            discountValue = voucher.GiaTriGiam;
        }
        
        setDiscount(discountValue);
        setAppliedVoucher(voucher);
        alert(`🎉 Áp dụng mã ${voucher.Code} thành công! Bạn được giảm ${Number(discountValue).toLocaleString()}đ.`);
        
    } catch (error) {
        console.error(error);
        alert("Lỗi khi kiểm tra mã giảm giá.");
    }
  };

  const handleRemovePromo = () => {
      setAppliedVoucher(null);
      setDiscount(0);
      setPromoCode('');
  };

  const handleCheckoutClick = () => {
    navigate('/checkout', { state: { cartItems, shippingType } });
  };

  const shippingFee = shippingType === 'standard' ? 22000 : 0;
  // Tính tổng tiền cuối cùng (không cho phép âm)
  const totalAmount = Math.max(0, subTotal + shippingFee - discount);

  if (isLoading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#4caf50' }}>Đang tải...</h2>;

  return (
    <div className="cart-page">
      <h2 className="cart-header">Giỏ hàng của bạn 🌱</h2>
      
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
                {cartItems.map((item) => (
                  <tr key={item.id} className="cart-row">
                    <td className="cart-col-action">
                      <button onClick={() => removeItem(item.id)} className="btn-remove">🗑️</button>
                    </td>
                    <td className="cart-col-product">
                      <div className="product-icon" style={{ padding: 0, width: '60px', height: '60px', flexShrink: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                        <img 
                          src={getImageUrl(item.HinhAnh || item.image || item.hinh_anh)} 
                          alt={item.name} 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Img' }}
                        />
                      </div>
                      <h4 className="product-name">{item.name}</h4>
                    </td>
                    <td className="cart-col-price">{Number(item.price).toLocaleString()} đ</td>
                    <td className="cart-col-qty">
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <div className="qty-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.quantity}
                        </div>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                      </div>
                    </td>
                    <td className="cart-col-total">{(Number(item.price) * item.quantity).toLocaleString()} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* KHU VỰC NHẬP MÃ GIẢM GIÁ */}
            <div className="promo-section">
                <h3 className="promo-title">Mã giảm giá</h3>
                <div className="promo-input-group">
                    <input 
                        type="text" 
                        className="promo-input" 
                        placeholder="Nhập mã giảm giá (VD: SALE10)" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={appliedVoucher !== null}
                    />
                    {appliedVoucher ? (
                        <button className="btn-apply-promo" style={{backgroundColor: '#d32f2f'}} onClick={handleRemovePromo}>
                            Hủy mã
                        </button>
                    ) : (
                        <button className="btn-apply-promo" onClick={handleApplyPromo}>
                            Áp dụng
                        </button>
                    )}
                </div>
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
                    <span>Giảm giá Voucher</span>
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
    </div>
  );
};

export default Cart;