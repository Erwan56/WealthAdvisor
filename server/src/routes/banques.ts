import { Router } from 'express';
import { db } from '../db/client.js';

export const banquesRouter = Router();

banquesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM banques ORDER BY libelle ASC').all();
  res.json(rows);
});

banquesRouter.post('/', (req, res) => {
  const { libelle } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }

  const info = db.prepare('INSERT INTO banques (libelle) VALUES (?)').run(libelle);
  const banque = db.prepare('SELECT * FROM banques WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(banque);
});

banquesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM banques WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Banque introuvable' });
  }

  const { libelle } = req.body ?? {};
  if (!libelle || typeof libelle !== 'string') {
    return res.status(400).json({ error: 'libelle requis' });
  }

  db.prepare('UPDATE banques SET libelle = ? WHERE id = ?').run(libelle, id);
  const banque = db.prepare('SELECT * FROM banques WHERE id = ?').get(id);
  res.json(banque);
});

banquesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const banque = db.prepare('SELECT * FROM banques WHERE id = ?').get(id) as { libelle: string } | undefined;
  if (!banque) {
    return res.status(404).json({ error: 'Banque introuvable' });
  }

  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM line_liquidites WHERE banque = ?')
    .get(banque.libelle) as { count: number };
  if (count > 0) {
    return res.status(400).json({ error: 'Cette Banque est utilisée par au moins une Ligne et ne peut pas être supprimée' });
  }

  db.prepare('DELETE FROM banques WHERE id = ?').run(id);
  res.status(204).end();
});
