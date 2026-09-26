-- Initial schema for the optional account/history features.
-- Apply with:  npx wrangler d1 execute pdf-tools --remote --file migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  sub        TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  picture    TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id        TEXT PRIMARY KEY,
  sub       TEXT NOT NULL,
  slug      TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  files     TEXT NOT NULL DEFAULT '[]',
  at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS history_sub_at ON history (sub, at DESC);
