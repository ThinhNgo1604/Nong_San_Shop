import { useEffect, useState } from "react";

import {
    getVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher
} from "../../services/Admin/voucherApi";

import VoucherForm from "../../components/Voucher/VoucherForm";
import VoucherTable from "../../components/Voucher/VoucherTable";

function Voucher() {

    const [vouchers, setVouchers] = useState([]);

    const [editingVoucher, setEditingVoucher] = useState(null);

    const fetchVouchers = async () => {

        try {

            const res = await getVouchers();

            setVouchers(res.data);

        } catch (error) {

            console.log(error);

        }

    };

    useEffect(() => {

        fetchVouchers();

    }, []);

    // ===========================
    // THÊM
    // ===========================
const handleAdd = async (data) => {

    const isExist = vouchers.some(v =>
        v.Code.trim().toUpperCase() ===
        data.Code.trim().toUpperCase()
    );

    if (isExist) {

        return {
            codeError: "Mã giảm giá đã tồn tại."
        };

    }

    try {

        await createVoucher(data);

        alert("Thêm mã giảm giá thành công");

        fetchVouchers();

        return {
            success: true
        };

    } catch (error) {

        console.log(error);

    }

};

    // ===========================
    // CẬP NHẬT
    // ===========================
const handleUpdate = async (id, data) => {

    const isExist = vouchers.some(v =>
        v.MaGG !== id &&
        v.Code.trim().toUpperCase() ===
        data.Code.trim().toUpperCase()
    );

    if (isExist) {

        return {
            codeError: "Mã giảm giá đã tồn tại."
        };

    }

    try {

        await updateVoucher(id, data);

        alert("Cập nhật thành công");

        fetchVouchers();

        setEditingVoucher(null);

        return {
            success: true
        };

    } catch (error) {

        console.log(error);

    }

};

    // ===========================
    // XÓA
    // ===========================

    const handleDelete = async (id) => {

        if (!window.confirm("Bạn có chắc muốn xóa?"))
            return;

        try {

            await deleteVoucher(id);

            alert("Đã xóa");

            fetchVouchers();

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Không thể xóa."
            );

        }

    };

    return (

        <div className="container">

            <div className="d-flex justify-content-between mb-3">

                <h2>
                    Quản lý mã giảm giá
                </h2>

                <button
                    className="btn btn-success"
                    onClick={() => setEditingVoucher(null)}
                >
                    + Thêm mã giảm giá
                </button>

            </div>

            <VoucherForm
                editingVoucher={editingVoucher}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onCancel={() => setEditingVoucher(null)}
            />

            <VoucherTable
                vouchers={vouchers}
                onEdit={setEditingVoucher}
                onDelete={handleDelete}
            />

        </div>

    );

}

export default Voucher;