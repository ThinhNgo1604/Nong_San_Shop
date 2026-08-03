import {

    Chart as ChartJS,

    CategoryScale,

    LinearScale,

    PointElement,

    LineElement,

    Tooltip,

    Legend

} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(

    CategoryScale,

    LinearScale,

    PointElement,

    LineElement,

    Tooltip,

    Legend

);

function RevenueChart({chartData}){

    const data={

        labels:chartData.map(item=>item.Ngay),

        datasets:[

            {

                label:"Doanh thu",

                data:chartData.map(item=>item.DoanhThu),

                borderColor:"#198754",

                backgroundColor:"rgba(25,135,84,.2)",

                tension:.3,

                fill:true

            }

        ]

    };

    return(

        <div className="card">

            <div className="card-body">

                <h5 className="mb-3">

                    Biểu đồ doanh thu

                </h5>

                <Line data={data}/>

            </div>

        </div>

    );

}

export default RevenueChart;