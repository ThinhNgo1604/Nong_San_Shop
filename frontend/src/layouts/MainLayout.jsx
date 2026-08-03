import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatWidget from '../components/Common/ChatWidget';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <div className="global-topbar">
        Freeship đơn từ 199k &nbsp;•&nbsp; Giảm 10% toàn bộ hóa đơn hôm nay
      </div>
      <Header />
      <div className="main-content">
        <Outlet />
      </div>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;