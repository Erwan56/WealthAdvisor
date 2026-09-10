import { Router } from 'express';
import { db } from '../db/client.js';
import { recomputeLineCurrentValue } from '../db/valorisations.js';

export const avPerRouter = Router();

const ENVELOPE_TYPES = ['assurance_vie', 'per'];
const SUPPORT_TYPES = ['fonds_euro', 'uc'];

const ENVELOPE_SELECT = `
  SELECT
    env.id, env.entity_id, env.libelle, env.date_ouverture, env.statut,
    ea.type,
    e.libelle AS entity_libelle, e.type AS entity_type
  FROM envelopes env
  JOIN envelope_av_per ea ON ea.envelope_id = env.id
  JOIN entities e ON e.id = env.entity_id
  WHERE env.domaine = 'av_per'
`;

const LINE_SELECT = `
  SELECT
    l.id, l.entity_id, l.envelope_id, l.libelle, l.valeur_actuelle, l.date_derniere_valorisation, l.note,
    la.nom_support, la.type_support
  FROM lines l
  JOIN line_av_per la ON la.line_id = l.id
  WHERE l.domaine = 'av_per'
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
  nom_support: string | null;
  type_support: string | null;
}

function linesByEnvelope(envelopeIds: number[]): Map<number, LineRow[]> {
  const byEnvelope = new Map<number, LineRow[]>();
  if (envelopeIds.length === 0) return byEnvelope;

  const placeholders = envelopeIds.map(() => '?').join(',');
  const rows = db
    .prepare(`${LINE_SELECT} AND l.envelope_id IN (${placeholders}) ORDER BY l.libelle ASC`)
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

// Inserts a support Ligne (nom + type fonds_euro/uc) and its first Valorisation.
// Shared by Enveloppe creation and the "add support to an existing Enveloppe" endpoint (PRD §3.4).
function insertSupportLine(params: {
  entityId: number;
  envelopeId: number;
  libelle: string;
  nomSupport: unknown;
  typeSupport: unknown;
  valeur: number;
  date: string;
}): number {
  const { entityId, envelopeId, libelle, nomSupport, typeSupport, valeur, date } = params;

  const info = db
    .prepare(
      `INSERT INTO lines (entity_id, domaine, envelope_id, libelle, valeur_actuelle, date_derniere_valorisation, note)
       VALUES (?, 'av_per', ?, ?, ?, ?, NULL)`
    )
    .run(entityId, envelopeId, libelle, valeur, date);
  const lineId = info.lastInsertRowid as number;
  db.prepare('INSERT INTO line_av_per (line_id, nom_support, type_support) VALUES (?, ?, ?)').run(
    lineId,
    nomSupport ?? null,
    typeSupport ?? null
  );
  db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)').run(lineId, date, valeur);
  return lineId;
}

// GET /api/av-per/envelopes?entity_id=<id>|all
avPerRouter.get('/envelopes', (req, res) => {
  const entityId = req.query.entity_id as string | undefined;

  const envelopes =
    !entityId || entityId === 'all'
      ? (db.prepare(`${ENVELOPE_SELECT} ORDER BY env.libelle ASC`).all() as EnvelopeRow[])
      : (db.prepare(`${ENVELOPE_SELECT} AND env.entity_id = ? ORDER BY env.libelle ASC`).all(Number(entityId)) as EnvelopeRow[]);

  res.json(withLines(envelopes));
});

// POST /api/av-per/envelopes — creates an Enveloppe (contrat) and its first support Ligne (PRD §3.4).
// Creates the contrat alone, sans premier support (refonte-saisie-patrimoine,
// ticket 07) : le premier support se saisit ensuite via POST /envelopes/:id/lines,
// comme tout support suivant.
avPerRouter.post('/envelopes', (req, res) => {
  const { entity_id, libelle, type, date_ouverture, statut } = req.body ?? {};

  if (!entity_id || !libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'entity_id et libelle requis' });
  }
  if (!ENVELOPE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de ${ENVELOPE_TYPES.join(', ')}` });
  }

  const entity = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity_id);
  if (!entity) {
    return res.status(404).json({ error: 'Entité introuvable' });
  }

  const envelopeId = db.transaction(() => {
    const envInfo = db
      .prepare(
        `INSERT INTO envelopes (entity_id, domaine, libelle, type, date_ouverture, statut)
         VALUES (?, 'av_per', ?, ?, ?, ?)`
      )
      .run(entity_id, libelle, type, date_ouverture ?? null, statut ?? null);
    const envId = envInfo.lastInsertRowid as number;

    db.prepare('INSERT INTO envelope_av_per (envelope_id, type) VALUES (?, ?)').run(envId, type);

    return envId;
  })();

  const created = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envelopeId) as EnvelopeRow;
  res.status(201).json(withLines([created])[0]);
});

