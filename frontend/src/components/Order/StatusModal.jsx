import { useEffect, useState } from "react";

function StatusModal({ order, onSave, onClose }) {
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");

    useEffect(() => {
        if (order) {
            setStatus(order.TrangThaiDonHang);
            setPaymentStatus(order.TrangThaiThanhToan);
        }
    }, [order]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Gửi cả 2 trạng thái lên server
        onSave(order.MaDH, { 
            TrangThaiDonHang: status, 
            TrangThaiThanhToan: paymentStatus 
        });
    };

    if (!order) return null;

    const currentStatus = order.TrangThaiDonHang;

    const allowedTransitions = {
        "Chờ xác nhận": ["Chờ xác nhận", "Đã xác nhận", "Đã hủy"],
        "Đã xác nhận": ["Đã xác nhận", "Đang giao", "Đã hủy"],
        "Đang giao": ["Đang giao", "Đã giao", "Đã hủy"],
        "Đã giao": ["Đã giao"], 
        "Đã hủy": ["Đã hủy"]    
    };

    const validOptions = allowedTransitions[currentStatus] || [currentStatus];
    const isTerminalState = currentStatus === "Đã giao" || currentStatus === "Đã hủy";

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Cập nhật đơn hàng</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {isTerminalState ? (
                                <div className="alert alert-warning">
                                    Đơn hàng này đang ở trạng thái <strong>{currentStatus}</strong> và không thể thay đổi trạng thái giao hàng.
                                </div>
                            ) : (
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Trạng thái giao hàng:</label>
                                    <select
                                        className="form-select"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        {validOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* THÊM PHẦN CẬP NHẬT TRẠNG THÁI THANH TOÁN CHO MỤC ĐÍCH TEST */}
                            <div className="mb-3 mt-4 pt-3 border-top">
                                <label className="form-label fw-bold text-primary">Trạng thái thanh toán:</label>
                                <select
                                    className="form-select"
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                >
                                    <option value="Chưa thanh toán">Chưa thanh toán</option>
                                    <option value="Đã thanh toán">Đã thanh toán</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Đóng
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default StatusModal;