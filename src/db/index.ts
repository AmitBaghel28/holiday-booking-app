import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DATABASE_URL ?? './data.db';
const db = new Database(path.resolve(DB_PATH));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK(role IN ('admin', 'host', 'user')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      location    TEXT NOT NULL,
      price       INTEGER NOT NULL CHECK(price >= 0),
      start_time  TEXT NOT NULL,
      created_by  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status      TEXT NOT NULL DEFAULT 'draft'
                    CHECK(status IN ('draft', 'published', 'blocked')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id            TEXT PRIMARY KEY,
      experience_id TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seats         INTEGER NOT NULL CHECK(seats >= 1),
      status        TEXT NOT NULL DEFAULT 'confirmed'
                      CHECK(status IN ('confirmed', 'cancelled')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_experiences_location_time
      ON experiences(location, start_time);

    CREATE INDEX IF NOT EXISTS idx_bookings_user_experience
      ON bookings(user_id, experience_id);
  `);

  console.log('Database initialized');
}

export function checkDBHealth(): boolean {
  try {
    db.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}

export default db;
