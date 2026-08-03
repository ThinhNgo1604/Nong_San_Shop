import { useEffect, useState } from "react";

import {
    getCustomers,
    updateCustomerStatus
} from "../../services/Admin/customerApi";

import CustomerTable from "../../components/Customer/CustomerTable";

function Customer() {

    const [customers, setCustomers] = useState([]);

    useEffect(() => {

        fetchCustomers();

    }, []);

    async function fetchCustomers() {

        try {

            const res = await getCustomers();

            setCustomers(res.data);

        } catch (error) {

            console.log(error);

        }

    }

    const handleLock = async (customer) => {
        if (customer.VaiTro === "Admin" || customer.Email === "admin@gmail.com") {
            alert("Tài khoản Quản trị viên (Admin) luôn luôn mở khóa và không thể bị khóa!");
            return;
        }

        const isActive = customer.TrangThai === true || customer.TrangThai === 1 || customer.TrangThai === "1" || customer.TrangThai === "Hoạt động";

        const confirmAction = window.confirm(
            isActive
                ? `Bạn có chắc muốn KHÓA tài khoản ${customer.HoTen || customer.Email}?`
                : `Bạn có chắc muốn MỞ KHÓA tài khoản ${customer.HoTen || customer.Email}?`
        );

        if (!confirmAction) return;

        try {

            await updateCustomerStatus(

                customer.MaKH,

                {
                    TrangThai: !isActive
                }

            );

            alert("Cập nhật thành công!");

            fetchCustomers();

        } catch (error) {

            console.log(error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái");

        }

    };

    return (

        <div className="container-fluid">

            <h2 className="mb-4">

                Quản lý khách hàng

            </h2>

            <CustomerTable
                customers={customers}
                onLock={handleLock}
            />

        </div>

    );

}

export default Customer;