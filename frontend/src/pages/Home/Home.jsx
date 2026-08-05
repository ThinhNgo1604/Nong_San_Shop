import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; 
import TreasureChestWidget from "../../components/TreasureChestWidget/TreasureChestWidget";
import { getAllProducts } from "../../services/Client/productApi";
import { getImageUrl, handleImageError } from "../../utils/api";
import PromotionSection from "./PromotionSection";


const categories = [
  { name: 'Rau Củ Quả', icon: '🥦' },
  { name: 'Trái Cây Tươi', icon: '🍇' },
  { name: 'Nông Sản Khô', icon: '🌾' },
  { name: 'Thực Phẩm Chế Biến', icon: '🥫' },
  { name: 'Đặc Sản Vùng Miền', icon: '🎋' },
  { name: 'Hạt Giống', icon: '🌱' },
  { name: 'Sản Phẩm Hữu Cơ', icon: '🍃' },
  { name: 'Combo Tiết Kiệm', icon: '🎁' },
];

const fallbackSlides = [
  {
    key: 'fallback-1',
    emoji: '🍎',
    title: 'Mang thiên nhiên vào bữa ăn của bạn',
    subtitle: 'Rau củ quả hữu cơ, trái cây tươi 100% từ nông trại đạt chuẩn.',
    cta: 'Khám phá ngay',
    to: '/products',
    bg: 'linear-gradient(135deg, #6DBE8A 0%, #2D6A4F 100%)'
  },
  {
    key: 'fallback-2',
    emoji: '🥕',
    title: 'Giao hàng trong ngày, tươi từ vườn',
    subtitle: 'Đặt trước 10h sáng, nhận hàng ngay trong chiều nay.',
    cta: 'Đặt hàng ngay',
    to: '/products',
    bg: 'linear-gradient(135deg, #40916C 0%, #1B4332 100%)'
  },
  {
    key: 'fallback-3',
    emoji: '🥬',
    title: 'Cam kết 100% không hóa chất',
    subtitle: 'Mỗi sản phẩm đều có nguồn gốc rõ ràng, kiểm định an toàn.',
    cta: 'Tìm hiểu thêm',
    to: '/products',
    bg: 'linear-gradient(135deg, #2D6A4F 0%, #081C15 100%)'
  }
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getAllProducts();
        setProducts(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const productSlides = products.slice(0, 3).map(p => ({
    key: `product-${p.MaSP}`,
    image: getImageUrl(p.HinhAnh || p.image || p.hinh_anh),
    title: p.TenSP.normalize("NFC"),
    subtitle: `Chỉ từ ${Number(p.DonGia).toLocaleString()} đ — tươi mới mỗi ngày`,
    cta: 'Xem chi tiết',
    to: `/product/${p.MaSP}`
  }));

  const slides = productSlides.length >= 2 ? productSlides : fallbackSlides;

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const goToSlide = (index) => {
    setActiveSlide(index);
    clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % slides.length);
      }, 5000);
    }
  };

  const goPrev = () => goToSlide((activeSlide - 1 + slides.length) % slides.length);
  const goNext = () => goToSlide((activeSlide + 1) % slides.length);

  return (
    <div className="home-container">

      {/* KHU VỰC BANNER: SIDEBAR DANH MỤC + CAROUSEL */}
      <div className="hc-layout">

        <div className="hc-sidebar hc-sidebar-pro">
          <div className="hc-sidebar-heading">
            <span className="hc-sidebar-heading-icon">☰</span>
            Danh mục sản phẩm
          </div>
          {categories.map((cat) => (
            <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`} className="hc-sidebar-item hc-sidebar-item-pro">
              <span className="hc-sidebar-item-icon">{cat.icon}</span>
              <span className="hc-sidebar-item-text">{cat.name}</span>
              <span className="hc-sidebar-item-arrow">›</span>
            </Link>
          ))}
        </div>

        <header className="hc-carousel">
          <div
            className="hc-track"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slides.map((slide) => (
              <div
                key={slide.key}
                className="hc-slide"
                style={!slide.image ? { background: slide.bg } : undefined}
              >
                {slide.image && (
                  <>
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="hc-slide-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="hc-slide-overlay" />
                  </>
                )}
                {!slide.image && (
                  <span className="hc-slide-emoji" aria-hidden="true">{slide.emoji}</span>
                )}
                <div className="hc-slide-content">
                  <span className="hc-eyebrow">🌿 Nông Sản Shop</span>
                  <h2 className="hc-title">{slide.title}</h2>
                  <p className="hc-subtitle">{slide.subtitle}</p>
                  <Link to={slide.to} className="hc-cta">{slide.cta} →</Link>
                </div>
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <>
              <button className="hc-arrow hc-arrow-left" onClick={goPrev} aria-label="Slide trước">‹</button>
              <button className="hc-arrow hc-arrow-right" onClick={goNext} aria-label="Slide sau">›</button>

              <div className="hc-dots">
                {slides.map((slide, index) => (
                  <button
                    key={slide.key}
                    className={`hc-dot ${index === activeSlide ? 'hc-dot-active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Đến slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="hc-badge">
            <span>Tươi mỗi ngày</span>
          </div>
        </header>

      </div>

      {/* THANH SLOGAN */}
      <div className="hc-slogan-strip">
        NÔNG SẢN SHOP – MANG THỰC PHẨM SẠCH ĐẾN MỌI GIA ĐÌNH VIỆT
      </div>

      {/* CHƯƠNG TRÌNH KHUYẾN MÃI */}
      <PromotionSection />

      {/* DANH SÁCH SẢN PHẨM */}
      <section className="products-section">
        <h3 className="section-title">
          Sản Phẩm Tươi Mới Hôm Nay 🌻
        </h3>

        {isLoading ? (
          <h4 className="loading-text">⏳ Đang tải nông sản từ vườn...</h4>
        ) : (
          <div className="product-grid">
            {products.map(product => (
                <div key={product.MaSP} className="product-card" style={{ position: 'relative' }}>
                    
                    {/* Nhãn phần trăm giảm giá */}
                    {product.TuDongGiamGia && product.GiaGoc > product.DonGia && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#e53935', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            -{Math.round(((product.GiaGoc - product.DonGia) / product.GiaGoc) * 100)}%
                        </div>
                    )}

                    <div className="product-icon" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }}>
                        <img 
                            src={getImageUrl(product.HinhAnh || product.image || product.hinh_anh)} 
                            alt={product.TenSP} 
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                            onError={handleImageError}
                        />
                    </div>

                    <div style={{ padding: '12px' }}>
                        <h4 className="product-name" style={{ fontSize: '16px', margin: '0 0 8px 0', height: '40px', overflow: 'hidden' }}>
                            {product.TenSP}
                        </h4>

                        {/* Khu vực giá cả */}
                        <div className="price-section" style={{ minHeight: '45px' }}>
                            <p className="product-price" style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>
                                {Number(product.DonGia).toLocaleString()} đ
                            </p>
                            {product.TuDongGiamGia && product.GiaGoc > product.DonGia && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <p style={{ textDecoration: 'line-through', color: '#9e9e9e', fontSize: '13px', margin: 0 }}>
                                        {Number(product.GiaGoc).toLocaleString()} đ
                                    </p>
                                    <span style={{ fontSize: '11px', color: '#e53935', fontStyle: 'italic' }}>⏳ Đang giảm!</span>
                                </div>
                            )}
                        </div>

                        <Link
                            to={`/product/${product.MaSP}`}
                            className="btn-details"
                            style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: '6px', backgroundColor: '#f5f5f5', color: '#333', textDecoration: 'none', fontSize: '14px', marginTop: '10px' }}
                        >
                            🔍 Xem chi tiết
                        </Link>
                    </div>
                </div>
            ))}
          </div>
        )}
      </section>
      <TreasureChestWidget />

      <style>{`
        .hc-sidebar-pro {
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
            border: 1px solid #eef1ee;
        }

        .hc-sidebar-heading {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 16px;
            background: linear-gradient(135deg, #2e7d32, #1b5e20);
            color: #fff;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.2px;
        }

        .hc-sidebar-heading-icon {
            font-size: 15px;
        }

        .hc-sidebar-item-pro {
            display: flex !important;
            align-items: center;
            gap: 10px;
            padding: 11px 16px;
            font-size: 13.5px;
            color: #3a3a3a;
            text-decoration: none;
            border-bottom: 1px solid #f2f4f2;
            transition: background 0.15s ease, padding-left 0.15s ease, color 0.15s ease;
            position: relative;
        }

        .hc-sidebar-item-pro:last-child {
            border-bottom: none;
        }

        .hc-sidebar-item-pro:hover {
            background: #f1f8f1;
            padding-left: 20px;
            color: #2e7d32;
        }

        .hc-sidebar-item-icon {
            font-size: 16px;
            flex-shrink: 0;
            width: 22px;
            text-align: center;
        }

        .hc-sidebar-item-text {
            flex: 1;
            font-weight: 500;
        }

        .hc-sidebar-item-arrow {
            opacity: 0;
            transform: translateX(-4px);
            transition: opacity 0.15s ease, transform 0.15s ease;
            color: #2e7d32;
            font-weight: 700;
        }

        .hc-sidebar-item-pro:hover .hc-sidebar-item-arrow {
            opacity: 1;
            transform: translateX(0);
        }
      `}</style>
    </div>
  );
};

export default Home;