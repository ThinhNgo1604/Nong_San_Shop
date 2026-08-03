function CategoryTable({ 
                        categories,
                        onEdit,
                        onDelete 
                     }) {

    return (

        <table className="table table-bordered table-hover">

            <thead className="table-success">

                <tr>

                    <th>Tên danh mục</th>

                    <th>Mô tả</th>

                    <th width="180">
                        Thao tác
                    </th>

                </tr>

            </thead>

            <tbody>

                {

                    categories.map(category => (

                        <tr key={category.MaDM}>


                            <td>{category.TenDM}</td>

                            <td>{category.MoTa}</td>

                            <td>

                                <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => onEdit(category)}
                                >
                                    Sửa
                                </button>

                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => onDelete(category.MaDM)}
                                >
                                    Xóa
                                </button>

                            </td>

                        </tr>

                    ))

                }

            </tbody>

        </table>

    );

}

export default CategoryTable;