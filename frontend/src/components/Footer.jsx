import {
    FaFacebookF,
    FaPhoneAlt,
    FaEnvelope,
    FaMapMarkerAlt,
    FaLeaf
} from "react-icons/fa";

import { Link } from "react-router-dom";

function Footer() {

    return (

        <footer
            className="mt-auto"
            style={{
                background: "#2e7d32",
                color: "#fff"
            }}
        >

            <div className="container py-5">

                <div className="row">

                    {/* Giới thiệu */}

                    <div className="col-lg-4 mb-4">

                        <h4 className="fw-bold mb-3">
                            🌱 Nông Sản Shop
                        </h4>

                        <p className="mb-3">
                            Chuyên cung cấp nông sản sạch, rau củ quả tươi,
                            trái cây chất lượng cao với nguồn gốc rõ ràng.
                        </p>

                        <div className="d-flex align-items-center mb-2">

                            <FaMapMarkerAlt className="me-2" />

                            <span>
                                123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh
                            </span>

                        </div>

                        <div className="d-flex align-items-center mb-2">

                            <FaPhoneAlt className="me-2" />

                            <span>0901 234 567</span>

                        </div>

                        <div className="d-flex align-items-center">

                            <FaEnvelope className="me-2" />

                            <span>support@nongsanshop.vn</span>

                        </div>

                    </div>

                    {/* Chính sách */}

                    <div className="col-lg-2 col-md-6 mb-4">

                        <h5 className="fw-bold mb-3">
                            Chính sách
                        </h5>

                        <ul className="list-unstyled">

                            <li className="mb-2">
                                <Link
                                    to="/"
                                    className="text-white text-decoration-none"
                                >
                                    Chính sách đổi trả
                                </Link>
                            </li>

                            <li className="mb-2">
                                <Link
                                    to="/"
                                    className="text-white text-decoration-none"
                                >
                                    Chính sách bảo mật
                                </Link>
                            </li>

                            <li className="mb-2">
                                <Link
                                    to="/"
                                    className="text-white text-decoration-none"
                                >
                                    Điều khoản sử dụng
                                </Link>
                            </li>

                        </ul>

                    </div>

                    {/* Hỗ trợ */}

                    <div className="col-lg-3 col-md-6 mb-4">

                        <h5 className="fw-bold mb-3">
                            Hỗ trợ khách hàng
                        </h5>

                        <ul className="list-unstyled">

                            <li className="mb-2">
                                <Link
                                    to="/products"
                                    className="text-white text-decoration-none"
                                >
                                    Danh sách sản phẩm
                                </Link>
                            </li>

                            <li className="mb-2">
                                <Link
                                    to="/cart"
                                    className="text-white text-decoration-none"
                                >
                                    Giỏ hàng
                                </Link>
                            </li>

                            <li className="mb-2">
                                <Link
                                    to="/profile"
                                    className="text-white text-decoration-none"
                                >
                                    Theo dõi đơn hàng
                                </Link>
                            </li>

                            <li className="mb-2">
                                <Link
                                    to="/profile/thong-bao"
                                    className="text-white text-decoration-none"
                                >
                                    Thông báo
                                </Link>
                            </li>

                        </ul>

                    </div>

                    {/* Mạng xã hội */}

                    <div className="col-lg-3 mb-4">

                        <h5 className="fw-bold mb-3">
                            Kết nối với chúng tôi
                        </h5>

                        <p>
                            Theo dõi để nhận nhiều chương trình khuyến mãi mới nhất.
                        </p>

                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-light rounded-circle me-2"
                        >
                            <FaFacebookF />
                        </a>

                        <div className="mt-4">

                            <div className="d-flex align-items-center">

                                <FaLeaf className="me-2" />

                                <span>
                                    Cam kết 100% nông sản sạch
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            <div
                style={{
                    borderTop: "1px solid rgba(255,255,255,.2)"
                }}
            >

                <div className="container py-3 d-flex justify-content-between flex-wrap">

                    <span>
                        © 2026 Nông Sản Shop. All rights reserved.
                    </span>

                    <span>
                        Đồ án môn học - HUFLIT
                    </span>

                </div>

            </div>

        </footer>

    );

}

export default Footer;