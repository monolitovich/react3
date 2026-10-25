import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        <NavLink to="/" className="brand-logo">
          <span className="brand-dot"></span>
          AURA SALON
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            Каталог
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              Администрирование
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          <NavLink to="/cart" className="cart-badge-btn">
            <span>Корзина</span>
            {totalItemsCount > 0 && <span className="cart-counter">{totalItemsCount}</span>}
          </NavLink>

          {user ? (
            <div className="profile-widget">
              <div className="profile-details">
                <span className="profile-name">{user.full_name || user.email}</span>
                {user.coupon && (
                  <span className="profile-coupon">Купон -{user.coupon.discount_percent}%</span>
                )}
              </div>
              <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
                Выйти
              </button>
            </div>
          ) : (
            <button className="btn-auth" onClick={() => navigate('/auth')}>
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}