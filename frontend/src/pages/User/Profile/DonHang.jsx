import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "../../../utils/api";

function DonHang() {

    const outletCtx = useOutletContext() || {};
    const orders = outletCtx.orders || [];
    const fetchOrders = outletCtx.fetchOrders;

    const [filter, setFilter] = useState("all");

    const [currentPage, setCurrentPage] = useState(1);

    const ordersPerPage = 5;

    const handleCancelOrder = async (targetId) => {
        if (!targetId) {
            alert("Không tìm thấy mã đơn hàng!");
            return;
        }

        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?"))
            return;

        try {
            const response = await fetch(
                `${API_BASE}/api/orders/${targetId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        TrangThaiDonHang: "Đã hủy",
                        isUserCancel: true
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Hủy đơn hàng thành công!");
                if (typeof fetchOrders === "function") {
                    fetchOrders();
                }
            } else {
                alert(data.message || "Có lỗi xảy ra khi hủy đơn.");
            }

        } catch (error) {

            console.error(error);

            alert("Lỗi kết nối máy chủ.");

        }

    };

    //============================
    // LỌC ĐƠN
    //============================

    const filteredOrders = orders.filter((o) => {

        switch (filter) {

            case "cancelled":
                return o.TrangThaiDonHang === "Đã hủy";

            case "active":
                return o.TrangThaiDonHang !== "Đã hủy";

            case "paid":
                return o.TrangThaiThanhToan === "Đã thanh toán";

            case "unpaid":
                return o.TrangThaiThanhToan !== "Đã thanh toán";

            default:
                return true;
        }

    });

    //============================
    // PHÂN TRANG
    //============================

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const indexOfLastOrder = currentPage * ordersPerPage;

    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

    const currentOrders = filteredOrders.slice(
        indexOfFirstOrder,
        indexOfLastOrder
    );

    return (

        <div className="shadow-sm rounded p-3 bg-white mt-3 border">

            <div className="d-flex justify-content-between align-items-center mb-3">

                <h5 className="fw-bold text-success mb-0">

                    Đơn hàng của bạn

                </h5>

                <select
                    className="form-select w-auto"
                    value={filter}
                    onChange={(e) => {

                        setFilter(e.target.value);

                        setCurrentPage(1);

                    }}
                >
                    <option value="all">Tất cả</option>

                    <option value="active">
                        Chưa hủy
                    </option>

                    <option value="cancelled">
                        Đã hủy
                    </option>

                    <option value="paid">
                        Đã thanh toán
                    </option>

                    <option value="unpaid">
                        Chưa thanh toán
                    </option>

                </select>

            </div>

            {filteredOrders.length === 0 ? (

                <div className="text-center text-muted py-4">

                    Không có đơn hàng.

                </div>

            ) : (

                <>
                    <div className="table-responsive">

                        <table className="table table-hover align-middle">

                            <thead className="table-light">

                                <tr>

                                    <th>Ngày đặt</th>

                                    <th>Tổng tiền</th>

                                    <th>Trạng thái</th>

                                    <th>Thanh toán</th>

                                    <th>Thao tác</th>

                                </tr>

                            </thead>

                            <tbody>

                                {currentOrders.map((o) => {
                                    const orderStatus = o.TrangThaiDonHang || o.TrangThai || "Chờ xác nhận";
                                    const paymentStatus = o.TrangThaiThanhToan || "Chưa thanh toán";
                                    // Đơn hàng đã được xác nhận hoặc đã thanh toán thì không thể hủy
                                    const canCancel =
                                        orderStatus === "Chờ xác nhận" &&
                                        paymentStatus !== "Đã thanh toán";
                                    const orderId = o.MaDH || o.maDH || o.id;

                                    return (

                                        <tr key={orderId}>

                                            <td>
                                                {new Date(
                                                    o.NgayDat
                                                ).toLocaleDateString("vi-VN")}
                                            </td>

                                            <td className="text-danger fw-bold">
                                                {Number(
                                                    o.TongTien
                                                ).toLocaleString()} đ
                                            </td>

                                            <td>

                                                <span
                                                    className={`badge ${
                                                        o.TrangThaiDonHang ===
                                                        "Đã giao"
                                                            ? "bg-success"
                                                            : o.TrangThaiDonHang ===
                                                              "Đã hủy"
                                                            ? "bg-danger"
                                                            : "bg-warning text-dark"
                                                    }`}
                                                >

                                                    {o.TrangThaiDonHang}

                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={`badge ${
                                                        o.TrangThaiThanhToan ===
                                                        "Đã thanh toán"
                                                            ? "bg-info text-dark"
                                                            : "bg-secondary"
                                                    }`}
                                                >

                                                    {o.TrangThaiThanhToan}

                                                </span>

                                            </td>

                                            <td>

                                                {canCancel ? (

                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() =>
                                                            handleCancelOrder(
                                                                orderId
                                                            )
                                                        }
                                                    >
                                                        Hủy đơn
                                                    </button>

                                                ) : (

                                                    <span className="text-muted small">

                                                        Không thể hủy

                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    );

                                })}

                            </tbody>

                        </table>

                    </div>

                    {/* PHÂN TRANG */}

                    {totalPages > 1 && (

                        <div className="d-flex justify-content-center mt-3">

                            <nav>

                                <ul className="pagination">

                                    <li
                                        className={`page-item ${
                                            currentPage === 1
                                                ? "disabled"
                                                : ""
                                        }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() =>
                                                setCurrentPage(
                                                    currentPage - 1
                                                )
                                            }
                                        >
                                            «
                                        </button>
                                    </li>

                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => (

                                            <li
                                                key={i}
                                                className={`page-item ${
                                                    currentPage === i + 1
                                                        ? "active"
                                                        : ""
                                                }`}
                                            >

                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        setCurrentPage(i + 1)
                                                    }
                                                >
                                                    {i + 1}
                                                </button>

                                            </li>

                                        )
                                    )}

                                    <li
                                        className={`page-item ${
                                            currentPage === totalPages
                                                ? "disabled"
                                                : ""
                                        }`}
                                    >

                                        <button
                                            className="page-link"
                                            onClick={() =>
                                                setCurrentPage(
                                                    currentPage + 1
                                                )
                                            }
                                        >
                                            »
                                        </button>

                                    </li>

                                </ul>

                            </nav>

                        </div>

                    )}

                </>

            )}

        </div>

    );

}

export default DonHang;