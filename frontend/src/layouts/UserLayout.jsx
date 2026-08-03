import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function UserLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />

            <main
                style={{
                    paddingTop: "80px",
                    flex: 1
                }}
            >
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default UserLayout;