import { Router } from 'express';
import { db } from '../db/client.js';
import { recomputeLineCurrentValue } from '../db/valorisations.js';

export const peScpiRouter = Router();

const TYPE_DISPOSITIF = ['FCPR', 'FIP', 'FCPI', 'SCPI'];

const ENVELOPE_SELECT = `
  SELECT
    env.id, env.entity_id, env.libelle, env.date_ouverture, env.statut,
    ep.type_dispositif, ep.duree_blocage,
    e.libelle AS entity_libelle, e.type AS entity_type
  FROM envelopes env
  JOIN envelope_pe_scpi ep ON ep.envelope_id = env.id
  JOIN entities e ON e.id = env.entity_id
  WHERE env.domaine = 'pe_scpi'
`;

const LINE_SELECT = `
  SELECT
    l.id, l.entity_id, l.envelope_id, l.libelle, l.valeur_actuelle, l.date_derniere_valorisation, l.note,
    lp.nombre_parts
  FROM lines l
  JOIN line_pe_scpi lp ON lp.line_id = l.id
  WHERE l.domaine = 'pe_scpi'
`;

interface EnvelopeRow {
  id: number;
  entity_id: number;
  libelle: string;
  date_ouverture: string | null;
  statut: string | null;
  type_dispositif: string;
  duree_blocage: number | null;
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
  nombre_parts: number | null;
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== null && v !== '' ? n : null;
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

// Inserts a part souscrite Ligne (nombre de parts) and its first Valorisation.
// Shared by Enveloppe creation and the "add part to an existing Enveloppe" endpoint (PRD §3.6).
function insertPartLine(params: {
  entityId: number;
  envelopeId: number;
  libelle: string;
  nombreParts: unknown;
  valeur: number;
  date: string;
}): number {
  const { entityId, envelopeId, libelle, nombreParts, valeur, date } = params;

  const info = db
    .prepare(
      `INSERT INTO lines (entity_id, domaine, envelope_id, libelle, valeur_actuelle, date_derniere_valorisation, note)
       VALUES (?, 'pe_scpi', ?, ?, ?, ?, NULL)`
    )
    .run(entityId, envelopeId, libelle, valeur, date);
  const lineId = info.lastInsertRowid as number;
  db.prepare('INSERT INTO line_pe_scpi (line_id, nombre_parts) VALUES (?, ?)').run(lineId, toNumberOrNull(nombreParts));
  db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)').run(lineId, date, valeur);
  return lineId;
}

// GET /api/pe-scpi/envelopes?entity_id=<id>|all
peScpiRouter.get('/envelopes', (req, res) => {
  const entityId = req.query.entity_id as string | undefined;

  const envelopes =
    !entityId || entityId === 'all'
      ? (db.prepare(`${ENVELOPE_SELECT} ORDER BY env.libelle ASC`).all() as EnvelopeRow[])
      : (db.prepare(`${ENVELOPE_SELECT} AND env.entity_id = ? ORDER BY env.libelle ASC`).all(Number(entityId)) as EnvelopeRow[]);

  res.json(withLines(envelopes));
});

// POST /api/pe-scpi/envelopes — creates un fonds and its first part souscrite Ligne (PRD §3.6).
// Creates the fonds alone, sans première part souscrite (refonte-saisie-patrimoine,
// ticket 07) : la première part se saisit ensuite via POST /envelopes/:id/lines,
// comme toute part suivante.
peScpiRouter.post('/envelopes', (req, res) => {
  const { entity_id, libelle, type_dispositif, duree_blocage, date_ouverture, statut } = req.body ?? {};

  if (!entity_id || !libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'entity_id et libelle requis' });
  }
  if (!TYPE_DISPOSITIF.includes(type_dispositif)) {
    return res.status(400).json({ error: `type_dispositif doit être l'un de ${TYPE_DISPOSITIF.join(', ')}` });
  }

  const entity = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity_id);
  if (!entity) {
    return res.status(404).json({ error: 'Entité introuvable' });
  }

  const envelopeId = db.transaction(() => {
    const envInfo = db
      .prepare(
        `INSERT INTO envelopes (entity_id, domaine, libelle, date_ouverture, statut)
         VALUES (?, 'pe_scpi', ?, ?, ?)`
      )
      .run(entity_id, libelle, date_ouverture ?? null, statut ?? null);
    const envId = envInfo.lastInsertRowid as number;

    db.prepare('INSERT INTO envelope_pe_scpi (envelope_id, type_dispositif, duree_blocage) VALUES (?, ?, ?)').run(
      envId,
      type_dispositif,
      toNumberOrNull(duree_blocage)
    );

    return envId;
  })();

  const created = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envelopeId) as EnvelopeRow;
  res.status(201).json(withLines([created])[0]);
});

