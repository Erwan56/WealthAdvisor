import { Router } from 'express';
import { db } from '../db/client.js';
import { recomputeLineCurrentValue } from '../db/valorisations.js';

export const bourseRouter = Router();

const ENVELOPE_TYPES = ['PEA', 'PEA-PME', 'CTO'];

const ENVELOPE_SELECT = `
  SELECT
    env.id, env.entity_id, env.libelle, env.date_ouverture, env.statut,
    eb.type,
    e.libelle AS entity_libelle, e.type AS entity_type
  FROM envelopes env
  JOIN envelope_bourse eb ON eb.envelope_id = env.id
  JOIN entities e ON e.id = env.entity_id
  WHERE env.domaine = 'bourse'
`;

const LINE_SELECT = `
  SELECT
    l.id, l.entity_id, l.envelope_id, l.libelle, l.valeur_actuelle, l.date_derniere_valorisation, l.note,
    lb.nom_isin, lb.quantite, lb.pru, lb.est_compte_especes
  FROM lines l
  JOIN line_bourse lb ON lb.line_id = l.id
  WHERE l.domaine = 'bourse'
`;

interface EnvelopeRow {
  id: number;
  entity_id: number;
  libelle: string;
  date_ouverture: string | null;
  statut: string | null;
  type: string;
  entity_libelle: string;
  entity_type: string;
}

interface LineRow {
  id: number;
  entity_id: number;
  envelope_id: number;
  libelle: string;
  valeur_actuelle: number;
  date_derniere_valorisation: string | null;
  note: string | null;
  nom_isin: string | null;
  quantite: number | null;
  pru: number | null;
  est_compte_especes: 0 | 1;
}

function linesByEnvelope(envelopeIds: number[]): Map<number, LineRow[]> {
  const byEnvelope = new Map<number, LineRow[]>();
  if (envelopeIds.length === 0) return byEnvelope;

  const placeholders = envelopeIds.map(() => '?').join(',');
  const rows = db
    .prepare(`${LINE_SELECT} AND l.envelope_id IN (${placeholders}) ORDER BY lb.est_compte_especes ASC, l.libelle ASC`)
    .all(...envelopeIds) as LineRow[];

  for (const row of rows) {
    const list = byEnvelope.get(row.envelope_id) ?? [];
    list.push(row);
    byEnvelope.set(row.envelope_id, list);
  }
  return byEnvelope;
}

function withLines(envelopes: EnvelopeRow[]) {
  const byEnvelope = linesByEnvelope(envelopes.map((e) => e.id));
  return envelopes.map((env) => {
    const lines = byEnvelope.get(env.id) ?? [];
    const valeur_totale = lines.reduce((sum, l) => sum + l.valeur_actuelle, 0);
    return { ...env, valeur_totale, lines };
  });
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== null && v !== '' ? n : null;
}

// Inserts a titre Ligne (nom/ISIN + quantité, PRU gated to CTO Enveloppes) and
// its first Valorisation. Shared by Enveloppe creation and the "add titre to
// an existing Enveloppe" endpoint (PRD §3.2).
function insertTitreLine(params: {
  entityId: number;
  envelopeId: number;
  envelopeType: string;
  libelle: string;
  nomIsin: unknown;
  quantite: unknown;
  pru: unknown;
  valeur: number;
  date: string;
}): number {
  const { entityId, envelopeId, envelopeType, libelle, nomIsin, quantite, pru, valeur, date } = params;
  const finalPru = envelopeType === 'CTO' ? toNumberOrNull(pru) : null;

  const info = db
    .prepare(
      `INSERT INTO lines (entity_id, domaine, envelope_id, libelle, valeur_actuelle, date_derniere_valorisation, note)
       VALUES (?, 'bourse', ?, ?, ?, ?, NULL)`
    )
    .run(entityId, envelopeId, libelle, valeur, date);
  const lineId = info.lastInsertRowid as number;
  db.prepare(
    `INSERT INTO line_bourse (line_id, nom_isin, quantite, pru, est_compte_especes)
     VALUES (?, ?, ?, ?, 0)`
  ).run(lineId, nomIsin ?? null, toNumberOrNull(quantite), finalPru);
  db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)').run(lineId, date, valeur);
  return lineId;
}

