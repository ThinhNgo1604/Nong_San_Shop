import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
    const [keyword, setKeyword] = useState("");
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0); 
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();

    const calculateCartCount = () => {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(cart)) {
                return cart.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
            }
        } catch (e) {
            return 0;
        }
        return 0;
    };

    useEffect(() => {
        const loadUser = () => {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    if (parsedUser.maTK || parsedUser.MaTK) {
                        fetchUnreadCount(parsedUser.maTK || parsedUser.MaTK);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setUser(null);
            }
        };

        const updateCart = () => {
            setCartCount(calculateCartCount());
        };

        loadUser();
        updateCart();

        const handleNotificationUpdate = (e) => {
            if (e && e.detail && typeof e.detail.unreadCount === 'number') {
                setUnreadCount(e.detail.unreadCount);
            } else {
                const currentUser = JSON.parse(localStorage.getItem("user"));
                if (currentUser) {
                    fetchUnreadCount(currentUser.maTK || currentUser.MaTK);
                }
            }
        };

        window.addEventListener('updateNotificationCount', handleNotificationUpdate);
        window.addEventListener('userUpdated', loadUser);
        window.addEventListener('cartUpdated', updateCart);
        window.addEventListener('storage', () => {
            loadUser();
            updateCart();
        });
        return () => {
            window.removeEventListener('updateNotificationCount', handleNotificationUpdate);
            window.removeEventListener('userUpdated', loadUser);
            window.removeEventListener('cartUpdated', updateCart);
            window.removeEventListener('storage', () => {
                loadUser();
                updateCart();
            });
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        const timer = setInterval(() => {
            fetchUnreadCount(user.maTK);
        }, 30000); 
        return () => clearInterval(timer);
    }, [user]);

    const fetchUnreadCount = (maTK) => {
        const apiBase = import.meta.env.VITE_API_URL || "";
        fetch(`${apiBase}/api/notifications/${maTK}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const count = data.filter(notif => !notif.DaDoc && notif.DaDoc !== 1 && notif.DaDoc !== true && notif.DaDoc !== "1" && notif.DaDoc !== "true").length;
                    setUnreadCount(count);
                }
            })
            .catch(err => console.error("Lỗi đếm thông báo Header:", err));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setUnreadCount(0); 
        navigate("/");
    };

    return (
        <div
            className="d-flex justify-content-between align-items-center px-4 py-3"
            style={{ backgroundColor: "#fff", borderBottom: "1px solid #eee", gap: "20px" }}
        >
            <Link to="/" className="d-flex align-items-center text-decoration-none flex-shrink-0" style={{ gap: "8px" }}>
                <span style={{ fontSize: "26px" }}>🌱</span>
                <span style={{ fontSize: "20px", fontWeight: "700", color: "#2e7d32" }}>
                    Nông Sản Shop
                </span>
            </Link>

            <form onSubmit={handleSearch} className="ns-search-form flex-grow-1" style={{ maxWidth: "500px" }}>
                <input
                    type="text"
                    className="ns-search-input"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <button type="submit" className="ns-search-btn" aria-label="Tìm kiếm">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                        <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                    </svg>
                </button>
            </form>

            <nav className="d-flex align-items-center flex-shrink-0" style={{ gap: "25px" }}>
                <Link
                    to="/products"
                    className="text-decoration-none fw-medium"
                    style={{ color: "#333", fontSize: "15px" }}
                >
                    Sản phẩm
                </Link>

                <Link
                    to="/cart"
                    className="text-decoration-none fw-medium px-3 py-2 position-relative"
                    style={{
                        backgroundColor: "#f57c00",
                        color: "#fff",
                        borderRadius: "20px",
                        fontSize: "14px",
                        boxShadow: "0 2px 6px rgba(245, 124, 0, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <span>🛒 Giỏ hàng</span>
                    {cartCount > 0 && (
                        <span
                            className="badge rounded-pill bg-danger position-absolute"
                            style={{
                                top: "-6px",
                                right: "-6px",
                                fontSize: "11px",
                                padding: "4px 7px",
                                border: "2px solid #fff",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                            }}
                        >
                            {cartCount > 99 ? "99+" : cartCount}
                        </span>
                    )}
                </Link>

                {user ? (
                    <>
                        {/* CHUÔNG ĐƯỢC ÉP CSS TRONG SUỐT HOÀN TOÀN */}
                        <Link 
                            to="/profile/thong-bao" 
                            title="Thông báo"
                            style={{ 
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "40px", 
                                height: "40px", 
                                textDecoration: "none",
                                backgroundColor: "transparent", /* ÉP BUỘC TRONG SUỐT */
                                background: "none",
                                border: "none",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            <span style={{ fontSize: "22px", background: "transparent", lineHeight: "1" }}>🔔</span>
                            
                            {/* CHẤM ĐỎ */}
                            {unreadCount > 0 && (
                                <span 
                                    style={{ 
                                        position: "absolute",
                                        top: "0px", 
                                        right: "0px", 
                                        backgroundColor: "#d32f2f",
                                        color: "white",
                                        fontSize: "10px", 
                                        fontWeight: "bold",
                                        padding: "3px 5px",
                                        borderRadius: "50%",
                                        border: "2px solid #fff",
                                        lineHeight: "1"
                                    }}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/profile"
                            title="Trang cá nhân"
                            className="d-flex align-items-center justify-content-center overflow-hidden"
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                backgroundColor: "#e8f5e9",
                                color: "#2e7d32",
                                textDecoration: "none",
                                fontSize: "18px",
                                border: "1px solid #c8e6c9",
                                padding: 0
                            }}
                        >
                            {(user?.avatarUrl || user?.HinhAnh || user?.Avatar) ? (
                                <img
                                    src={user.avatarUrl || user.HinhAnh || user.Avatar}
                                    alt="Avatar"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                "👤"
                            )}
                        </Link>
                        
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2"
                            style={{
                                backgroundColor: "transparent",
                                color: "#d32f2f",
                                borderRadius: "20px",
                                border: "1.5px solid #d32f2f",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#d32f2f";
                                e.target.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.color = "#d32f2f";
                            }}
                        >
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="text-decoration-none fw-medium px-3 py-2"
                            style={{
                                color: "#2e7d32",
                                fontSize: "14px",
                                fontWeight: "500",
                                border: "1.5px solid #2e7d32",
                                borderRadius: "20px",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#2e7d32";
                                e.target.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.color = "#2e7d32";
                            }}
                        >
                            Đăng nhập
                        </Link>

                        <Link
                            to="/register"
                            className="text-decoration-none fw-medium px-3 py-2"
                            style={{
                                backgroundColor: "#2e7d32",
                                color: "#fff",
                                borderRadius: "20px",
                                fontSize: "14px",
                                fontWeight: "500",
                                boxShadow: "0 2px 6px rgba(46, 125, 50, 0.3)",
                            }}
                        >
                            Đăng ký
                        </Link>
                    </>
                )}
            </nav>

            <style>{`
                .ns-search-form {
                    display: flex;
                    align-items: center;
                    background: #fff;
                    border: 1.5px solid #e2e6e2;
                    border-radius: 999px;
                    overflow: hidden;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .ns-search-form:hover {
                    border-color: #c9d6c9;
                }

                .ns-search-form:focus-within {
                    border-color: #2e7d32;
                    box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.12);
                }

                .ns-search-input {
                    flex: 1;
                    min-width: 0;
                    padding: 11px 18px;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    background: transparent;
                    color: #333;
                }

                .ns-search-input::placeholder {
                    color: #9aa39a;
                }

                .ns-search-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    margin: 3px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #43a047, #1b5e20);
                    color: #fff;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
                }

                .ns-search-btn:hover {
                    transform: scale(1.07);
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.35);
                    filter: brightness(1.05);
                }

                .ns-search-btn:active {
                    transform: scale(0.96);
                }
            `}</style>
        </div>
    );
}

export default Header;