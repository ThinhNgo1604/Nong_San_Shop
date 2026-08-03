import { useState, useEffect } from "react";
import { API_BASE } from "../../../utils/api";

function DoiMatKhau() {
    const [user, setUser] = useState(null);
    const [matKhauCu, setMatKhauCu] = useState("");
    const [matKhauMoi, setMatKhauMoi] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
    
    const [thongBao, setThongBao] = useState("");
    const [loi, setLoi] = useState("");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoi("");
        setThongBao("");

        if (matKhauMoi !== xacNhanMatKhau) {
            setLoi("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        if (matKhauMoi.length < 6) {
            setLoi("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        if (!user || !user.maTK) {
            setLoi("Không tìm thấy thông tin tài khoản đang đăng nhập.");
            return;
        }

        // LẤY TOKEN TỪ LOCALSTORAGE ĐỂ GỬI KÈM API
        const token = localStorage.getItem('token'); 
        if (!token) {
            setLoi("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
        }

        try {
            // SỬA LẠI ĐƯỜNG DẪN API
            const response = await fetch(`${API_BASE}/api/auth/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    // THÊM AUTHORIZATION HEADER VÀO ĐÂY
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    matKhauCu: matKhauCu,
                    matKhauMoi: matKhauMoi
                })
            });

            const data = await response.json();

            if (response.ok) {
                setThongBao("Đổi mật khẩu thành công!");
                setMatKhauCu("");
                setMatKhauMoi("");
                setXacNhanMatKhau("");
            } else {
                setLoi(data.message || "Đổi mật khẩu thất bại.");
            }
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error);
            setLoi("Có lỗi xảy ra khi kết nối đến máy chủ.");
        }
    };

    return (
        <div className="shadow-sm rounded p-4 bg-white mt-3 border">
            <h5 className="fw-bold mb-4 text-success">Đổi mật khẩu</h5>
            
            {loi && <div className="alert alert-danger">{loi}</div>}
            {thongBao && <div className="alert alert-success">{thongBao}</div>}

            <form onSubmit={handleSubmit} className="w-75">
                <div className="mb-3">
                    <label className="form-label fw-bold">Mật khẩu hiện tại</label>
                    <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Nhập mật khẩu hiện tại"
                        value={matKhauCu}
                        onChange={(e) => setMatKhauCu(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold">Mật khẩu mới</label>
                    <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Nhập mật khẩu mới"
                        value={matKhauMoi}
                        onChange={(e) => setMatKhauMoi(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="form-label fw-bold">Xác nhận mật khẩu mới</label>
                    <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Nhập lại mật khẩu mới"
                        value={xacNhanMatKhau}
                        onChange={(e) => setXacNhanMatKhau(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-success px-4">
                    Lưu thay đổi
                </button>
            </form>
        </div>
    );
}

export default DoiMatKhau;