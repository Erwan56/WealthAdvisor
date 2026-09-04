import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
const dbPath = join(dataDir, 'wealth-advisor.db');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate(): void {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  seed();
}

function seed(): void {
  const perso = db.prepare('SELECT id FROM entities WHERE type = ? AND locked = 1').get('personnelle');
  if (!perso) {
    db.prepare(
      "INSERT INTO entities (libelle, type, locked) VALUES ('Perso', 'personnelle', 1)"
    ).run();
  }

  const profil = db.prepare('SELECT id FROM profil WHERE id = 1').get();
  if (!profil) {
    db.prepare(
      'INSERT INTO profil (id, mois_reserve_visees) VALUES (1, 6)'
    ).run();
  }
}