// Inserts the auto-managed "compte espèces" Ligne for a new Enveloppe (PRD §3.2).
function insertCashLine(entityId: number, envelopeId: number, date: string): number {
  const info = db
    .prepare(
      `INSERT INTO lines (entity_id, domaine, envelope_id, libelle, valeur_actuelle, date_derniere_valorisation, note)
       VALUES (?, 'bourse', ?, 'Compte espèces', 0, ?, NULL)`
    )
    .run(entityId, envelopeId, date);
  const lineId = info.lastInsertRowid as number;
  db.prepare(
    `INSERT INTO line_bourse (line_id, nom_isin, quantite, pru, est_compte_especes)
     VALUES (?, NULL, NULL, NULL, 1)`
  ).run(lineId);
  db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, 0)').run(lineId, date);
  return lineId;
}

// GET /api/bourse/envelopes?entity_id=<id>|all
bourseRouter.get('/envelopes', (req, res) => {
  const entityId = req.query.entity_id as string | undefined;

  const envelopes =
    !entityId || entityId === 'all'
      ? (db.prepare(`${ENVELOPE_SELECT} ORDER BY env.libelle ASC`).all() as EnvelopeRow[])
      : (db.prepare(`${ENVELOPE_SELECT} AND env.entity_id = ? ORDER BY env.libelle ASC`).all(Number(entityId)) as EnvelopeRow[]);

  res.json(withLines(envelopes));
});

// POST /api/bourse/envelopes — creates an Enveloppe, its first titre Ligne, and its
// auto-managed "compte espèces" Ligne (PRD §3.2).
bourseRouter.post('/envelopes', (req, res) => {
  const { entity_id, libelle, type, date_ouverture, statut, line } = req.body ?? {};

  if (!entity_id || !libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'entity_id et libelle requis' });
  }
  if (!ENVELOPE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de ${ENVELOPE_TYPES.join(', ')}` });
  }
  if (!line || !line.libelle || typeof line.libelle !== 'string') {
    return res.status(400).json({ error: 'line.libelle requis (premier titre de l’Enveloppe)' });
  }
  if (!line.nom_isin || typeof line.nom_isin !== 'string') {
    return res.status(400).json({ error: 'line.nom_isin requis' });
  }
  if (toNumberOrNull(line.quantite) === null) {
    return res.status(400).json({ error: 'line.quantite requis' });
  }

  const entity = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity_id);
  if (!entity) {
    return res.status(404).json({ error: 'Entité introuvable' });
  }

  const valDate = line.date || new Date().toISOString().slice(0, 10);
  const valeur = typeof line.valeur_initiale === 'number' ? line.valeur_initiale : Number(line.valeur_initiale) || 0;

  const envelopeId = db.transaction(() => {
    const envInfo = db
      .prepare(
        `INSERT INTO envelopes (entity_id, domaine, libelle, type, date_ouverture, statut)
         VALUES (?, 'bourse', ?, ?, ?, ?)`
      )
      .run(entity_id, libelle, type, date_ouverture ?? null, statut ?? null);
    const envId = envInfo.lastInsertRowid as number;

    db.prepare('INSERT INTO envelope_bourse (envelope_id, type) VALUES (?, ?)').run(envId, type);

    insertTitreLine({
      entityId: entity_id,
      envelopeId: envId,
      envelopeType: type,
      libelle: line.libelle,
      nomIsin: line.nom_isin,
      quantite: line.quantite,
      pru: line.pru,
      valeur,
      date: valDate,
    });
    insertCashLine(entity_id, envId, valDate);

    return envId;
  })();

  const created = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envelopeId) as EnvelopeRow;
  res.status(201).json(withLines([created])[0]);
});

// PUT /api/bourse/envelopes/:id
bourseRouter.put('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'bourse'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, type, date_ouverture, statut } = req.body ?? {};
  if (type !== undefined && !ENVELOPE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de ${ENVELOPE_TYPES.join(', ')}` });
  }

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE envelopes SET libelle = ? WHERE id = ?').run(libelle, envId);
    }
    if (date_ouverture !== undefined) {
      db.prepare('UPDATE envelopes SET date_ouverture = ? WHERE id = ?').run(date_ouverture, envId);
    }
    if (statut !== undefined) {
      db.prepare('UPDATE envelopes SET statut = ? WHERE id = ?').run(statut, envId);
    }
    if (type !== undefined) {
      db.prepare('UPDATE envelopes SET type = ? WHERE id = ?').run(type, envId);
      db.prepare('UPDATE envelope_bourse SET type = ? WHERE envelope_id = ?').run(type, envId);
    }
  })();

  const updated = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envId) as EnvelopeRow;
  res.json(withLines([updated])[0]);
});

