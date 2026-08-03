import {

Bar

} from "react-chartjs-2";

function TopProducts({

data

}){

    return(

        <div className="card shadow-sm">

            <div className="card-body">

                <h5>

                    Top 5 sản phẩm bán chạy

                </h5>

                <Bar

                    data={{

                        labels:data.map(x=>x.TenSP),

                        datasets:[{

                            label:"Đã bán",

                            data:data.map(x=>x.SoLuongBan),

                            backgroundColor:"#198754"

                        }]

                    }}

                />

            </div>

        </div>

    )

}

export default TopProducts;