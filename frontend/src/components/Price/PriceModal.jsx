import { useState } from "react";
import { updatePrice } from "../../services/Admin/priceApi";

function PriceModal({
    product,
    handleClose,
    reload
}) {

    const [formData, setFormData] = useState({
        GiaGoc: product.GiaGoc,
        GiamToiDa: product.GiamToiDa,
        TuDongGiamGia: product.TuDongGiamGia
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (Number(formData.GiaGoc) <= 0) {
            alert("Giá gốc phải lớn hơn 0.");
            return;
        }

        if (
            Number(formData.GiamToiDa) < 0 ||
            Number(formData.GiamToiDa) > 100
        ) {
            alert("Giảm tối đa phải từ 0 đến 100%.");
            return;
        }

        try {

            setLoading(true);

            await updatePrice(product.MaSP, {
                GiaGoc: Number(formData.GiaGoc),
                GiamToiDa: Number(formData.GiamToiDa),
                TuDongGiamGia: formData.TuDongGiamGia
            });

            await reload();

            alert("Cập nhật giá thành công!");

            handleClose();

        } catch (err) {

            console.log(err);

            alert("Không thể cập nhật giá.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div
            className="modal fade show"
            style={{
                display: "block",
                backgroundColor: "rgba(0,0,0,.5)"
            }}
        >

            <div className="modal-dialog">

                <div className="modal-content">

                    <div className="modal-header">

                        <h5 className="modal-title">
                            Cập nhật giá sản phẩm
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        />

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="modal-body">

                            <div className="mb-3">

                                <label className="form-label">
                                    Tên sản phẩm
                                </label>

                                <input
                                    className="form-control"
                                    value={product.TenSP}
                                    disabled
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">
                                    Giá bán hiện tại
                                </label>

                                <input
                                    className="form-control"
                                    value={
                                        Number(product.DonGia).toLocaleString("vi-VN") + " đ"
                                    }
                                    disabled
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">
                                    Giá gốc
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="GiaGoc"
                                    value={formData.GiaGoc}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">
                                    Giảm tối đa (%)
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="GiamToiDa"
                                    value={formData.GiamToiDa}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="form-check">

                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="TuDongGiamGia"
                                    checked={formData.TuDongGiamGia}
                                    onChange={handleChange}
                                />

                                <label className="form-check-label">
                                    Bật tự động giảm giá
                                </label>

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClose}
                            >
                                Đóng
                            </button>

                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang lưu..."
                                    : "Lưu thay đổi"}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );

}

export default PriceModal;