// PUT /api/av-per/envelopes/:id
avPerRouter.put('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'av_per'").get(envId);
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
      db.prepare('UPDATE envelope_av_per SET type = ? WHERE envelope_id = ?').run(type, envId);
    }
  })();

  const updated = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envId) as EnvelopeRow;
  res.json(withLines([updated])[0]);
});

// DELETE /api/av-per/envelopes/:id — cascades to its Lignes (supports).
avPerRouter.delete('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'av_per'").get(envId);
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
      db.prepare('DELETE FROM line_av_per WHERE line_id = ?').run(lineId);
      db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
    }
    db.prepare('DELETE FROM mouvements WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelope_av_per WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelopes WHERE id = ?').run(envId);
  })();

  res.status(204).end();
});

// POST /api/av-per/envelopes/:id/lines — adds a support Ligne to an existing contrat.
avPerRouter.post('/envelopes/:id/lines', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'av_per'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, nom_support, type_support, valeur_initiale, date } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }
  if (type_support !== undefined && type_support !== null && !SUPPORT_TYPES.includes(type_support)) {
    return res.status(400).json({ error: `type_support doit être l'un de ${SUPPORT_TYPES.join(', ')}` });
  }

  const entityId = (db.prepare('SELECT entity_id FROM envelopes WHERE id = ?').get(envId) as { entity_id: number })
    .entity_id;
  const valDate = date || new Date().toISOString().slice(0, 10);
  const valeur = typeof valeur_initiale === 'number' ? valeur_initiale : Number(valeur_initiale) || 0;

  const lineId = db.transaction(() =>
    insertSupportLine({
      entityId,
      envelopeId: envId,
      libelle,
      nomSupport: nom_support ?? libelle,
      typeSupport: type_support,
      valeur,
      date: valDate,
    })
  )();

  const created = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.status(201).json(created);
});

// PUT /api/av-per/lines/:id
avPerRouter.put('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'av_per'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { libelle, note, nom_support, type_support } = req.body ?? {};
  if (type_support !== undefined && type_support !== null && !SUPPORT_TYPES.includes(type_support)) {
    return res.status(400).json({ error: `type_support doit être l'un de ${SUPPORT_TYPES.join(', ')}` });
  }

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE lines SET libelle = ? WHERE id = ?').run(libelle, lineId);
    }
    if (note !== undefined) {
      db.prepare('UPDATE lines SET note = ? WHERE id = ?').run(note, lineId);
    }
    if (nom_support !== undefined) {
      db.prepare('UPDATE line_av_per SET nom_support = ? WHERE line_id = ?').run(nom_support, lineId);
    }
    if (type_support !== undefined) {
      db.prepare('UPDATE line_av_per SET type_support = ? WHERE line_id = ?').run(type_support, lineId);
    }
  })();

  const updated = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.json(updated);
});

// DELETE /api/av-per/lines/:id
avPerRouter.delete('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'av_per'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM line_av_per WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
  })();

  res.status(204).end();
});

// GET /api/av-per/lines/:id/valorisations
avPerRouter.get('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const rows = db
    .prepare('SELECT id, date, valeur FROM valorisations WHERE line_id = ? ORDER BY date ASC, id ASC')
    .all(lineId);
  res.json(rows);
});

// POST /api/av-per/lines/:id/valorisations
avPerRouter.post('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'av_per'").get(lineId);
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
      db.prepare('INSERT INTO mouvements (line_id, type, date, montant) VALUES (?, ?, ?, ?)').run(
        lineId,
        mouvement.type,
        date,
        mouvement.montant ?? null
      );
    }

    recomputeLineCurrentValue(lineId);
    return info.lastInsertRowid;
  })();

  const created = db.prepare('SELECT id, date, valeur FROM valorisations WHERE id = ?').get(result);
  res.status(201).json(created);
});

// PUT /api/av-per/valorisations/:id
avPerRouter.put('/valorisations/:id', (req, res) => {
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

// DELETE /api/av-per/valorisations/:id
avPerRouter.delete('/valorisations/:id', (req, res) => {
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
