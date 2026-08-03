function OrderDetailModal({ details, onClose }) {
    const list = Array.isArray(details) ? details : [];

    return (
        <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 2000, overflowY: "auto" }}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Chi tiết đơn hàng</h5>
                        <button
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>

                    <div className="modal-body">
                        {list.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                Không tìm thấy chi tiết sản phẩm cho đơn hàng này.
                            </div>
                        ) : (
                            <table className="table table-bordered align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th className="text-center" width="100">Số lượng</th>
                                        <th className="text-end" width="140">Đơn giá</th>
                                        <th className="text-end" width="140">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((item, index) => (
                                        <tr key={index}>
                                            <td className="fw-medium">{item.TenSP}</td>
                                            <td className="text-center">{item.SoLuong}</td>
                                            <td className="text-end">
                                                {Number(item.DonGia || 0).toLocaleString()} đ
                                            </td>
                                            <td className="text-end fw-semibold text-danger">
                                                {Number(item.ThanhTien || 0).toLocaleString()} đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetailModal;