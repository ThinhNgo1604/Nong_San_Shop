import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/Admin/Dashboard";
import Category from "../pages/Admin/Category";
import Product from "../pages/Admin/Product";
import Price from "../pages/Admin/Price";
import Order from "../pages/Admin/Order";
import Customer from "../pages/Admin/Customer";
import Voucher from "../pages/Admin/Voucher";

import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home/Home";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import Products from "../pages/Products/Products";

import UserLayout from "../layouts/UserLayout";
import Login from "../pages/User/Login";
import Register from "../pages/User/Register";
import Profile from "../pages/User/Profile";

// Các trang con trong Profile
import HoSoCaNhan from "../pages/User/Profile/HoSoCaNhan";
import SoDiaChi from "../pages/User/Profile/SoDiaChi";
import DoiMatKhau from "../pages/User/Profile/DoiMatKhau";
import UuDaiThanhVien from "../pages/User/Profile/UuDaiThanhVien";
import DonHang from "../pages/User/Profile/DonHang";
import VoucherWallet from "../pages/User/Profile/VoucherWallet";
import Notification from "../pages/User/Profile/Notification";
import FavoritePro from "../pages/User/Profile/FavoritePro";
import MyDanhGia from "../pages/User/Profile/MyDanhGia";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Website khách - trang chính */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                </Route>

                {/* Website khách - tài khoản */}
                <Route path="/" element={<UserLayout />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />

                    {/* Profile có route con */}
                    <Route path="profile" element={<Profile />}>
                        <Route index element={<HoSoCaNhan />} />
                        <Route path="dia-chi" element={<SoDiaChi />} />
                        <Route path="doi-mat-khau" element={<DoiMatKhau />} />
                        <Route path="uu-dai" element={<UuDaiThanhVien />} />
                        <Route path="don-hang" element={<DonHang />} />
                        <Route path="vi-voucher" element={<VoucherWallet />} />
                        <Route path="thong-bao" element={<Notification />} />
                        <Route path="yeu-thich" element={<FavoritePro />} />
                        <Route path="danh-gia" element={<MyDanhGia />} />
                    </Route>
                </Route>

                {/* Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="categories" element={<Category />} />
                    <Route path="products" element={<Product />} />
                    <Route path="prices" element={<Price />} />
                    <Route path="orders" element={<Order />} />
                    <Route path="customers" element={<Customer />} />
                    <Route path="vouchers" element={<Voucher />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;