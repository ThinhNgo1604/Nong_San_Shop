import { useEffect, useState } from "react";
import { getPrices } from "../../services/Admin/priceApi";
import PriceTable from "../../components/Price/PriceTable";
import PriceModal from "../../components/Price/PriceModal";

function Price() {

    const [prices, setPrices] = useState([]);
    const [selected, setSelected] = useState(null);
    const [show, setShow] = useState(false);

    const loadData = async () => {
        try {
            const res = await getPrices();
            setPrices(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (item) => {
        setSelected(item);
        setShow(true);
    };

    return (
        <div className="container-fluid">

            <div className="card shadow">

                <div className="card-header bg-success text-white">
                    <h4 className="mb-0">
                        Quản lý giá sản phẩm
                    </h4>
                </div>

                <div className="card-body">

                    <PriceTable
                        data={prices}
                        onEdit={handleEdit}
                    />

                </div>

            </div>

            {
                show &&
                <PriceModal
                    show={show}
                    handleClose={() => setShow(false)}
                    product={selected}
                    reload={loadData}
                />
            }

        </div>
    );

}

export default Price;