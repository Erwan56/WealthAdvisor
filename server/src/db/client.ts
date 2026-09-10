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
  migrateObjectifsLienNullable();
  migrateLineBourseRename();
  migrateAddColumns();
  seed();
}

// `lien_patrimoine_type` was originally NOT NULL; ticket 10 requires it nullable
// (a new Objectif starts without a lien configured). `CREATE TABLE IF NOT EXISTS`
// doesn't retrofit an already-created table, so rebuild it once if a stale copy
// is found — safe since the table only ever holds rows created by this app.
function migrateObjectifsLienNullable(): void {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'objectifs'").get() as
    | { sql: string }
    | undefined;
  if (!row || !row.sql.includes('lien_patrimoine_type  TEXT NOT NULL')) return;

  db.exec(`
    ALTER TABLE objectifs RENAME TO objectifs_old;
    CREATE TABLE objectifs (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      type                  TEXT NOT NULL,
      libelle               TEXT NOT NULL,
      horizon               TEXT,
      montant_cible         REAL,
      lien_patrimoine_type  TEXT CHECK (lien_patrimoine_type IN ('total', 'domaines', 'entite')),
      lien_domaines         TEXT,
      lien_entite_id        INTEGER REFERENCES entities(id)
    );
    INSERT INTO objectifs SELECT * FROM objectifs_old;
    DROP TABLE objectifs_old;
  `);
}

// `line_bourse.nom_isin`/`pru` are renamed to `isin`/`cout_acquisition_unitaire`
// (valorisation-bourse-temps-reel, ticket 06) — a plain column rename, not a
// constraint change, so a simple `RENAME COLUMN` suffices (no rebuild needed
// unlike migrateObjectifsLienNullable above). Existing values carry over as-is.
function migrateLineBourseRename(): void {
  const columns = (db.prepare('PRAGMA table_info(line_bourse)').all() as { name: string }[]).map((c) => c.name);
  if (columns.includes('nom_isin')) {
    db.exec('ALTER TABLE line_bourse RENAME COLUMN nom_isin TO isin');
  }
  if (columns.includes('pru')) {
    db.exec('ALTER TABLE line_bourse RENAME COLUMN pru TO cout_acquisition_unitaire');
  }
}

// `line_bourse.date_achat` et les 4 champs Prêt immobilier de `line_immobilier`
// (refonte-saisie-patrimoine, tickets 08/10) sont ajoutés à des tables déjà
// créées chez un utilisateur existant — `CREATE TABLE IF NOT EXISTS` ne les
// retrofit pas, d'où cet `ALTER TABLE ... ADD COLUMN` idempotent (contrairement
// à migrateObjectifsLienNullable, un simple ajout de colonne nullable ne
// nécessite pas de reconstruire la table).
function migrateAddColumns(): void {
  addColumnIfMissing('line_bourse', 'date_achat', 'TEXT');
  addColumnIfMissing('line_immobilier', 'capital_emprunte_initial', 'REAL');
  addColumnIfMissing('line_immobilier', 'taux_annuel', 'REAL');
  addColumnIfMissing('line_immobilier', 'duree_mois', 'INTEGER');
  addColumnIfMissing('line_immobilier', 'date_depart', 'TEXT');
}

function addColumnIfMissing(table: string, column: string, type: string): void {
  const columns = (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

const BANQUES_PAR_DEFAUT = [
  'BNP Paribas',
  'Crédit Agricole',
  'Société Générale',
  'LCL',
  'Banque Postale',
  "Caisse d'Épargne",
  'Crédit Mutuel',
  'CIC',
  'Banque Populaire',
  'HSBC Continental Europe',
  'BoursoBank',
  'Fortuneo',
  'Hello bank!',
  'Monabanq',
  'Revolut',
  'N26',
];

const TYPES_COMPTE_PAR_DEFAUT = ['Compte courant', 'Livret A', 'LDDS', 'LEP', 'Compte à terme', 'Autre'];

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

  const insertBanque = db.prepare('INSERT OR IGNORE INTO banques (libelle) VALUES (?)');
  for (const libelle of BANQUES_PAR_DEFAUT) insertBanque.run(libelle);

  const insertTypeCompte = db.prepare('INSERT OR IGNORE INTO types_compte_liquidites (libelle) VALUES (?)');
  for (const libelle of TYPES_COMPTE_PAR_DEFAUT) insertTypeCompte.run(libelle);
}
