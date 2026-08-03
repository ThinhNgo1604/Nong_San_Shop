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

        await customerModel.updateStatus(
            req.params.id,
            req.body.TrangThai
        );

        res.json({
            message: "Cập nhật thành công"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

};

module.exports = {
    getAllCustomers,
    updateStatus
};