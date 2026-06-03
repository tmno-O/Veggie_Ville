-- schema.sql
CREATE DATABASE IF NOT EXISTS community_garden;
USE community_garden;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('buyer','seller','admin') DEFAULT 'buyer',
  is_active     BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  seller_id   INT            NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  description TEXT,
  price       DECIMAL(10,2)  NOT NULL,
  quantity    INT            DEFAULT 0,
  size        ENUM('S','M','L','XL') NOT NULL,
  category    VARCHAR(100),
  best_before DATE           NOT NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pickup_slots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT       NOT NULL,
  slot_start DATETIME  NOT NULL,
  slot_end   DATETIME  NOT NULL,
  max_orders INT       DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT       NOT NULL,
  product_id INT       NOT NULL,
  quantity   INT       DEFAULT 1,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id       INT           NOT NULL,
  pickup_slot_id INT           NOT NULL,
  total_price    DECIMAL(10,2) NOT NULL,
  status         ENUM('pending','confirmed','shipped','cancelled') DEFAULT 'confirmed',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id)       REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (pickup_slot_id) REFERENCES pickup_slots(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT           NOT NULL,
  product_id INT           NOT NULL,
  quantity   INT           NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  size       ENUM('S','M','L','XL') NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
