import { Router } from 'express';
import { db } from '../db/client.js';
import { recomputeLineCurrentValue } from '../db/valorisations.js';

export const cryptoRouter = Router();

const ENVELOPE_SELECT = `
  SELECT
    env.id, env.entity_id, env.libelle, env.date_ouverture, env.statut,
    ec.plateforme_etrangere, ec.prix_acquisition_cumule,
    e.libelle AS entity_libelle, e.type AS entity_type
  FROM envelopes env
  JOIN envelope_crypto ec ON ec.envelope_id = env.id
  JOIN entities e ON e.id = env.entity_id
  WHERE env.domaine = 'crypto'
`;

const LINE_SELECT = `
  SELECT
    l.id, l.entity_id, l.envelope_id, l.libelle, l.valeur_actuelle, l.date_derniere_valorisation, l.note,
    lc.symbole, lc.quantite
  FROM lines l
  JOIN line_crypto lc ON lc.line_id = l.id
  WHERE l.domaine = 'crypto'
`;

interface EnvelopeRow {
  id: number;
  entity_id: number;
  libelle: string;
  date_ouverture: string | null;
  statut: string | null;
  plateforme_etrangere: 0 | 1;
  prix_acquisition_cumule: number | null;
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
  symbole: string | null;
  quantite: number | null;
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

// Inserts an actif Ligne (symbole + quantité) and its first Valorisation.
// Shared by Enveloppe creation and the "add actif to an existing Enveloppe" endpoint (PRD §3.5).
function insertActifLine(params: {
  entityId: number;
  envelopeId: number;
  libelle: string;
  symbole: unknown;
  quantite: unknown;
  valeur: number;
  date: string;
}): number {
  const { entityId, envelopeId, libelle, symbole, quantite, valeur, date } = params;

  const info = db
    .prepare(
      `INSERT INTO lines (entity_id, domaine, envelope_id, libelle, valeur_actuelle, date_derniere_valorisation, note)
       VALUES (?, 'crypto', ?, ?, ?, ?, NULL)`
    )
    .run(entityId, envelopeId, libelle, valeur, date);
  const lineId = info.lastInsertRowid as number;
  db.prepare('INSERT INTO line_crypto (line_id, symbole, quantite) VALUES (?, ?, ?)').run(
    lineId,
    symbole ?? null,
    toNumberOrNull(quantite)
  );
  db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)').run(lineId, date, valeur);
  return lineId;
}

// GET /api/crypto/envelopes?entity_id=<id>|all
cryptoRouter.get('/envelopes', (req, res) => {
  const entityId = req.query.entity_id as string | undefined;

  const envelopes =
    !entityId || entityId === 'all'
      ? (db.prepare(`${ENVELOPE_SELECT} ORDER BY env.libelle ASC`).all() as EnvelopeRow[])
      : (db.prepare(`${ENVELOPE_SELECT} AND env.entity_id = ? ORDER BY env.libelle ASC`).all(Number(entityId)) as EnvelopeRow[]);

  res.json(withLines(envelopes));
});

// POST /api/crypto/envelopes — creates a portefeuille and its first actif Ligne (PRD §3.5).
cryptoRouter.post('/envelopes', (req, res) => {
  const { entity_id, libelle, plateforme_etrangere, prix_acquisition_cumule, date_ouverture, statut, line } =
    req.body ?? {};

  if (!entity_id || !libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'entity_id et libelle requis' });
  }
  if (!line || !line.libelle || typeof line.libelle !== 'string') {
    return res.status(400).json({ error: 'line.libelle requis (premier actif du portefeuille)' });
  }
  if (!line.symbole || typeof line.symbole !== 'string') {
    return res.status(400).json({ error: 'line.symbole requis' });
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
        `INSERT INTO envelopes (entity_id, domaine, libelle, date_ouverture, statut)
         VALUES (?, 'crypto', ?, ?, ?)`
      )
      .run(entity_id, libelle, date_ouverture ?? null, statut ?? null);
    const envId = envInfo.lastInsertRowid as number;

    db.prepare(
      'INSERT INTO envelope_crypto (envelope_id, plateforme_etrangere, prix_acquisition_cumule) VALUES (?, ?, ?)'
    ).run(envId, plateforme_etrangere ? 1 : 0, toNumberOrNull(prix_acquisition_cumule));

    insertActifLine({
      entityId: entity_id,
      envelopeId: envId,
      libelle: line.libelle,
      symbole: line.symbole,
      quantite: line.quantite,
      valeur,
      date: valDate,
    });

    return envId;
  })();

  const created = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envelopeId) as EnvelopeRow;
  res.status(201).json(withLines([created])[0]);
});

