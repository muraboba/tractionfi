-- Better Auth core schema for SQLite/D1
-- Hand-transcribed from @better-auth/core 1.x source (get-tables.mjs + get-migration.mjs).
-- CLI generation failed: dialect.createDriver not available without a live D1 binding.
-- Types: id → TEXT PK, string → TEXT, boolean → INTEGER, date → DATE, number → INTEGER.
-- Table names are singular (usePlural: false). Date defaults are set by application code,
-- not the DB, matching Better Auth's JS-side defaultValue functions.

CREATE TABLE user (
  id            TEXT PRIMARY KEY NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image         TEXT,
  createdAt     DATE NOT NULL,
  updatedAt     DATE NOT NULL
);

CREATE TABLE session (
  id         TEXT PRIMARY KEY NOT NULL,
  expiresAt  DATE NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  createdAt  DATE NOT NULL,
  updatedAt  DATE NOT NULL,
  ipAddress  TEXT,
  userAgent  TEXT,
  userId     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX session_userId_idx ON session (userId);

CREATE TABLE account (
  id                     TEXT PRIMARY KEY NOT NULL,
  accountId              TEXT NOT NULL,
  providerId             TEXT NOT NULL,
  userId                 TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken            TEXT,
  refreshToken           TEXT,
  idToken                TEXT,
  accessTokenExpiresAt   DATE,
  refreshTokenExpiresAt  DATE,
  scope                  TEXT,
  password               TEXT,
  createdAt              DATE NOT NULL,
  updatedAt              DATE NOT NULL
);

CREATE INDEX account_userId_idx ON account (userId);

CREATE TABLE verification (
  id         TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expiresAt  DATE NOT NULL,
  createdAt  DATE NOT NULL,
  updatedAt  DATE NOT NULL
);

CREATE INDEX verification_identifier_idx ON verification (identifier);

-- TractionFI application table
-- blob stores the full UserData JSON. version enables optimistic concurrency (spec §2.4).
CREATE TABLE user_state (
  user_id    TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  blob       TEXT NOT NULL,
  version    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
