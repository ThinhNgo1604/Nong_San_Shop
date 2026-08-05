import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import TreasureChestWidget from '../../components/TreasureChestWidget/TreasureChestWidget';
import { API_BASE } from "../../utils/api";

function Profile() {

    const location = useLocation();

    const isOrdersTab = location.pathname.includes('don-hang');
    const isReviewsTab = location.pathname.includes('danh-gia');
    const isVoucherTab = location.pathname.includes('vi-voucher');

    const [orders, setOrders] = useState([]);
    const [user, setUser] = useState(null);
    const [apiPoints, setApiPoints] = useState(null);

    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
    
    // States cho phần hiển thị ưu đãi Rank
    const [showBenefits, setShowBenefits] = useState(false);
    const [activeTab, setActiveTab] = useState("Vàng");

    const fileInputRef = useRef(null);

    const fetchOrders = () => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const maTK = storedUser ? (storedUser.maTK || storedUser.MaTK || storedUser.MaKH || storedUser.maKH) : null;
        if (maTK) {
            fetch(`${API_BASE}/api/orders/user/${maTK}`)
                .then(res => res.json())
                .then(data => setOrders(Array.isArray(data) ? data : []))
                .catch(err => console.log(err));
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem("token");
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);
                if (storedUser?.avatarUrl || storedUser?.HinhAnh) {
                    setAvatarUrl(storedUser.avatarUrl || storedUser.HinhAnh);
                }
            }

            if (token) {
                try {
                    const res = await fetch(`${API_BASE}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.user) {
                            const updated = {
                                ...storedUser,
                                ...data.user,
                                avatarUrl: data.user.avatarUrl || data.user.HinhAnh || "",
                                HinhAnh: data.user.HinhAnh || data.user.avatarUrl || "",
                            };
                            setUser(updated);
                            setAvatarUrl(updated.avatarUrl || null);
                            localStorage.setItem("user", JSON.stringify(updated));
                        }
                    }
                } catch (err) {
                    console.error("Lỗi đồng bộ hồ sơ:", err);
                }
            }
        };

        const fetchUserPoints = () => {
            const token = localStorage.getItem("token");
            if (token) {
                fetch(`${API_BASE}/api/vouchers/redeemable`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data.totalPoints === 'number') {
                        setApiPoints(data.totalPoints);
                    }
                })
                .catch(() => {});
            }
        };

        loadUser();
        fetchOrders();
        fetchUserPoints();

        window.addEventListener("userUpdated", loadUser);
        return () => window.removeEventListener("userUpdated", loadUser);
    }, [location.pathname]);

    const totalOrders = orders.length;

    const totalSpent = orders
        .filter(o => o.TrangThaiThanhToan === "Đã thanh toán")
        .reduce((sum, o) => sum + Number(o.TongTien), 0);

    const totalSpentAll = orders.reduce((sum, o) => sum + Number(o.TongTien || 0), 0);

    const displayName = user ? (user.HoTen || user.email) : "Họ và tên";
    const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : "U";

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Kích thước file quá lớn (tối đa 5MB). Vui lòng chọn ảnh có dung lượng nhỏ hơn!");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setAvatarUrl(base64Data);

            try {
                const token = localStorage.getItem("token");
                await fetch(`${API_BASE}/api/auth/update-profile`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token ? `Bearer ${token}` : "",
                    },
                    body: JSON.stringify({ avatarUrl: base64Data }),
                });

                const storedUser = JSON.parse(localStorage.getItem("user")) || {};
                const updatedUser = {
                    ...storedUser,
                    avatarUrl: base64Data,
                    HinhAnh: base64Data,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("userUpdated"));
            } catch (err) {
                console.error("Lỗi cập nhật ảnh đại diện:", err);
            }
        };
        reader.readAsDataURL(file);
    };

    const menuLinkStyle = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "10px",
        textDecoration: "none"
    };

    const getActiveStyle = (path) => {
        const active =
            path === "/profile"
                ? location.pathname === "/profile"
                : location.pathname.includes(path);

        return {
            ...menuLinkStyle,
            color: active ? "#2e7d32" : "#212529",
            fontWeight: active ? 700 : 400,
            backgroundColor: active ? "rgba(46,125,50,0.08)" : "transparent"
        };
    };

    // ==========================================
    // LOGIC TÍNH HẠNG THÀNH VIÊN (RANK) - ĐỒNG BỘ VỚI QUẢN LÝ KHÁCH HÀNG
    // ==========================================
    const userStoredPoints = Number(user?.DiemThuong ?? user?.DiemXepHang ?? user?.diemThuong ?? user?.diemXepHang ?? 0);
    const diemDonHang = Math.floor(totalSpentAll / 500);
    const diemXepHang = Math.max(apiPoints !== null ? apiPoints : 0, userStoredPoints, diemDonHang); 

    let currentRank = "Đồng";
    let nextRank = "Bạc";
    let minPoint = 0;
    let maxPoint = 1000;
    let rankColor = "#cd7f32"; 
    let rankIcon = "🥉";
    let rankGradient = "linear-gradient(135deg, #cd7f32, #ffcc80, #cd7f32)"; // Viền gradient Đồng

    if (diemXepHang >= 10000) {
        currentRank = "Kim Cương";
        nextRank = "Tối đa";
        minPoint = 10000;
        maxPoint = 10000;
        rankColor = "#00bcd4"; 
        rankIcon = "💎";
        rankGradient = "linear-gradient(135deg, #00bcd4, #b2ebf2, #00bcd4)"; // Viền gradient Kim Cương
    } else if (diemXepHang >= 5000) {
        currentRank = "Vàng";
        nextRank = "Kim Cương";
        minPoint = 5000;
        maxPoint = 10000;
        rankColor = "#ffd700"; 
        rankIcon = "🥇";
        rankGradient = "linear-gradient(135deg, #ffd700, #fff59d, #ffd700)"; // Viền gradient Vàng
    } else if (diemXepHang >= 1000) {
        currentRank = "Bạc";
        nextRank = "Vàng";
        minPoint = 1000;
        maxPoint = 5000;
        rankColor = "#9e9e9e"; 
        rankIcon = "🥈";
        rankGradient = "linear-gradient(135deg, #9e9e9e, #e0e0e0, #9e9e9e)"; // Viền gradient Bạc
    }

    const progressPercent = currentRank === "Kim Cương"
        ? 100
        : ((diemXepHang - minPoint) / (maxPoint - minPoint)) * 100;

    const pointsNeeded = currentRank === "Kim Cương" ? 0 : maxPoint - diemXepHang;

    useEffect(() => {
        setActiveTab(currentRank);
    }, [currentRank]);

    const rankBenefits = {
        "Đồng": [
            { icon: "🚚", title: "Miễn phí vận chuyển", desc: "Tặng 1 mã Freeship mỗi tháng" },
            { icon: "🎂", title: "Ưu đãi Sinh nhật", desc: "Voucher giảm 5% (tối đa 20.000đ)" }
        ],
        "Bạc": [
            { icon: "🚚", title: "Miễn phí vận chuyển", desc: "Tặng 2 mã Freeship mỗi tháng" },
            { icon: "🏷️", title: "Voucher độc quyền", desc: "Giảm 5% cho đơn từ 200.000đ" },
            { icon: "🎂", title: "Ưu đãi Sinh nhật", desc: "Voucher giảm 10% (tối đa 50.000đ)" }
        ],
        "Vàng": [
            { icon: "🚚", title: "Miễn phí vận chuyển", desc: "Tặng 4 mã Freeship mỗi tháng" },
            { icon: "👑", title: "Ngày hội Thành viên", desc: "Nhận x2 điểm thưởng ngày 15 hàng tháng" },
            { icon: "🎁", title: "Quà tặng Thăng hạng", desc: "Tặng ngay 1 voucher 50.000đ khi lên hạng" },
            { icon: "🎂", title: "Ưu đãi Sinh nhật", desc: "Voucher giảm 15% (tối đa 100.000đ)" }
        ],
        "Kim Cương": [
            { icon: "🚚", title: "Miễn phí vận chuyển", desc: "Freeship không giới hạn (tối đa 30k/đơn)" },
            { icon: "👑", title: "Ngày hội Thành viên", desc: "Nhận x3 điểm thưởng ngày 15 hàng tháng" },
            { icon: "🎁", title: "Quà tặng Thăng hạng", desc: "Tặng ngay 1 voucher 100.000đ khi lên hạng" },
            { icon: "🎧", title: "Chăm sóc Đặc quyền", desc: "Hotline hỗ trợ riêng biệt ưu tiên 24/7" },
            { icon: "🎂", title: "Ưu đãi Sinh nhật", desc: "Voucher giảm 20% (tối đa 200.000đ)" }
        ]
    };

    // KIỂM TRA ĐƯỜNG DẪN HIỆN TẠI ĐỂ ẨN/HIỆN KHUNG ĐIỂM
    const showRewardSection = location.pathname === "/profile" || location.pathname === "/profile/" || location.pathname.includes("/profile/uu-dai");

    return (
        <div className="row g-4 pb-5">
            <div className="col-md-3">
                <div
                    className="rounded-4 p-4 text-center mb-3"
                    style={{
                        background: "linear-gradient(135deg,#2e7d32,#66bb6a)",
                        color: "#fff"
                    }}
                >
                    {/* KHUNG AVATAR CÓ VIỀN RANK */}
                    <div
                        className="rounded-circle mx-auto mb-3 position-relative"
                        style={{
                            width: "96px",
                            height: "96px",
                            padding: "4px", 
                            background: rankGradient,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
                        }}
                    >
                        {/* ẢNH AVATAR BÊN TRONG */}
                        <div
                            onMouseEnter={() => setIsHoveringAvatar(true)}
                            onMouseLeave={() => setIsHoveringAvatar(false)}
                            onClick={() => fileInputRef.current.click()}
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold w-100 h-100 position-relative"
                            style={{
                                background: avatarUrl
                                    ? `url(${avatarUrl}) center/cover`
                                    : "#fff",
                                color: "#2e7d32",
                                fontSize: "32px",
                                cursor: "pointer",
                                border: "2px solid #fff" 
                            }}
                        >
                            {!avatarUrl && avatarLetter}

                            {isHoveringAvatar && (
                                <div
                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                                    style={{ background: "rgba(0,0,0,.5)", borderRadius: "50%" }}
                                >
                                    📷
                                </div>
                            )}
                        </div>

                        {/* HUY HIỆU RANK GẮN Ở GÓC AVATAR */}
                        <div
                            className="position-absolute d-flex align-items-center justify-content-center"
                            style={{
                                bottom: "-2px",
                                right: "-12px",
                                backgroundColor: rankColor,
                                color: currentRank === "Vàng" ? "#000" : "#fff",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                border: "2px solid #fff",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                whiteSpace: "nowrap",
                                zIndex: 2
                            }}
                        >
                            {rankIcon} {currentRank}
                        </div>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        style={{ display: "none" }}
                    />

                    <strong>{displayName}</strong>
                </div>

                <div className="rounded-4 p-3 bg-white">
                    <h6>Thông tin tài khoản</h6>
                    <Link to="/profile" style={getActiveStyle("/profile")}>👤 Hồ sơ cá nhân</Link>
                    <Link to="/profile/dia-chi" style={getActiveStyle("/profile/dia-chi")}>📍 Sổ địa chỉ</Link>
                    <Link to="/profile/doi-mat-khau" style={getActiveStyle("/profile/doi-mat-khau")}>🔒 Đổi mật khẩu</Link>
                    <Link to="/profile/uu-dai" style={getActiveStyle("/profile/uu-dai")}>🎁 Ưu đãi thành viên</Link>
                    <hr />
                    <Link to="/profile/don-hang" style={getActiveStyle("/profile/don-hang")}>📄 Đơn hàng của tôi</Link>
                    <Link to="/profile/vi-voucher" style={getActiveStyle("/profile/vi-voucher")}>🎟️ Ví voucher</Link>
                    <Link to="/profile/thong-bao" style={getActiveStyle("/profile/thong-bao")}>✉️ Thông báo</Link>
                    <Link to="/profile/yeu-thich" style={getActiveStyle("/profile/yeu-thich")}>♡ Sản phẩm yêu thích</Link>
                    <Link to="/profile/danh-gia" style={getActiveStyle("/profile/danh-gia")}>★ Đánh giá của tôi</Link>
                </div>
            </div>

            <div className="col-md-9">
                <div
                    className="rounded-4 mb-3 p-4"
                    style={{
                        background: "#2e7d32",
                        color: "#fff"
                    }}
                >
                    <h4>
                        Xin chào {displayName}
                    </h4>
                </div>

                {/* BỌC TOÀN BỘ KHỐI ĐIỂM THƯỞNG BẰNG ĐIỀU KIỆN ẨN/HIỆN */}
                {showRewardSection && (
                    <>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <div className="bg-white rounded-4 p-4 border h-100">
                                    <h6>🎁 Ưu đãi</h6>
                                    <h3>
                                        {(totalSpent * 0.1).toLocaleString()}
                                    </h3>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="bg-white rounded-4 p-4 border h-100">
                                    <h6>🏆 Thành tích</h6>
                                    <p className="mb-2">
                                        Số đơn hàng đã đặt là: <strong>{totalOrders}</strong> đơn hàng
                                    </p>
                                    <p className="mb-0">
                                        Tổng số tiền đã thanh toán: <strong>{totalSpent.toLocaleString()} đ</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-4 p-4 border-0 shadow-sm mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div 
                                        className="d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: "60px", height: "60px", backgroundColor: "rgba(0,0,0,0.03)", fontSize: "32px", border: `2px solid ${rankColor}` }}
                                    >
                                        {rankIcon}
                                    </div>
                                    <div>
                                        <h5 className="mb-1 fw-bold" style={{ color: rankColor, textTransform: "uppercase" }}>Hạng {currentRank}</h5>
                                        <span className="text-muted">Điểm tích lũy: <strong className="text-dark">{diemXepHang.toLocaleString()} / {maxPoint.toLocaleString()}</strong></span>
                                    </div>
                                </div>

                                {currentRank !== "Kim Cương" ? (
                                    <div className="text-end bg-light px-3 py-2 rounded-3">
                                        <small className="text-muted d-block">Lên hạng <strong>{nextRank}</strong></small>
                                        <small style={{ color: '#ff9800', fontWeight: 'bold' }}>Cần thêm {pointsNeeded.toLocaleString()} điểm</small>
                                    </div>
                                ) : (
                                    <div className="text-end bg-light px-3 py-2 rounded-3">
                                        <small className="text-muted d-block">Chúc mừng!</small>
                                        <small style={{ color: rankColor, fontWeight: 'bold' }}>Đã đạt thứ hạng cao nhất</small>
                                    </div>
                                )}
                            </div>

                            <div className="progress mt-4" style={{ height: '14px', borderRadius: '20px', backgroundColor: '#f0f0f0' }}>
                                <div
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    role="progressbar"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: rankColor,
                                        borderRadius: '20px',
                                        transition: 'width 1s ease-in-out'
                                    }}
                                    aria-valuenow={progressPercent}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>
                            
                            <div className="d-flex justify-content-between mt-2 px-1 mb-4">
                                <small className="text-muted fw-bold">{minPoint.toLocaleString()} điểm</small>
                                {currentRank !== "Kim Cương" && <small className="text-muted fw-bold">{maxPoint.toLocaleString()} điểm</small>}
                            </div>

                            <div className="text-center border-top pt-3">
                                <button 
                                    className="btn btn-sm px-4 py-2 fw-bold"
                                    style={{ backgroundColor: showBenefits ? "#f8f9fa" : "#fff", border: "1px solid #e0e0e0", color: "#2e7d32", borderRadius: "20px" }}
                                    onClick={() => setShowBenefits(!showBenefits)}
                                >
                                    {showBenefits ? "Thu gọn đặc quyền ▴" : "🎁 Xem đặc quyền các hạng ▾"}
                                </button>
                            </div>

                            {showBenefits && (
                                <div className="mt-4 pt-3">
                                    <h6 className="fw-bold mb-3 text-center" style={{ color: "#e65100" }}>THÔNG TIN ƯU ĐÃI CÁC THỨ HẠNG</h6>
                                    
                                    <div className="d-flex justify-content-between border-bottom mb-4">
                                        {Object.keys(rankBenefits).map(rank => (
                                            <div 
                                                key={rank}
                                                onClick={() => setActiveTab(rank)}
                                                style={{
                                                    flex: 1,
                                                    textAlign: "center",
                                                    padding: "10px 5px",
                                                    cursor: "pointer",
                                                    fontWeight: activeTab === rank ? "bold" : "500",
                                                    color: activeTab === rank ? "#e65100" : "#888",
                                                    borderBottom: activeTab === rank ? "3px solid #e65100" : "3px solid transparent",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                {rank}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="d-flex flex-column gap-3">
                                        {rankBenefits[activeTab].map((benefit, idx) => (
                                            <div key={idx} className="d-flex gap-3 align-items-center bg-light p-3 rounded-4 border-0">
                                                <div style={{ fontSize: "28px" }}>{benefit.icon}</div>
                                                <div>
                                                    <h6 className="mb-1 fw-bold text-dark">{benefit.title}</h6>
                                                    <small className="text-muted">{benefit.desc}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Outlet CHỨA CÁC TRANG CON HIỂN THỊ PHÍA DƯỚI */}
                <div className={showRewardSection ? "mt-4" : ""}>
                    <Outlet context={{ orders, fetchOrders }} />
                </div>
                <TreasureChestWidget />
            </div>
        </div>
    );
}

export default Profile;