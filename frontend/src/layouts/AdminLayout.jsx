import { Outlet, useNavigate, Link } from "react-router-dom";
import { FaLock, FaExclamationTriangle, FaSignOutAlt, FaHome, FaUserShield } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import HeaderAdmin from "../components/HeaderAdmin";

function AdminLayout() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    let currentUser = null;
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
        } catch (e) {
            currentUser = null;
        }
    }

    const isAdmin = token && currentUser && (
        String(currentUser.vaiTro).trim().toLowerCase() === "admin"
    );

    const handleSwitchToAdmin = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    if (!token || !currentUser) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
                <div className="card border-0 shadow-lg text-center p-4" style={{ maxWidth: "480px", borderRadius: "16px" }}>
                    <div className="mb-3">
                        <div className="d-inline-flex align-items-center justify-content-center bg-warning text-dark rounded-circle" style={{ width: "70px", height: "70px", fontSize: "32px" }}>
                            <FaLock />
                        </div>
                    </div>
                    <h4 className="fw-bold text-dark mb-2">Yêu cầu đăng nhập Admin</h4>
                    <p className="text-secondary small mb-4">
                        Bạn chưa đăng nhập. Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin) để truy cập hệ thống này.
                    </p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Link to="/" className="btn btn-outline-secondary btn-sm px-3">
                            <FaHome className="me-1" /> Trang chủ
                        </Link>
                        <button onClick={handleSwitchToAdmin} className="btn btn-success btn-sm px-3 fw-semibold">
                            <FaUserShield className="me-1" /> Đăng nhập Admin
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
                <div className="card border-0 shadow-lg text-center p-4" style={{ maxWidth: "500px", borderRadius: "16px" }}>
                    <div className="mb-3">
                        <div className="d-inline-flex align-items-center justify-content-center bg-danger text-white rounded-circle shadow-sm" style={{ width: "70px", height: "70px", fontSize: "32px" }}>
                            <FaExclamationTriangle />
                        </div>
                    </div>
                    <h4 className="fw-bold text-danger mb-2">Truy cập bị từ chối!</h4>
                    <p className="text-secondary small mb-3">
                        Bạn đang đăng nhập dưới tài khoản khách hàng: <br />
                        <strong className="text-dark">{currentUser.hoTen || currentUser.tenDangNhap || currentUser.email}</strong> ({currentUser.vaiTro || "Khách hàng"}).
                    </p>
                    <div className="alert alert-warning py-2 small mb-4 border-0">
                        🔒 Bạn không có quyền truy cập trang Quản trị (Admin). Vui lòng đăng xuất và đăng nhập bằng tài khoản Quản trị viên.
                    </div>
                    <div className="d-flex gap-2 justify-content-center">
                        <Link to="/" className="btn btn-outline-secondary btn-sm px-3">
                            <FaHome className="me-1" /> Về trang bán hàng
                        </Link>
                        <button onClick={handleSwitchToAdmin} className="btn btn-danger btn-sm px-3 fw-semibold">
                            <FaSignOutAlt className="me-1" /> Đổi sang tài khoản Admin
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Sidebar />

            <div
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    background: "#f8f9fa"
                }}
            >
                <HeaderAdmin />

                <div className="p-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;