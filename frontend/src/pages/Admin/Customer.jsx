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

        const confirmAction = window.confirm(

            customer.TrangThai
                ? "Bạn có chắc muốn khóa tài khoản này?"
                : "Bạn có chắc muốn mở khóa tài khoản này?"

        );

        if (!confirmAction) return;

        try {

            await updateCustomerStatus(

                customer.MaKH,

                {
                    TrangThai: !customer.TrangThai
                }

            );

            alert("Cập nhật thành công");

            fetchCustomers();

        } catch (error) {

            console.log(error);

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