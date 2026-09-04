import { Router } from 'express';
import { db } from '../db/client.js';

export const entitiesRouter = Router();

entitiesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM entities ORDER BY locked DESC, id ASC').all();
  res.json(rows);
});

entitiesRouter.post('/', (req, res) => {
  const { libelle, type, charges_fixes_professionnelles } = req.body ?? {};

  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }
  if (type !== 'activite_service' && type !== 'detention_immobiliere') {
    return res.status(400).json({ error: "type doit être 'activite_service' ou 'detention_immobiliere'" });
  }

  const info = db
    .prepare('INSERT INTO entities (libelle, type, charges_fixes_professionnelles, locked) VALUES (?, ?, ?, 0)')
    .run(libelle, type, charges_fixes_professionnelles ?? null);

  const entity = db.prepare('SELECT * FROM entities WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(entity);
});
