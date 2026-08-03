import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import HeaderAdmin from "../components/HeaderAdmin";

function AdminLayout() {

    return (

        <div>

            <Sidebar />

            <div
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    background: "#f8f9fa"
                }}
            >

                <HeaderAdmin />

                <div className="p-4">

                    <Outlet />

                </div>

            </div>

        </div>

    );

}

export default AdminLayout;