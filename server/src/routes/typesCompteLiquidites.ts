import { Router } from 'express';
import { db } from '../db/client.js';

export const typesCompteLiquiditesRouter = Router();

typesCompteLiquiditesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM types_compte_liquidites ORDER BY libelle ASC').all();
  res.json(rows);
});

typesCompteLiquiditesRouter.post('/', (req, res) => {
  const { libelle } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }

  const info = db.prepare('INSERT INTO types_compte_liquidites (libelle) VALUES (?)').run(libelle);
  const type = db.prepare('SELECT * FROM types_compte_liquidites WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(type);
});

typesCompteLiquiditesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM types_compte_liquidites WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Type de compte introuvable' });
  }

  const { libelle } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }

  db.prepare('UPDATE types_compte_liquidites SET libelle = ? WHERE id = ?').run(libelle, id);
  const type = db.prepare('SELECT * FROM types_compte_liquidites WHERE id = ?').get(id);
  res.json(type);
});

typesCompteLiquiditesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const type = db.prepare('SELECT * FROM types_compte_liquidites WHERE id = ?').get(id) as
    | { libelle: string }
    | undefined;
  if (!type) {
    return res.status(404).json({ error: 'Type de compte introuvable' });
  }

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM line_liquidites WHERE type_compte = ?')
    .get(type.libelle) as { count: number };
  if (count > 0) {
    return res
      .status(400)
      .json({ error: 'Ce Type de compte est utilisé par au moins une Ligne et ne peut pas être supprimé' });
  }

  db.prepare('DELETE FROM types_compte_liquidites WHERE id = ?').run(id);
  res.status(204).end();
});
