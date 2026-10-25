import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Вход
          </button>
          <button
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            Регистрация
          </button>
        </div>

        {error && <div className="status-banner error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-body">
          {isRegister && (
            <div className="form-field">
              <label>Ваше имя</label>
              <input
                type="text"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="user@salon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Подождите...' : isRegister ? 'Зарегистрироваться' : 'Войти в аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}