// DELETE /api/bourse/envelopes/:id — cascades to its Lignes (titres + compte espèces).
bourseRouter.delete('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'bourse'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  db.transaction(() => {
    const lineIds = (db.prepare('SELECT id FROM lines WHERE envelope_id = ?').all(envId) as { id: number }[]).map(
      (r) => r.id
    );
    for (const lineId of lineIds) {
      db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
      db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
      db.prepare('DELETE FROM line_bourse WHERE line_id = ?').run(lineId);
      db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
    }
    db.prepare('DELETE FROM mouvements WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelope_bourse WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelopes WHERE id = ?').run(envId);
  })();

  res.status(204).end();
});

// POST /api/bourse/envelopes/:id/lines — adds a titre Ligne to an existing Enveloppe.
bourseRouter.post('/envelopes/:id/lines', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db
    .prepare("SELECT id, type FROM envelopes WHERE id = ? AND domaine = 'bourse'")
    .get(envId) as { id: number; type: string } | undefined;
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, nom_isin, quantite, pru, valeur_initiale, date } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }
  if (!nom_isin || typeof nom_isin !== 'string') {
    return res.status(400).json({ error: 'nom_isin requis' });
  }
  if (toNumberOrNull(quantite) === null) {
    return res.status(400).json({ error: 'quantite requis' });
  }

  const entityId = (db.prepare('SELECT entity_id FROM envelopes WHERE id = ?').get(envId) as { entity_id: number })
    .entity_id;
  const valDate = date || new Date().toISOString().slice(0, 10);
  const valeur = typeof valeur_initiale === 'number' ? valeur_initiale : Number(valeur_initiale) || 0;

  const lineId = db.transaction(() =>
    insertTitreLine({
      entityId,
      envelopeId: envId,
      envelopeType: envelope.type,
      libelle,
      nomIsin: nom_isin,
      quantite,
      pru,
      valeur,
      date: valDate,
    })
  )();

  const created = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.status(201).json(created);
});

// PUT /api/bourse/lines/:id
bourseRouter.put('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db
    .prepare("SELECT id, envelope_id FROM lines WHERE id = ? AND domaine = 'bourse'")
    .get(lineId) as { id: number; envelope_id: number } | undefined;
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const meta = db.prepare('SELECT est_compte_especes FROM line_bourse WHERE line_id = ?').get(lineId) as {
    est_compte_especes: 0 | 1;
  };
  const { libelle, note, nom_isin, quantite, pru } = req.body ?? {};
  if (meta.est_compte_especes && (nom_isin !== undefined || quantite !== undefined || pru !== undefined)) {
    return res.status(400).json({ error: 'Le compte espèces n’a ni nom/ISIN, ni quantité, ni PRU.' });
  }

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE lines SET libelle = ? WHERE id = ?').run(libelle, lineId);
    }
    if (note !== undefined) {
      db.prepare('UPDATE lines SET note = ? WHERE id = ?').run(note, lineId);
    }
    if (nom_isin !== undefined) {
      db.prepare('UPDATE line_bourse SET nom_isin = ? WHERE line_id = ?').run(nom_isin, lineId);
    }
    if (quantite !== undefined) {
      db.prepare('UPDATE line_bourse SET quantite = ? WHERE line_id = ?').run(toNumberOrNull(quantite), lineId);
    }
    if (pru !== undefined) {
      const envelopeType = (
        db.prepare('SELECT type FROM envelopes WHERE id = ?').get(line.envelope_id) as { type: string }
      ).type;
      db.prepare('UPDATE line_bourse SET pru = ? WHERE line_id = ?').run(
        envelopeType === 'CTO' ? toNumberOrNull(pru) : null,
        lineId
      );
    }
  })();

  const updated = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.json(updated);
});

