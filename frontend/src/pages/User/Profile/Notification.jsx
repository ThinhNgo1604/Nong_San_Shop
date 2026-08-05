import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../utils/api';

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [now, setNow] = useState(new Date()); 
    const [filterTab, setFilterTab] = useState("all"); // "all" | "unread"

    // --- STATE DÀNH CHO PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 6;

    const storedUser = JSON.parse(localStorage.getItem("user"));

    // Lấy dữ liệu từ API & Polling tự động
    const fetchNotifs = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user ? (user.maTK || user.MaTK) : null;
        if (userId) {
            fetch(`${API_BASE}/api/notifications/${userId}`)
                .then(res => res.json())
                .then(data => {
                    setNotifications(Array.isArray(data) ? data : []);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi tải thông báo:", err);
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 3000);
        window.addEventListener('updateNotificationCount', fetchNotifs);
        window.addEventListener('userUpdated', fetchNotifs);
        return () => {
            clearInterval(interval);
            window.removeEventListener('updateNotificationCount', fetchNotifs);
            window.removeEventListener('userUpdated', fetchNotifs);
        };
    }, []);

    // Hẹn giờ tự động cập nhật thời gian mỗi 1 phút
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const isNotifRead = (notif) => {
        return notif.DaDoc === true || notif.DaDoc === 1 || notif.DaDoc === "1" || notif.DaDoc === "true";
    };

    // Hàm gọi API đánh dấu đã đọc 1 thông báo
    const handleMarkAsRead = async (maTB) => {
        try {
            const res = await fetch(`${API_BASE}/api/notifications/read/${maTB}`, {
                method: 'PUT'
            });
            if (res.ok) {
                const updated = notifications.map(n => n.MaTB === maTB ? { ...n, DaDoc: true } : n);
                setNotifications(updated);
                const unreadCount = updated.filter(n => !isNotifRead(n)).length;
                window.dispatchEvent(new CustomEvent('updateNotificationCount', { detail: { unreadCount } }));
            }
        } catch (error) {
            console.error("Lỗi đánh dấu đã đọc 1 thông báo:", error);
        }
    };

    // Hàm gọi API đánh dấu đã đọc tất cả
    const handleMarkAllAsRead = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user ? (user.maTK || user.MaTK) : null;
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE}/api/notifications/read-all/${userId}`, {
                method: 'PUT'
            });
            if (res.ok) {
                const updated = notifications.map(notif => ({ ...notif, DaDoc: true }));
                setNotifications(updated);
                window.dispatchEvent(new CustomEvent('updateNotificationCount', { detail: { unreadCount: 0 } }));
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật thông báo:", error);
        }
    };

    // Hàm xóa 1 thông báo
    const handleDeleteNotif = async (maTB, e) => {
        if (e) e.stopPropagation();
        try {
            const res = await fetch(`${API_BASE}/api/notifications/${maTB}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const updated = notifications.filter(n => n.MaTB !== maTB);
                setNotifications(updated);
                const unreadCount = updated.filter(n => !isNotifRead(n)).length;
                window.dispatchEvent(new CustomEvent('updateNotificationCount', { detail: { unreadCount } }));
            }
        } catch (error) {
            console.error("Lỗi xóa thông báo:", error);
        }
    };

    // Hàm xóa tất cả thông báo
    const handleDeleteAll = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user ? (user.maTK || user.MaTK) : null;
        if (!userId) return;
        if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;

        try {
            const res = await fetch(`${API_BASE}/api/notifications/delete-all/${userId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setNotifications([]);
                window.dispatchEvent(new CustomEvent('updateNotificationCount', { detail: { unreadCount: 0 } }));
            }
        } catch (error) {
            console.error("Lỗi xóa tất cả thông báo:", error);
        }
    };

    // HÀM TÍNH THỜI GIAN
    const timeAgo = (dateString) => {
        if (!dateString) return "Vừa xong";

        let notifDate = new Date(dateString);
        
        if (notifDate > now) {
            const offsetMs = now.getTimezoneOffset() * 60 * 1000; 
            notifDate = new Date(notifDate.getTime() + offsetMs); 
            if (notifDate > now) notifDate = now; 
        }

        const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const diffDays = Math.floor((today - notifDay) / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            const day = String(notifDate.getDate()).padStart(2, '0');
            const month = String(notifDate.getMonth() + 1).padStart(2, '0');
            const year = notifDate.getFullYear();
            return `${day}/${month}/${year}`;
        } else if (diffDays >= 1) {
            return `${diffDays} ngày trước`;
        } else {
            const diffMs = now - notifDate;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);

            if (diffHours >= 1) {
                return `${diffHours} giờ trước`;
            } else if (diffMinutes >= 1) {
                return `${diffMinutes} phút trước`;
            } else {
                return "Vừa xong";
            }
        }
    };

    const getIconAndColor = (type) => {
        switch (type) {
            case 'order':
            case 'DonHang': return { icon: '📦', color: '#17a2b8', bg: '#e0f7fa' };
            case 'point': return { icon: '💎', color: '#ffc107', bg: '#fff8e1' };
            case 'voucher': return { icon: '🎟️', color: '#e91e63', bg: '#fce4ec' };
            case 'account': return { icon: '🔒', color: '#28a745', bg: '#e8f5e9' };
            default: return { icon: '🔔', color: '#6c757d', bg: '#f8f9fa' };
        }
    };

    // Filter notifications by tab
    const filteredNotifications = notifications.filter(n => {
        if (filterTab === "unread") return !isNotifRead(n);
        return true;
    });

    const unreadCount = notifications.filter(n => !isNotifRead(n)).length;

    // --- LOGIC XỬ LÝ DỮ LIỆU PHÂN TRANG ---
    const indexOfLastNotification = currentPage * notificationsPerPage;
    const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
    const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (!storedUser) return <p className="text-center mt-4 text-danger">Vui lòng đăng nhập để xem thông báo.</p>;
    if (isLoading) return <p className="text-center mt-4">Đang tải...</p>;

    return (
        <div className="bg-white rounded-4 p-4 border shadow-sm">
            {/* HEADER PHẦN THÔNG BÁO */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <div className="d-flex align-items-center gap-3">
                    <h5 className="text-success fw-bold mb-0">Thông báo của bạn</h5>
                    <div className="btn-group btn-group-sm" role="group">
                        <button 
                            type="button" 
                            className={`btn ${filterTab === 'all' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => { setFilterTab('all'); setCurrentPage(1); }}
                        >
                            Tất cả ({notifications.length})
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filterTab === 'unread' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => { setFilterTab('unread'); setCurrentPage(1); }}
                        >
                            Chưa đọc {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}
                        </button>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button 
                        onClick={handleMarkAllAsRead} 
                        className="btn btn-sm btn-outline-success rounded-pill px-3"
                        disabled={notifications.length === 0 || notifications.every(n => isNotifRead(n))}
                        title="Đánh dấu đã đọc tất cả"
                    >
                        ✓ Đánh dấu đã đọc tất cả
                    </button>
                    <button 
                        onClick={handleDeleteAll} 
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        disabled={notifications.length === 0}
                        title="Xóa tất cả thông báo"
                    >
                        🗑️ Xóa tất cả
                    </button>
                </div>
            </div>

            {filteredNotifications.length === 0 ? (
                <div className="text-center p-5 text-muted">
                    <p style={{ fontSize: '40px' }}>📭</p>
                    <p>{filterTab === 'unread' ? 'Bạn không có thông báo chưa đọc nào.' : 'Bạn chưa có thông báo nào.'}</p>
                </div>
            ) : (
                <>
                    <div className="list-group list-group-flush mb-4">
                        {currentNotifications.map((notif) => {
                            const { icon, bg } = getIconAndColor(notif.Loai);
                            const isRead = isNotifRead(notif);
                            return (
                                <div 
                                    key={notif.MaTB} 
                                    className={`list-group-item d-flex align-items-center py-3 px-3 mb-2 rounded-3 border ${isRead ? 'bg-white' : ''}`}
                                    style={{ 
                                        backgroundColor: isRead ? '#fff' : '#f4fbf5',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        if (!isRead) handleMarkAsRead(notif.MaTB);
                                    }}
                                >
                                    <div 
                                        className="d-flex justify-content-center align-items-center rounded-circle flex-shrink-0"
                                        style={{ width: '48px', height: '48px', backgroundColor: bg, fontSize: '22px' }}
                                    >
                                        {icon}
                                    </div>
                                    
                                    <div className="ms-3 flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <h6 className={`mb-0 ${isRead ? 'text-dark fw-semibold' : 'fw-bold text-success'}`}>
                                                {notif.TieuDe}
                                            </h6>
                                            <small className="text-muted ms-2" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                {timeAgo(notif.NgayTao)}
                                            </small>
                                        </div>
                                        <p className="mb-0 text-secondary" style={{ fontSize: '14px' }}>
                                            {notif.NoiDung}
                                        </p>
                                    </div>

                                    <div className="d-flex align-items-center ms-3 gap-2">
                                        {!isRead && (
                                            <span 
                                                className="badge bg-danger rounded-circle p-1" 
                                                style={{ width: '8px', height: '8px' }}
                                                title="Chưa đọc"
                                            ></span>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light text-muted hover-danger rounded-circle p-1 border-0"
                                            style={{ width: '32px', height: '32px', fontSize: '16px' }}
                                            onClick={(e) => handleDeleteNotif(notif.MaTB, e)}
                                            title="Xóa thông báo này"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* HIỂN THỊ CÁC NÚT PHÂN TRANG */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center">
                            <ul className="pagination">
                                {/* Nút Previous */}
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => paginate(currentPage - 1)}>«</button>
                                </li>
                                
                                {/* Các số trang */}
                                {[...Array(totalPages)].map((_, index) => (
                                    <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                
                                {/* Nút Next */}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => paginate(currentPage + 1)}>»</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Notification;