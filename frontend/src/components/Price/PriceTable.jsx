function PriceTable({ data, onEdit }) {

    return (

        <table className="table table-bordered table-hover align-middle">

            <thead className="table-success">

                <tr>

                    <th width="70">STT</th>

                    <th>Tên sản phẩm</th>

                    <th className="text-end">
                        Giá gốc
                    </th>

                    <th className="text-end">
                        Giá bán hiện tại
                    </th>

                    <th className="text-center">
                        Giảm tối đa
                    </th>

                    <th className="text-center">
                        Tự động
                    </th>

                    <th width="120">
                        Thao tác
                    </th>

                </tr>

            </thead>

            <tbody>

                {

                    data.map((item, index) => (

                        <tr key={item.MaSP}>

                            <td>{index + 1}</td>

                            <td>{item.TenSP}</td>

                            <td className="text-end">

                                <span className="fw-bold">

                                    {Number(item.GiaGoc).toLocaleString()} đ

                                </span>

                            </td>

                            <td className="text-end">

                                <span className="text-danger fw-bold">

                                    {Number(item.DonGia).toLocaleString()} đ

                                </span>

                            </td>

                            <td className="text-center">

                                {item.GiamToiDa}%

                            </td>

                            <td className="text-center">

                                {

                                    item.TuDongGiamGia ?

                                        <span className="badge bg-success">
                                            Bật
                                        </span>

                                        :

                                        <span className="badge bg-secondary">
                                            Tắt
                                        </span>

                                }

                            </td>

                            <td>

                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => onEdit(item)}
                                >
                                    Sửa
                                </button>

                            </td>

                        </tr>

                    ))

                }

            </tbody>

        </table>

    );

}

export default PriceTable;