// PUT /api/crypto/envelopes/:id
cryptoRouter.put('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'crypto'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, plateforme_etrangere, prix_acquisition_cumule, date_ouverture, statut } = req.body ?? {};

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
    if (plateforme_etrangere !== undefined) {
      db.prepare('UPDATE envelope_crypto SET plateforme_etrangere = ? WHERE envelope_id = ?').run(
        plateforme_etrangere ? 1 : 0,
        envId
      );
    }
    if (prix_acquisition_cumule !== undefined) {
      db.prepare('UPDATE envelope_crypto SET prix_acquisition_cumule = ? WHERE envelope_id = ?').run(
        toNumberOrNull(prix_acquisition_cumule),
        envId
      );
    }
  })();

  const updated = db.prepare(`${ENVELOPE_SELECT} AND env.id = ?`).get(envId) as EnvelopeRow;
  res.json(withLines([updated])[0]);
});

// DELETE /api/crypto/envelopes/:id — cascades to its Lignes (actifs).
cryptoRouter.delete('/envelopes/:id', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'crypto'").get(envId);
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
      db.prepare('DELETE FROM line_crypto WHERE line_id = ?').run(lineId);
      db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
    }
    db.prepare('DELETE FROM mouvements WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelope_crypto WHERE envelope_id = ?').run(envId);
    db.prepare('DELETE FROM envelopes WHERE id = ?').run(envId);
  })();

  res.status(204).end();
});

// POST /api/crypto/envelopes/:id/lines — adds an actif Ligne to an existing portefeuille.
cryptoRouter.post('/envelopes/:id/lines', (req, res) => {
  const envId = Number(req.params.id);
  const envelope = db.prepare("SELECT id FROM envelopes WHERE id = ? AND domaine = 'crypto'").get(envId);
  if (!envelope) {
    return res.status(404).json({ error: 'Enveloppe introuvable' });
  }

  const { libelle, symbole, quantite, valeur_initiale, date } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }
  if (!symbole || typeof symbole !== 'string') {
    return res.status(400).json({ error: 'symbole requis' });
  }
  if (toNumberOrNull(quantite) === null) {
    return res.status(400).json({ error: 'quantite requis' });
  }

  const entityId = (db.prepare('SELECT entity_id FROM envelopes WHERE id = ?').get(envId) as { entity_id: number })
    .entity_id;
  const valDate = date || new Date().toISOString().slice(0, 10);
  const valeur = typeof valeur_initiale === 'number' ? valeur_initiale : Number(valeur_initiale) || 0;

  const lineId = db.transaction(() =>
    insertActifLine({ entityId, envelopeId: envId, libelle, symbole, quantite, valeur, date: valDate })
  )();

  const created = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.status(201).json(created);
});

// PUT /api/crypto/lines/:id
cryptoRouter.put('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'crypto'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { libelle, note, symbole, quantite } = req.body ?? {};

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE lines SET libelle = ? WHERE id = ?').run(libelle, lineId);
    }
    if (note !== undefined) {
      db.prepare('UPDATE lines SET note = ? WHERE id = ?').run(note, lineId);
    }
    if (symbole !== undefined) {
      db.prepare('UPDATE line_crypto SET symbole = ? WHERE line_id = ?').run(symbole, lineId);
    }
    if (quantite !== undefined) {
      db.prepare('UPDATE line_crypto SET quantite = ? WHERE line_id = ?').run(toNumberOrNull(quantite), lineId);
    }
  })();

  const updated = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.json(updated);
});

// DELETE /api/crypto/lines/:id
cryptoRouter.delete('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'crypto'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM line_crypto WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
  })();

  res.status(204).end();
});

// GET /api/crypto/lines/:id/valorisations
cryptoRouter.get('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const rows = db
    .prepare('SELECT id, date, valeur FROM valorisations WHERE line_id = ? ORDER BY date ASC, id ASC')
    .all(lineId);
  res.json(rows);
});

// POST /api/crypto/lines/:id/valorisations
cryptoRouter.post('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'crypto'").get(lineId);
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
        `INSERT INTO mouvements (line_id, type, date, quantite, prix_unitaire)
         VALUES (?, ?, ?, ?, ?)`
      ).run(lineId, mouvement.type, date, mouvement.quantite ?? null, mouvement.prix_unitaire ?? null);
    }

    recomputeLineCurrentValue(lineId);
    return info.lastInsertRowid;
  })();

  const created = db.prepare('SELECT id, date, valeur FROM valorisations WHERE id = ?').get(result);
  res.status(201).json(created);
});

// PUT /api/crypto/valorisations/:id
cryptoRouter.put('/valorisations/:id', (req, res) => {
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

// DELETE /api/crypto/valorisations/:id
cryptoRouter.delete('/valorisations/:id', (req, res) => {
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
