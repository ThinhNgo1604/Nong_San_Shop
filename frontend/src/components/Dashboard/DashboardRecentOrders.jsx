function DashboardRecentOrders({
    orders
}){

return(

<div className="card mt-4">
    <div className="card-body">
        <h5>
            Đơn hàng mới nhất

        </h5>
        <table className="table">
            <thead>
                <tr>

                    <th>Mã</th>

                    <th>Khách</th>

                    <th>Tổng tiền</th>

                    <th>Trạng thái</th>

                </tr>

            </thead>

            <tbody>
                {
                orders.map(order=>

                <tr key={order.MaDH}>

                    <td>{order.MaDH}</td>

                    <td>{order.HoTen}</td>

                    <td>
                        {Number(order.TongTien).toLocaleString()} đ

                    </td>

                    <td>{order.TrangThaiDonHang}</td>

                </tr>
                )}

            </tbody>

        </table>

    </div>

</div>

)}

export default DashboardRecentOrders;