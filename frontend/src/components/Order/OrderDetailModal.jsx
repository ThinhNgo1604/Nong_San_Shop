function OrderDetailModal({ details, onClose }) {

    return (

        <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >

            <div className="modal-dialog modal-lg">

                <div className="modal-content">

                    <div className="modal-header">

                        <h5>Chi tiết đơn hàng</h5>

                        <button
                            className="btn-close"
                            onClick={onClose}
                        ></button>

                    </div>

                    <div className="modal-body">

                        <table className="table table-bordered">

                            <thead>

                                <tr>

                                    <th>Sản phẩm</th>

                                    <th>Số lượng</th>

                                    <th>Đơn giá</th>

                                    <th>Thành tiền</th>

                                </tr>

                            </thead>

                            <tbody>

                                {
                                    details.map((item, index) => (

                                        <tr key={index}>

                                            <td>{item.TenSP}</td>

                                            <td>{item.SoLuong}</td>

                                            <td>
                                                {Number(item.DonGia).toLocaleString()} đ
                                            </td>

                                            <td>
                                                {Number(item.ThanhTien).toLocaleString()} đ
                                            </td>

                                        </tr>

                                    ))
                                }

                            </tbody>

                        </table>

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