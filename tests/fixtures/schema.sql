-- Mock schema for integration tests
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  age INTEGER,
  country VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total DECIMAL(10,2)
);

INSERT INTO users (name, age, country) VALUES ('Alice', 25, 'FR'), ('Bob', 17, 'US');
INSERT INTO orders (user_id, total) VALUES (1, 100.00), (1, 200.00);
