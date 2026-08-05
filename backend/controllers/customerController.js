const customerModel = require("../models/customerModel");

const getAllCustomers = async (req, res) => {

    try {

        const customers = await customerModel.getAllCustomers();

        res.json(customers);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Lỗi server"
        });

    }

};

const updateStatus = async (req, res) => {

    try {

        const customers = await customerModel.getAllCustomers();
        const targetCustomer = customers.find(c => Number(c.MaKH) === Number(req.params.id) || Number(c.MaTK) === Number(req.params.id));

        if (targetCustomer && (targetCustomer.VaiTro === "Admin" || targetCustomer.Email === "admin@gmail.com")) {
            return res.status(400).json({
                message: "Tài khoản Quản trị viên (Admin) luôn luôn mở khóa và không thể bị khóa!"
            });
        }

        await customerModel.updateStatus(
            req.params.id,
            req.body.TrangThai
        );

        res.json({
            message: "Cập nhật trạng thái thành công"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({ message: "Lỗi máy chủ khi cập nhật trạng thái" });

    }

};

module.exports = {
    getAllCustomers,
    updateStatus
};