import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getImageUrl } from '../../../utils/api';

function FavoritePro() {
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    // Lấy thông tin user hiện tại
    const storedUser = JSON.parse(localStorage.getItem("user"));
    // Tạo key riêng biệt cho user này. Nếu không có user, dùng mảng rỗng tạm.
    const favKey = storedUser ? `favorites_${storedUser.maTK}` : 'favorites';

    useEffect(() => {
        // Chỉ lấy ID yêu thích của tài khoản này
        const favIds = JSON.parse(localStorage.getItem(favKey) || '[]');
        
        if (favIds.length === 0) {
            setIsLoading(false);
            return;
        }

        fetch(`${API_BASE}/api/products/all`)
            .then(res => res.json())
            .then(data => {
                const favProducts = data.filter(p => favIds.includes(p.MaSP));
                setFavorites(favProducts);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [favKey]);

    const removeFavorite = (e, maSP) => {
        e.stopPropagation(); 
        
        // Chỉ xóa trong key của user này
        const updatedFavIds = JSON.parse(localStorage.getItem(favKey) || '[]').filter(id => id !== maSP);
        localStorage.setItem(favKey, JSON.stringify(updatedFavIds));
        
        setFavorites(favorites.filter(p => p.MaSP !== maSP));
    };

    const goToDetail = (maSP) => {
        navigate(`/product/${maSP}`);
    };

    if (isLoading) return <p className="text-center mt-4">Đang tải...</p>;

    if (!storedUser) return <p className="text-center mt-4 text-danger">Vui lòng đăng nhập để xem sản phẩm yêu thích.</p>;

    return (
        <div className="bg-white rounded-4 p-4 border shadow-sm">
            <h5 className="mb-4 text-success fw-bold">Sản phẩm yêu thích của bạn</h5>
            
            {favorites.length === 0 ? (
                <div className="text-center p-5 text-muted">
                    <p style={{ fontSize: '40px' }}>♡</p>
                    <p>Bạn chưa có sản phẩm yêu thích nào.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {favorites.map(item => (
                        <div key={item.MaSP} className="col-md-4">
                            <div 
                                className="card h-100 position-relative shadow-sm" 
                                style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #eee' }}
                                onClick={() => goToDetail(item.MaSP)}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span 
                                    className="position-absolute"
                                    onClick={(e) => removeFavorite(e, item.MaSP)}
                                    style={{
                                        top: '10px', right: '15px',
                                        fontSize: '28px', color: '#e91e63',
                                        cursor: 'pointer', zIndex: 10,
                                        userSelect: 'none'
                                    }}
                                    title="Bỏ yêu thích"
                                >
                                    ♥
                                </span>
                                
                                <img 
                                    src={getImageUrl(item.HinhAnh || item.image || item.hinh_anh)} 
                                    className="card-img-top p-3" 
                                    alt={item.TenSP} 
                                    style={{ height: '200px', objectFit: 'contain' }}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+Image' }}
                                />
                                <div className="card-body text-center border-top">
                                    <h6 className="card-title text-success text-truncate">{item.TenSP}</h6>
                                    <p className="card-text text-danger fw-bold mb-0">
                                        {Number(item.DonGia).toLocaleString()} đ
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FavoritePro;