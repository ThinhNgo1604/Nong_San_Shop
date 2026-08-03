function CustomerTable({
    customers,
    onLock
}) {

    return (

        <table className="table table-bordered table-hover">

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
                    customers.map(customer => (

                        <tr key={customer.MaKH}>

                            <td>{customer.HoTen}</td>

                            <td>{customer.Email}</td>

                            <td>{customer.SoDienThoai}</td>

                            <td>{customer.TenHang ?? "Chưa có"}</td>

                            <td>{customer.DiemThuong}</td>

                            <td>

                                {
                                    customer.TrangThai
                                        ? "Hoạt động"
                                        : "Đã khóa"
                                }

                            </td>

                            <td>

                                <button
                                    className={`btn btn-sm ${
                                        customer.TrangThai
                                            ? "btn-danger"
                                            : "btn-success"
                                    }`}
                                    onClick={() => onLock(customer)}
                                >

                                    {
                                        customer.TrangThai
                                            ? "Khóa"
                                            : "Mở khóa"
                                    }

                                </button>

                            </td>

                        </tr>

                    ))
                }

            </tbody>

        </table>

    );

}

export default CustomerTable;