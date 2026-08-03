function CategoryTable({ 
    categories,
    onEdit,
    onDelete 
}) {
    if (!categories || categories.length === 0) {
        return (
            <div className="alert alert-info text-center shadow-sm">
                Chưa có danh mục nào.
            </div>
        );
    }

    return (
        <div className="table-responsive shadow-sm rounded">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-success">
                    <tr>
                        <th style={{ width: "60px" }} className="text-center">STT</th>
                        <th>Tên danh mục</th>
                        <th>Mô tả</th>
                        <th style={{ width: "160px" }} className="text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category, index) => {
                        const id = category.MaDM || category.maDM || category.id;
                        return (
                            <tr key={id || index}>
                                <td className="text-center text-muted fw-bold">{index + 1}</td>
                                <td className="fw-bold">{category.TenDM || category.tenDM}</td>
                                <td>{category.MoTa || category.moTa || <em className="text-muted">Không có mô tả</em>}</td>
                                <td className="text-center">
                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        onClick={() => onEdit(category)}
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => onDelete(id)}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default CategoryTable;