// DELETE /api/bourse/lines/:id — refuses to delete the compte espèces Ligne
// directly, it only goes away with its Enveloppe.
bourseRouter.delete('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db
    .prepare("SELECT id, envelope_id FROM lines WHERE id = ? AND domaine = 'bourse'")
    .get(lineId) as { id: number; envelope_id: number } | undefined;
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const meta = db.prepare('SELECT est_compte_especes FROM line_bourse WHERE line_id = ?').get(lineId) as
    | { est_compte_especes: 0 | 1 }
    | undefined;
  if (meta?.est_compte_especes) {
    return res.status(400).json({ error: 'Le compte espèces ne se supprime pas seul — supprimez l’Enveloppe.' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM line_bourse WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
  })();

  res.status(204).end();
});

// GET /api/bourse/lines/:id/valorisations
bourseRouter.get('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const rows = db
    .prepare('SELECT id, date, valeur FROM valorisations WHERE line_id = ? ORDER BY date ASC, id ASC')
    .all(lineId);
  res.json(rows);
});

// POST /api/bourse/lines/:id/valorisations
bourseRouter.post('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'bourse'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { date, valeur, mouvement } = req.body ?? {};
  if (!date || typeof valeur !== 'number') {
    return res.status(400).json({ error: 'date et valeur (number) requis' });
  }

  const result = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)')
      .run(lineId, date, valeur);

    if (mouvement && mouvement.type) {
      db.prepare(
        `INSERT INTO mouvements (line_id, type, date, montant, quantite, prix_unitaire)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        lineId,
        mouvement.type,
        date,
        mouvement.montant ?? null,
        mouvement.quantite ?? null,
        mouvement.prix_unitaire ?? null
      );
    }

    recomputeLineCurrentValue(lineId);
    return info.lastInsertRowid;
  })();

  const created = db.prepare('SELECT id, date, valeur FROM valorisations WHERE id = ?').get(result);
  res.status(201).json(created);
});

// PUT /api/bourse/valorisations/:id
bourseRouter.put('/valorisations/:id', (req, res) => {
  const valId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM valorisations WHERE id = ?').get(valId) as
    | { id: number; line_id: number; date: string; valeur: number }
    | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Valorisation introuvable' });
  }

  const { date, valeur } = req.body ?? {};

  db.transaction(() => {
    db.prepare('UPDATE valorisations SET date = COALESCE(?, date), valeur = COALESCE(?, valeur) WHERE id = ?').run(
      date ?? null,
      typeof valeur === 'number' ? valeur : null,
      valId
    );
    recomputeLineCurrentValue(existing.line_id);
  })();

  const updated = db.prepare('SELECT id, date, valeur FROM valorisations WHERE id = ?').get(valId);
  res.json(updated);
});

// DELETE /api/bourse/valorisations/:id
bourseRouter.delete('/valorisations/:id', (req, res) => {
  const valId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM valorisations WHERE id = ?').get(valId) as
    | { id: number; line_id: number }
    | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Valorisation introuvable' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM valorisations WHERE id = ?').run(valId);
    recomputeLineCurrentValue(existing.line_id);
  })();

  res.status(204).end();
});
