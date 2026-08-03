function DashboardCards({ data }) {

    const cards = [

        {

            title:"Doanh thu",

            value:Number(data.revenue)
                .toLocaleString()+" đ",

            color:"success"

        },

        {

            title:"Đơn hàng",

            value:data.orders,

            color:"primary"

        },

        {

            title:"Khách hàng",

            value:data.customers,

            color:"warning"

        },

        {

            title:"Sản phẩm",

            value:data.products,

            color:"danger"

        }

    ];

    return(

        <div className="row">

            {

                cards.map(card=>

                    <div

                        className="col-md-3"

                        key={card.title}

                    >

                        <div

                            className={`card border-${card.color} mb-3`}

                        >

                            <div className="card-body">

                                <h6>{card.title}</h6>

                                <h3>{card.value}</h3>

                            </div>

                        </div>

                    </div>

                )

            }

        </div>

    )

}

export default DashboardCards;