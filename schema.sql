-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          TEXT DEFAULT 'buyer',
  is_active     INTEGER       DEFAULT 1,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id   INTEGER        NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  description TEXT,
  price       REAL           NOT NULL,
  quantity    INTEGER        DEFAULT 0,
  size        TEXT           NOT NULL,
  category    VARCHAR(100),
  best_before DATE           NOT NULL,
  created_at  DATETIME       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pickup_slots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER   NOT NULL,
  slot_start DATETIME  NOT NULL,
  slot_end   DATETIME  NOT NULL,
  max_orders INTEGER   DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER   NOT NULL,
  product_id INTEGER   NOT NULL,
  quantity   INTEGER   DEFAULT 1,
  added_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id       INTEGER       NOT NULL,
  pickup_slot_id INTEGER       NOT NULL,
  total_price    REAL          NOT NULL,
  status         TEXT DEFAULT 'confirmed',
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id)       REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (pickup_slot_id) REFERENCES pickup_slots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER       NOT NULL,
  product_id INTEGER       NOT NULL,
  quantity   INTEGER       NOT NULL,
  unit_price REAL          NOT NULL,
  size       TEXT          NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
