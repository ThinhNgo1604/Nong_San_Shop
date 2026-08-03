function CustomerTable({
    customers,
    onLock
}) {
    const getRankInfo = (customer) => {
        if (customer.TenHang) return customer.TenHang;
        if (customer.Hang) return customer.Hang;

        const points = Number(customer.DiemThuong ?? customer.DiemXepHang ?? 0);
        if (points >= 10000) return "Kim Cương";
        if (points >= 5000) return "Vàng";
        if (points >= 1000) return "Bạc";
        return "Đồng";
    };

    const getRankBadgeClass = (rank) => {
        switch (rank) {
            case "Kim Cương":
                return "bg-info text-white";
            case "Vàng":
                return "bg-warning text-dark";
            case "Bạc":
                return "bg-secondary text-white";
            case "Đồng":
            default:
                return "bg-dark-subtle text-dark border border-secondary-subtle";
        }
    };

    return (

        <table className="table table-bordered table-hover align-middle">

            <thead className="table-success">

                <tr>

                    <th>Họ tên</th>

                    <th>Email</th>

                    <th>SĐT</th>

                    <th>Hạng</th>

                    <th>Điểm</th>

                    <th>Trạng thái</th>

                    <th width="180">
                        Thao tác
                    </th>

                </tr>

            </thead>

            <tbody>

                {
                    customers.map(customer => {
                        const rank = getRankInfo(customer);
                        const points = Number(customer.DiemThuong ?? customer.DiemXepHang ?? 0);
                        const isAdmin = customer.VaiTro === "Admin" || customer.Email === "admin@gmail.com";
                        const isActive = isAdmin || customer.TrangThai === true || customer.TrangThai === 1 || customer.TrangThai === "1" || customer.TrangThai === "Hoạt động";

                        return (
                            <tr key={customer.MaKH || customer.Email}>

                                <td className="fw-medium">
                                    <div className="d-flex align-items-center gap-2">
                                        {(customer.HinhAnh || customer.avatarUrl) ? (
                                            <img
                                                src={customer.HinhAnh || customer.avatarUrl}
                                                alt="Avatar"
                                                className="rounded-circle border"
                                                style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center fw-bold"
                                                style={{ width: "32px", height: "32px", fontSize: "14px" }}
                                            >
                                                {(customer.HoTen || customer.Email || "U").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span>{customer.HoTen}</span>
                                    </div>
                                </td>

                                <td>{customer.Email}</td>

                                <td>{customer.SoDienThoai || "---"}</td>

                                <td>
                                    <span className={`badge ${getRankBadgeClass(rank)} px-2 py-1`}>
                                        {rank}
                                    </span>
                                </td>

                                <td className="fw-semibold text-end">{points.toLocaleString()}</td>

                                <td>
                                    <span className={`badge ${isActive ? "bg-success" : "bg-danger"} px-2 py-1`}>
                                        {isActive ? "Hoạt động" : "Đã khóa"}
                                    </span>
                                </td>

                                <td>
                                    {isAdmin ? (
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            disabled
                                            style={{ cursor: "not-allowed", opacity: 0.75 }}
                                            title="Tài khoản Quản trị viên (Admin) luôn mở khóa"
                                        >
                                            Không thể khóa
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn btn-sm ${isActive ? "btn-outline-danger" : "btn-success"}`}
                                            onClick={() => onLock(customer)}
                                        >
                                            {isActive ? "Khóa" : "Mở khóa"}
                                        </button>
                                    )}
                                </td>

                            </tr>
                        );
                    })
                }

            </tbody>

        </table>

    );

}

export default CustomerTable;