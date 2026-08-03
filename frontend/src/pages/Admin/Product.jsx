import { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/api";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "../../services/Admin/productApi";

import { getCategories } from "../../services/Admin/categoryApi";

import ProductForm from "../../components/Product/ProductForm";

import Pagination from "../../components/Common/Pagination";

function Product() {

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [page,setPage]=useState(1);
    const [totalPages,setTotalPages]=useState(1);
    useEffect(() => {

    fetchProducts(page);
    fetchCategories();

}, [page]);

    async function fetchProducts(currentPage) {

        try {

            const res = await getProducts(currentPage);

            setProducts(res.data.products);

            setTotalPages(res.data.totalPages); 

        } catch (error) {

            console.log(error);

        }

    }

    async function fetchCategories() {

        try {

            const res = await getCategories();

            setCategories(res.data);

        } catch (error) {

            console.log(error);

        }

    }
const handleSave = async (data) => {

    try {

        if (editingProduct) {

            await updateProduct(editingProduct.MaSP, data);

            alert("Cập nhật thành công");

        } else {

            await createProduct(data);

            alert("Thêm thành công");

        }

        await fetchProducts(page);

        setEditingProduct(null);

    } catch (error) {

        alert(
            error.response?.data?.message ||
            "Có lỗi xảy ra."
        );

        console.log(error);

    }

};
    const handleDelete = async (id) => {

        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

        try {

            await deleteProduct(id);

            alert("Đã xóa");

            await fetchProducts(page);

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Không thể xóa sản phẩm."
            );

            console.log(err);

        }

    };
    return (

        <div className="container-fluid">

            <div className="d-flex justify-content-between mb-3">

                <h2>Quản lý sản phẩm</h2>

            <button
                className="btn btn-success"
                onClick={() => setEditingProduct(null)}
            >
                + Thêm sản phẩm
            </button>
            </div>

            <ProductForm
                onAdd={handleSave}
                categories={categories}
                editingProduct={editingProduct}
            />

            <table className="table table-bordered table-hover">

                <thead className="table-success">

                    <tr>
                        
                        <th>Tên sản phẩm</th>

                        <th>Hình ảnh</th>

                        <th>Danh mục</th>

                        <th>Giá</th>

                        <th>Tồn kho</th>

                        <th>Đơn vị</th>

                        <th>Trạng thái</th>

                        <th width="180">Thao tác</th>

                    </tr>

                </thead>

                <tbody>

                    {
                        products.map(product => (

                            <tr key={product.MaSP}>


                                <td>{product.TenSP}</td>
                                
                                <td>
                            <img
                                src={getImageUrl(product.HinhAnh)}
                                alt={product.TenSP}
                                width="70"
                                height="70"
                                style={{
                                    objectFit: "cover",
                                    borderRadius: "8px"
                                }}
                            />
                        </td>

                                <td>{product.TenDM}</td>

                                <td>{Number(product.GiaGoc).toLocaleString()} đ</td>

                                <td>{product.SoLuongTon}</td>

                                <td>{product.DonViTinh}</td>

                                <td>
                                    {product.TrangThai === 0 ? (
                                        <span className="badge bg-secondary">Đã ẩn</span>
                                    ) : product.SoLuongTon === 0 ? (
                                        <span className="badge bg-danger">Hết hàng</span>
                                    ) : (
                                        <span className="badge bg-success">Đang bán</span>
                                    )}
                                </td>

                                <td>

                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        onClick={() => {
                                            setEditingProduct(product);
                                        }}
                                    >
                                        Sửa
                                    </button>

                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(product.MaSP)}
                                    >
                                        Xóa
                                    </button>

                                </td>
                            </tr>

                        ))
                    }

                </tbody>

            </table>
        <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
        />
        </div>

    );

}

export default Product;