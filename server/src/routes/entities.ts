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

const LINE_DOMAIN_TABLES: Record<string, string> = {
  liquidites: 'line_liquidites',
  bourse: 'line_bourse',
  immobilier: 'line_immobilier',
  av_per: 'line_av_per',
  crypto: 'line_crypto',
  pe_scpi: 'line_pe_scpi',
};

const ENVELOPE_DOMAIN_TABLES: Record<string, string> = {
  bourse: 'envelope_bourse',
  av_per: 'envelope_av_per',
  crypto: 'envelope_crypto',
  pe_scpi: 'envelope_pe_scpi',
};

// DELETE /api/entities/:id — cascades to its Enveloppes, Lignes, Mouvements et
// Valorisations, et détache les Objectifs qui pointaient dessus (l'Objectif
// survit, juste sans lien de patrimoine).
entitiesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const entity = db.prepare('SELECT * FROM entities WHERE id = ?').get(id) as
    | { id: number; locked: 0 | 1 }
    | undefined;
  if (!entity) {
    return res.status(404).json({ error: 'Entité introuvable' });
  }
  if (entity.locked) {
    return res.status(400).json({ error: 'Cette Entité est protégée et ne peut pas être supprimée' });
  }

  db.transaction(() => {
    const lineIds = (db.prepare('SELECT id, domaine FROM lines WHERE entity_id = ?').all(id) as {
      id: number;
      domaine: string;
    }[]);
    for (const line of lineIds) {
      const valorisationIds = (
        db.prepare('SELECT id FROM valorisations WHERE line_id = ?').all(line.id) as { id: number }[]
      ).map((v) => v.id);
      for (const valId of valorisationIds) {
        db.prepare('DELETE FROM valorisation_immobilier WHERE valorisation_id = ?').run(valId);
      }
      db.prepare('DELETE FROM mouvements WHERE line_id = ?').run(line.id);
      db.prepare('DELETE FROM valorisations WHERE line_id = ?').run(line.id);
      const lineTable = LINE_DOMAIN_TABLES[line.domaine];
      if (lineTable) {
        db.prepare(`DELETE FROM ${lineTable} WHERE line_id = ?`).run(line.id);
      }
      db.prepare('DELETE FROM lines WHERE id = ?').run(line.id);
    }

    const envelopeIds = (
      db.prepare('SELECT id, domaine FROM envelopes WHERE entity_id = ?').all(id) as { id: number; domaine: string }[]
    );
    for (const envelope of envelopeIds) {
      db.prepare('DELETE FROM mouvements WHERE envelope_id = ?').run(envelope.id);
      const envelopeTable = ENVELOPE_DOMAIN_TABLES[envelope.domaine];
      if (envelopeTable) {
        db.prepare(`DELETE FROM ${envelopeTable} WHERE envelope_id = ?`).run(envelope.id);
      }
      db.prepare('DELETE FROM envelopes WHERE id = ?').run(envelope.id);
    }

    db.prepare(
      `UPDATE objectifs SET lien_patrimoine_type = NULL, lien_domaines = NULL, lien_entite_id = NULL
       WHERE lien_entite_id = ?`
    ).run(id);

    db.prepare('DELETE FROM entities WHERE id = ?').run(id);
  })();

  res.status(204).end();
});
