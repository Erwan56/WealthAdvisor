import { db } from './client.js';

export const DOMAINES = ['liquidites', 'bourse', 'immobilier', 'av_per', 'crypto', 'pe_scpi'] as const;
export type Domaine = (typeof DOMAINES)[number];

// Ligne ids for a Domaine (or all Domaines) scoped to an Entité or 'all'.
export function lineIdsForDomain(entityId: number | 'all', domaine?: string): number[] {
  let sql = 'SELECT id FROM lines WHERE 1 = 1';
  const params: unknown[] = [];
  if (domaine) {
    sql += ' AND domaine = ?';
    params.push(domaine);
  }
  if (entityId !== 'all') {
    sql += ' AND entity_id = ?';
    params.push(entityId);
  }
  return (db.prepare(sql).all(...params) as { id: number }[]).map((r) => r.id);
}

export interface LienPatrimoine {
  type: 'total' | 'domaines' | 'entite';
  domaines?: string[] | null;
  entity_id?: number | null;
}

// Ligne ids matching an Objectif's `lien_patrimoine` — always across ALL Entités
// except the 'entite' variant, since the Objectifs screen is Entité-agnostic
// (ticket 10 — Domaine(s) entiers ou Patrimoine total ou une Entité).
export function lineIdsForLien(lien: LienPatrimoine): number[] {
  if (lien.type === 'entite' && lien.entity_id) {
    return (db.prepare('SELECT id FROM lines WHERE entity_id = ?').all(lien.entity_id) as { id: number }[]).map(
      (r) => r.id
    );
  }
  if (lien.type === 'domaines' && lien.domaines && lien.domaines.length > 0) {
    const placeholders = lien.domaines.map(() => '?').join(',');
    return (
      db.prepare(`SELECT id FROM lines WHERE domaine IN (${placeholders})`).all(...lien.domaines) as { id: number }[]
    ).map((r) => r.id);
  }
  return (db.prepare('SELECT id FROM lines').all() as { id: number }[]).map((r) => r.id);
}
