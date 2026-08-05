import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import TreasureChestWidget from '../../components/TreasureChestWidget/TreasureChestWidget';
import { API_BASE, getImageUrl, handleImageError } from '../../utils/api';

const ProductDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFavorite, setIsFavorite] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  const [toast, setToast] = useState({ show: false, visible: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    setToast({ show: true, visible: true, message, type });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
      fadeTimeoutRef.current = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 500); // Biến mất hoàn toàn sau 0.5s mờ dần
    }, 1500); // Giữ hiển thị 1.5s
  };

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const favKey = storedUser ? `favorites_${storedUser.maTK}` : 'favorites';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/products/${id}`).then(res => res.json()),
      fetch(`${API_BASE}/api/products/all`).then(res => res.json()),
      fetch(`${API_BASE}/api/reviews/product/${id}`).then(res => res.json())
    ])
    .then(([productData, allProductsData, reviewsData]) => {
      setProduct(productData);
      const allList = Array.isArray(allProductsData) ? allProductsData : [];
      const filtered = allList.filter(item => item && item.MaSP !== parseInt(id)).slice(0, 4);
      setRelatedProducts(filtered);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setIsLoading(false);
      setQuantity(1); 

      const favIds = JSON.parse(localStorage.getItem(favKey) || '[]');
      setIsFavorite(productData && productData.MaSP ? favIds.includes(productData.MaSP) : false);
    })
    .catch(err => { console.error(err); setIsLoading(false); });

    if (storedUser) {
        const userMaTK = storedUser.maTK || storedUser.MaTK;
        fetch(`${API_BASE}/api/reviews/check/${userMaTK}/${id}`)
            .then(res => res.json())
            .then(data => setCanReview(data.canReview))
            .catch(err => console.error(err));
    }
  }, [id, favKey]);

  const increaseQty = () => setQuantity(prev => prev + 1);
  const decreaseQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  
  const handleAddToCart = async () => {
    if (!product || !product.MaSP) return;

    let localCart = [];
    try {
      localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
      localCart = [];
    }

    const productId = Number(product.MaSP);
    const existingIndex = localCart.findIndex(item => Number(item.id || item.maSP) === productId);

    if (existingIndex >= 0) {
      localCart[existingIndex].quantity = (Number(localCart[existingIndex].quantity) || 0) + quantity;
      localCart[existingIndex].price = product.DonGia;
      localCart[existingIndex].DonGia = product.DonGia;
      localCart[existingIndex].name = product.TenSP;
      localCart[existingIndex].TenSP = product.TenSP;
      localCart[existingIndex].HinhAnh = product.HinhAnh || product.image || product.hinh_anh;
    } else {
      localCart.push({
        id: productId,
        maSP: productId,
        name: product.TenSP,
        TenSP: product.TenSP,
        price: product.DonGia,
        DonGia: product.DonGia,
        quantity: quantity,
        HinhAnh: product.HinhAnh || product.image || product.hinh_anh
      });
    }

    localStorage.setItem('cart', JSON.stringify(localCart));
    window.dispatchEvent(new Event('cartUpdated'));

    showToast(`Đã thêm ${quantity} ${product.TenSP} vào giỏ hàng thành công!`);

    if (storedUser) {
      try {
        await fetch(`${API_BASE}/api/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maKH: storedUser.maTK || storedUser.MaTK, 
            maSP: product.MaSP,
            soLuong: quantity
          })
        });
      } catch (error) {
        console.error("Lỗi đồng bộ giỏ hàng lên server:", error);
      }
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const toggleFavorite = () => {
    let favIds = JSON.parse(localStorage.getItem(favKey) || '[]');
    if (isFavorite) {
      favIds = favIds.filter(favId => favId !== product.MaSP);
    } else {
      favIds.push(product.MaSP);
    }
    localStorage.setItem(favKey, JSON.stringify(favIds));
    setIsFavorite(!isFavorite);
  };

  const submitReview = async () => {
    if (!storedUser) return showToast("Vui lòng đăng nhập để đánh giá!", "error");
    if (!reviewText.trim()) return showToast("Vui lòng nhập nội dung đánh giá!", "error");
    try {
        const userMaTK = storedUser.maTK || storedUser.MaTK;
        const res = await fetch(`${API_BASE}/api/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maTK: userMaTK, maSP: id, soSao: rating, noiDung: reviewText })
        });
        if (res.ok) {
            showToast("Cảm ơn bạn đã đánh giá sản phẩm!");
            setReviewText('');
            setRating(5);
            const newReviews = await fetch(`${API_BASE}/api/reviews/product/${id}`).then(r => r.json());
            setReviews(newReviews);
        } else {
            const err = await res.json();
            showToast(err.message || "Không thể gửi đánh giá", "error");
        }
    } catch (error) {
        showToast("Lỗi kết nối Server.", "error");
    }
  };

  const SectionHeader = ({ title }) => <div className="section-title">{title}</div>;

  if (isLoading) return <h3 style={{ textAlign: 'center', marginTop: '50px', color: '#4caf50' }}>Đang tải thông tin...</h3>;
  if (!product) return <h3 style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Sản phẩm không tồn tại</h3>;

  const avgStar = reviews.length > 0 ? (reviews.reduce((a, b) => a + b.SoSao, 0) / reviews.length).toFixed(1) : 5;

  return (
    <div className="pd-wrapper">
      <nav className="pd-breadcrumb">
        <Link to="/" style={{ textDecoration: 'none', color: '#2e7d32', fontSize: '20px', fontWeight: 'bold' }}>🌱 Nông Sản Shop</Link>
        <span style={{ margin: '0 10px', color: '#888' }}>/</span>
        <span style={{ color: '#555' }}>{product.TenSP}</span>
      </nav>

      <div className="pd-container">
        <div className="pd-card">
          <div className="pd-image" style={{ padding: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <img src={getImageUrl(product.HinhAnh || product.image || product.hinh_anh)} alt={product.TenSP} style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }} onError={handleImageError} />
          </div>

          <div className="pd-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h1 className="pd-title" style={{ margin: 0 }}>{product.TenSP}</h1>
                <span 
                    onClick={toggleFavorite}
                    style={{ 
                        fontSize: '32px', 
                        color: '#e91e63', 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        transition: 'transform 0.2s'
                    }}
                    onMouseDown={(e) => e.target.style.transform = 'scale(0.8)'}
                    onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                    title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                    {isFavorite ? '♥' : '♡'}
                </span>
            </div>
            
            <div className="pd-rating">
                <span style={{color: '#ffc107'}}>{"★".repeat(Math.round(avgStar)) + "☆".repeat(5 - Math.round(avgStar))}</span> 
                ({reviews.length} đánh giá) | 
                {product.SoLuongTon > 0 ? (
                    <span style={{ color: '#28a745', marginLeft: '5px' }}>Đang còn hàng</span>
                ) : (
                    <span style={{ color: '#dc3545', marginLeft: '5px', fontWeight: 'bold' }}>Hết hàng</span>
                )}
            </div>
            
            <div className="pd-price-box" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px' }}>
              <span className="pd-price">{Number(product.DonGia).toLocaleString()} đ</span>
              {product.TuDongGiamGia && product.GiaGoc > product.DonGia && (
                  <>
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '18px' }}>
                          {Number(product.GiaGoc).toLocaleString()} đ
                      </span>
                      <span style={{ backgroundColor: '#e53935', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                          -{Math.round(((product.GiaGoc - product.DonGia) / product.GiaGoc) * 100)}%
                      </span>
                      <div style={{ width: '100%', color: '#e53935', fontStyle: 'italic', fontSize: '14px', marginTop: '5px' }}>
                          ⏳ Giá đang giảm!
                      </div>
                  </>
              )}
          </div>

            <div className="pd-variant"><span>Khu vực:</span><button className="btn-outline">Hồ Chí Minh</button></div>
            <div className="pd-variant"><span>Trọng lượng:</span><button className="btn-active">1 kg</button></div>

            <div className="pd-actions">
              <div className="qty-box">
                <button onClick={decreaseQty} className="qty-btn" disabled={product.SoLuongTon === 0}>-</button>
                <div className="qty-input">{quantity}</div>
                <button onClick={increaseQty} className="qty-btn" disabled={product.SoLuongTon === 0}>+</button>
              </div>
              
              <button 
                  onClick={handleAddToCart} 
                  className="btn-add-cart" 
                  disabled={product.SoLuongTon === 0}
                  style={product.SoLuongTon === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                  🛒 Thêm vào giỏ
              </button>
              <button 
                  onClick={handleBuyNow} 
                  className="btn-buy-now" 
                  disabled={product.SoLuongTon === 0}
                  style={product.SoLuongTon === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                  Mua ngay
              </button>
            </div>
          </div>
        </div>

        <div className="pd-columns">
          <div className="col-main">
            <SectionHeader title="Mô tả sản phẩm" />
            <div style={{ padding: '20px', color: '#444', lineHeight: '1.6' }}><p>{product.MoTa || "Sản phẩm nông sản sạch, đảm bảo 100% tươi ngon, an toàn cho sức khỏe."}</p></div>
          </div>
          <div className="col-side">
            <div className="side-box">
              {/* Đã sửa từ "Thông margin phẩm" thành "Thông tin sản phẩm" */}
              <SectionHeader title="Thông tin sản phẩm" />
              <div style={{ padding: '15px' }}>
                <div className="side-row"><span style={{ width: '40%', fontWeight: 'bold' }}>Trọng lượng:</span><span>1 kg</span></div>
                <div className="side-row"><span style={{ width: '40%', fontWeight: 'bold' }}>Khu vực:</span><span>Hà Nội, Hồ Chí Minh</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', marginTop: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <SectionHeader title="Đánh giá sản phẩm" />
            <div className="review-section" style={{ padding: '10px' }}>
                
                <div className="review-list" style={{ marginBottom: '30px' }}>
                    {reviews.length === 0 ? (
                        <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Chưa có đánh giá nào.</div>
                    ) : (
                        reviews.map(rv => (
                            <div key={rv.MaDG} style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{rv.HoTen} <span style={{ color: '#ffc107', marginLeft: '10px' }}>{"★".repeat(rv.SoSao)}{"☆".repeat(5-rv.SoSao)}</span></div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>{new Date(rv.NgayDG).toLocaleDateString('vi-VN')}</div>
                                <div style={{ color: '#333' }}>{rv.NoiDung}</div>
                            </div>
                        ))
                    )}
                </div>

                {canReview ? (
                    <div className="review-form" style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <h5 style={{ color: '#2e7d32', marginBottom: '15px', fontWeight: 'bold' }}>Viết đánh giá của bạn</h5>
                        <div className="d-flex align-items-center mb-3">
                            <span style={{ marginRight: '15px', fontWeight: '500' }}>Chọn số sao: </span>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer', fontSize: '24px', color: star <= rating ? '#ffc107' : '#e4e5e9', marginRight: '5px' }}>★</span>
                            ))}
                        </div>
                        <textarea className="form-control mb-3" rows="4" placeholder="Nhập nội dung đánh giá..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}></textarea>
                        <button onClick={submitReview} style={{ backgroundColor: '#2e7d32', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Gửi đánh giá</button>
                    </div>
                ) : (
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center', color: '#d32f2f', fontStyle: 'italic' }}>
                        * Bạn cần mua và nhận sản phẩm này thành công để có thể viết đánh giá.
                    </div>
                )}
            </div>
        </div>

        <div className="related-box" style={{ marginTop: '30px' }}>
          <SectionHeader title="Các sản phẩm khác" />
          <div className="related-list">
              {relatedProducts.map((item) => (
                <Link to={`/product/${item.MaSP}`} key={item.MaSP} className="related-item" style={{ position: 'relative', textDecoration: 'none', display: 'block', color: 'inherit' }}>
                    {item.TuDongGiamGia && item.GiaGoc > item.DonGia && (
                        <div style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#e53935', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', zIndex: 2 }}>
                            -{Math.round(((item.GiaGoc - item.DonGia) / item.GiaGoc) * 100)}%
                        </div>
                    )}
                    <div className="related-icon" style={{ padding: 0, overflow: 'hidden', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={getImageUrl(item.HinhAnh || item.image || item.hinh_anh)} alt={item.TenSP} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={handleImageError} />
                    </div>
                    <h4 style={{ color: '#2e7d32', margin: '10px 0 5px 0' }}>{item.TenSP}</h4>
                    
                    <div style={{ minHeight: '40px' }}>
                        <p style={{ color: '#d32f2f', fontWeight: 'bold', margin: '0' }}>{Number(item.DonGia).toLocaleString()} đ</p>
                        {item.TuDongGiamGia && item.GiaGoc > item.DonGia && (
                            <p style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px', margin: '2px 0 0 0' }}>{Number(item.GiaGoc).toLocaleString()} đ</p>
                        )}
                    </div>
                    
                    <div className="btn-view-detail" style={{ marginTop: '10px' }}>Xem chi tiết</div>
                </Link>
            ))}
          </div>
        </div>
      </div>
      <TreasureChestWidget />

      {/* Thông báo alert nhỏ ở góc phải bên dưới */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '25px',
            right: '25px',
            backgroundColor: toast.type === 'error' ? '#d32f2f' : '#2e7d32',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            opacity: toast.visible ? 1 : 0,
            transform: toast.visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease'
          }}
        >
          <span>{toast.type === 'error' ? '❌' : '🛒'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;