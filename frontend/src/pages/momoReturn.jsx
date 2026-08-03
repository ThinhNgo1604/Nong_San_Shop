import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/api';

const MomoReturn = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | success | fail

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem('momoOrder'));
    if (!stored) {
      navigate('/');
      return;
    }

    fetch(`${API_BASE}/api/momo/check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stored)
    })
      .then(res => res.json())
      .then(data => {
        sessionStorage.removeItem('momoOrder');
        if (data.paid) {
          setStatus('success');
          localStorage.removeItem('cart');
          window.dispatchEvent(new Event('cartUpdated'));
          setTimeout(() => navigate('/profile/don-hang'), 1500);
        } else {
          setStatus('fail');
        }
      })
      .catch(() => setStatus('fail'));
  }, []);

  return (
    <div style={{ textAlign: 'center', paddingTop: '100px' }}>
      {status === 'checking' && <h3>Đang xác nhận thanh toán...</h3>}
      {status === 'success' && <h3 style={{ color: '#2e7d32' }}>🎉 Thanh toán thành công! Đang chuyển hướng...</h3>}
      {status === 'fail' && (
        <>
          <h3 style={{ color: '#d32f2f' }}>Thanh toán thất bại hoặc đã huỷ.</h3>
          <button onClick={() => navigate('/cart')} className="btn btn-outline-secondary mt-3">Quay lại giỏ hàng</button>
        </>
      )}
    </div>
  );
};

export default MomoReturn;