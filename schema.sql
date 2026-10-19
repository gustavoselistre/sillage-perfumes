-- Banco D1 "sillage". Aplicar com: wrangler d1 execute sillage --remote --file=schema.sql
-- Os produtos entram pelo painel: no primeiro login, o banco vazio recebe o PRODUCTS de js/data.js.

-- Produtos: o objeto inteiro fica em "data" (JSON), no mesmo formato de PRODUCTS em js/data.js.
-- position define a ordem na vitrine (menor primeiro).
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS products_position ON products (position);

-- Tentativas de login erradas por IP (trava após várias em seguida).
CREATE TABLE IF NOT EXISTS login_failures (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  first_at INTEGER NOT NULL
);
