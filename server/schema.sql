-- Очистка таблиц при повторном запуске
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Роли пользователей
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Таблица скидочных купонов
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    description VARCHAR(255)
);

-- 2. Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    coupon_id INT REFERENCES coupons(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Категории услуг (для фильтрации в aside и динамического добавления)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Услуги
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_min INT NOT NULL CHECK (duration_min > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    discount_percent INT DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Записи на прием / заказы услуг
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Платежи
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) DEFAULT 'card',
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Заполнение начальными данными
-- =============================================

INSERT INTO roles (name) VALUES 
('admin'), 
('user');

INSERT INTO coupons (code, discount_percent, description) VALUES
('WELCOME10', 10, 'Приветственная скидка 10%'),
('VIP20', 20, 'Персональный VIP-купон 20%'),
('SPRING15', 15, 'Весенняя скидка 15%');

-- Пароль для обоих: password123 (хэш bcrypt)
INSERT INTO users (role_id, coupon_id, email, password_hash, full_name) VALUES
(1, NULL, 'admin@salon.local', '$2a$10$wOq9k9eFzXk1q2.5QZzEme7gV6nOaU3PqZ1M9O3u2uE5gXk1q2.5Q', 'Главный Администратор'),
(2, 1, 'client@salon.local', '$2a$10$wOq9k9eFzXk1q2.5QZzEme7gV6nOaU3PqZ1M9O3u2uE5gXk1q2.5Q', 'Иван Смирнов');

INSERT INTO categories (name) VALUES
('Парикмахерские услуги'),
('Ногтевой сервис'),
('Косметология и уход'),
('Массаж и SPA');

-- 10 услуг: ровно 3 из них (30%) имеют активную скидку
INSERT INTO services (category_id, name, description, duration_min, price, discount_percent) VALUES
(1, 'Мужская стрижка', 'Классическая стрижка ножницами и машинкой с мытьем головы', 45, 1800.00, 0),
(1, 'Женская стрижка и укладка', 'Модельная стрижка, сушка по форме и стайлинг', 60, 3200.00, 15), -- Скидка 1
(1, 'Окрашивание волос в один тон', 'Окрашивание премиальным красителем с уходом', 120, 5500.00, 0),
(2, 'Комбинированный маникюр', 'Обработка кутикулы аппаратом и ножницами', 50, 1500.00, 0),
(2, 'Маникюр с гель-лаком', 'Маникюр, укрепление базой и стойкое покрытие', 90, 2600.00, 20), -- Скидка 2
(2, 'Педикюр Smart', 'Аппаратная обработка стоп и пальцев с уходовым маслом', 80, 3100.00, 0),
(3, 'Ультразвуковая чистка лица', 'Глубокое очищение пор, тонизация и успокаивающая маска', 60, 2900.00, 0),
(3, 'Пилинг с фруктовыми кислотами', 'Обновление и сияние кожи лица, выравнивание тона', 45, 3400.00, 10), -- Скидка 3
(4, 'Классический массаж спины', 'Снятие мышечных зажимов и усталости', 40, 2200.00, 0),
(4, 'Расслабляющий SPA-массаж всего тела', 'Ароматерапия, мягкие техники релаксации', 90, 4800.00, 0);