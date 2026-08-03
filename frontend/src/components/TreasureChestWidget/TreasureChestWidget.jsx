import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TreasureChestWidget.css';

const STORAGE_KEY_POS = 'treasure_widget_pos';
const API_BASE = import.meta.env.VITE_API_URL || "";
const API_URL = `${API_BASE}/api/tasks`;

const TreasureChestWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);  
  const [errorMsg, setErrorMsg] = useState('');

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Kiểm tra nếu tọa độ đã lưu vượt quá kích thước màn hình hiện tại thì reset về mặc định
        if (parsed.x < window.innerWidth && parsed.y < window.innerHeight) {
          return parsed;
        }
      } catch (e) {
        // Nếu parse lỗi thì bỏ qua
      }
    }
    // Mặc định luôn nằm gọn ở góc dưới bên phải màn hình (cách lề phải 90px, lề dưới 150px)
    return { x: window.innerWidth - 90, y: window.innerHeight - 150 };
  });

  const dragInfo = useRef({ dragging: false, moved: false, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
  }, [position]);

  const getToken = () => localStorage.getItem('token');

  // Kiểm tra đăng nhập
  const isLoggedIn = !!getToken() && !!localStorage.getItem('user');

  const fetchTaskStatus = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/status`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Không tải được nhiệm vụ');
        return;
      }
      setTasks(data.tasks);
      setTotalPoints(data.totalPoints);
    } catch (err) {
      setErrorMsg('Không thể kết nối tới máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (task) => {
    try {
      const res = await fetch(`${API_URL}/${task.MaNV}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Nhận điểm thất bại');
        return;
      }
      setTotalPoints(data.totalPoints);
      setTasks((prev) =>
        prev.map((t) => (t.MaNV === task.MaNV ? { ...t, status: 'claimed' } : t))
      );
    } catch (err) {
      alert('Không thể kết nối tới máy chủ');
    }
  };

  // ====== KÉO THẢ ======
  const startDrag = (clientX, clientY) => {
    dragInfo.current.dragging = true;
    dragInfo.current.moved = false;
    dragInfo.current.offsetX = clientX - position.x;
    dragInfo.current.offsetY = clientY - position.y;
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragInfo.current.dragging) return;
    dragInfo.current.moved = true;

    const chestSize = 72;
    let newX = clientX - dragInfo.current.offsetX;
    let newY = clientY - dragInfo.current.offsetY;

    newX = Math.max(8, Math.min(window.innerWidth - chestSize - 8, newX));
    newY = Math.max(8, Math.min(window.innerHeight - chestSize - 8, newY));

    setPosition({ x: newX, y: newY });
  };

  const endDrag = () => { dragInfo.current.dragging = false; };

  const handleMouseDown = (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
  const handleTouchStart = (e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); };

  useEffect(() => {
    const handleMouseMove = (e) => moveDrag(e.clientX, e.clientY);
    const handleTouchMove = (e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); };
    const handleUp = () => endDrag();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const handleClick = () => {
    if (!dragInfo.current.moved) {
      setIsOpen(true);
      // Chỉ fetch dữ liệu khi đã đăng nhập
      if (isLoggedIn) {
        fetchTaskStatus();
      }
    }
  };

  const completedCount = isLoggedIn ? tasks.filter((t) => t.status === 'claimed').length : 0;

  return (
    <>
      <div
        className="treasure-chest-widget"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        title="Nhiệm vụ tích điểm"
      >
        <span className="treasure-chest-icon">🎁</span>
        {completedCount > 0 && (
          <span className="treasure-chest-badge">{completedCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="treasure-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="treasure-modal" onClick={(e) => e.stopPropagation()}>

            <div className="treasure-modal-header">
              <h3>🏆 Nhiệm vụ tích điểm</h3>
              <button className="treasure-modal-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Trường hợp CHƯA ĐĂNG NHẬP */}
            {!isLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <p style={{ fontSize: '16px', color: '#555', marginBottom: '20px' }}>
                  Bạn vui lòng đăng nhập để làm nhiệm vụ tích điểm nhé! 😉
                </p>
                <button
                  className="treasure-task-btn"
                  style={{ fontSize: '14px', padding: '10px 24px' }}
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login'); // Thay '/login' theo đường dẫn trang đăng nhập của bạn
                  }}
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : (
              /* Trường hợp ĐÃ ĐĂNG NHẬP */
              <>
                <div className="treasure-points-summary">
                  <span className="treasure-points-label">Điểm của bạn</span>
                  <span className="treasure-points-value">{totalPoints} điểm</span>
                </div>

                {isLoading && <p style={{ textAlign: 'center', padding: 20 }}>⏳ Đang tải nhiệm vụ...</p>}
                {errorMsg && <p style={{ textAlign: 'center', color: '#d32f2f', padding: 10 }}>{errorMsg}</p>}

                {!isLoading && !errorMsg && (
                  <div className="treasure-task-list">
                    {tasks.map((task) => (
                      <div key={task.MaNV} className={`treasure-task-item ${task.status === 'claimed' ? 'done' : ''}`}>
                        <div className="treasure-task-info">
                          <h4>{task.TenNV}</h4>
                          <p>{task.MoTa}</p>
                        </div>
                        <div className="treasure-task-action">
                          <span className="treasure-task-points">+{task.SoDiemThuong}</span>
                          <button
                            className="treasure-task-btn"
                            disabled={task.status !== 'available'}
                            onClick={() => handleClaim(task)}
                          >
                            {task.status === 'claimed'
                              ? 'Đã nhận'
                              : task.status === 'available'
                              ? 'Nhận điểm'
                              : 'Chưa hoàn thành'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default TreasureChestWidget;