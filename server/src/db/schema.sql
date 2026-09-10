-- WealthAdvisor — schéma relationnel complet (PRD §11)
-- Toutes les tables du modèle de données sont créées ici, même si seul le
-- domaine Liquidités est câblé à l'UI dans cette passe (voir PRD §"scope").

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Entités
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
  id                              INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle                         TEXT NOT NULL,
  type                            TEXT NOT NULL CHECK (type IN ('personnelle', 'activite_service', 'detention_immobiliere')),
  charges_fixes_professionnelles  REAL,
  locked                          INTEGER NOT NULL DEFAULT 0 -- 1 pour 'perso' : non supprimable
);

-- ---------------------------------------------------------------------
-- Configuration globale — listes de référence éditables (ticket 05)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banques (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS types_compte_liquidites (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- Profil (ligne unique, id=1)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profil (
  id                              INTEGER PRIMARY KEY CHECK (id = 1),
  date_naissance                  TEXT,
  horizon_global                  TEXT,
  tmi                             REAL,
  plafond_per_annuel              REAL,
  depenses_mensuelles_courantes   REAL,
  mois_reserve_visees             REAL NOT NULL DEFAULT 6,
  statut_marital                  TEXT,
  personnes_a_charge              INTEGER,
  risque_bucket                   TEXT CHECK (risque_bucket IN ('prudent', 'equilibre', 'dynamique')),
  risque_connaissance              TEXT CHECK (risque_connaissance IN ('novice', 'initie', 'expert')),
  risque_override_manuel          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questionnaire_risque_reponses (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  question_index INTEGER NOT NULL,
  reponse        TEXT NOT NULL,
  date           TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- Objectifs
-- ---------------------------------------------------------------------
-- lien_patrimoine_type est nullable : un nouvel Objectif reste "sans lien
-- configuré" (pas d'avancée affichée) tant qu'il n'est pas réglé explicitement
-- (ticket 10 — pas de valeur par défaut).
CREATE TABLE IF NOT EXISTS objectifs (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  type                  TEXT NOT NULL,
  libelle               TEXT NOT NULL,
  horizon               TEXT,
  montant_cible         REAL,
  lien_patrimoine_type  TEXT CHECK (lien_patrimoine_type IN ('total', 'domaines', 'entite')),
  lien_domaines         TEXT, -- JSON array de domaines, NULL sinon
  lien_entite_id        INTEGER REFERENCES entities(id)
);

-- ---------------------------------------------------------------------
-- Enveloppes (bourse / assurance-vie-PER / crypto / PE-SCPI uniquement —
-- liquidités et immobilier n'ont pas d'Enveloppe)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS envelopes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id      INTEGER NOT NULL REFERENCES entities(id),
  domaine        TEXT NOT NULL CHECK (domaine IN ('bourse', 'av_per', 'crypto', 'pe_scpi')),
  libelle        TEXT NOT NULL,
  type           TEXT,
  date_ouverture TEXT,
  statut         TEXT
);

CREATE TABLE IF NOT EXISTS envelope_bourse (
  envelope_id INTEGER PRIMARY KEY REFERENCES envelopes(id),
  type        TEXT NOT NULL CHECK (type IN ('PEA', 'PEA-PME', 'CTO'))
);

CREATE TABLE IF NOT EXISTS envelope_av_per (
  envelope_id INTEGER PRIMARY KEY REFERENCES envelopes(id),
  type        TEXT NOT NULL CHECK (type IN ('assurance_vie', 'per'))
);

CREATE TABLE IF NOT EXISTS envelope_crypto (
  envelope_id              INTEGER PRIMARY KEY REFERENCES envelopes(id),
  plateforme_etrangere     INTEGER NOT NULL DEFAULT 0,
  prix_acquisition_cumule  REAL
);

CREATE TABLE IF NOT EXISTS envelope_pe_scpi (
  envelope_id     INTEGER PRIMARY KEY REFERENCES envelopes(id),
  type_dispositif TEXT NOT NULL CHECK (type_dispositif IN ('FCPR', 'FIP', 'FCPI', 'SCPI')),
  duree_blocage   REAL
);

-- ---------------------------------------------------------------------
-- Lignes (actif individuel — rattachée à une Enveloppe quand le Domaine
-- en a une)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lines (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id                   INTEGER NOT NULL REFERENCES entities(id),
  domaine                     TEXT NOT NULL CHECK (domaine IN ('liquidites', 'bourse', 'immobilier', 'av_per', 'crypto', 'pe_scpi')),
  envelope_id                 INTEGER REFERENCES envelopes(id),
  libelle                     TEXT NOT NULL,
  valeur_actuelle             REAL NOT NULL DEFAULT 0,
  date_derniere_valorisation  TEXT,
  note                        TEXT
);

CREATE TABLE IF NOT EXISTS line_liquidites (
  line_id              INTEGER PRIMARY KEY REFERENCES lines(id),
  type_compte          TEXT,
  plafond              REAL,
  taux                 REAL,
  banque               TEXT,
  reserve_pour_line_id INTEGER REFERENCES lines(id)
);

CREATE TABLE IF NOT EXISTS line_immobilier (
  line_id                    INTEGER PRIMARY KEY REFERENCES lines(id),
  prix_acquisition_total     REAL,
  date_acquisition           TEXT,
  residence_principale       INTEGER NOT NULL DEFAULT 0,
  regime_location            TEXT,
  -- Prêt immobilier (ticket 10) — optionnel, porté par la Ligne. Dès qu'il est
  -- configuré, capital restant dû et mensualité cessent d'être des champs
  -- stockés par Valorisation et deviennent calculés à la volée (voir
  -- server/src/domain/pretImmobilier.ts).
  capital_emprunte_initial   REAL,
  taux_annuel                REAL,
  duree_mois                 INTEGER,
  date_depart                TEXT
);

CREATE TABLE IF NOT EXISTS line_bourse (
  line_id                    INTEGER PRIMARY KEY REFERENCES lines(id),
  isin                       TEXT,
  quantite                   REAL,
  cout_acquisition_unitaire  REAL,
  est_compte_especes         INTEGER NOT NULL DEFAULT 0,
  date_achat                 TEXT
);

CREATE TABLE IF NOT EXISTS line_av_per (
  line_id      INTEGER PRIMARY KEY REFERENCES lines(id),
  nom_support  TEXT,
  type_support TEXT CHECK (type_support IN ('fonds_euro', 'uc'))
);

CREATE TABLE IF NOT EXISTS line_crypto (
  line_id  INTEGER PRIMARY KEY REFERENCES lines(id),
  symbole  TEXT,
  quantite REAL
);

CREATE TABLE IF NOT EXISTS line_pe_scpi (
  line_id       INTEGER PRIMARY KEY REFERENCES lines(id),
  nombre_parts  REAL
);

-- ---------------------------------------------------------------------
-- Mouvements (événements datés, attachés à une Ligne ou une Enveloppe)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mouvements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id        INTEGER REFERENCES lines(id),
  envelope_id    INTEGER REFERENCES envelopes(id),
  type           TEXT NOT NULL,
  date           TEXT NOT NULL,
  montant        REAL,
  quantite       REAL,
  prix_unitaire  REAL,
  deductible     INTEGER
);

-- ---------------------------------------------------------------------
-- Valorisations (instantané daté de la valeur d'une Ligne)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS valorisations (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL REFERENCES lines(id),
  date    TEXT NOT NULL,
  valeur  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS valorisation_immobilier (
  valorisation_id    INTEGER PRIMARY KEY REFERENCES valorisations(id),
  capital_restant_du REAL,
  loyer              REAL,
  charges            REAL,
  taxe_fonciere      REAL,
  assurance          REAL,
  frais_gestion      REAL,
  mensualite         REAL
);

CREATE INDEX IF NOT EXISTS idx_envelopes_entity ON envelopes(entity_id);
CREATE INDEX IF NOT EXISTS idx_lines_entity ON lines(entity_id);
CREATE INDEX IF NOT EXISTS idx_lines_envelope ON lines(envelope_id);
CREATE INDEX IF NOT EXISTS idx_lines_domaine ON lines(domaine);
CREATE INDEX IF NOT EXISTS idx_mouvements_line ON mouvements(line_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_envelope ON mouvements(envelope_id);
CREATE INDEX IF NOT EXISTS idx_valorisations_line ON valorisations(line_id);
CREATE INDEX IF NOT EXISTS idx_valorisations_line_date ON valorisations(line_id, date);
