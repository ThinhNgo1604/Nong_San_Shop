import { useEffect, useState } from "react";
import { getOrders, getOrderDetail, updateOrderStatus } from "../../services/Admin/orderApi";
import OrderTable from "../../components/Order/OrderTable";
import OrderDetailModal from "../../components/Order/OrderDetailModal";
import StatusModal from "../../components/Order/StatusModal";

function Order() {
    const [orders, setOrders] = useState([]);
    const [details, setDetails] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    // States cho bộ lọc
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 8; 
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    // Hàm gọi API kèm params
    async function fetchOrders() {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterFromDate) params.fromDate = filterFromDate;
            if (filterToDate) params.toDate = filterToDate;

            const res = await getOrders(params);
            setOrders(res.data);
            setCurrentPage(1);
        } catch (error) {
            console.log(error);
        }
    }

    const handleDetail = async (id) => {
        try {
            const res = await getOrderDetail(id);
            setDetails(res.data);
            setShowModal(true);
        } catch (error) {
            console.log(error);
        }
    };

    const handleUpdateStatus = async (id, data) => {
        try {
            await updateOrderStatus(id, data);
            alert("Cập nhật thành công!");
            setEditingOrder(null);
            fetchOrders();
        } catch (error) {
            console.log(error);
        }
    };

    // Hàm đặt lại bộ lọc
    const handleResetFilter = () => {
        setFilterStatus("");
        setFilterFromDate("");
        setFilterToDate("");
        // Sau khi clear state, gọi lại api toàn bộ
        setTimeout(() => fetchOrders(), 0); 
    };
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentOrders = orders.slice(
        startIndex,
        startIndex + itemsPerPage
    );
    return (
        <div className="container-fluid">
            <h2 className="mb-4">Quản lý đơn hàng</h2>

            {/* GIAO DIỆN BỘ LỌC */}
            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label">Trạng thái đơn hàng</label>
                            <select 
                                className="form-select" 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="Chờ xác nhận">Chờ xác nhận</option>
                                <option value="Đã xác nhận">Đã xác nhận</option>
                                <option value="Đang giao">Đang giao</option>
                                <option value="Đã giao">Đã giao</option>
                                <option value="Đã hủy">Đã hủy</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Từ ngày</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filterFromDate}
                                onChange={(e) => setFilterFromDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Đến ngày</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filterToDate}
                                onChange={(e) => setFilterToDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <button className="btn btn-primary me-2" onClick={fetchOrders}>
                                Lọc
                            </button>
                            <button className="btn btn-secondary" onClick={handleResetFilter}>
                                Xóa lọc
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <OrderTable
                orders={currentOrders}
                onDetail={handleDetail}
                onUpdate={setEditingOrder}
            />
            {totalPages > 1 && (
                <nav className="mt-4">
                    <ul className="pagination justify-content-center">

                        {/* Trang đầu */}
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(1)}
                            >
                                ««
                            </button>
                        </li>

                        {/* Trang trước */}
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                «
                            </button>
                        </li>

                        {/* Danh sách số trang */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <li
                                key={page}
                                className={`page-item ${
                                    currentPage === page ? "active" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            </li>
                        ))}

                        {/* Trang sau */}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                »
                            </button>
                        </li>

                        {/* Trang cuối */}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(totalPages)}
                            >
                                »»
                            </button>
                        </li>

                    </ul>
                </nav>
            )}
            {showModal && (
                <OrderDetailModal
                    details={details}
                    onClose={() => setShowModal(false)}
                />
            )}
            
            {editingOrder && (
                <StatusModal
                    order={editingOrder}
                    onSave={handleUpdateStatus}
                    onClose={() => setEditingOrder(null)}
                />
            )}
        </div>
    );
}

export default Order;