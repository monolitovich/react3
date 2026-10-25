import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { request } from '../api';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, personalDiscountPercent, personalDiscountAmount, finalTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await request('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart,
          total_amount: finalTotal,
          payment_method: 'card',
        }),
      });
      setSuccessOrder(res);
      clearCart();
    } catch (err) {
      setError(err.message || 'Ошибка оформления');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="page-container center-content">
        <div className="order-success-card">
          <div className="success-icon">✓</div>
          <h2>Заказ успешно оформлен!</h2>
          <p>Платеж подтвержден. Ваши процедуры добавлены в график салона.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page-container center-content">
        <div className="empty-cart-view">
          <h2>Корзина пуста</h2>
          <p>В вашей корзине пока нет добавленных услуг.</p>
          <Link to="/" className="btn-primary">
            Перейти к каталогу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container cart-page-layout">
      <div className="cart-items-column">
        <h1 className="page-heading">Корзина услуг</h1>

        {error && <div className="status-banner error">{error}</div>}

        <div className="cart-cards-list">
          {cart.map((item) => (
            <div key={item.id} className="cart-row-item">
              <div className="cart-row-info">
                <h4>{item.name}</h4>
                <span className="cart-row-cat">{item.category_name}</span>
                <span className="cart-row-duration">Длительность: {item.duration_min} мин.</span>
              </div>

              <div className="cart-row-price">
                {Number(item.final_price || item.price).toLocaleString()} ₽
              </div>

              <div className="cart-row-qty">
                <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}>+</button>
              </div>

              <div className="cart-row-subtotal">
                {(Number(item.final_price || item.price) * item.quantity).toLocaleString()} ₽
              </div>

              <button className="cart-row-remove" onClick={() => removeFromCart(item.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-summary-column">
        <div className="summary-box">
          <h3>Итог заказа</h3>

          <div className="summary-line">
            <span>Промежуточный итог:</span>
            <span>{Number(subtotal).toLocaleString()} ₽</span>
          </div>

          {personalDiscountPercent > 0 && (
            <div className="summary-line discount">
              <span>Персональный купон ({personalDiscountPercent}%):</span>
              <span>−{Number(personalDiscountAmount).toLocaleString()} ₽</span>
            </div>
          )}

          <div className="summary-line total">
            <span>Всего к оплате:</span>
            <span>{Number(finalTotal).toLocaleString()} ₽</span>
          </div>

          <button
            className="btn-checkout"
            disabled={loading}
            onClick={handleCheckout}
          >
            {loading ? 'Обработка платежа...' : user ? 'Оформить заказ' : 'Войти для оформления'}
          </button>

          {!user && (
            <p className="summary-footnote">
              Для фиксации времени записи и персональных скидок требуется авторизация.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}