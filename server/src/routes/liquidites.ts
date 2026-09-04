import { Router } from 'express';
import { db } from '../db/client.js';
import { recomputeLineCurrentValue } from '../db/valorisations.js';

export const liquiditesRouter = Router();

const LINE_SELECT = `
  SELECT
    l.id, l.entity_id, l.libelle, l.valeur_actuelle, l.date_derniere_valorisation, l.note,
    ll.type_compte, ll.plafond, ll.taux, ll.banque, ll.reserve_pour_line_id,
    e.libelle AS entity_libelle, e.type AS entity_type
  FROM lines l
  JOIN line_liquidites ll ON ll.line_id = l.id
  JOIN entities e ON e.id = l.entity_id
  WHERE l.domaine = 'liquidites'
`;

// GET /api/liquidites/lines?entity_id=<id>|all
liquiditesRouter.get('/lines', (req, res) => {
  const entityId = req.query.entity_id as string | undefined;

  if (!entityId || entityId === 'all') {
    const rows = db.prepare(`${LINE_SELECT} ORDER BY l.libelle ASC`).all();
    return res.json(rows);
  }

  const rows = db.prepare(`${LINE_SELECT} AND l.entity_id = ? ORDER BY l.libelle ASC`).all(Number(entityId));
  res.json(rows);
});

// POST /api/liquidites/lines
liquiditesRouter.post('/lines', (req, res) => {
  const {
    entity_id,
    libelle,
    type_compte,
    plafond,
    taux,
    banque,
    reserve_pour_line_id,
    valeur_initiale,
    date,
  } = req.body ?? {};

  if (!entity_id || !libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'entity_id et libelle requis' });
  }

  const entity = db.prepare('SELECT id FROM entities WHERE id = ?').get(entity_id);
  if (!entity) {
    return res.status(404).json({ error: 'Entité introuvable' });
  }

  const valeur = typeof valeur_initiale === 'number' ? valeur_initiale : Number(valeur_initiale) || 0;
  const valDate = date || new Date().toISOString().slice(0, 10);

  const result = db.transaction(() => {
    const lineInfo = db
      .prepare(
        `INSERT INTO lines (entity_id, domaine, libelle, valeur_actuelle, date_derniere_valorisation, note)
         VALUES (?, 'liquidites', ?, ?, ?, NULL)`
      )
      .run(entity_id, libelle, valeur, valDate);

    const lineId = lineInfo.lastInsertRowid as number;

    db.prepare(
      `INSERT INTO line_liquidites (line_id, type_compte, plafond, taux, banque, reserve_pour_line_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(lineId, type_compte ?? null, plafond ?? null, taux ?? null, banque ?? null, reserve_pour_line_id ?? null);

    db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)').run(lineId, valDate, valeur);

    return lineId;
  })();

  const created = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(result);
  res.status(201).json(created);
});

// PUT /api/liquidites/lines/:id
liquiditesRouter.put('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'liquidites'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { libelle, type_compte, plafond, taux, banque, reserve_pour_line_id, note } = req.body ?? {};

  db.transaction(() => {
    if (libelle !== undefined) {
      db.prepare('UPDATE lines SET libelle = ? WHERE id = ?').run(libelle, lineId);
    }
    if (note !== undefined) {
      db.prepare('UPDATE lines SET note = ? WHERE id = ?').run(note, lineId);
    }
    db.prepare(
      `UPDATE line_liquidites SET
        type_compte = COALESCE(?, type_compte),
        plafond = ?,
        taux = ?,
        banque = COALESCE(?, banque),
        reserve_pour_line_id = ?
       WHERE line_id = ?`
    ).run(type_compte ?? null, plafond ?? null, taux ?? null, banque ?? null, reserve_pour_line_id ?? null, lineId);
  })();

  const updated = db.prepare(`${LINE_SELECT} AND l.id = ?`).get(lineId);
  res.json(updated);
});

// DELETE /api/liquidites/lines/:id
liquiditesRouter.delete('/lines/:id', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'liquidites'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  db.transaction(() => {
    db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(lineId);
    db.prepare('UPDATE lines SET reserve_pour_line_id = NULL WHERE id = ?').run(lineId); // no-op safeguard
    db.prepare('DELETE FROM line_liquidites WHERE line_id = ?').run(lineId);
    db.prepare('DELETE FROM lines WHERE id = ?').run(lineId);
  })();

  res.status(204).end();
});

// GET /api/liquidites/lines/:id/valorisations
liquiditesRouter.get('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const rows = db
    .prepare('SELECT id, date, valeur FROM valorisations WHERE line_id = ? ORDER BY date ASC, id ASC')
    .all(lineId);
  res.json(rows);
});

// POST /api/liquidites/lines/:id/valorisations
liquiditesRouter.post('/lines/:id/valorisations', (req, res) => {
  const lineId = Number(req.params.id);
  const line = db.prepare("SELECT id FROM lines WHERE id = ? AND domaine = 'liquidites'").get(lineId);
  if (!line) {
    return res.status(404).json({ error: 'Ligne introuvable' });
  }

  const { date, valeur, mouvement } = req.body ?? {};
  if (!date || typeof valeur !== 'number') {
    return res.status(400).json({ error: 'date et valeur (number) requis' });
  }

  const result = db.transaction(() => {
    const info = db.prepare('INSERT INTO valorisations (line_id, date, valeur) VALUES (?, ?, ?)').run(
      lineId,
      date,
      valeur
    );

    if (mouvement && mouvement.type) {
      db.prepare(
        `INSERT INTO mouvements (line_id, type, date, montant)
         VALUES (?, ?, ?, ?)`
      ).run(lineId, mouvement.type, date, mouvement.montant ?? null);
    }

    recomputeLineCurrentValue(lineId);
    return info.lastInsertRowid;
  })();

  const created = db.prepare('SELECT id, date, valeur FROM valorisations WHERE id = ?').get(result);
  res.status(201).json(created);
});

// PUT /api/liquidites/valorisations/:id
liquiditesRouter.put('/valorisations/:id', (req, res) => {
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

// DELETE /api/liquidites/valorisations/:id
liquiditesRouter.delete('/valorisations/:id', (req, res) => {
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
