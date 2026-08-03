const dashboardModel = require("../models/dashboardModel");

const getDashboard = async (req, res) => {

    try {

        const data = await dashboardModel.getDashboard();

        res.json(data);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Lỗi server"
        });

    }

};

module.exports = {
    getDashboard
};