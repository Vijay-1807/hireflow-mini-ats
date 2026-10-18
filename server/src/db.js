import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'ats.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'applied',
    source TEXT DEFAULT 'careers-page',
    location TEXT,
    experience_years REAL DEFAULT 0,
    expected_salary INTEGER,
    skills TEXT DEFAULT '[]',
    resume_url TEXT,
    rating INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage);
  CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at);
  CREATE INDEX IF NOT EXISTS idx_activities_candidate ON activities(candidate_id);
`);

export const STAGES = [
  { id: 'applied', label: 'Applied', color: '#60a5fa', order: 1 },
  { id: 'screening', label: 'Screening', color: '#a78bfa', order: 2 },
  { id: 'interview', label: 'Interview', color: '#fbbf24', order: 3 },
  { id: 'offer', label: 'Offer', color: '#34d399', order: 4 },
  { id: 'hired', label: 'Hired', color: '#22d3ee', order: 5 },
  { id: 'rejected', label: 'Rejected', color: '#f87171', order: 6 },
];

export default db;
