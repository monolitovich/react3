import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// Middleware аутентификации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Требуется авторизация' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Недействительный или истекший токен' });
    req.user = user;
    next();
  });
};

// Middleware проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ разрешен только администраторам' });
  }
  next();
};

// ==========================================
// 1. АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛИ
// ==========================================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Новым пользователям по умолчанию даем роль user и купон WELCOME10
    const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'user'");
    const roleId = roleRes.rows[0]?.id || 2;

    const couponRes = await pool.query("SELECT id FROM coupons WHERE code = 'WELCOME10'");
    const couponId = couponRes.rows[0]?.id || null;

    const result = await pool.query(
      `INSERT INTO users (role_id, coupon_id, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name`,
      [roleId, couponId, email, hash, full_name || '']
    );

    res.status(201).json({ message: 'Регистрация успешна', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации', error: error.message });
  }
});

// Авторизация
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Заполните поля email и пароль' });
  }

  try {
    const userRes = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, r.name AS role,
              c.code AS coupon_code, c.discount_percent AS coupon_discount
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN coupons c ON u.coupon_id = c.id
       WHERE u.email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        coupon: user.coupon_code
          ? { code: user.coupon_code, discount_percent: user.coupon_discount }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при входе', error: error.message });
  }
});

// Получение профиля текущего пользователя (с актуальным купоном)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT u.id, u.email, u.full_name, r.name AS role,
              c.code AS coupon_code, c.discount_percent AS coupon_discount
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN coupons c ON u.coupon_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const user = userRes.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      coupon: user.coupon_code
        ? { code: user.coupon_code, discount_percent: user.coupon_discount }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// ==========================================
// 2. КАТЕГОРИИ
// ==========================================

// Получить все категории
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Не удалось загрузить категории', error: error.message });
  }
});

// Добавить категорию (Только Администратор)
app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Название категории не может быть пустым' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания категории', error: error.message });
  }
});

// ==========================================
// 3. КАТАЛОГ УСЛУГ
// ==========================================

// Получить список услуг с фильтрацией по категориям
app.get('/api/services', async (req, res) => {
  try {
    const { categories } = req.query; // строка с ID через запятую: "1,2,3"

    let query = `
      SELECT s.id, s.name, s.description, s.duration_min, s.price, s.discount_percent,
             s.category_id, c.name AS category_name,
             ROUND(s.price * (1 - s.discount_percent::numeric / 100), 2) AS final_price
      FROM services s
      JOIN categories c ON s.category_id = c.id
    `;
    const params = [];

    if (categories) {
      const catIds = categories.split(',').map((id) => parseInt(id)).filter((id) => !isNaN(id));
      if (catIds.length > 0) {
        query += ` WHERE s.category_id = ANY($1)`;
        params.push(catIds);
      }
    }

    query += ' ORDER BY s.id ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Не удалось загрузить услуги', error: error.message });
  }
});

// Назначить скидку на услугу (Только Администратор)
app.patch('/api/services/:id/discount', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { discount_percent } = req.body;

  if (discount_percent < 0 || discount_percent > 100) {
    return res.status(400).json({ message: 'Скидка должна быть от 0 до 100%' });
  }

  try {
    const result = await pool.query(
      'UPDATE services SET discount_percent = $1 WHERE id = $2 RETURNING *',
      [discount_percent, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Услуга не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления скидки', error: error.message });
  }
});

// ==========================================
// 4. СИСТЕМА КУПОНОВ И ПЕРСОНАЛЬНЫХ СКИДОК
// ==========================================

// Список пользователей и купонов для панели администратора
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT u.id, u.email, u.full_name, r.name AS role, u.coupon_id,
              c.code AS coupon_code, c.discount_percent
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN coupons c ON u.coupon_id = c.id
       ORDER BY u.id ASC`
    );
    const coupons = await pool.query('SELECT * FROM coupons ORDER BY discount_percent ASC');
    res.json({ users: users.rows, coupons: coupons.rows });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения пользователей', error: error.message });
  }
});

// Назначить купон конкретному пользователю (Только Администратор)
app.patch('/api/admin/users/:id/coupon', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { coupon_id } = req.body;

  try {
    await pool.query('UPDATE users SET coupon_id = $1 WHERE id = $2', [coupon_id || null, id]);
    res.json({ message: 'Скидочный купон успешно присвоен' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления купона', error: error.message });
  }
});

// ==========================================
// 5. ОФОРМЛЕНИЕ ЗАКАЗА (Appointments & Payments)
// ==========================================

app.post('/api/checkout', authenticateToken, async (req, res) => {
  const { items, total_amount, payment_method } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Корзина пуста' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Запись на завтра

    const createdAppointments = [];
    for (const item of items) {
      const appRes = await client.query(
        `INSERT INTO appointments (user_id, service_id, appointment_date, status)
         VALUES ($1, $2, $3, 'confirmed')
         RETURNING id`,
        [req.user.id, item.id, appointmentDate]
      );
      createdAppointments.push(appRes.rows[0].id);
    }

    // Фиксация платежа
    const paymentRes = await client.query(
      `INSERT INTO payments (appointment_id, user_id, amount, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, 'paid')
       RETURNING *`,
      [createdAppointments[0], req.user.id, total_amount, payment_method || 'card']
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Заказ успешно оформлен и оплачен!',
      payment: paymentRes.rows[0],
      appointmentsCount: createdAppointments.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Ошибка при оформлении заказа', error: error.message });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});