// PUT /api/pe-scpi/envelopes/:id
peScpiRouter.put('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'pe_scpi'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, type_dispositif, duree_blocage, date_ouverture, statut } = req.body ?? {};
  if (type_dispositif !== undefined && !TYPE_DISPOSITIF.includes(type_dispositif)) {
    return res.status(400).json({ error: `type_dispositif doit être l'un de ${TYPE_DISPOSITIF.join(', ')}` });
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
    if (type_dispositif !== undefined) {
      db.prepare('UPDATE envelope_pe_scpi SET type_dispositif = ? WHERE envelope_id = ?').run(type_dispositif, envId);
    }
    if (duree_blocage !== undefined) {
      db.prepare('UPDATE envelope_pe_scpi SET duree_blocage = ? WHERE envelope_id = ?').run(
        toNumberOrNull(duree_blocage),
        envId
      );
    }
  })();

  const updated = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envId) as EnvelopeRow;
  res.json(withLines([updated])[0]);
});

// DELETE /api/pe-scpi/envelopes/:id — cascades to its Lignes (parts).
peScpiRouter.delete('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'pe_scpi'").get(envId);
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
      db.prepare('DELETE FROM line_pe_scpi WHERE line_id = ?').run(lineId);
      db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
    }
    db.prepare('DELETE FROM mouvements WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelope_pe_scpi WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelopes WHERE id = ?').run(envId);
  })();

  res.status(204).end();
});

// POST /api/pe-scpi/envelopes/:id/lines — adds a part souscrite Ligne to an existing fonds.
peScpiRouter.post('/envelopes/:id/lines', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'pe_scpi'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, nombre_parts, valeur_initiale, date } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }
  if (toNumberOrNull(nombre_parts) === null) {
    return res.status(400).json({ error: 'nombre_parts requis' });
  }

  const entityId = (db.prepare('SELECT entity_id FROM envelopes WHERE id = ?').get(envId) as { entity_id: number })
    .entity_id;
  const valDate = date || new Date().toISOString().slice(0, 10);
  const valeur = typeof valeur_initiale === 'number' ? valeur_initiale : Number(valeur_initiale) || 0;

  const lineId = db.transaction(() =>
    insertPartLine({ entityId, envelopeId: envId, libelle, nombreParts: nombre_parts, valeur, date: valDate })
  )();

  const created = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.status(201).json(created);
});

// PUT /api/pe-scpi/lines/:id
peScpiRouter.put('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'pe_scpi'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { libelle, note, nombre_parts } = req.body ?? {};

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE lines SET libelle = ? WHERE id = ?').run(libelle, lineId);
    }
    if (note !== undefined) {
      db.prepare('UPDATE lines SET note = ? WHERE id = ?').run(note, lineId);
    }
    if (nombre_parts !== undefined) {
      db.prepare('UPDATE line_pe_scpi SET nombre_parts = ? WHERE line_id = ?').run(
        toNumberOrNull(nombre_parts),
        lineId
      );
    }
  })();

  const updated = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.json(updated);
});

// DELETE /api/pe-scpi/lines/:id
peScpiRouter.delete('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'pe_scpi'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM line_pe_scpi WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
  })();

  res.status(204).end();
});

// GET /api/pe-scpi/lines/:id/valorisations
peScpiRouter.get('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const rows = db
    .prepare('SELECT id, date, valeur FROM valorisations WHERE line_id = ? ORDER BY date ASC, id ASC')
    .all(lineId);
  res.json(rows);
});

// POST /api/pe-scpi/lines/:id/valorisations
peScpiRouter.post('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'pe_scpi'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { date, valeur } = req.body ?? {};
  if (!date || typeof valeur !== 'number') {
    return res.status(400).json({ error: 'date et valeur (number) requis' });
  }

  const result = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)')
      .run(lineId, date, valeur);

    recomputeLineCurrentValue(lineId);
    return info.lastInsertRowid;
  })();

  const created = db.prepare('SELECT id, date, valeur FROM valorisations WHERE id = ?').get(result);
  res.status(201).json(created);
});

// PUT /api/pe-scpi/valorisations/:id
peScpiRouter.put('/valorisations/:id', (req, res) => {
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

// DELETE /api/pe-scpi/valorisations/:id
peScpiRouter.delete('/valorisations/:id', (req, res) => {
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
