import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../api';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const [adminData, svcData] = await Promise.all([
          request('/admin/users'),
          request('/services'),
        ]);
        setUsers(adminData.users);
        setCoupons(adminData.coupons);
        setServices(svcData);
      } catch (err) {
        setMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, navigate]);

  const handleUpdateDiscount = async (serviceId, percent) => {
    try {
      await request(`/services/${serviceId}/discount`, {
        method: 'PATCH',
        body: JSON.stringify({ discount_percent: parseInt(percent, 10) || 0 }),
      });
      setMsg('Скидка на услугу обновлена');
      const updated = await request('/services');
      setServices(updated);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleAssignCoupon = async (userId, couponId) => {
    try {
      await request(`/admin/users/${userId}/coupon`, {
        method: 'PATCH',
        body: JSON.stringify({ coupon_id: couponId ? parseInt(couponId, 10) : null }),
      });
      setMsg('Персональный купон назначен');
      const adminData = await request('/admin/users');
      setUsers(adminData.users);
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) return <div className="page-container">Загрузка панели...</div>;

  return (
    <div className="page-container admin-dashboard">
      <h1 className="page-heading">Панель управления салоном</h1>
      {msg && <div className="status-banner success">{msg}</div>}

      <div className="admin-grid-layout">
        <section className="admin-section">
          <h2>Управление скидками каталога</h2>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Услуга</th>
                <th>Категория</th>
                <th>Базовая цена</th>
                <th>Текущая скидка</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.category_name}</td>
                  <td>{s.price} ₽</td>
                  <td>
                    <select
                      value={s.discount_percent}
                      onChange={(e) => handleUpdateDiscount(s.id, e.target.value)}
                    >
                      <option value="0">0%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                      <option value="20">20%</option>
                      <option value="30">30%</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-section">
          <h2>Персональные скидки клиентов</h2>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Имя</th>
                <th>Купон</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.full_name || '—'}</td>
                  <td>
                    <select
                      value={u.coupon_id || ''}
                      onChange={(e) => handleAssignCoupon(u.id, e.target.value)}
                    >
                      <option value="">Без скидки</option>
                      {coupons.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} (-{c.discount_percent}%)
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}