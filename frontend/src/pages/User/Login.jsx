import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../utils/api";

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 🌟 Tự động chuyển hướng nếu người dùng ĐÃ đăng nhập sẵn
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userJson = localStorage.getItem("user");

        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                if (user && user.vaiTro) {
                    if (user.vaiTro.trim() === "Admin") {
                        navigate("/admin");
                    } else {
                        navigate("/");
                    }
                }
            } catch (e) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);

            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Đăng nhập thất bại");
                return;
            }

            console.log("Role nhận được:", data.user?.vaiTro);

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // ĐỒNG BỘ GIỎ HÀNG (Chạy ngầm)
            const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (localCart.length > 0) {
                fetch(`${API_BASE}/api/cart/merge`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        maKH: data.user.maTK,
                        localCart: localCart
                    })
                })
                    .catch((err) => console.error("Lỗi đồng bộ giỏ hàng:", err));
            }

            const role = data.user && data.user.vaiTro ? data.user.vaiTro.trim() : "";
            if (role === "Admin") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error(err);
            setError("Không thể kết nối tới máy chủ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ns-auth-page">
            <div className="ns-auth-wrapper">
                {/* CỘT TRÁI - HÌNH ẢNH THƯƠNG HIỆU */}
                <div className="ns-auth-visual">
                    <div className="ns-auth-visual-overlay">
                        <div className="ns-auth-brand">
                            <span style={{ fontSize: "40px" }}>🌱</span>
                            <span className="ns-auth-brand-name">Nông Sản Shop</span>
                        </div>
                        <h2 className="ns-auth-tagline">
                            Nông sản sạch,<br />từ trang trại đến bàn ăn
                        </h2>
                        <p className="ns-auth-subtext">
                            Cam kết 100% rau củ quả tươi sạch, nguồn gốc rõ ràng,
                            giao hàng nhanh tận nơi mỗi ngày.
                        </p>

                        <div className="ns-auth-features">
                            <div className="ns-auth-feature">
                                <span>🚚</span> Miễn phí vận chuyển
                            </div>
                            <div className="ns-auth-feature">
                                <span>✅</span> Chuẩn an toàn VietGAP
                            </div>
                            <div className="ns-auth-feature">
                                <span>🎁</span> Ưu đãi cho khách mới
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI - FORM ĐĂNG NHẬP */}
                <div className="ns-auth-form-side">
                    <div className="ns-auth-card">
                        <div className="ns-auth-card-header">
                            <span style={{ fontSize: "30px" }}>🔐</span>
                            <h3>Đăng nhập</h3>
                            <p className="ns-auth-subtitle">Chào mừng bạn quay trở lại!</p>
                        </div>

                        {error && (
                            <div className="ns-auth-alert">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="ns-auth-field">
                                <label className="ns-auth-label">Email</label>
                                <div className="ns-auth-input-wrap">
                                    <span className="ns-auth-input-icon">✉️</span>
                                    <input
                                        type="email"
                                        name="email"
                                        className="ns-auth-input"
                                        placeholder="Nhập email của bạn"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ns-auth-field">
                                <label className="ns-auth-label">Mật khẩu</label>
                                <div className="ns-auth-input-wrap">
                                    <span className="ns-auth-input-icon">🔒</span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="ns-auth-input"
                                        placeholder="Nhập mật khẩu"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="ns-auth-toggle-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label="Hiện/ẩn mật khẩu"
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            <div className="ns-auth-row">
                                <label className="ns-auth-remember">
                                    <input type="checkbox" />
                                    <span>Ghi nhớ đăng nhập</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="ns-auth-submit-btn"
                                disabled={loading}
                            >
                                {loading ? "Đang xử lý..." : "Đăng nhập"}
                            </button>
                        </form>

                        <p className="ns-auth-switch">
                            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .ns-auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f4f7f4;
                    padding: 30px 16px;
                }

                .ns-auth-wrapper {
                    display: flex;
                    width: 100%;
                    max-width: 980px;
                    min-height: 620px;
                    background: #fff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(46, 125, 50, 0.15);
                }

                .ns-auth-visual {
                    flex: 1;
                    background: linear-gradient(160deg, #2e7d32 0%, #1b5e20 100%);
                    position: relative;
                    display: flex;
                    align-items: center;
                    padding: 50px 40px;
                    color: #fff;
                    overflow: hidden;
                }

                .ns-auth-visual::before {
                    content: "";
                    position: absolute;
                    width: 320px;
                    height: 320px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.06);
                    top: -100px;
                    right: -100px;
                }

                .ns-auth-visual::after {
                    content: "";
                    position: absolute;
                    width: 220px;
                    height: 220px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                    bottom: -80px;
                    left: -60px;
                }

                .ns-auth-visual-overlay {
                    position: relative;
                    z-index: 1;
                }

                .ns-auth-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 40px;
                }

                .ns-auth-brand-name {
                    font-size: 20px;
                    font-weight: 700;
                }

                .ns-auth-tagline {
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 1.35;
                    margin-bottom: 16px;
                }

                .ns-auth-subtext {
                    font-size: 14.5px;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.85);
                    margin-bottom: 36px;
                    max-width: 340px;
                }

                .ns-auth-features {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .ns-auth-feature {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    background: rgba(255, 255, 255, 0.12);
                    padding: 10px 16px;
                    border-radius: 12px;
                    width: fit-content;
                }

                .ns-auth-form-side {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 50px 40px;
                }

                .ns-auth-card {
                    width: 100%;
                    max-width: 360px;
                }

                .ns-auth-card-header {
                    text-align: center;
                    margin-bottom: 28px;
                }

                .ns-auth-card-header h3 {
                    margin: 10px 0 4px;
                    font-weight: 700;
                    color: #1b1b1b;
                }

                .ns-auth-subtitle {
                    color: #888;
                    font-size: 14px;
                    margin: 0;
                }

                .ns-auth-alert {
                    background: #fdecea;
                    color: #d32f2f;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 13.5px;
                    margin-bottom: 18px;
                    border: 1px solid #f5c6c6;
                }

                .ns-auth-field {
                    margin-bottom: 18px;
                }

                .ns-auth-label {
                    display: block;
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 6px;
                }

                .ns-auth-input-wrap {
                    display: flex;
                    align-items: center;
                    border: 1.5px solid #e2e6e2;
                    border-radius: 12px;
                    padding: 0 14px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    background: #fff;
                }

                .ns-auth-input-wrap:focus-within {
                    border-color: #2e7d32;
                    box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.12);
                }

                .ns-auth-input-icon {
                    font-size: 15px;
                    margin-right: 8px;
                    flex-shrink: 0;
                }

                .ns-auth-input {
                    flex: 1;
                    min-width: 0;
                    border: none;
                    outline: none;
                    padding: 12px 0;
                    font-size: 14px;
                    background: transparent;
                    color: #333;
                }

                .ns-auth-toggle-eye {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 15px;
                    padding: 4px;
                    flex-shrink: 0;
                    opacity: 0.7;
                }

                .ns-auth-toggle-eye:hover {
                    opacity: 1;
                }

                .ns-auth-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 22px;
                    font-size: 13px;
                }

                .ns-auth-remember {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #555;
                    cursor: pointer;
                }

                .ns-auth-link-small {
                    color: #2e7d32;
                    text-decoration: none;
                    font-weight: 500;
                }

                .ns-auth-link-small:hover {
                    text-decoration: underline;
                }

                .ns-auth-submit-btn {
                    width: 100%;
                    padding: 13px;
                    border: none;
                    border-radius: 999px;
                    background: linear-gradient(135deg, #43a047, #1b5e20);
                    color: #fff;
                    font-weight: 600;
                    font-size: 15px;
                    cursor: pointer;
                    transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
                    box-shadow: 0 4px 14px rgba(27, 94, 32, 0.3);
                }

                .ns-auth-submit-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    filter: brightness(1.05);
                }

                .ns-auth-submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .ns-auth-switch {
                    text-align: center;
                    margin-top: 22px;
                    font-size: 13.5px;
                    color: #666;
                }

                .ns-auth-switch a {
                    color: #2e7d32;
                    font-weight: 600;
                    text-decoration: none;
                }

                .ns-auth-switch a:hover {
                    text-decoration: underline;
                }

                @media (max-width: 820px) {
                    .ns-auth-visual {
                        display: none;
                    }
                    .ns-auth-wrapper {
                        min-height: auto;
                    }
                    .ns-auth-form-side {
                        padding: 40px 24px;
                    }
                }
            `}</style>
        </div>
    );
}

export default Login;