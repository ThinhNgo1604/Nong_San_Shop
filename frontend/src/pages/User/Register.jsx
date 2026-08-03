import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../utils/api";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        hoTen: "",
        email: "",
        soDienThoai: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu nhập lại không khớp!");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hoTen: formData.hoTen,
                    email: formData.email,
                    soDienThoai: formData.soDienThoai,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Đăng ký thất bại");
                return;
            }

            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate("/login");
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
                            Tham gia cùng chúng tôi,<br />mua sắm nông sản dễ dàng hơn
                        </h2>
                        <p className="ns-auth-subtext">
                            Tạo tài khoản để theo dõi đơn hàng, nhận ưu đãi độc quyền
                            và trải nghiệm mua sắm nhanh chóng hơn.
                        </p>

                        <div className="ns-auth-features">
                            <div className="ns-auth-feature">
                                <span>🎁</span> Giảm 10% cho đơn đầu tiên
                            </div>
                            <div className="ns-auth-feature">
                                <span>📦</span> Theo dõi đơn hàng dễ dàng
                            </div>
                            <div className="ns-auth-feature">
                                <span>🔔</span> Nhận thông báo khuyến mãi
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI - FORM ĐĂNG KÝ */}
                <div className="ns-auth-form-side">
                    <div className="ns-auth-card">
                        <div className="ns-auth-card-header">
                            <span style={{ fontSize: "30px" }}>📝</span>
                            <h3>Đăng ký</h3>
                            <p className="ns-auth-subtitle">Tạo tài khoản mới chỉ trong 1 phút</p>
                        </div>

                        {error && (
                            <div className="ns-auth-alert">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="ns-auth-field">
                                <label className="ns-auth-label">Họ và tên</label>
                                <div className="ns-auth-input-wrap">
                                    <span className="ns-auth-input-icon">🧑</span>
                                    <input
                                        type="text"
                                        name="hoTen"
                                        className="ns-auth-input"
                                        placeholder="Nhập họ và tên"
                                        value={formData.hoTen}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

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
                                <label className="ns-auth-label">Số điện thoại</label>
                                <div className="ns-auth-input-wrap">
                                    <span className="ns-auth-input-icon">📱</span>
                                    <input
                                        type="tel"
                                        name="soDienThoai"
                                        className="ns-auth-input"
                                        placeholder="Nhập số điện thoại"
                                        value={formData.soDienThoai}
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

                            <div className="ns-auth-field">
                                <label className="ns-auth-label">Nhập lại mật khẩu</label>
                                <div className="ns-auth-input-wrap">
                                    <span className="ns-auth-input-icon">🔒</span>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        className="ns-auth-input"
                                        placeholder="Nhập lại mật khẩu"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="ns-auth-toggle-eye"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                        aria-label="Hiện/ẩn mật khẩu"
                                    >
                                        {showConfirmPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="ns-auth-submit-btn"
                                disabled={loading}
                                style={{ marginTop: "6px" }}
                            >
                                {loading ? "Đang xử lý..." : "Đăng ký"}
                            </button>
                        </form>

                        <p className="ns-auth-switch">
                            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
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
                    font-size: 26px;
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
                    padding: 44px 40px;
                }

                .ns-auth-card {
                    width: 100%;
                    max-width: 360px;
                }

                .ns-auth-card-header {
                    text-align: center;
                    margin-bottom: 22px;
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
                    margin-bottom: 16px;
                    border: 1px solid #f5c6c6;
                }

                .ns-auth-field {
                    margin-bottom: 14px;
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
                    padding: 11px 0;
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
                    margin-top: 20px;
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
                        padding: 36px 24px;
                    }
                }
            `}</style>
        </div>
    );
}

export default Register;