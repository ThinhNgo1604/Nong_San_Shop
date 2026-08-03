const reportModel = require("../models/reportModel");

const getDashboardReport = async (req, res) => {

    try {

        const { from, to } = req.query;

        const data = await reportModel.getDashboardReport(from, to);

        res.json(data);

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

const getRevenueChart = async (req, res) => {

    try {

        const { from, to } = req.query;

        const data = await reportModel.getRevenueChart(from, to);

        res.json(data);

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};
const getTopProducts = async(req,res)=>{

    try{

        const {from,to}=req.query;

        const result=await reportModel.getTopProducts(from,to);

        res.json(result);

    }catch (err) {
    console.log(err);

    res.status(500).json({
        message: err.message,
        stack: err.stack
    });
}

}

module.exports = {

    getDashboardReport,

    getRevenueChart,

    getTopProducts

};